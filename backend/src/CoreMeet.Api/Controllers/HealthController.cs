using CoreMeet.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Mvc;

namespace CoreMeet.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HealthController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public IActionResult Get() => Ok(new { status = "ok", service = "CoreMeet.Api", time = DateTime.UtcNow });

    [HttpGet("db")]
    public async Task<IActionResult> Db(CancellationToken ct)
    {
        var canConnect = await db.Database.CanConnectAsync(ct);
        return canConnect
            ? Ok(new { database = "connected" })
            : StatusCode(503, new { database = "unavailable" });
    }
}
