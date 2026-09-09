using System.Collections.Concurrent;

namespace CoreMeet.Api.Features.Meetings;

/// <summary>
/// An active remote-control session: <paramref name="ControllerConnectionId"/> is driving
/// the mouse/keyboard of <paramref name="TargetConnectionId"/>, who is sharing their screen.
/// </summary>
public record ControlSession(
    string Code,
    string TargetConnectionId,
    Guid TargetParticipantId,
    string ControllerConnectionId,
    Guid ControllerParticipantId,
    string ControllerName);

/// <summary>
/// Tracks live screen-control sessions. Rules enforced by the hub around this:
///  - the target must currently be sharing their screen
///  - one controller per target at a time
///  - a session ends the moment the target stops sharing or either party disconnects
/// Single-instance only, like <see cref="MeetingConnectionRegistry"/>.
/// </summary>
public class ControlRegistry
{
    // keyed by the target connection id (the person being controlled)
    private readonly ConcurrentDictionary<string, ControlSession> _byTarget = new();

    public bool TryStart(ControlSession session) => _byTarget.TryAdd(session.TargetConnectionId, session);

    public ControlSession? GetByTarget(string targetConnectionId) =>
        _byTarget.TryGetValue(targetConnectionId, out var s) ? s : null;

    public ControlSession? GetByController(string controllerConnectionId) =>
        _byTarget.Values.FirstOrDefault(s => s.ControllerConnectionId == controllerConnectionId);

    public ControlSession? EndByTarget(string targetConnectionId) =>
        _byTarget.TryRemove(targetConnectionId, out var s) ? s : null;

    public ControlSession? EndByController(string controllerConnectionId)
    {
        var session = GetByController(controllerConnectionId);
        return session is not null && _byTarget.TryRemove(session.TargetConnectionId, out var removed) ? removed : null;
    }

    /// <summary>Removes and returns every session where the connection is the target or the controller.</summary>
    public IReadOnlyList<ControlSession> EndAllInvolving(string connectionId)
    {
        var affected = _byTarget.Values
            .Where(s => s.TargetConnectionId == connectionId || s.ControllerConnectionId == connectionId)
            .ToList();
        foreach (var s in affected) _byTarget.TryRemove(s.TargetConnectionId, out _);
        return affected;
    }

    public IReadOnlyList<ControlSession> InRoom(string code) =>
        _byTarget.Values.Where(s => s.Code == code).ToList();
}
