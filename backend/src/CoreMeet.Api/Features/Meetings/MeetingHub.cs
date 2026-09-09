using CoreMeet.Api.Domain.Entities;
using CoreMeet.Api.Domain.Enums;
using CoreMeet.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace CoreMeet.Api.Features.Meetings;

/// <summary>
/// Real-time meeting channel: presence, chat, and WebRTC signaling relay.
/// Clients call <c>JoinRoom</c> first; everything else is scoped to that room.
/// </summary>
public class MeetingHub(AppDbContext db, MeetingConnectionRegistry registry, ControlRegistry control) : Hub
{
    // ---- Presence -------------------------------------------------

    public async Task JoinRoom(string code, Guid participantId, string? client = null)
    {
        var isDesktop = string.Equals(client, "desktop", StringComparison.OrdinalIgnoreCase);

        var participant = await db.MeetingParticipants
            .Include(p => p.Meeting)
            .Include(p => p.User)
            .FirstOrDefaultAsync(p => p.Id == participantId && p.Meeting!.Code == code);

        if (participant is null)
        {
            await Clients.Caller.SendAsync("error", "You are not a participant of this meeting.");
            return;
        }

        participant.IsConnected = true;
        participant.LeftAt = null;
        await db.SaveChangesAsync();

        await Groups.AddToGroupAsync(Context.ConnectionId, code);

        var avatarColor = participant.User?.AvatarColor ?? participant.AvatarColor;
        var avatarUrl = participant.User?.AvatarUrl ?? participant.AvatarUrl;

        var peers = registry.InRoom(code)
            .Select(c => new
            {
                c.ConnectionId, c.ParticipantId, c.DisplayName, c.AvatarColor, c.AvatarUrl,
                desktop = c.IsDesktop,
            })
            .ToList();

        registry.Add(new ConnectionInfo(
            Context.ConnectionId, code, participantId, participant.DisplayName, avatarColor, avatarUrl)
        {
            IsDesktop = isDesktop,
        });

        // Tell the newcomer who's already here (they will initiate the WebRTC offers).
        await Clients.Caller.SendAsync("roomPeers", peers);

        // Bring the newcomer up to speed on any active screen-control session.
        var sessions = control.InRoom(code)
            .Select(s => new
            {
                targetConnectionId = s.TargetConnectionId,
                controllerConnectionId = s.ControllerConnectionId,
                controllerName = s.ControllerName,
            })
            .ToList();
        if (sessions.Count > 0)
            await Clients.Caller.SendAsync("controlSessions", sessions);

        // Tell everyone else about the newcomer.
        var payload = new
        {
            connectionId = Context.ConnectionId,
            participantId,
            displayName = participant.DisplayName,
            avatarColor,
            avatarUrl,
            role = participant.Role.ToString(),
            desktop = isDesktop,
        };
        await Clients.OthersInGroup(code).SendAsync("peerJoined", payload);
    }

    public async Task LeaveRoom()
    {
        await HandleDisconnect();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        await HandleDisconnect();
        await base.OnDisconnectedAsync(exception);
    }

    private async Task HandleDisconnect()
    {
        var info = registry.Remove(Context.ConnectionId);
        if (info is null) return;

        var participant = await db.MeetingParticipants.FindAsync(info.ParticipantId);
        if (participant is not null)
        {
            // Only mark offline if this was the participant's last live connection.
            var stillConnected = registry.InRoom(info.Code).Any(c => c.ParticipantId == info.ParticipantId);
            if (!stillConnected)
            {
                participant.IsConnected = false;
                participant.LeftAt = DateTime.UtcNow;
                await db.SaveChangesAsync();
            }
        }

        // Tear down any screen-control session this connection was part of.
        foreach (var session in control.EndAllInvolving(Context.ConnectionId))
            await NotifyControlEnded(session, Context.ConnectionId);

        await Groups.RemoveFromGroupAsync(Context.ConnectionId, info.Code);
        await Clients.Group(info.Code).SendAsync("peerLeft", new
        {
            connectionId = Context.ConnectionId,
            participantId = info.ParticipantId,
        });
    }

