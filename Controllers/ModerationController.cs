using hhru.DataAccess.Context.DbContext;
using hhru.DataAccess.Dtos;
using hhru.DataAccess.Models.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace hhru.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Curator,Admin")]
    public class ModerationController : ControllerBase
    {
        private readonly AppDbContext _db;

        public ModerationController(AppDbContext db)
        {
            _db = db;
        }

        [HttpGet("employers")]
        public async Task<IActionResult> GetEmployers([FromQuery] EmployerVerificationStatus? status)
        {
            var query = _db.EmployerProfiles
                .Include(x => x.User)
                .AsQueryable();

            if (status.HasValue)
                query = query.Where(x => x.VerificationStatus == status.Value);
            else
                query = query.Where(x => x.VerificationStatus == EmployerVerificationStatus.Pending || x.VerificationStatus == EmployerVerificationStatus.RequiresInfo);

            var employers = await query
                .OrderByDescending(x => x.CreatedAt)
                .ToListAsync();

            return Ok(employers.Select(x => new
            {
                x.Id,
                x.CompanyName,
                x.Description,
                x.Industry,
                x.WebsiteUrl,
                x.SocialLinks,
                x.VerificationMethod,
                x.VerificationData,
                x.VerificationStatus,
                x.VerificationComment,
                x.IsVerified,
                x.VerifiedAt,
                x.City,
                x.OfficeAddress,
                x.CreatedAt,
                User = x.User == null ? null : new
                {
                    x.User.Id,
                    x.User.DisplayName,
                    x.User.Email
                }
            }));
        }

        [HttpPut("employers/{id}/verification")]
        public async Task<IActionResult> UpdateEmployerVerification(Guid id, [FromBody] UpdateEmployerVerificationDto dto)
        {
            var employer = await _db.EmployerProfiles
                .Include(x => x.User)
                .FirstOrDefaultAsync(x => x.Id == id);

            if (employer == null)
                return NotFound("Профиль работодателя не найден");

            employer.VerificationStatus = dto.Status;
            employer.VerificationComment = dto.Comment;
            employer.IsVerified = dto.Status == EmployerVerificationStatus.Verified;
            employer.VerifiedAt = employer.IsVerified ? DateTime.UtcNow : null;

            await _db.SaveChangesAsync();

            return Ok(new
            {
                message = "Статус верификации обновлен",
                employer.Id,
                employer.VerificationStatus,
                employer.IsVerified
            });
        }

        [HttpGet("opportunities")]
        public async Task<IActionResult> GetOpportunities([FromQuery] OpportunityStatus? status)
        {
            var query = _db.Opportunities
                .Include(x => x.EmployerProfile)
                .ThenInclude(x => x.User)
                .Where(x => !x.IsDeleted)
                .AsQueryable();

            if (status.HasValue)
                query = query.Where(x => x.Status == status.Value);
            else
                query = query.Where(x =>
                    x.Status == OpportunityStatus.OnModeration ||
                    x.Status == OpportunityStatus.Planned);

            var opportunities = await query
                .OrderByDescending(x => x.PublishedAt)
                .ToListAsync();

            return Ok(opportunities.Select(x => new
            {
                x.Id,
                x.Title,
                x.ShortDescription,
                x.FullDescription,
                x.Type,
                x.WorkFormat,
                x.Status,
                x.CompanyName,
                x.City,
                x.Address,
                x.SalaryFrom,
                x.SalaryTo,
                x.Tags,
                x.ContactEmail,
                x.ContactPhone,
                x.ExternalUrl,
                x.MediaUrl,
                x.Latitude,
                x.Longitude,
                x.PublishedAt,
                x.ExpiresAt,
                x.EventDate,
                x.IsVerifiedOnly,
                x.ModerationComment,
                Employer = x.EmployerProfile == null ? null : new
                {
                    x.EmployerProfile.Id,
                    x.EmployerProfile.CompanyName,
                    x.EmployerProfile.IsVerified,
                    x.EmployerProfile.VerificationStatus,
                    User = x.EmployerProfile.User == null ? null : new
                    {
                        x.EmployerProfile.User.Id,
                        x.EmployerProfile.User.DisplayName,
                        x.EmployerProfile.User.Email
                    }
                }
            }));
        }

        [HttpPut("opportunities/{id}")]
        public async Task<IActionResult> ModerateOpportunity(Guid id, [FromBody] ModerateOpportunityDto dto)
        {
            var opportunity = await _db.Opportunities
                .FirstOrDefaultAsync(x => x.Id == id && !x.IsDeleted);

            if (opportunity == null)
                return NotFound("Карточка возможности не найдена");

            opportunity.Status = dto.Status;
            opportunity.ModerationComment = dto.ModerationComment;

            await _db.SaveChangesAsync();

            return Ok(new
            {
                message = "Статус карточки обновлен",
                opportunity.Id,
                opportunity.Status
            });
        }
    }
}
