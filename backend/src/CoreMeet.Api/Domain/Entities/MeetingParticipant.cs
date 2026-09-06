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

    public string DisplayName { get; set; } = string.Empty;

    public ParticipantRole Role { get; set; } = ParticipantRole.Guest;

    public bool IsConnected { get; set; }

    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;

    public DateTime? LeftAt { get; set; }
}
