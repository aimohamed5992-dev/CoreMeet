using CoreMeet.Api.Common.Auth;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CoreMeet.Api.Features.Auth;

[ApiController]
[Route("api/[controller]")]
public class AuthController(AuthService auth, ICurrentUser currentUser) : ControllerBase
{
    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterRequest req, CancellationToken ct)
    {
        var result = await auth.RegisterAsync(req, ct);
        return result.Succeeded
            ? Ok(result.Response)
            : Conflict(new { message = result.Error });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequest req, CancellationToken ct)
    {
        var result = await auth.LoginAsync(req, ct);
        return result.Succeeded
            ? Ok(result.Response)
            : Unauthorized(new { message = result.Error });
    }

    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh(RefreshRequest req, CancellationToken ct)
    {
        var result = await auth.RefreshAsync(req.RefreshToken, ct);
        return result.Succeeded
            ? Ok(result.Response)
            : Unauthorized(new { message = result.Error });
    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout(RefreshRequest req, CancellationToken ct)
    {
        await auth.LogoutAsync(req.RefreshToken, ct);
        return NoContent();
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> Me(CancellationToken ct)
    {
        if (currentUser.UserId is not { } id)
            return Unauthorized();

        var user = await auth.GetMeAsync(id, ct);
        return user is null ? Unauthorized() : Ok(user);
    }
}
