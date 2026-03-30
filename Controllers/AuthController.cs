using hhru.DataAccess.Dtos;
using hhru.DataAccess.Models;
using hhru.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace hhru.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly UserManager<AppUser> _userManager;
        private readonly SignInManager<AppUser> _signInManager;
        private readonly RoleManager<IdentityRole<Guid>> _roleManager;
        private readonly JwtService _jwtService;

        public AuthController(
            UserManager<AppUser> userManager,
            SignInManager<AppUser> signInManager,
            RoleManager<IdentityRole<Guid>> roleManager,
            JwtService jwtService)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _roleManager = roleManager;
            _jwtService = jwtService;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.FullName))
                return BadRequest("Введите имя");

            if (string.IsNullOrWhiteSpace(dto.Email))
                return BadRequest("Введите email");

            if (string.IsNullOrWhiteSpace(dto.Password))
                return BadRequest("Введите пароль");

            if (string.IsNullOrWhiteSpace(dto.Role))
                return BadRequest("Введите роль");

            var allowedRoles = new[] { "Applicant", "Employer" };

            if (!allowedRoles.Contains(dto.Role))
                return BadRequest("Некорректная роль");

            var existingUserByEmail = await _userManager.FindByEmailAsync(dto.Email);
            if (existingUserByEmail != null)
                return BadRequest("Пользователь с таким email уже существует");

            var user = new AppUser
            {
                UserName = dto.Email,
                Email = dto.Email,
                DisplayName = dto.FullName
            };

            var createResult = await _userManager.CreateAsync(user, dto.Password);

            if (!createResult.Succeeded)
            {
                return BadRequest(createResult.Errors.Select(e => e.Description));
            }

            var addToRoleResult = await _userManager.AddToRoleAsync(user, dto.Role);

            if (!addToRoleResult.Succeeded)
            {
                return BadRequest(addToRoleResult.Errors.Select(e => e.Description));
            }

            return Ok(new
            {
                message = "Пользователь успешно зарегистрирован",
                user = new
                {
                    user.Id,
                    user.DisplayName,
                    user.Email,
                    Role = dto.Role
                }
            });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Email))
                return BadRequest("Введите email");

            if (string.IsNullOrWhiteSpace(dto.Password))
                return BadRequest("Введите пароль");

            var user = await _userManager.FindByEmailAsync(dto.Email);
            if (user == null)
                return Unauthorized("Неверный email или пароль");

            var result = await _signInManager.CheckPasswordSignInAsync(user, dto.Password, false);

            if (!result.Succeeded)
                return Unauthorized("Неверный email или пароль");

            var token = await _jwtService.GenerateToken(user);
            var roles = await _userManager.GetRolesAsync(user);

            return Ok(new
            {
                token,
                user = new
                {
                    user.Id,
                    user.DisplayName,
                    user.Email,
                    Roles = roles
                }
            });
        }
    }
}
