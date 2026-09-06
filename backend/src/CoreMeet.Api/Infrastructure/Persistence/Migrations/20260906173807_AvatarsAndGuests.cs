using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CoreMeet.Api.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AvatarsAndGuests : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "avatar_url",
                table: "users",
                type: "mediumtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "avatar_color",
                table: "meeting_participants",
                type: "varchar(9)",
                maxLength: 9,
                nullable: false,
                defaultValue: "")
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "avatar_url",
                table: "meeting_participants",
                type: "mediumtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "avatar_url",
                table: "users");

            migrationBuilder.DropColumn(
                name: "avatar_color",
                table: "meeting_participants");

            migrationBuilder.DropColumn(
                name: "avatar_url",
                table: "meeting_participants");
        }
    }
}
