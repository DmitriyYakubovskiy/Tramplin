using hhru.DataAccess.Context.DbContext;
using hhru.DataAccess.Dtos;
using hhru.DataAccess.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace hhru.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    public class CuratorsController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly UserManager<AppUser> _userManager;

        public CuratorsController(AppDbContext db, UserManager<AppUser> userManager)
        {
            _db = db;
            _userManager = userManager;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var curators = await _db.CuratorProfiles
                .Include(x => x.User)
                .OrderByDescending(x => x.CreatedAt)
                .ToListAsync();

            return Ok(curators.Select(x => new
            {
                x.Id,
                x.FullName,
                x.OrganizationName,
                x.Position,
                x.IsAdmin,
                x.CreatedAt,
                User = x.User == null ? null : new
                {
                    x.User.Id,
                    x.User.DisplayName,
                    x.User.Email
                }
            }));
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateCuratorDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Email) || string.IsNullOrWhiteSpace(dto.Password) || string.IsNullOrWhiteSpace(dto.FullName))
                return BadRequest("Заполните ФИО, email и пароль куратора");

            var existingUser = await _userManager.FindByEmailAsync(dto.Email);
            if (existingUser != null)
                return BadRequest("Пользователь с таким email уже существует");

            var user = new AppUser
            {
                UserName = dto.Email,
                Email = dto.Email,
                DisplayName = dto.FullName
            };

            var createResult = await _userManager.CreateAsync(user, dto.Password);
            if (!createResult.Succeeded)
                return BadRequest(createResult.Errors.Select(x => x.Description));

            await _userManager.AddToRoleAsync(user, "Curator");

            if (dto.IsAdmin)
                await _userManager.AddToRoleAsync(user, "Admin");

            var curatorProfile = new DataAccess.Models.CuratorProfile
            {
                UserId = user.Id,
                FullName = dto.FullName,
                OrganizationName = dto.OrganizationName,
                Position = dto.Position,
                IsAdmin = dto.IsAdmin
            };

            _db.CuratorProfiles.Add(curatorProfile);
            await _db.SaveChangesAsync();

            curatorProfile = await _db.CuratorProfiles
                .Include(x => x.User)
                .FirstAsync(x => x.Id == curatorProfile.Id);

            return Ok(new
            {
                message = "Учетная запись куратора создана",
                curator = new
                {
                    curatorProfile.Id,
                    curatorProfile.FullName,
                    curatorProfile.OrganizationName,
                    curatorProfile.Position,
                    curatorProfile.IsAdmin,
                    User = curatorProfile.User == null ? null : new
                    {
                        curatorProfile.User.Id,
                        curatorProfile.User.DisplayName,
                        curatorProfile.User.Email
                    }
                }
            });
        }
    }
}
