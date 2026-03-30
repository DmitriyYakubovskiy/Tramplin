using hhru.DataAccess.Context.DbContext;
using hhru.DataAccess.Dtos;
using hhru.DataAccess.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.EntityFrameworkCore;

namespace hhru.Pages
{
    [Authorize(AuthenticationSchemes = "Identity.Application", Roles = "Applicant,Admin")]
    public class ApplicantProfileModel : PageModel
    {
        private readonly AppDbContext _db;
        private readonly UserManager<AppUser> _userManager;

        public ApplicantProfileModel(AppDbContext db, UserManager<AppUser> userManager)
        {
            _db = db;
            _userManager = userManager;
        }

        [BindProperty]
        public CreateApplicantProfileDto Input { get; set; } = new();

        public string Message { get; set; } = string.Empty;
        public bool IsSuccess { get; set; }

        public ApplicantProfile? ExistingProfile { get; set; }

        public async Task<IActionResult> OnGetAsync()
        {
            var user = await _userManager.GetUserAsync(User);
            if (user == null)
                return RedirectToPage("/Login");

            ExistingProfile = await _db.ApplicantProfiles
                .FirstOrDefaultAsync(x => x.UserId == user.Id);

            if (ExistingProfile != null)
            {
                Input = new CreateApplicantProfileDto
                {
                    FullName = ExistingProfile.FullName,
                    University = ExistingProfile.University,
                    Faculty = ExistingProfile.Faculty,
                    CourseOrGraduationYear = ExistingProfile.CourseOrGraduationYear,
                    About = ExistingProfile.About,
                    Skills = ExistingProfile.Skills,
                    ProjectExperience = ExistingProfile.ProjectExperience,
                    PortfolioUrl = ExistingProfile.PortfolioUrl,
                    GitHubUrl = ExistingProfile.GitHubUrl,
                    ResumeFileUrl = ExistingProfile.ResumeFileUrl,
                    City = ExistingProfile.City,
                    IsOpenToWork = ExistingProfile.IsOpenToWork,
                    ShowEmail = ExistingProfile.ShowEmail,
                    ShowPhone = ExistingProfile.ShowPhone,
                    ShowContactsOnlyForVerifiedEmployers = ExistingProfile.ShowContactsOnlyForVerifiedEmployers
                };
            }

            return Page();
        }

        public async Task<IActionResult> OnPostAsync()
        {
            var user = await _userManager.GetUserAsync(User);
            if (user == null)
                return RedirectToPage("/Login");

            var profile = await _db.ApplicantProfiles
                .FirstOrDefaultAsync(x => x.UserId == user.Id);

            if (profile == null)
            {
                profile = new ApplicantProfile
                {
                    UserId = user.Id,
                    CreatedAt = DateTime.UtcNow
                };

                _db.ApplicantProfiles.Add(profile);
            }

            profile.FullName = Input.FullName;
            profile.University = Input.University;
            profile.Faculty = Input.Faculty;
            profile.CourseOrGraduationYear = Input.CourseOrGraduationYear;
            profile.About = Input.About;
            profile.Skills = Input.Skills;
            profile.ProjectExperience = Input.ProjectExperience;
            profile.PortfolioUrl = Input.PortfolioUrl;
            profile.GitHubUrl = Input.GitHubUrl;
            profile.ResumeFileUrl = Input.ResumeFileUrl;
            profile.City = Input.City;
            profile.IsOpenToWork = Input.IsOpenToWork;
            profile.ShowEmail = Input.ShowEmail;
            profile.ShowPhone = Input.ShowPhone;
            profile.ShowContactsOnlyForVerifiedEmployers = Input.ShowContactsOnlyForVerifiedEmployers;

            await _db.SaveChangesAsync();

            ExistingProfile = profile;
            IsSuccess = true;
            Message = "Профиль соискателя сохранен";

            return Page();
        }
    }
}
