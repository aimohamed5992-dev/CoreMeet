namespace CoreMeet.Api.Common.Settings;

public class JwtSettings
{
    public const string SectionName = "Jwt";

    public string Issuer { get; set; } = "CoreMeet";

    public string Audience { get; set; } = "CoreMeet";

    public string Secret { get; set; } = string.Empty;

    public int AccessTokenMinutes { get; set; } = 30;

    /// <summary>
    /// Sliding: renewed on every successful refresh (see TokenService.RenewRefreshToken),
    /// so a session effectively never expires as long as the app is opened at least once
    /// within this window. 365 days ~ "stays signed in" without issuing a token that's
    /// truly infinite (a lost/stolen device is still bounded, and logout still revokes it).
    /// </summary>
    public int RefreshTokenDays { get; set; } = 365;
}
