using System.Security.Cryptography;
using CoreMeet.Api.Domain.Entities;
using CoreMeet.Api.Domain.Enums;
using CoreMeet.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CoreMeet.Api.Features.Meetings;

public class MeetingService(AppDbContext db)
{
    private const string CodeAlphabet = "abcdefghijkmnopqrstuvwxyz"; // no 'l'
    private static readonly int[] Groups = [3, 4, 3];

    public async Task<MeetingDto> CreateAsync(Guid hostId, string? title, CancellationToken ct)
    {
        var host = await db.Users.FindAsync([hostId], ct)
            ?? throw new InvalidOperationException("Host not found.");

        var meeting = new Meeting
        {
            Code = await GenerateUniqueCodeAsync(ct),
            Title = string.IsNullOrWhiteSpace(title) ? "New meeting" : title.Trim(),
            HostId = hostId,
            Status = MeetingStatus.Active,
            StartedAt = DateTime.UtcNow,
        };

        db.Meetings.Add(meeting);
        await db.SaveChangesAsync(ct);

        return new MeetingDto(meeting.Id, meeting.Code, meeting.Title, meeting.Status,
            hostId, host.Name, meeting.CreatedAt, 0);
    }

    public async Task<MeetingDetailDto?> GetByCodeAsync(string code, CancellationToken ct)
    {
        var meeting = await db.Meetings
            .Include(m => m.Host)
            .Include(m => m.Participants).ThenInclude(p => p.User)
            .AsNoTracking()
            .FirstOrDefaultAsync(m => m.Code == code, ct);

        return meeting is null ? null : ToDetailDto(meeting);
    }

    public async Task<IReadOnlyList<MeetingDto>> GetMineAsync(Guid userId, CancellationToken ct)
    {
        return await db.Meetings
            .Where(m => m.HostId == userId || m.Participants.Any(p => p.UserId == userId))
            .OrderByDescending(m => m.CreatedAt)
            .Take(20)
            .Select(m => new MeetingDto(
                m.Id, m.Code, m.Title, m.Status, m.HostId, m.Host!.Name, m.CreatedAt,
                m.Participants.Count))
            .AsNoTracking()
            .ToListAsync(ct);
    }

    private static readonly string[] GuestColors =
        ["#1FA84C", "#2563EB", "#7C3AED", "#DB2777", "#EA580C", "#0891B2", "#CA8A04"];

    public async Task<JoinMeetingResponse?> JoinAsync(
        string code, Guid? userId, string? displayName, string? avatarUrl, string? guestKey, CancellationToken ct)
    {
        var meeting = await db.Meetings
            .Include(m => m.Host)
            .Include(m => m.Participants).ThenInclude(p => p.User)
            .FirstOrDefaultAsync(m => m.Code == code, ct);

        if (meeting is null || meeting.Status == MeetingStatus.Ended)
            return null;

        var trimmedGuestKey = string.IsNullOrWhiteSpace(guestKey) ? null : guestKey.Trim();

        MeetingParticipant? participant = userId is { } uid
            ? meeting.Participants.FirstOrDefault(p => p.UserId == uid)
            : trimmedGuestKey is not null
                ? meeting.Participants.FirstOrDefault(p => p.UserId == null && p.GuestKey == trimmedGuestKey)
                : null;

        if (participant is null)
        {
            var account = userId is { } id2 ? await db.Users.FindAsync([id2], ct) : null;
            var name = account?.Name
                ?? (string.IsNullOrWhiteSpace(displayName) ? "Guest" : displayName.Trim());
            var avatar = account?.AvatarUrl
                ?? (string.IsNullOrWhiteSpace(avatarUrl) ? null : avatarUrl.Trim());

            participant = new MeetingParticipant
            {
                MeetingId = meeting.Id,
                UserId = userId,
                GuestKey = userId is null ? trimmedGuestKey : null,
                DisplayName = name,
                AvatarUrl = avatar,
                AvatarColor = account?.AvatarColor
                    ?? GuestColors[Math.Abs(name.GetHashCode()) % GuestColors.Length],
                Role = meeting.HostId == userId ? ParticipantRole.Host : ParticipantRole.Guest,
            };
            meeting.Participants.Add(participant);
            try
            {
                await db.SaveChangesAsync(ct);
            }
            catch (DbUpdateException) when (userId is not null)
            {
                // Concurrent join for the same account — fall back to the existing row.
                db.Entry(participant).State = EntityState.Detached;
                participant = await db.MeetingParticipants
                    .Include(p => p.User)
                    .FirstAsync(p => p.MeetingId == meeting.Id && p.UserId == userId, ct);
                return new JoinMeetingResponse(
                    ToDetailDto(await ReloadAsync(meeting.Id, ct)), ToParticipantDto(participant));
            }

            participant.User = userId is { } id3 ? await db.Users.FindAsync([id3], ct) : null;
        }
        else if (userId is null)
        {
            // Returning guest: pick up a name/avatar change since their last visit.
            if (!string.IsNullOrWhiteSpace(displayName)) participant.DisplayName = displayName.Trim();
            if (!string.IsNullOrEmpty(avatarUrl)) participant.AvatarUrl = avatarUrl.Trim();
            await db.SaveChangesAsync(ct);
        }

        return new JoinMeetingResponse(ToDetailDto(meeting), ToParticipantDto(participant));
    }

