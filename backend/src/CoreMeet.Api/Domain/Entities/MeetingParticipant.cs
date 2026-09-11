using CoreMeet.Api.Domain.Enums;

namespace CoreMeet.Api.Domain.Entities;

public class MeetingParticipant
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid MeetingId { get; set; }

    public Meeting? Meeting { get; set; }

    /// <summary>Null when the participant joined as an anonymous guest.</summary>
    public Guid? UserId { get; set; }

    public User? User { get; set; }

    /// <summary>
    /// Client-generated id (stored in the guest's browser) identifying a returning
    /// guest across leave/rejoin so they get one roster row instead of a new one
    /// each time. Null for signed-in users, who are matched by <see cref="UserId"/>.
    /// </summary>
    public string? GuestKey { get; set; }

    public string DisplayName { get; set; } = string.Empty;

    /// <summary>Avatar for guests (or a snapshot of the user's avatar), as a data URI.</summary>
    public string? AvatarUrl { get; set; }

    /// <summary>Hex fallback colour for this participant's avatar.</summary>
    public string AvatarColor { get; set; } = "#667a6f";

    public ParticipantRole Role { get; set; } = ParticipantRole.Guest;

    public bool IsConnected { get; set; }

    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;

    public DateTime? LeftAt { get; set; }
}