    // ---- Chat ---------------------------------------------------

    public async Task SendChatMessage(string content)
    {
        var info = registry.Get(Context.ConnectionId);
        if (info is null || string.IsNullOrWhiteSpace(content)) return;

        var trimmed = content.Trim();
        if (trimmed.Length > 4000) trimmed = trimmed[..4000];

        var participant = await db.MeetingParticipants
            .Include(p => p.Meeting)
            .FirstOrDefaultAsync(p => p.Id == info.ParticipantId);
        if (participant?.Meeting is null) return;

        var message = new ChatMessage
        {
            MeetingId = participant.MeetingId,
            SenderParticipantId = info.ParticipantId,
            SenderName = info.DisplayName,
            Content = trimmed,
        };
        db.ChatMessages.Add(message);
        await db.SaveChangesAsync();

        await Clients.Group(info.Code).SendAsync("chatMessage", new ChatMessageDto(
            message.Id, message.SenderParticipantId, message.SenderName, message.Content, message.SentAt));
    }

    /// <summary>Host renames the meeting; every participant sees it live.</summary>
    public async Task RenameMeeting(string title)
    {
        var info = registry.Get(Context.ConnectionId);
        if (info is null || string.IsNullOrWhiteSpace(title)) return;

        var trimmed = title.Trim();
        if (trimmed.Length > 200) trimmed = trimmed[..200];

        var participant = await db.MeetingParticipants
            .Include(p => p.Meeting)
            .FirstOrDefaultAsync(p => p.Id == info.ParticipantId);
        var meeting = participant?.Meeting;
        if (meeting is null || meeting.HostId != participant!.UserId ||
            meeting.Status == MeetingStatus.Ended)
            return;

        meeting.Title = trimmed;
        await db.SaveChangesAsync();

        await Clients.Group(info.Code).SendAsync("meetingRenamed", new { title = trimmed });
    }

    // ---- Media state (mic / camera on-off, shown on remote tiles) ----

    public async Task SetMediaState(bool audio, bool video, bool screen)
    {
        var info = registry.Get(Context.ConnectionId);
        if (info is null) return;

        var wasSharing = info.SharingScreen;
        info.SharingScreen = screen;

        // Stopping a screen share immediately ends any control of it.
        if (wasSharing && !screen)
        {
            var session = control.EndByTarget(Context.ConnectionId);
            if (session is not null) await NotifyControlEnded(session, Context.ConnectionId);
        }

        await Clients.OthersInGroup(info.Code).SendAsync("peerMediaState", new
        {
            connectionId = Context.ConnectionId,
            participantId = info.ParticipantId,
            audio,
            video,
            screen,
        });
    }

    // ---- Remote control of a shared screen ----------------------------
    //
    // A viewer requests control of the person sharing their screen; that person
    // must explicitly grant it and can revoke it at any moment. Input events are
    // relayed as opaque JSON strings (see the client contract):
    //   { t:"move|down|up|click|dblclick", x,y }   coords normalised 0..1 of the shared frame
    //   { t:"wheel", dx,dy,x,y }
    //   { t:"key", code,key,down, mods:{ctrl,alt,shift,meta} }

    private const int MaxControlEventBytes = 2048;

