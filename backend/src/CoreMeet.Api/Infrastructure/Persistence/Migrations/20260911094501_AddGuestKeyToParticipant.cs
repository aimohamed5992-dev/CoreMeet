using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CoreMeet.Api.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddGuestKeyToParticipant : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "guest_key",
                table: "meeting_participants",
                type: "varchar(80)",
                maxLength: 80,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "ix_meeting_participants_meeting_id_guest_key",
                table: "meeting_participants",
                columns: new[] { "meeting_id", "guest_key" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ix_meeting_participants_meeting_id_guest_key",
                table: "meeting_participants");

            migrationBuilder.DropColumn(
                name: "guest_key",
                table: "meeting_participants");
        }
    }
}
