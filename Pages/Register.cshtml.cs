using hhru.DataAccess.Dtos;
using hhru.DataAccess.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace hhru.Pages
{
    public class RegisterModel : PageModel
    {
        private readonly UserManager<AppUser> _userManager;
        private readonly RoleManager<IdentityRole<Guid>> _roleManager;

        public RegisterModel(
            UserManager<AppUser> userManager,
            RoleManager<IdentityRole<Guid>> roleManager)
        {
            _userManager = userManager;
            _roleManager = roleManager;
        }

        [BindProperty]
        public RegisterDto Input { get; set; } = new();

        public string Message { get; set; } = string.Empty;
        public bool IsSuccess { get; set; }

        public void OnGet()
        {
        }

        public async Task<IActionResult> OnPostAsync()
        {
            if (string.IsNullOrWhiteSpace(Input.FullName) ||
                string.IsNullOrWhiteSpace(Input.Email) ||
                string.IsNullOrWhiteSpace(Input.Password) ||
                string.IsNullOrWhiteSpace(Input.Role))
            {
                Message = "Заполни все поля";
                return Page();
            }

            var allowedRoles = new[] { "Applicant", "Employer" };

            if (!allowedRoles.Contains(Input.Role))
            {
                Message = "Можно выбрать только Applicant или Employer";
                return Page();
            }

            var existingUser = await _userManager.FindByEmailAsync(Input.Email);
            if (existingUser != null)
            {
                Message = "Пользователь с таким email уже существует";
                return Page();
            }

            var user = new AppUser
            {
                UserName = Input.Email,
                Email = Input.Email,
                DisplayName = Input.FullName
            };

            var result = await _userManager.CreateAsync(user, Input.Password);

            if (!result.Succeeded)
            {
                Message = string.Join("; ", result.Errors.Select(x => x.Description));
                return Page();
            }

            if (!await _roleManager.RoleExistsAsync(Input.Role))
            {
                await _roleManager.CreateAsync(new IdentityRole<Guid>(Input.Role));
            }

            await _userManager.AddToRoleAsync(user, Input.Role);

            IsSuccess = true;
            Message = "Регистрация успешна";
            Input = new RegisterDto();

            return Page();
        }
    }
}