    public async Task<bool> EndAsync(string code, Guid userId, CancellationToken ct)
    {
        var meeting = await db.Meetings.FirstOrDefaultAsync(m => m.Code == code, ct);
        if (meeting is null || meeting.HostId != userId) return false;

        meeting.Status = MeetingStatus.Ended;
        meeting.EndedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
        return true;
    }

    /// <summary>Host-only rename. Returns the new title, or null if not allowed / not found.</summary>
    public async Task<string?> RenameAsync(string code, Guid userId, string? title, CancellationToken ct)
    {
        var trimmed = title?.Trim();
        if (string.IsNullOrEmpty(trimmed)) return null;
        if (trimmed.Length > 200) trimmed = trimmed[..200];

        var meeting = await db.Meetings.FirstOrDefaultAsync(m => m.Code == code, ct);
        if (meeting is null || meeting.HostId != userId || meeting.Status == MeetingStatus.Ended)
            return null;

        meeting.Title = trimmed;
        await db.SaveChangesAsync(ct);
        return trimmed;
    }

    // ---- helpers ----------------------------------------------------

    private async Task<Meeting> ReloadAsync(Guid meetingId, CancellationToken ct) =>
        await db.Meetings
            .Include(m => m.Host)
            .Include(m => m.Participants).ThenInclude(p => p.User)
            .AsNoTracking()
            .FirstAsync(m => m.Id == meetingId, ct);

    private async Task<string> GenerateUniqueCodeAsync(CancellationToken ct)
    {
        for (var attempt = 0; attempt < 8; attempt++)
        {
            var code = string.Join('-', Groups.Select(RandomSegment));
            if (!await db.Meetings.AnyAsync(m => m.Code == code, ct))
                return code;
        }
        throw new InvalidOperationException("Could not allocate a unique meeting code.");
    }

    private static string RandomSegment(int length)
    {
        Span<char> chars = stackalloc char[length];
        for (var i = 0; i < length; i++)
            chars[i] = CodeAlphabet[RandomNumberGenerator.GetInt32(CodeAlphabet.Length)];
        return new string(chars);
    }

    private static MeetingDetailDto ToDetailDto(Meeting m) => new(
        m.Id, m.Code, m.Title, m.Status, m.HostId, m.Host?.Name ?? "Host", m.CreatedAt,
        m.Participants
            .OrderBy(p => p.JoinedAt)
            .Select(ToParticipantDto)
            .ToList());

    private static ParticipantDto ToParticipantDto(MeetingParticipant p) => new(
        p.Id, p.UserId, p.DisplayName, p.Role,
        p.User?.AvatarColor ?? p.AvatarColor,
        p.User?.AvatarUrl ?? p.AvatarUrl,
        p.IsConnected, p.JoinedAt);
}
