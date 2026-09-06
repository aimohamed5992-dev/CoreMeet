using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace CoreMeet.Api.Infrastructure.Persistence;

/// <summary>
/// Used by the EF Core CLI (`dotnet ef`) so migrations can be created without booting the web host.
/// </summary>
public class AppDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
{
    public AppDbContext CreateDbContext(string[] args)
    {
        var connectionString = Environment.GetEnvironmentVariable("COREMEET_DB")
            ?? "server=localhost;port=3306;database=coremeet;user=root;password=";

        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseMySql(connectionString, new MariaDbServerVersion(new Version(10, 4, 28)))
            .UseSnakeCaseNamingConvention()
            .Options;

        return new AppDbContext(options);
    }
}
