using CoreMeet.Api.Common.Auth;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CoreMeet.Api.Features.Auth;

[ApiController]
[Route("api/profile")]
[Authorize]
public class ProfileController(AuthService auth, ICurrentUser currentUser) : ControllerBase
{
    /// <summary>Max size of the stored avatar data URI (~700 KB of base64 ≈ 500 KB image).</summary>
    private const int MaxAvatarChars = 700_000;

    [HttpPut]
    public async Task<IActionResult> Update(UpdateProfileRequest req, CancellationToken ct)
    {
        if (currentUser.UserId is not { } userId) return Unauthorized();

        if (!string.IsNullOrEmpty(req.AvatarUrl))
        {
            if (req.AvatarUrl.Length > MaxAvatarChars)
                return BadRequest(new { message = "Image is too large. Please choose a smaller picture." });
            if (!req.AvatarUrl.StartsWith("data:image/", StringComparison.OrdinalIgnoreCase))
                return BadRequest(new { message = "Unsupported image format." });
        }

        var user = await auth.UpdateProfileAsync(userId, req, ct);
        return user is null ? Unauthorized() : Ok(user);
    }
}
