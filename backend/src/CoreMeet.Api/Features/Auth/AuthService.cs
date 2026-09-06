using CoreMeet.Api.Common.Auth;
using CoreMeet.Api.Domain.Entities;
using CoreMeet.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CoreMeet.Api.Features.Auth;

public class AuthResult
{
    public AuthResponse? Response { get; private init; }
    public string? Error { get; private init; }
    public bool Succeeded => Response is not null;

    public static AuthResult Ok(AuthResponse response) => new() { Response = response };
    public static AuthResult Fail(string error) => new() { Error = error };
}

public class AuthService(AppDbContext db, ITokenService tokens)
{
    private static readonly string[] AvatarColors =
        ["#1FA84C", "#2563EB", "#7C3AED", "#DB2777", "#EA580C", "#0891B2", "#CA8A04"];

    public async Task<AuthResult> RegisterAsync(RegisterRequest req, CancellationToken ct)
    {
        var email = req.Email.Trim().ToLowerInvariant();

        if (await db.Users.AnyAsync(u => u.Email == email, ct))
            return AuthResult.Fail("An account with this email already exists.");

        var user = new User
        {
            Name = req.Name.Trim(),
            Email = email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password),
            AvatarColor = AvatarColors[Random.Shared.Next(AvatarColors.Length)],
        };

        db.Users.Add(user);
        var auth = await IssueTokensAsync(user, ct);
        await db.SaveChangesAsync(ct);
        return AuthResult.Ok(auth);
    }

    public async Task<AuthResult> LoginAsync(LoginRequest req, CancellationToken ct)
    {
        var email = req.Email.Trim().ToLowerInvariant();
        var user = await db.Users.FirstOrDefaultAsync(u => u.Email == email, ct);

        if (user is null || !BCrypt.Net.BCrypt.Verify(req.Password, user.PasswordHash))
            return AuthResult.Fail("Invalid email or password.");

        var auth = await IssueTokensAsync(user, ct);
        await db.SaveChangesAsync(ct);
        return AuthResult.Ok(auth);
    }

    public async Task<AuthResult> RefreshAsync(string rawToken, CancellationToken ct)
    {
        var hash = tokens.Hash(rawToken);
        var stored = await db.RefreshTokens
            .Include(t => t.User)
            .FirstOrDefaultAsync(t => t.TokenHash == hash, ct);

        if (stored is null || stored.User is null)
            return AuthResult.Fail("Invalid refresh token.");

        if (!stored.IsActive)
        {
            // Reuse of a rotated/revoked token — revoke the whole chain for safety.
            await db.RefreshTokens
                .Where(t => t.UserId == stored.UserId && t.RevokedAt == null)
                .ExecuteUpdateAsync(s => s.SetProperty(t => t.RevokedAt, DateTime.UtcNow), ct);
            return AuthResult.Fail("Refresh token is no longer valid.");
        }

        var (rawNew, entityNew) = tokens.CreateRefreshToken(stored.UserId);
        stored.RevokedAt = DateTime.UtcNow;
        stored.ReplacedByTokenHash = entityNew.TokenHash;
        db.RefreshTokens.Add(entityNew);

        var (access, accessExp) = tokens.CreateAccessToken(stored.User);
        await db.SaveChangesAsync(ct);

        return AuthResult.Ok(new AuthResponse(access, accessExp, rawNew, ToDto(stored.User)));
    }

    public async Task LogoutAsync(string rawToken, CancellationToken ct)
    {
        var hash = tokens.Hash(rawToken);
        await db.RefreshTokens
            .Where(t => t.TokenHash == hash && t.RevokedAt == null)
            .ExecuteUpdateAsync(s => s.SetProperty(t => t.RevokedAt, DateTime.UtcNow), ct);
    }

    public async Task<UserDto?> GetMeAsync(Guid userId, CancellationToken ct)
    {
        var user = await db.Users.FindAsync([userId], ct);
        return user is null ? null : ToDto(user);
    }

    public async Task<UserDto?> UpdateProfileAsync(Guid userId, UpdateProfileRequest req, CancellationToken ct)
    {
        var user = await db.Users.FindAsync([userId], ct);
        if (user is null) return null;

        user.Name = req.Name.Trim();
        var avatar = req.AvatarUrl?.Trim();
        user.AvatarUrl = string.IsNullOrEmpty(avatar) ? null : avatar;

        await db.SaveChangesAsync(ct);
        return ToDto(user);
    }

    private async Task<AuthResponse> IssueTokensAsync(User user, CancellationToken ct)
    {
        var (access, accessExp) = tokens.CreateAccessToken(user);
        var (rawRefresh, refreshEntity) = tokens.CreateRefreshToken(user.Id);
        db.RefreshTokens.Add(refreshEntity);
        await Task.CompletedTask;
        return new AuthResponse(access, accessExp, rawRefresh, ToDto(user));
    }

    private static UserDto ToDto(User u) => new(u.Id, u.Name, u.Email, u.AvatarColor, u.AvatarUrl);
}
