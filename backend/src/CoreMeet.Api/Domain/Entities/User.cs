namespace CoreMeet.Api.Domain.Entities;

public class User
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public string Name { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string PasswordHash { get; set; } = string.Empty;

    /// <summary>Hex color used for the user's avatar fallback in the UI.</summary>
    public string AvatarColor { get; set; } = "#1FA84C";

    /// <summary>Optional uploaded profile picture, stored as a data URI (client-resized).</summary>
    public string? AvatarUrl { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Meeting> HostedMeetings { get; set; } = new List<Meeting>();

    public ICollection<MeetingParticipant> Participations { get; set; } = new List<MeetingParticipant>();

    public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
}