    /// <summary>Ask the person sharing their screen (<paramref name="targetConnectionId"/>) for control.</summary>
    public async Task RequestControl(string targetConnectionId)
    {
        var me = registry.Get(Context.ConnectionId);
        var target = registry.Get(targetConnectionId);
        if (me is null || target is null || me.Code != target.Code || targetConnectionId == Context.ConnectionId)
            return;

        if (!target.IsDesktop)
        {
            // Only the CoreMeet desktop app can inject input — a browser can't be a target.
            await Clients.Caller.SendAsync("controlDenied", targetConnectionId, "web_target");
            return;
        }
        if (!target.SharingScreen)
        {
            await Clients.Caller.SendAsync("controlDenied", targetConnectionId, "not_sharing");
            return;
        }
        if (control.GetByTarget(targetConnectionId) is not null)
        {
            await Clients.Caller.SendAsync("controlDenied", targetConnectionId, "busy");
            return;
        }

        await Clients.Client(targetConnectionId).SendAsync("controlRequested", new
        {
            connectionId = Context.ConnectionId,
            participantId = me.ParticipantId,
            name = me.DisplayName,
        });
    }

    /// <summary>The person sharing responds to a pending control request.</summary>
    public async Task RespondControl(string requesterConnectionId, bool granted)
    {
        var me = registry.Get(Context.ConnectionId); // the sharer
        var requester = registry.Get(requesterConnectionId);
        if (me is null || requester is null || me.Code != requester.Code)
            return;

        if (!granted || !me.SharingScreen)
        {
            await Clients.Client(requesterConnectionId).SendAsync("controlResponse", Context.ConnectionId, false);
            return;
        }

        var session = new ControlSession(
            me.Code, Context.ConnectionId, me.ParticipantId,
            requesterConnectionId, requester.ParticipantId, requester.DisplayName);

        if (!control.TryStart(session))
        {
            await Clients.Client(requesterConnectionId).SendAsync("controlResponse", Context.ConnectionId, false);
            return;
        }

        await Clients.Client(requesterConnectionId).SendAsync("controlResponse", Context.ConnectionId, true);
        await Clients.Caller.SendAsync("controlGranted", requesterConnectionId, requester.DisplayName, requester.ParticipantId);
        await Clients.OthersInGroup(me.Code).SendAsync("controlStarted", new
        {
            targetConnectionId = Context.ConnectionId,
            controllerConnectionId = requesterConnectionId,
            controllerName = requester.DisplayName,
        });
    }

    /// <summary>The active controller sends one input event to the person being controlled.</summary>
    public Task SendControlEvent(string ev)
    {
        if (string.IsNullOrEmpty(ev) || System.Text.Encoding.UTF8.GetByteCount(ev) > MaxControlEventBytes)
            return Task.CompletedTask;

        var session = control.GetByController(Context.ConnectionId);
        if (session is null) return Task.CompletedTask;

        return Clients.Client(session.TargetConnectionId).SendAsync("controlEvent", ev);
    }

    /// <summary>Either party ends the control session.</summary>
    public async Task RevokeControl()
    {
        var session = control.EndByController(Context.ConnectionId) ?? control.EndByTarget(Context.ConnectionId);
        if (session is not null) await NotifyControlEnded(session, Context.ConnectionId);
    }

    private async Task NotifyControlEnded(ControlSession s, string byConnectionId)
    {
        await Clients.Clients(s.TargetConnectionId, s.ControllerConnectionId)
            .SendAsync("controlEnded", byConnectionId);
        await Clients.Group(s.Code).SendAsync("controlStopped", new
        {
            targetConnectionId = s.TargetConnectionId,
            controllerConnectionId = s.ControllerConnectionId,
        });
    }

    // ---- WebRTC signaling relay (wired up on the client in step 4) ----

    public Task SendOffer(string targetConnectionId, string sdp) =>
        Clients.Client(targetConnectionId).SendAsync("offer", Context.ConnectionId, sdp);

    public Task SendAnswer(string targetConnectionId, string sdp) =>
        Clients.Client(targetConnectionId).SendAsync("answer", Context.ConnectionId, sdp);

    public Task SendIceCandidate(string targetConnectionId, string candidate) =>
        Clients.Client(targetConnectionId).SendAsync("iceCandidate", Context.ConnectionId, candidate);

    public Task Signal(string targetConnectionId, string kind, string data) =>
        Clients.Client(targetConnectionId).SendAsync("signal", Context.ConnectionId, kind, data);
}
