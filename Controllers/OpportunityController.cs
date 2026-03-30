using hhru.DataAccess.Context.DbContext;
using hhru.DataAccess.Dtos;
using hhru.DataAccess.Models;
using hhru.DataAccess.Models.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace hhru.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class OpportunityController : ControllerBase
    {
        private readonly AppDbContext _db;

        public OpportunityController(AppDbContext db)
        {
            _db = db;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll(
            [FromQuery] OpportunityType? type,
            [FromQuery] string? city,
            [FromQuery] OpportunityStatus? status,
            [FromQuery] string? search,
            [FromQuery] WorkFormat? workFormat,
            [FromQuery] decimal? salaryFrom,
            [FromQuery] decimal? salaryTo,
            [FromQuery] string? tag)
        {
            var viewerIsModerator = User.IsInRole("Curator") || User.IsInRole("Admin");

            var query = _db.Opportunities
                .Include(x => x.EmployerProfile)
                .ThenInclude(x => x.User)
                .Where(x => !x.IsDeleted)
                .AsQueryable();

            if (type.HasValue)
                query = query.Where(x => x.Type == type.Value);

            if (workFormat.HasValue)
                query = query.Where(x => x.WorkFormat == workFormat.Value);

            if (!string.IsNullOrWhiteSpace(city))
            {
                var loweredCity = city.ToLower();
                query = query.Where(x => x.City.ToLower().Contains(loweredCity));
            }

            if (status.HasValue && (viewerIsModerator || status == OpportunityStatus.Active))
                query = query.Where(x => x.Status == status.Value);
            else
                query = query.Where(x => x.Status == OpportunityStatus.Active);

            if (salaryFrom.HasValue)
                query = query.Where(x => (x.SalaryTo ?? x.SalaryFrom ?? 0) >= salaryFrom.Value);

            if (salaryTo.HasValue)
                query = query.Where(x => (x.SalaryFrom ?? x.SalaryTo ?? salaryTo.Value) <= salaryTo.Value);

            if (!string.IsNullOrWhiteSpace(tag))
            {
                var loweredTag = tag.ToLower();
                query = query.Where(x => x.Tags.ToLower().Contains(loweredTag));
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                var lowered = search.ToLower();
                query = query.Where(x =>
                    x.Title.ToLower().Contains(lowered) ||
                    x.ShortDescription.ToLower().Contains(lowered) ||
                    x.FullDescription.ToLower().Contains(lowered) ||
                    x.CompanyName.ToLower().Contains(lowered) ||
                    x.Tags.ToLower().Contains(lowered));
            }

            var opportunities = await query
                .OrderByDescending(x => x.PublishedAt)
                .ToListAsync();

            return Ok(opportunities.Select(x => BuildOpportunityResponse(x, viewerIsModerator)));
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var opportunity = await _db.Opportunities
                .Include(x => x.EmployerProfile)
                .ThenInclude(x => x.User)
                .FirstOrDefaultAsync(x => x.Id == id && !x.IsDeleted);

            if (opportunity == null)
                return NotFound("Карточка возможности не найдена");

            var currentUserId = GetCurrentUserId();
            var isOwner = currentUserId != null && opportunity.EmployerProfile?.UserId == currentUserId;
            var isModerator = User.IsInRole("Curator") || User.IsInRole("Admin");

            if (!isModerator && !isOwner && opportunity.Status != OpportunityStatus.Active)
                return NotFound("Карточка возможности не найдена");

            return Ok(BuildOpportunityResponse(opportunity, isModerator || isOwner, true));
        }

        [Authorize(Roles = "Employer,Admin")]
        [HttpGet("my")]
        public async Task<IActionResult> GetMyOpportunities()
        {
            var userId = GetCurrentUserId();
            if (userId == null)
                return Unauthorized();

            if (User.IsInRole("Admin") && !User.IsInRole("Employer"))
            {
                var allOpportunities = await _db.Opportunities
                    .Include(x => x.EmployerProfile)
                    .ThenInclude(x => x.User)
                    .Where(x => !x.IsDeleted)
                    .OrderByDescending(x => x.PublishedAt)
                    .ToListAsync();

                return Ok(allOpportunities.Select(x => BuildOpportunityResponse(x, true)));
            }

            var employerProfile = await _db.EmployerProfiles
                .Include(x => x.User)
                .FirstOrDefaultAsync(x => x.UserId == userId);

            if (employerProfile == null)
                return BadRequest("Сначала создайте профиль работодателя");

            var opportunities = await _db.Opportunities
                .Include(x => x.EmployerProfile)
                .ThenInclude(x => x.User)
                .Where(x => x.EmployerProfileId == employerProfile.Id && !x.IsDeleted)
                .OrderByDescending(x => x.PublishedAt)
                .ToListAsync();

            return Ok(opportunities.Select(x => BuildOpportunityResponse(x, true)));
        }

        [Authorize(Roles = "Employer")]
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateOpportunityDto dto)
        {
            var userId = GetCurrentUserId();
            if (userId == null)
                return Unauthorized();

            var employerProfile = await _db.EmployerProfiles
                .FirstOrDefaultAsync(x => x.UserId == userId);

            if (employerProfile == null)
                return BadRequest("Сначала создайте профиль работодателя");

            if (!employerProfile.IsVerified)
                return BadRequest("Публикация доступна только после верификации работодателя");

            if (string.IsNullOrWhiteSpace(dto.Title))
                return BadRequest("Название обязательно");

            var opportunity = new Opportunity
            {
                EmployerProfileId = employerProfile.Id,
                PublishedAt = DateTime.UtcNow
            };

            ApplyOpportunityData(opportunity, dto, employerProfile, false);

            _db.Opportunities.Add(opportunity);
            await _db.SaveChangesAsync();

            return Ok(new
            {
                message = "Карточка возможности создана и отправлена на модерацию",
                opportunity.Id,
                opportunity.Status
            });
        }

        [Authorize(Roles = "Employer,Curator,Admin")]
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] UpdateOpportunityDto dto)
        {
            var userId = GetCurrentUserId();
            if (userId == null)
                return Unauthorized();

            var opportunity = await _db.Opportunities
                .Include(x => x.EmployerProfile)
                .ThenInclude(x => x.User)
                .FirstOrDefaultAsync(x => x.Id == id && !x.IsDeleted);

            if (opportunity == null)
                return NotFound("Карточка возможности не найдена");

            var isModerator = User.IsInRole("Curator") || User.IsInRole("Admin");
            EmployerProfile? employerProfile = null;

            if (!isModerator)
            {
                employerProfile = await _db.EmployerProfiles.FirstOrDefaultAsync(x => x.UserId == userId);

                if (employerProfile == null)
                    return BadRequest("Профиль работодателя не найден");

                if (employerProfile.Id != opportunity.EmployerProfileId)
                    return Forbid();

                if (!employerProfile.IsVerified)
                    return BadRequest("Редактирование публикаций доступно только верифицированному работодателю");
            }

            if (isModerator)
            {
                opportunity.Title = dto.Title;
                opportunity.ShortDescription = dto.ShortDescription;
                opportunity.FullDescription = dto.FullDescription;
                opportunity.Type = dto.Type;
                opportunity.WorkFormat = dto.WorkFormat;
                opportunity.Status = dto.Status;
                opportunity.CompanyName = dto.CompanyName;
                opportunity.City = dto.City;
                opportunity.Address = dto.Address;
                opportunity.SalaryFrom = dto.SalaryFrom;
                opportunity.SalaryTo = dto.SalaryTo;
                opportunity.ContactEmail = dto.ContactEmail;
                opportunity.ContactPhone = dto.ContactPhone;
                opportunity.ExternalUrl = dto.ExternalUrl;
                opportunity.Tags = dto.Tags;
                opportunity.MediaUrl = dto.MediaUrl;
                opportunity.Latitude = dto.Latitude;
                opportunity.Longitude = dto.Longitude;
                opportunity.ExpiresAt = NormalizeNullableUtc(dto.ExpiresAt);
                opportunity.EventDate = NormalizeNullableUtc(dto.EventDate);
                opportunity.IsVerifiedOnly = dto.IsVerifiedOnly;
                opportunity.IsDeleted = dto.IsDeleted;
                opportunity.ModerationComment = dto.ModerationComment;
            }
            else
            {
                ApplyOpportunityData(opportunity, dto, employerProfile!, true);
                opportunity.IsDeleted = dto.IsDeleted;
            }

            await _db.SaveChangesAsync();

            return Ok(new
            {
                message = "Карточка возможности обновлена",
                opportunity.Status
            });
        }

        [Authorize(Roles = "Employer,Admin")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var userId = GetCurrentUserId();
            if (userId == null)
                return Unauthorized();

            var opportunity = await _db.Opportunities
                .FirstOrDefaultAsync(x => x.Id == id && !x.IsDeleted);

            if (opportunity == null)
                return NotFound("Карточка возможности не найдена");

            if (!User.IsInRole("Admin"))
            {
                var employerProfile = await _db.EmployerProfiles
                    .FirstOrDefaultAsync(x => x.UserId == userId);

                if (employerProfile == null)
                    return BadRequest("Профиль работодателя не найден");

                if (opportunity.EmployerProfileId != employerProfile.Id)
                    return Forbid();
            }

            opportunity.IsDeleted = true;
            await _db.SaveChangesAsync();

            return Ok(new { message = "Карточка возможности удалена" });
        }

        private Guid? GetCurrentUserId()
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return userIdClaim == null ? null : Guid.Parse(userIdClaim);
        }

        private static object BuildOpportunityResponse(Opportunity opportunity, bool includeModerationFields, bool includeEmployerDetails = false)
        {
            return new
            {
                opportunity.Id,
                opportunity.Title,
                opportunity.ShortDescription,
                opportunity.FullDescription,
                opportunity.Type,
                opportunity.WorkFormat,
                opportunity.Status,
                opportunity.CompanyName,
                opportunity.City,
                opportunity.Address,
                opportunity.SalaryFrom,
                opportunity.SalaryTo,
                opportunity.ContactEmail,
                opportunity.ContactPhone,
                opportunity.ExternalUrl,
                opportunity.Tags,
                opportunity.MediaUrl,
                opportunity.Latitude,
                opportunity.Longitude,
                opportunity.PublishedAt,
                opportunity.ExpiresAt,
                opportunity.EventDate,
                opportunity.IsVerifiedOnly,
                ModerationComment = includeModerationFields ? opportunity.ModerationComment : null,
                Employer = opportunity.EmployerProfile == null ? null : new
                {
                    opportunity.EmployerProfile.Id,
                    opportunity.EmployerProfile.CompanyName,
                    opportunity.EmployerProfile.Description,
                    opportunity.EmployerProfile.Industry,
                    opportunity.EmployerProfile.LogoUrl,
                    opportunity.EmployerProfile.VideoPresentationUrl,
                    opportunity.EmployerProfile.WebsiteUrl,
                    opportunity.EmployerProfile.SocialLinks,
                    opportunity.EmployerProfile.IsVerified,
                    VerificationStatus = includeModerationFields ? (EmployerVerificationStatus?)opportunity.EmployerProfile.VerificationStatus : null,
                    User = opportunity.EmployerProfile.User == null ? null : new
                    {
                        opportunity.EmployerProfile.User.Id,
                        opportunity.EmployerProfile.User.DisplayName,
                        Email = includeEmployerDetails ? opportunity.EmployerProfile.User.Email : null
                    }
                }
            };
        }

        private static void ApplyOpportunityData(Opportunity opportunity, CreateOpportunityDto dto, EmployerProfile employerProfile, bool isUpdate)
        {
            opportunity.Title = dto.Title;
            opportunity.ShortDescription = dto.ShortDescription;
            opportunity.FullDescription = dto.FullDescription;
            opportunity.Type = dto.Type;
            opportunity.WorkFormat = dto.WorkFormat;
            opportunity.Status = NormalizeEmployerRequestedStatus(dto.Status, isUpdate, employerProfile.IsVerified);
            opportunity.CompanyName = string.IsNullOrWhiteSpace(dto.CompanyName)
                ? employerProfile.CompanyName
                : dto.CompanyName;
            opportunity.City = dto.City;
            opportunity.Address = dto.Address;
            opportunity.SalaryFrom = dto.SalaryFrom;
            opportunity.SalaryTo = dto.SalaryTo;
            opportunity.ContactEmail = dto.ContactEmail;
            opportunity.ContactPhone = dto.ContactPhone;
            opportunity.ExternalUrl = dto.ExternalUrl;
            opportunity.Tags = dto.Tags;
            opportunity.MediaUrl = dto.MediaUrl;
            opportunity.Latitude = dto.Latitude;
            opportunity.Longitude = dto.Longitude;
            opportunity.ExpiresAt = NormalizeNullableUtc(dto.ExpiresAt);
            opportunity.EventDate = NormalizeNullableUtc(dto.EventDate);
            opportunity.IsVerifiedOnly = dto.IsVerifiedOnly;

            if (opportunity.Status == OpportunityStatus.OnModeration)
                opportunity.ModerationComment = string.Empty;
        }

        private static void ApplyOpportunityData(Opportunity opportunity, UpdateOpportunityDto dto, EmployerProfile employerProfile, bool isUpdate)
        {
            ApplyOpportunityData(opportunity, new CreateOpportunityDto
            {
                Title = dto.Title,
                ShortDescription = dto.ShortDescription,
                FullDescription = dto.FullDescription,
                Type = dto.Type,
                WorkFormat = dto.WorkFormat,
                Status = dto.Status,
                CompanyName = dto.CompanyName,
                City = dto.City,
                Address = dto.Address,
                SalaryFrom = dto.SalaryFrom,
                SalaryTo = dto.SalaryTo,
                ContactEmail = dto.ContactEmail,
                ContactPhone = dto.ContactPhone,
                ExternalUrl = dto.ExternalUrl,
                Tags = dto.Tags,
                MediaUrl = dto.MediaUrl,
                Latitude = dto.Latitude,
                Longitude = dto.Longitude,
                ExpiresAt = dto.ExpiresAt,
                EventDate = dto.EventDate,
                IsVerifiedOnly = dto.IsVerifiedOnly
            }, employerProfile, isUpdate);
        }

        private static OpportunityStatus NormalizeEmployerRequestedStatus(
            OpportunityStatus requestedStatus,
            bool isUpdate,
            bool isVerifiedEmployer)
        {
            return requestedStatus switch
            {
                OpportunityStatus.Draft => OpportunityStatus.Draft,
                OpportunityStatus.Planned => OpportunityStatus.Planned,
                OpportunityStatus.Active when isVerifiedEmployer => OpportunityStatus.Active,
                OpportunityStatus.OnModeration => OpportunityStatus.OnModeration,
                OpportunityStatus.Closed when isUpdate => OpportunityStatus.Closed,
                OpportunityStatus.Archived when isUpdate => OpportunityStatus.Archived,
                _ => OpportunityStatus.OnModeration
            };
        }

        private static DateTime? NormalizeNullableUtc(DateTime? value)
        {
            if (!value.HasValue)
                return null;

            return value.Value.Kind switch
            {
                DateTimeKind.Utc => value.Value,
                DateTimeKind.Local => value.Value.ToUniversalTime(),
                _ => DateTime.SpecifyKind(value.Value, DateTimeKind.Utc)
            };
        }
    }
}
