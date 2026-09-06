using CoreMeet.Api.Domain.Entities;
using CoreMeet.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace CoreMeet.Api.Features.Meetings;

/// <summary>
/// Real-time meeting channel: presence, chat, and WebRTC signaling relay.
/// Clients call <c>JoinRoom</c> first; everything else is scoped to that room.
/// </summary>
public class MeetingHub(AppDbContext db, MeetingConnectionRegistry registry) : Hub
{
    // ---- Presence -------------------------------------------------

    public async Task JoinRoom(string code, Guid participantId)
    {
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
            .Select(c => new { c.ConnectionId, c.ParticipantId, c.DisplayName, c.AvatarColor, c.AvatarUrl })
            .ToList();

        registry.Add(new ConnectionInfo(
            Context.ConnectionId, code, participantId, participant.DisplayName, avatarColor, avatarUrl));

        // Tell the newcomer who's already here (they will initiate the WebRTC offers).
        await Clients.Caller.SendAsync("roomPeers", peers);

        // Tell everyone else about the newcomer.
        var payload = new
        {
            connectionId = Context.ConnectionId,
            participantId,
            displayName = participant.DisplayName,
            avatarColor,
            avatarUrl,
            role = participant.Role.ToString(),
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

    // ---- Media state (mic / camera on-off, shown on remote tiles) ----

    public Task SetMediaState(bool audio, bool video, bool screen)
    {
        var info = registry.Get(Context.ConnectionId);
        if (info is null) return Task.CompletedTask;
        return Clients.OthersInGroup(info.Code).SendAsync("peerMediaState", new
        {
            connectionId = Context.ConnectionId,
            participantId = info.ParticipantId,
            audio,
            video,
            screen,
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
