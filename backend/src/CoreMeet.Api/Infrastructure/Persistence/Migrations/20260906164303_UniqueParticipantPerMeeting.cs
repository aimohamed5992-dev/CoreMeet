using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CoreMeet.Api.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class UniqueParticipantPerMeeting : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // The meeting_id FK relies on this index, so drop/recreate it around the change.
            migrationBuilder.DropForeignKey(
                name: "fk_meeting_participants_meetings_meeting_id",
                table: "meeting_participants");

            migrationBuilder.DropIndex(
                name: "ix_meeting_participants_meeting_id_user_id",
                table: "meeting_participants");

            migrationBuilder.CreateIndex(
                name: "ix_meeting_participants_meeting_id_user_id",
                table: "meeting_participants",
                columns: new[] { "meeting_id", "user_id" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "fk_meeting_participants_meetings_meeting_id",
                table: "meeting_participants",
                column: "meeting_id",
                principalTable: "meetings",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_meeting_participants_meetings_meeting_id",
                table: "meeting_participants");

            migrationBuilder.DropIndex(
                name: "ix_meeting_participants_meeting_id_user_id",
                table: "meeting_participants");

            migrationBuilder.CreateIndex(
                name: "ix_meeting_participants_meeting_id_user_id",
                table: "meeting_participants",
                columns: new[] { "meeting_id", "user_id" });

            migrationBuilder.AddForeignKey(
                name: "fk_meeting_participants_meetings_meeting_id",
                table: "meeting_participants",
                column: "meeting_id",
                principalTable: "meetings",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
