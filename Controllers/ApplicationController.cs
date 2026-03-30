using hhru.DataAccess.Models.Enums;
using hhru.DataAccess.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using hhru.DataAccess.Dtos;
using hhru.DataAccess.Context.DbContext;

namespace hhru.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ApplicationController : ControllerBase
    {
        private readonly AppDbContext _db;

        public ApplicationController(AppDbContext db)
        {
            _db = db;
        }

        [Authorize(Roles = "Applicant,Admin")]
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateApplicationDto dto)
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userIdClaim == null)
                return Unauthorized();

            var userId = Guid.Parse(userIdClaim);

            var applicantProfile = await _db.ApplicantProfiles
                .FirstOrDefaultAsync(x => x.UserId == userId);

            if (applicantProfile == null)
                return BadRequest("Сначала создайте профиль соискателя");

            var opportunity = await _db.Opportunities
                .Include(x => x.EmployerProfile)
                .FirstOrDefaultAsync(x => x.Id == dto.OpportunityId && !x.IsDeleted);

            if (opportunity == null)
                return NotFound("Возможность не найдена");

            if (opportunity.Status != OpportunityStatus.Active)
                return BadRequest("Откликаться можно только на активные возможности");

            var existingApplication = await _db.Applications
                .FirstOrDefaultAsync(x =>
                    x.ApplicantProfileId == applicantProfile.Id &&
                    x.OpportunityId == dto.OpportunityId);

            if (existingApplication != null)
                return BadRequest("Вы уже откликались на эту возможность");

            var application = new Application
            {
                ApplicantProfileId = applicantProfile.Id,
                OpportunityId = dto.OpportunityId,
                Message = dto.Message,
                Status = ApplicationStatus.Pending,
                CreatedAt = DateTime.UtcNow
            };

            _db.Applications.Add(application);
            await _db.SaveChangesAsync();

            return Ok(new
            {
                message = "Отклик успешно создан",
                application.Id
            });
        }

        [Authorize(Roles = "Applicant,Admin")]
        [HttpGet("my")]
        public async Task<IActionResult> GetMyApplications()
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userIdClaim == null)
                return Unauthorized();

            var userId = Guid.Parse(userIdClaim);

            var applicantProfile = await _db.ApplicantProfiles
                .FirstOrDefaultAsync(x => x.UserId == userId);

            if (applicantProfile == null)
                return BadRequest("Профиль соискателя не найден");

            var applications = await _db.Applications
                .Include(x => x.Opportunity)
                .ThenInclude(x => x.EmployerProfile)
                .Where(x => x.ApplicantProfileId == applicantProfile.Id)
                .OrderByDescending(x => x.CreatedAt)
                .ToListAsync();

            var result = applications.Select(x => new
            {
                x.Id,
                x.Message,
                x.Status,
                x.CreatedAt,
                x.UpdatedAt,
                Opportunity = x.Opportunity == null ? null : new
                {
                    x.Opportunity.Id,
                    x.Opportunity.Title,
                    x.Opportunity.Type,
                    x.Opportunity.City,
                    x.Opportunity.CompanyName,
                    x.Opportunity.Status
                }
            });

            return Ok(result);
        }

        [Authorize(Roles = "Employer,Admin")]
        [HttpGet("for-my-opportunities")]
        public async Task<IActionResult> GetForMyOpportunities()
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userIdClaim == null)
                return Unauthorized();

            var userId = Guid.Parse(userIdClaim);

            var employerProfile = await _db.EmployerProfiles
                .FirstOrDefaultAsync(x => x.UserId == userId);

            IQueryable<Application> query = _db.Applications
                .Include(x => x.Opportunity)
                .Include(x => x.ApplicantProfile)
                .ThenInclude(x => x!.User)
                .OrderByDescending(x => x.CreatedAt);

            if (User.IsInRole("Admin") && employerProfile == null)
            {
                query = query.Where(x => x.Opportunity != null);
            }
            else
            {
                if (employerProfile == null)
                    return BadRequest("Профиль работодателя не найден");

                query = query.Where(x => x.Opportunity != null && x.Opportunity.EmployerProfileId == employerProfile.Id);
            }

            var applications = await query.ToListAsync();

            var result = applications.Select(x => new
            {
                x.Id,
                x.Message,
                x.Status,
                x.CreatedAt,
                x.UpdatedAt,
                Opportunity = x.Opportunity == null ? null : new
                {
                    x.Opportunity.Id,
                    x.Opportunity.Title,
                    x.Opportunity.Type,
                    x.Opportunity.City
                },
                Applicant = x.ApplicantProfile == null ? null : new
                {
                    x.ApplicantProfile.Id,
                    x.ApplicantProfile.FullName,
                    x.ApplicantProfile.University,
                    x.ApplicantProfile.Faculty,
                    x.ApplicantProfile.CourseOrGraduationYear,
                    x.ApplicantProfile.City,
                    x.ApplicantProfile.GitHubUrl,
                    x.ApplicantProfile.PortfolioUrl,
                    ResumeFileUrl = x.ApplicantProfile.ShowResumeToAuthenticatedUsers || User.IsInRole("Admin")
                        ? x.ApplicantProfile.ResumeFileUrl
                        : null,
                    ContactEmail = x.ApplicantProfile.ShowEmail || User.IsInRole("Admin")
                        ? x.ApplicantProfile.User != null
                            ? x.ApplicantProfile.User.Email
                            : null
                        : null
                }
            });

            return Ok(result);
        }

        [Authorize(Roles = "Employer,Admin")]
        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateApplicationStatusDto dto)
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userIdClaim == null)
                return Unauthorized();

            var userId = Guid.Parse(userIdClaim);

            var application = await _db.Applications
                .Include(x => x.Opportunity)
                .FirstOrDefaultAsync(x => x.Id == id);

            if (application == null)
                return NotFound("Отклик не найден");

            if (application.Opportunity == null)
                return BadRequest("У отклика отсутствует возможность");

            if (!User.IsInRole("Admin"))
            {
                var employerProfile = await _db.EmployerProfiles
                    .FirstOrDefaultAsync(x => x.UserId == userId);

                if (employerProfile == null)
                    return BadRequest("Профиль работодателя не найден");

                if (application.Opportunity.EmployerProfileId != employerProfile.Id)
                    return Forbid();
            }

            application.Status = dto.Status;
            application.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();

            return Ok(new { message = "Статус отклика обновлен" });
        }
    }
}
