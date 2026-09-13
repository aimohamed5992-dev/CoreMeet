using System.Collections.Concurrent;

namespace CoreMeet.Api.Features.Meetings;

/// <summary>A non-host connection waiting for the host to admit it into the room.</summary>
public record JoinRequest(
    string ConnectionId,
    string Code,
    Guid ParticipantId,
    string DisplayName,
    string AvatarColor,
    string? AvatarUrl,
    string? Client);

/// <summary>
/// Tracks pending "knock to join" requests: a non-host connection registers here
/// instead of the live <see cref="MeetingConnectionRegistry"/> until the host
/// admits it. Single-instance only, like the other registries.
/// </summary>
public class JoinRequestRegistry
{
    private readonly ConcurrentDictionary<string, JoinRequest> _byConnection = new();

    public void Add(JoinRequest request) => _byConnection[request.ConnectionId] = request;

    public JoinRequest? Get(string connectionId) =>
        _byConnection.TryGetValue(connectionId, out var r) ? r : null;

    public JoinRequest? Remove(string connectionId) =>
        _byConnection.TryRemove(connectionId, out var r) ? r : null;

    public IReadOnlyList<JoinRequest> InRoom(string code) =>
        _byConnection.Values.Where(r => r.Code == code).ToList();
}
