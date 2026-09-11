using System.ComponentModel.DataAnnotations;
using CoreMeet.Api.Domain.Enums;

namespace CoreMeet.Api.Features.Meetings;

public record CreateMeetingRequest
{
    [StringLength(200, MinimumLength = 1)]
    public string? Title { get; init; }
}

public record RenameMeetingRequest
{
    [Required, StringLength(200, MinimumLength = 1)]
    public string Title { get; init; } = string.Empty;
}

public record JoinMeetingRequest
{
    /// <summary>Required when joining without an account (guest). Ignored for authenticated users.</summary>
    [StringLength(120, MinimumLength = 1)]
    public string? DisplayName { get; init; }

    /// <summary>Optional guest avatar as a data URI.</summary>
    public string? AvatarUrl { get; init; }

    /// <summary>
    /// Client-generated id (persisted in the guest's browser) so a guest who
    /// leaves and rejoins reuses their roster row instead of duplicating it.
    /// Ignored for authenticated users, who are matched by their account.
    /// </summary>
    [StringLength(80)]
    public string? GuestKey { get; init; }
}

public record ParticipantDto(
    Guid Id,
    Guid? UserId,
    string DisplayName,
    ParticipantRole Role,
    string AvatarColor,
    string? AvatarUrl,
    bool IsConnected,
    DateTime JoinedAt);

public record MeetingDto(
    Guid Id,
    string Code,
    string Title,
    MeetingStatus Status,
    Guid HostId,
    string HostName,
    DateTime CreatedAt,
    int ParticipantCount);

public record MeetingDetailDto(
    Guid Id,
    string Code,
    string Title,
    MeetingStatus Status,
    Guid HostId,
    string HostName,
    DateTime CreatedAt,
    IReadOnlyList<ParticipantDto> Participants);

public record JoinMeetingResponse(MeetingDetailDto Meeting, ParticipantDto Me);

public record ChatMessageDto(Guid Id, Guid SenderParticipantId, string SenderName, string Content, DateTime SentAt);
