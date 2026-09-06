using CoreMeet.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace CoreMeet.Api.Infrastructure.Persistence;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();

    public DbSet<Meeting> Meetings => Set<Meeting>();

    public DbSet<MeetingParticipant> MeetingParticipants => Set<MeetingParticipant>();

    public DbSet<ChatMessage> ChatMessages => Set<ChatMessage>();

    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // Every key is a Guid assigned in the domain constructor, never database-generated.
        // Without this, EF treats a graph-added entity that already carries a key value as
        // Modified (→ an UPDATE that affects 0 rows) rather than Added.
        foreach (var key in builder.Model.GetEntityTypes()
                     .Select(t => t.FindPrimaryKey())
                     .Where(k => k is { Properties.Count: 1 })
                     .Select(k => k!.Properties[0])
                     .Where(p => p.ClrType == typeof(Guid)))
        {
            key.ValueGenerated = Microsoft.EntityFrameworkCore.Metadata.ValueGenerated.Never;
        }

        builder.Entity<User>(e =>
        {
            e.HasKey(u => u.Id);
            e.Property(u => u.Name).HasMaxLength(120).IsRequired();
            e.Property(u => u.Email).HasMaxLength(256).IsRequired();
            e.HasIndex(u => u.Email).IsUnique();
            e.Property(u => u.PasswordHash).HasMaxLength(256).IsRequired();
            e.Property(u => u.AvatarColor).HasMaxLength(9);
            e.Property(u => u.AvatarUrl).HasColumnType("mediumtext");
        });

        builder.Entity<Meeting>(e =>
        {
            e.HasKey(m => m.Id);
            e.Property(m => m.Code).HasMaxLength(32).IsRequired();
            e.HasIndex(m => m.Code).IsUnique();
            e.Property(m => m.Title).HasMaxLength(200).IsRequired();
            e.HasOne(m => m.Host)
                .WithMany(u => u.HostedMeetings)
                .HasForeignKey(m => m.HostId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<MeetingParticipant>(e =>
        {
            e.HasKey(p => p.Id);
            e.Property(p => p.DisplayName).HasMaxLength(120).IsRequired();
            e.Property(p => p.AvatarColor).HasMaxLength(9);
            e.Property(p => p.AvatarUrl).HasColumnType("mediumtext");
            e.HasOne(p => p.Meeting)
                .WithMany(m => m.Participants)
                .HasForeignKey(p => p.MeetingId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(p => p.User)
                .WithMany(u => u.Participations)
                .HasForeignKey(p => p.UserId)
                .OnDelete(DeleteBehavior.SetNull);
            // One row per (meeting, account). Guests all have a null user_id and
            // MySQL permits repeated NULLs, so they are unaffected.
            e.HasIndex(p => new { p.MeetingId, p.UserId }).IsUnique();
        });

        builder.Entity<RefreshToken>(e =>
        {
            e.HasKey(t => t.Id);
            e.Property(t => t.TokenHash).HasMaxLength(128).IsRequired();
            e.Property(t => t.ReplacedByTokenHash).HasMaxLength(128);
            e.HasIndex(t => t.TokenHash).IsUnique();
            e.Ignore(t => t.IsActive);
            e.HasOne(t => t.User)
                .WithMany(u => u.RefreshTokens)
                .HasForeignKey(t => t.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<ChatMessage>(e =>
        {
            e.HasKey(c => c.Id);
            e.Property(c => c.SenderName).HasMaxLength(120).IsRequired();
            e.Property(c => c.Content).HasMaxLength(4000).IsRequired();
            e.HasOne(c => c.Meeting)
                .WithMany(m => m.Messages)
                .HasForeignKey(c => c.MeetingId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasIndex(c => new { c.MeetingId, c.SentAt });
        });
    }
}
