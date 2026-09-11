using CoreMeet.Api.Common.Auth;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CoreMeet.Api.Features.Meetings;

[ApiController]
[Route("api/[controller]")]
public class MeetingsController(MeetingService meetings, ICurrentUser currentUser) : ControllerBase
{
    [Authorize]
    [HttpPost]
    public async Task<IActionResult> Create(CreateMeetingRequest req, CancellationToken ct)
    {
        if (currentUser.UserId is not { } userId) return Unauthorized();
        var meeting = await meetings.CreateAsync(userId, req.Title, ct);
        return CreatedAtAction(nameof(GetByCode), new { code = meeting.Code }, meeting);
    }

    [Authorize]
    [HttpGet("mine")]
    public async Task<IActionResult> Mine(CancellationToken ct)
    {
        if (currentUser.UserId is not { } userId) return Unauthorized();
        return Ok(await meetings.GetMineAsync(userId, ct));
    }

    [AllowAnonymous]
    [HttpGet("{code}")]
    public async Task<IActionResult> GetByCode(string code, CancellationToken ct)
    {
        var meeting = await meetings.GetByCodeAsync(code, ct);
        return meeting is null ? NotFound(new { message = "Meeting not found." }) : Ok(meeting);
    }

    [AllowAnonymous]
    [HttpPost("{code}/join")]
    public async Task<IActionResult> Join(string code, JoinMeetingRequest req, CancellationToken ct)
    {
        var avatar = req.AvatarUrl;
        if (!string.IsNullOrEmpty(avatar) &&
            (avatar.Length > 700_000 || !avatar.StartsWith("data:image/", StringComparison.OrdinalIgnoreCase)))
        {
            avatar = null; // silently drop an oversized / unsupported guest avatar
        }

        var result = await meetings.JoinAsync(code, currentUser.UserId, req.DisplayName, avatar, req.GuestKey, ct);
        return result is null
            ? NotFound(new { message = "This meeting is not available." })
            : Ok(result);
    }

    [Authorize]
    [HttpPut("{code}")]
    public async Task<IActionResult> Rename(string code, RenameMeetingRequest req, CancellationToken ct)
    {
        if (currentUser.UserId is not { } userId) return Unauthorized();
        var title = await meetings.RenameAsync(code, userId, req.Title, ct);
        return title is null ? Forbid() : Ok(new { title });
    }

    [Authorize]
    [HttpPost("{code}/end")]
    public async Task<IActionResult> End(string code, CancellationToken ct)
    {
        if (currentUser.UserId is not { } userId) return Unauthorized();
        var ok = await meetings.EndAsync(code, userId, ct);
        return ok ? NoContent() : Forbid();
    }
}
