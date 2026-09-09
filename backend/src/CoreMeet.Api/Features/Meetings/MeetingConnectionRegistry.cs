using System.Collections.Concurrent;

namespace CoreMeet.Api.Features.Meetings;

public record ConnectionInfo(
    string ConnectionId,
    string Code,
    Guid ParticipantId,
    string DisplayName,
    string AvatarColor = "#667a6f",
    string? AvatarUrl = null)
{
    /// <summary>Whether this connection is currently sharing its screen (from the last <c>SetMediaState</c>).</summary>
    public bool SharingScreen { get; set; }

    /// <summary>True for the CoreMeet desktop app — only it can be a remote-control target.</summary>
    public bool IsDesktop { get; set; }
}

/// <summary>
/// In-memory map of live SignalR connections to meeting participants. Single-instance
/// only — a multi-node deployment would move this to a backplane (Redis).
/// </summary>
public class MeetingConnectionRegistry
{
    private readonly ConcurrentDictionary<string, ConnectionInfo> _byConnection = new();

    public void Add(ConnectionInfo info) => _byConnection[info.ConnectionId] = info;

    public ConnectionInfo? Remove(string connectionId) =>
        _byConnection.TryRemove(connectionId, out var info) ? info : null;

    public ConnectionInfo? Get(string connectionId) =>
        _byConnection.TryGetValue(connectionId, out var info) ? info : null;

    public IReadOnlyList<ConnectionInfo> InRoom(string code) =>
        _byConnection.Values.Where(c => c.Code == code).ToList();
}
