namespace CoreMeet.Api.Common.Settings;

public class JwtSettings
{
    public const string SectionName = "Jwt";

    public string Issuer { get; set; } = "CoreMeet";

    public string Audience { get; set; } = "CoreMeet";

    public string Secret { get; set; } = string.Empty;

    public int AccessTokenMinutes { get; set; } = 30;

    public int RefreshTokenDays { get; set; } = 7;
}
