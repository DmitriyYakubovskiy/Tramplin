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
    public class EmployerProfileController : ControllerBase
    {
        private readonly AppDbContext _db;

        public EmployerProfileController(AppDbContext db)
        {
            _db = db;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var profiles = await _db.EmployerProfiles
                .Include(x => x.User)
                .OrderByDescending(x => x.CreatedAt)
                .ToListAsync();

            return Ok(profiles.Select(BuildPublicProfileResponse));
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var profile = await _db.EmployerProfiles
                .Include(x => x.User)
                .FirstOrDefaultAsync(x => x.Id == id);

            if (profile == null)
                return NotFound("Профиль работодателя не найден");

            var viewerUserId = GetCurrentUserId();
            if (viewerUserId == profile.UserId || User.IsInRole("Curator") || User.IsInRole("Admin"))
                return Ok(BuildPrivateProfileResponse(profile));

            return Ok(BuildPublicProfileResponse(profile));
        }

        [Authorize(Roles = "Employer,Admin")]
        [HttpGet("me")]
        public async Task<IActionResult> GetMyProfile()
        {
            var userId = GetCurrentUserId();
            if (userId == null)
                return Unauthorized();

            var profile = await _db.EmployerProfiles
                .Include(x => x.User)
                .FirstOrDefaultAsync(x => x.UserId == userId);

            if (profile == null)
                return NotFound("У вас еще нет профиля работодателя");

            return Ok(BuildPrivateProfileResponse(profile));
        }

        [Authorize(Roles = "Employer")]
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateEmployerProfileDto dto)
        {
            var userId = GetCurrentUserId();
            if (userId == null)
                return Unauthorized();

            if (string.IsNullOrWhiteSpace(dto.CompanyName))
                return BadRequest("Укажите название компании");

            if (string.IsNullOrWhiteSpace(dto.VerificationMethod) || string.IsNullOrWhiteSpace(dto.VerificationData))
                return BadRequest("Для регистрации работодателя нужны данные для верификации");

            var existingProfile = await _db.EmployerProfiles
                .FirstOrDefaultAsync(x => x.UserId == userId);

            if (existingProfile != null)
                return BadRequest("Профиль работодателя уже существует");

            var profile = new EmployerProfile
            {
                UserId = userId.Value,
                VerificationStatus = EmployerVerificationStatus.Pending
            };

            ApplyProfileData(profile, dto);

            _db.EmployerProfiles.Add(profile);
            await _db.SaveChangesAsync();

            return Ok(BuildPrivateProfileResponse(profile));
        }

        [Authorize(Roles = "Employer")]
        [HttpPut("me")]
        public async Task<IActionResult> UpdateMyProfile([FromBody] CreateEmployerProfileDto dto)
        {
            var userId = GetCurrentUserId();
            if (userId == null)
                return Unauthorized();

            var profile = await _db.EmployerProfiles
                .Include(x => x.User)
                .FirstOrDefaultAsync(x => x.UserId == userId);

            if (profile == null)
                return NotFound("Профиль работодателя не найден");

            ApplyProfileData(profile, dto);

            await _db.SaveChangesAsync();

            return Ok(BuildPrivateProfileResponse(profile));
        }

        [Authorize(Roles = "Curator,Admin")]
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateByCurator(Guid id, [FromBody] CreateEmployerProfileDto dto)
        {
            var profile = await _db.EmployerProfiles
                .Include(x => x.User)
                .FirstOrDefaultAsync(x => x.Id == id);

            if (profile == null)
                return NotFound("Профиль работодателя не найден");

            ApplyProfileData(profile, dto);
            await _db.SaveChangesAsync();

            return Ok(BuildPrivateProfileResponse(profile));
        }

        [Authorize(Roles = "Employer,Admin")]
        [HttpDelete("me")]
        public async Task<IActionResult> DeleteMyProfile()
        {
            var userId = GetCurrentUserId();
            if (userId == null)
                return Unauthorized();

            var profile = await _db.EmployerProfiles
                .FirstOrDefaultAsync(x => x.UserId == userId);

            if (profile == null)
                return NotFound("Профиль работодателя не найден");

            _db.EmployerProfiles.Remove(profile);
            await _db.SaveChangesAsync();

            return Ok(new { message = "Профиль работодателя удален" });
        }

        private Guid? GetCurrentUserId()
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return userIdClaim == null ? null : Guid.Parse(userIdClaim);
        }

        private static object BuildPublicProfileResponse(EmployerProfile profile)
        {
            return new
            {
                profile.Id,
                profile.CompanyName,
                profile.Description,
                profile.Industry,
                profile.LogoUrl,
                profile.VideoPresentationUrl,
                profile.WebsiteUrl,
                profile.SocialLinks,
                profile.City,
                profile.OfficeAddress,
                profile.IsVerified,
                profile.VerificationStatus,
                profile.CreatedAt,
                User = profile.User == null ? null : new
                {
                    profile.User.Id,
                    profile.User.DisplayName
                }
            };
        }

        private static object BuildPrivateProfileResponse(EmployerProfile profile)
        {
            return new
            {
                profile.Id,
                profile.UserId,
                profile.CompanyName,
                profile.Description,
                profile.Industry,
                profile.LogoUrl,
                profile.VideoPresentationUrl,
                profile.WebsiteUrl,
                profile.SocialLinks,
                profile.VerificationMethod,
                profile.VerificationData,
                profile.VerificationComment,
                profile.IsVerified,
                profile.VerificationStatus,
                profile.VerifiedAt,
                profile.OfficeAddress,
                profile.City,
                profile.CreatedAt,
                User = profile.User == null ? null : new
                {
                    profile.User.Id,
                    profile.User.DisplayName,
                    profile.User.Email
                }
            };
        }

        private static void ApplyProfileData(EmployerProfile profile, CreateEmployerProfileDto dto)
        {
            var shouldResetVerification =
                !string.Equals(profile.CompanyName, dto.CompanyName, StringComparison.Ordinal) ||
                !string.Equals(profile.WebsiteUrl, dto.WebsiteUrl, StringComparison.Ordinal) ||
                !string.Equals(profile.VerificationMethod, dto.VerificationMethod, StringComparison.Ordinal) ||
                !string.Equals(profile.VerificationData, dto.VerificationData, StringComparison.Ordinal);

            profile.CompanyName = dto.CompanyName;
            profile.Description = dto.Description;
            profile.Industry = dto.Industry;
            profile.LogoUrl = dto.LogoUrl;
            profile.VideoPresentationUrl = dto.VideoPresentationUrl;
            profile.WebsiteUrl = dto.WebsiteUrl;
            profile.SocialLinks = dto.SocialLinks;
            profile.VerificationMethod = dto.VerificationMethod;
            profile.VerificationData = dto.VerificationData;
            profile.OfficeAddress = dto.OfficeAddress;
            profile.City = dto.City;

            if (shouldResetVerification)
            {
                profile.IsVerified = false;
                profile.VerifiedAt = null;
                profile.VerificationStatus = EmployerVerificationStatus.Pending;
                profile.VerificationComment = string.Empty;
            }
        }
    }
}
