using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace hhru.Migrations
{
    /// <inheritdoc />
    public partial class AssignmentComplianceUpgrade : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ModerationComment",
                table: "Opportunities",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "LogoUrl",
                table: "EmployerProfiles",
                type: "character varying(500)",
                maxLength: 500,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "VerificationComment",
                table: "EmployerProfiles",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "VerificationStatus",
                table: "EmployerProfiles",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "VideoPresentationUrl",
                table: "EmployerProfiles",
                type: "character varying(500)",
                maxLength: 500,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "CareerInterests",
                table: "ApplicantProfiles",
                type: "character varying(500)",
                maxLength: 500,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<bool>(
                name: "IsProfilePublic",
                table: "ApplicantProfiles",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "ShowApplicationsToApplicants",
                table: "ApplicantProfiles",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "ShowResumeToAuthenticatedUsers",
                table: "ApplicantProfiles",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateTable(
                name: "PlatformTags",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Category = table.Column<int>(type: "integer", nullable: false),
                    IsSystem = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedByUserId = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PlatformTags", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PlatformTags_AspNetUsers_CreatedByUserId",
                        column: x => x.CreatedByUserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "Recommendations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    RecommenderApplicantProfileId = table.Column<Guid>(type: "uuid", nullable: false),
                    RecommendedApplicantProfileId = table.Column<Guid>(type: "uuid", nullable: false),
                    OpportunityId = table.Column<Guid>(type: "uuid", nullable: false),
                    Message = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Recommendations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Recommendations_ApplicantProfiles_RecommendedApplicantProfi~",
                        column: x => x.RecommendedApplicantProfileId,
                        principalTable: "ApplicantProfiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Recommendations_ApplicantProfiles_RecommenderApplicantProfi~",
                        column: x => x.RecommenderApplicantProfileId,
                        principalTable: "ApplicantProfiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Recommendations_Opportunities_OpportunityId",
                        column: x => x.OpportunityId,
                        principalTable: "Opportunities",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PlatformTags_CreatedByUserId",
                table: "PlatformTags",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_PlatformTags_Name",
                table: "PlatformTags",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Recommendations_OpportunityId",
                table: "Recommendations",
                column: "OpportunityId");

            migrationBuilder.CreateIndex(
                name: "IX_Recommendations_RecommendedApplicantProfileId",
                table: "Recommendations",
                column: "RecommendedApplicantProfileId");

            migrationBuilder.CreateIndex(
                name: "IX_Recommendations_RecommenderApplicantProfileId_RecommendedAp~",
                table: "Recommendations",
                columns: new[] { "RecommenderApplicantProfileId", "RecommendedApplicantProfileId", "OpportunityId" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PlatformTags");

            migrationBuilder.DropTable(
                name: "Recommendations");

            migrationBuilder.DropColumn(
                name: "ModerationComment",
                table: "Opportunities");

            migrationBuilder.DropColumn(
                name: "LogoUrl",
                table: "EmployerProfiles");

            migrationBuilder.DropColumn(
                name: "VerificationComment",
                table: "EmployerProfiles");

            migrationBuilder.DropColumn(
                name: "VerificationStatus",
                table: "EmployerProfiles");

            migrationBuilder.DropColumn(
                name: "VideoPresentationUrl",
                table: "EmployerProfiles");

            migrationBuilder.DropColumn(
                name: "CareerInterests",
                table: "ApplicantProfiles");

            migrationBuilder.DropColumn(
                name: "IsProfilePublic",
                table: "ApplicantProfiles");

            migrationBuilder.DropColumn(
                name: "ShowApplicationsToApplicants",
                table: "ApplicantProfiles");

            migrationBuilder.DropColumn(
                name: "ShowResumeToAuthenticatedUsers",
                table: "ApplicantProfiles");
        }
    }
}
