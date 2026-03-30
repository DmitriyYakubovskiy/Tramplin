using hhru.DataAccess.Context.DbContext;
using hhru.DataAccess.Dtos;
using hhru.DataAccess.Models;
using hhru.DataAccess.Models.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace HhruApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ApplicantProfileController : ControllerBase
    {
        private readonly AppDbContext _db;

        public ApplicantProfileController(AppDbContext db)
        {
            _db = db;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var viewer = await GetViewerContextAsync();

            var query = _db.ApplicantProfiles
                .Include(x => x.User)
                .OrderByDescending(x => x.CreatedAt)
                .AsQueryable();

            if (!viewer.IsCuratorOrAdmin)
            {
                query = query.Where(x =>
                    x.IsProfilePublic ||
                    (viewer.UserId != null && x.UserId == viewer.UserId) ||
                    viewer.ContactApplicantIds.Contains(x.Id));
            }

            var profiles = await query.ToListAsync();
            return Ok(profiles.Select(x => BuildProfileResponse(x, viewer, false)));
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var viewer = await GetViewerContextAsync();

            var profile = await _db.ApplicantProfiles
                .Include(x => x.User)
                .Include(x => x.Applications)
                .ThenInclude(x => x.Opportunity)
                .FirstOrDefaultAsync(x => x.Id == id);

            if (profile == null)
                return NotFound("Профиль соискателя не найден");

            var isSelf = viewer.UserId == profile.UserId;
            var isAccessible = viewer.IsCuratorOrAdmin || isSelf || profile.IsProfilePublic || viewer.ContactApplicantIds.Contains(profile.Id);

            if (!isAccessible)
                return Forbid();

            return Ok(BuildProfileResponse(profile, viewer, true));
        }

        [Authorize(Roles = "Applicant,Admin")]
        [HttpGet("me")]
        public async Task<IActionResult> GetMyProfile()
        {
            var viewer = await GetViewerContextAsync();
            if (viewer.UserId == null)
                return Unauthorized();

            var profile = await _db.ApplicantProfiles
                .Include(x => x.User)
                .Include(x => x.Applications)
                .ThenInclude(x => x.Opportunity)
                .FirstOrDefaultAsync(x => x.UserId == viewer.UserId);

            if (profile == null)
                return NotFound("У вас еще нет профиля соискателя");

            return Ok(BuildProfileResponse(profile, viewer, true));
        }

        [Authorize(Roles = "Applicant")]
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateApplicantProfileDto dto)
        {
            var viewer = await GetViewerContextAsync();
            if (viewer.UserId == null)
                return Unauthorized();

            var existingProfile = await _db.ApplicantProfiles
                .FirstOrDefaultAsync(x => x.UserId == viewer.UserId);

            if (existingProfile != null)
                return BadRequest("Профиль соискателя уже существует");

            var profile = new ApplicantProfile
            {
                UserId = viewer.UserId.Value
            };

            ApplyProfileData(profile, dto);

            _db.ApplicantProfiles.Add(profile);
            await _db.SaveChangesAsync();

            profile = await _db.ApplicantProfiles
                .Include(x => x.User)
                .FirstAsync(x => x.Id == profile.Id);

            return Ok(BuildProfileResponse(profile, viewer, true));
        }

        [Authorize(Roles = "Applicant")]
        [HttpPut("me")]
        public async Task<IActionResult> UpdateMyProfile([FromBody] CreateApplicantProfileDto dto)
        {
            var viewer = await GetViewerContextAsync();
            if (viewer.UserId == null)
                return Unauthorized();

            var profile = await _db.ApplicantProfiles
                .Include(x => x.User)
                .Include(x => x.Applications)
                .ThenInclude(x => x.Opportunity)
                .FirstOrDefaultAsync(x => x.UserId == viewer.UserId);

            if (profile == null)
                return NotFound("Профиль соискателя не найден");

            ApplyProfileData(profile, dto);
            await _db.SaveChangesAsync();

            return Ok(BuildProfileResponse(profile, viewer, true));
        }

        [Authorize(Roles = "Curator,Admin")]
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateByCurator(Guid id, [FromBody] CreateApplicantProfileDto dto)
        {
            var viewer = await GetViewerContextAsync();
            var profile = await _db.ApplicantProfiles
                .Include(x => x.User)
                .Include(x => x.Applications)
                .ThenInclude(x => x.Opportunity)
                .FirstOrDefaultAsync(x => x.Id == id);

            if (profile == null)
                return NotFound("Профиль соискателя не найден");

            ApplyProfileData(profile, dto);
            await _db.SaveChangesAsync();

            return Ok(BuildProfileResponse(profile, viewer, true));
        }

        [Authorize(Roles = "Applicant,Admin")]
        [HttpDelete("me")]
        public async Task<IActionResult> DeleteMyProfile()
        {
            var viewer = await GetViewerContextAsync();
            if (viewer.UserId == null)
                return Unauthorized();

            var profile = await _db.ApplicantProfiles
                .FirstOrDefaultAsync(x => x.UserId == viewer.UserId);

            if (profile == null)
                return NotFound("Профиль соискателя не найден");

            _db.ApplicantProfiles.Remove(profile);
            await _db.SaveChangesAsync();

            return Ok(new { message = "Профиль соискателя удален" });
        }

        private static void ApplyProfileData(ApplicantProfile profile, CreateApplicantProfileDto dto)
        {
            profile.FullName = dto.FullName;
            profile.University = dto.University;
            profile.Faculty = dto.Faculty;
            profile.CourseOrGraduationYear = dto.CourseOrGraduationYear;
            profile.About = dto.About;
            profile.CareerInterests = dto.CareerInterests;
            profile.Skills = dto.Skills;
            profile.ProjectExperience = dto.ProjectExperience;
            profile.PortfolioUrl = dto.PortfolioUrl;
            profile.GitHubUrl = dto.GitHubUrl;
            profile.ResumeFileUrl = dto.ResumeFileUrl;
            profile.City = dto.City;
            profile.IsOpenToWork = dto.IsOpenToWork;
            profile.ShowEmail = dto.ShowEmail;
            profile.ShowPhone = dto.ShowPhone;
            profile.ShowContactsOnlyForVerifiedEmployers = dto.ShowContactsOnlyForVerifiedEmployers;
            profile.IsProfilePublic = dto.IsProfilePublic;
            profile.ShowResumeToAuthenticatedUsers = dto.ShowResumeToAuthenticatedUsers;
            profile.ShowApplicationsToApplicants = dto.ShowApplicationsToApplicants;
        }

        private object BuildProfileResponse(ApplicantProfile profile, ViewerContext viewer, bool includeDetails)
        {
            var isSelf = viewer.UserId == profile.UserId;
            var canSeeEmail = isSelf || viewer.IsCuratorOrAdmin || (viewer.IsAuthenticated && profile.ShowEmail && (!profile.ShowContactsOnlyForVerifiedEmployers || viewer.IsVerifiedEmployer));
            var canSeePhone = isSelf || viewer.IsCuratorOrAdmin || (viewer.IsAuthenticated && profile.ShowPhone && (!profile.ShowContactsOnlyForVerifiedEmployers || viewer.IsVerifiedEmployer));
            var canSeeResume = includeDetails && (isSelf || viewer.IsCuratorOrAdmin || (viewer.IsAuthenticated && profile.ShowResumeToAuthenticatedUsers));
            var canSeeApplications = includeDetails && (isSelf || viewer.IsCuratorOrAdmin || (viewer.IsApplicant && profile.ShowApplicationsToApplicants));

            return new
            {
                profile.Id,
                profile.UserId,
                profile.FullName,
                profile.University,
                profile.Faculty,
                profile.CourseOrGraduationYear,
                profile.About,
                profile.CareerInterests,
                profile.Skills,
                profile.ProjectExperience,
                profile.PortfolioUrl,
                profile.GitHubUrl,
                ResumeFileUrl = canSeeResume ? profile.ResumeFileUrl : null,
                profile.City,
                profile.IsOpenToWork,
                profile.CreatedAt,
                IsProfilePublic = isSelf || viewer.IsCuratorOrAdmin ? profile.IsProfilePublic : profile.IsProfilePublic,
                ShowEmail = isSelf || viewer.IsCuratorOrAdmin ? profile.ShowEmail : (bool?)null,
                ShowPhone = isSelf || viewer.IsCuratorOrAdmin ? profile.ShowPhone : (bool?)null,
                ShowContactsOnlyForVerifiedEmployers = isSelf || viewer.IsCuratorOrAdmin ? profile.ShowContactsOnlyForVerifiedEmployers : (bool?)null,
                ShowResumeToAuthenticatedUsers = isSelf || viewer.IsCuratorOrAdmin ? profile.ShowResumeToAuthenticatedUsers : (bool?)null,
                ShowApplicationsToApplicants = isSelf || viewer.IsCuratorOrAdmin ? profile.ShowApplicationsToApplicants : (bool?)null,
                ContactEmail = canSeeEmail ? profile.User?.Email : null,
                ContactPhone = canSeePhone ? profile.User?.PhoneNumber : null,
                Applications = canSeeApplications
                    ? profile.Applications
                        .OrderByDescending(x => x.CreatedAt)
                        .Select(x => new
                        {
                            x.Id,
                            x.Status,
                            x.Message,
                            x.CreatedAt,
                            x.UpdatedAt,
                            Opportunity = x.Opportunity == null ? null : new
                            {
                                x.Opportunity.Id,
                                x.Opportunity.Title,
                                x.Opportunity.Type,
                                x.Opportunity.CompanyName,
                                x.Opportunity.City,
                                x.Opportunity.Status
                            }
                        })
                    : null,
                User = profile.User == null ? null : new
                {
                    profile.User.Id,
                    profile.User.DisplayName
                }
            };
        }

        private async Task<ViewerContext> GetViewerContextAsync()
        {
            var viewer = new ViewerContext
            {
                IsAuthenticated = User.Identity?.IsAuthenticated == true,
                IsApplicant = User.IsInRole("Applicant"),
                IsCuratorOrAdmin = User.IsInRole("Curator") || User.IsInRole("Admin")
            };

            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userIdClaim == null)
                return viewer;

            viewer.UserId = Guid.Parse(userIdClaim);

            if (User.IsInRole("Employer"))
            {
                viewer.IsVerifiedEmployer = await _db.EmployerProfiles.AnyAsync(x => x.UserId == viewer.UserId && x.IsVerified);
            }

            if (viewer.IsApplicant)
            {
                viewer.ApplicantProfileId = await _db.ApplicantProfiles
                    .Where(x => x.UserId == viewer.UserId)
                    .Select(x => (Guid?)x.Id)
                    .FirstOrDefaultAsync();

                if (viewer.ApplicantProfileId != null)
                {
                    viewer.ContactApplicantIds = await _db.Contacts
                        .Where(x =>
                            x.Status == ContactStatus.Accepted &&
                            (x.SenderApplicantProfileId == viewer.ApplicantProfileId || x.ReceiverApplicantProfileId == viewer.ApplicantProfileId))
                        .Select(x => x.SenderApplicantProfileId == viewer.ApplicantProfileId
                            ? x.ReceiverApplicantProfileId
                            : x.SenderApplicantProfileId)
                        .ToListAsync();
                }
            }

            return viewer;
        }

        private sealed class ViewerContext
        {
            public Guid? UserId { get; set; }
            public Guid? ApplicantProfileId { get; set; }
            public bool IsAuthenticated { get; set; }
            public bool IsApplicant { get; set; }
            public bool IsCuratorOrAdmin { get; set; }
            public bool IsVerifiedEmployer { get; set; }
            public List<Guid> ContactApplicantIds { get; set; } = new();
        }
    }
}
