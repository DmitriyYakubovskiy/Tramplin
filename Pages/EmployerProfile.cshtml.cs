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
    [Authorize(AuthenticationSchemes = "Identity.Application", Roles = "Employer,Admin")]
    public class EmployerProfileModel : PageModel
    {
        private readonly AppDbContext _db;
        private readonly UserManager<AppUser> _userManager;

        public EmployerProfileModel(AppDbContext db, UserManager<AppUser> userManager)
        {
            _db = db;
            _userManager = userManager;
        }

        [BindProperty]
        public CreateEmployerProfileDto Input { get; set; } = new();

        public string Message { get; set; } = string.Empty;
        public bool IsSuccess { get; set; }

        public EmployerProfile? ExistingProfile { get; set; }

        public async Task<IActionResult> OnGetAsync()
        {
            var user = await _userManager.GetUserAsync(User);
            if (user == null)
                return RedirectToPage("/Login");

            ExistingProfile = await _db.EmployerProfiles
                .FirstOrDefaultAsync(x => x.UserId == user.Id);

            if (ExistingProfile != null)
            {
                Input = new CreateEmployerProfileDto
                {
                    CompanyName = ExistingProfile.CompanyName,
                    Description = ExistingProfile.Description,
                    Industry = ExistingProfile.Industry,
                    WebsiteUrl = ExistingProfile.WebsiteUrl,
                    SocialLinks = ExistingProfile.SocialLinks,
                    VerificationMethod = ExistingProfile.VerificationMethod,
                    VerificationData = ExistingProfile.VerificationData,
                    OfficeAddress = ExistingProfile.OfficeAddress,
                    City = ExistingProfile.City
                };
            }

            return Page();
        }

        public async Task<IActionResult> OnPostAsync()
        {
            var user = await _userManager.GetUserAsync(User);
            if (user == null)
                return RedirectToPage("/Login");

            var profile = await _db.EmployerProfiles
                .FirstOrDefaultAsync(x => x.UserId == user.Id);

            if (profile == null)
            {
                profile = new EmployerProfile
                {
                    UserId = user.Id,
                    CreatedAt = DateTime.UtcNow
                };

                _db.EmployerProfiles.Add(profile);
            }

            profile.CompanyName = Input.CompanyName;
            profile.Description = Input.Description;
            profile.Industry = Input.Industry;
            profile.WebsiteUrl = Input.WebsiteUrl;
            profile.SocialLinks = Input.SocialLinks;
            profile.VerificationMethod = Input.VerificationMethod;
            profile.VerificationData = Input.VerificationData;
            profile.OfficeAddress = Input.OfficeAddress;
            profile.City = Input.City;

            await _db.SaveChangesAsync();

            ExistingProfile = profile;
            IsSuccess = true;
            Message = "Профиль работодателя сохранен";

            return Page();
        }
    }
}