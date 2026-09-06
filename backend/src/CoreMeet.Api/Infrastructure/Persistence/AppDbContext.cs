using CoreMeet.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace CoreMeet.Api.Infrastructure.Persistence;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();

    public DbSet<Meeting> Meetings => Set<Meeting>();

    public DbSet<MeetingParticipant> MeetingParticipants => Set<MeetingParticipant>();

    public DbSet<ChatMessage> ChatMessages => Set<ChatMessage>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<User>(e =>
        {
            e.HasKey(u => u.Id);
            e.Property(u => u.Name).HasMaxLength(120).IsRequired();
            e.Property(u => u.Email).HasMaxLength(256).IsRequired();
            e.HasIndex(u => u.Email).IsUnique();
            e.Property(u => u.PasswordHash).HasMaxLength(256).IsRequired();
            e.Property(u => u.AvatarColor).HasMaxLength(9);
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
            e.HasOne(p => p.Meeting)
                .WithMany(m => m.Participants)
                .HasForeignKey(p => p.MeetingId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(p => p.User)
                .WithMany(u => u.Participations)
                .HasForeignKey(p => p.UserId)
                .OnDelete(DeleteBehavior.SetNull);
            e.HasIndex(p => new { p.MeetingId, p.UserId });
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
