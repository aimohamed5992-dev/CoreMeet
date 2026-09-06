using CoreMeet.Api.Domain.Enums;

namespace CoreMeet.Api.Domain.Entities;

public class Meeting
{
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>Human-friendly join code, e.g. "abc-defg-hij".</summary>
    public string Code { get; set; } = string.Empty;

    public string Title { get; set; } = "New meeting";

    public Guid HostId { get; set; }

    public User? Host { get; set; }

    public MeetingStatus Status { get; set; } = MeetingStatus.Active;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? StartedAt { get; set; }

    public DateTime? EndedAt { get; set; }

    public ICollection<MeetingParticipant> Participants { get; set; } = new List<MeetingParticipant>();

    public ICollection<ChatMessage> Messages { get; set; } = new List<ChatMessage>();
}
