using hhru.DataAccess.Models.Enums;
using hhru.DataAccess.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.EntityFrameworkCore;
using hhru.DataAccess.Dtos;
using hhru.DataAccess.Context.DbContext;

namespace hhru.Pages
{
    [Authorize(AuthenticationSchemes = "Identity.Application", Roles = "Employer,Admin")]
    public class OpportunityCreateModel : PageModel
    {
        private readonly AppDbContext _db;
        private readonly UserManager<AppUser> _userManager;

        public OpportunityCreateModel(AppDbContext db, UserManager<AppUser> userManager)
        {
            _db = db;
            _userManager = userManager;
        }

        [BindProperty]
        public CreateOpportunityDto Input { get; set; } = new();

        public string Message { get; set; } = string.Empty;
        public bool IsSuccess { get; set; }

        public async Task<IActionResult> OnGetAsync()
        {
            var user = await _userManager.GetUserAsync(User);
            if (user == null)
                return RedirectToPage("/Login");

            var employerProfile = await _db.EmployerProfiles
                .FirstOrDefaultAsync(x => x.UserId == user.Id);

            if (employerProfile == null)
            {
                Message = "Сначала создайте профиль работодателя";
                return Page();
            }

            Input.CompanyName = employerProfile.CompanyName;
            return Page();
        }

        public async Task<IActionResult> OnPostAsync()
        {
            var user = await _userManager.GetUserAsync(User);
            if (user == null)
                return RedirectToPage("/Login");

            var employerProfile = await _db.EmployerProfiles
                .FirstOrDefaultAsync(x => x.UserId == user.Id);

            if (employerProfile == null)
            {
                Message = "Сначала создайте профиль работодателя";
                return Page();
            }

            if (string.IsNullOrWhiteSpace(Input.Title))
            {
                Message = "Введите название возможности";
                return Page();
            }

            var opportunity = new Opportunity
            {
                EmployerProfileId = employerProfile.Id,
                Title = Input.Title,
                ShortDescription = Input.ShortDescription,
                FullDescription = Input.FullDescription,
                Type = Input.Type,
                WorkFormat = Input.WorkFormat,
                Status = OpportunityStatus.Active,
                CompanyName = string.IsNullOrWhiteSpace(Input.CompanyName)
                    ? employerProfile.CompanyName
                    : Input.CompanyName,
                City = Input.City,
                Address = Input.Address,
                SalaryFrom = Input.SalaryFrom,
                SalaryTo = Input.SalaryTo,
                ContactEmail = Input.ContactEmail,
                ContactPhone = Input.ContactPhone,
                ExternalUrl = Input.ExternalUrl,
                Tags = Input.Tags,
                MediaUrl = Input.MediaUrl,
                Latitude = Input.Latitude,
                Longitude = Input.Longitude,
                ExpiresAt = Input.ExpiresAt,
                EventDate = Input.EventDate,
                IsVerifiedOnly = Input.IsVerifiedOnly,
                PublishedAt = DateTime.UtcNow,
                IsDeleted = false
            };

            _db.Opportunities.Add(opportunity);
            await _db.SaveChangesAsync();

            IsSuccess = true;
            Message = "Возможность успешно создана";

            Input = new CreateOpportunityDto
            {
                CompanyName = employerProfile.CompanyName,
                Type = OpportunityType.Internship,
                WorkFormat = WorkFormat.Hybrid
            };

            return Page();
        }
    }
}