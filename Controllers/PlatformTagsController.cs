using hhru.DataAccess.Context.DbContext;
using hhru.DataAccess.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace hhru.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PlatformTagsController : ControllerBase
    {
        private readonly AppDbContext _db;

        public PlatformTagsController(AppDbContext db)
        {
            _db = db;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] DataAccess.Models.Enums.TagCategory? category, [FromQuery] string? search)
        {
            var query = _db.PlatformTags.AsQueryable();

            if (category.HasValue)
                query = query.Where(x => x.Category == category.Value);

            if (!string.IsNullOrWhiteSpace(search))
            {
                var lowered = search.ToLower();
                query = query.Where(x => x.Name.ToLower().Contains(lowered));
            }

            var tags = await query
                .OrderBy(x => x.Category)
                .ThenBy(x => x.Name)
                .ToListAsync();

            return Ok(tags);
        }

        [Authorize(Roles = "Employer,Curator,Admin")]
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreatePlatformTagDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Name))
                return BadRequest("Название тега обязательно");

            var normalizedName = dto.Name.Trim();
            var exists = await _db.PlatformTags.AnyAsync(x => x.Name.ToLower() == normalizedName.ToLower());
            if (exists)
                return BadRequest("Такой тег уже существует");

            Guid? currentUserId = null;
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (userIdClaim != null)
                currentUserId = Guid.Parse(userIdClaim);

            var tag = new DataAccess.Models.PlatformTag
            {
                Name = normalizedName,
                Category = dto.Category,
                IsSystem = false,
                CreatedByUserId = currentUserId
            };

            _db.PlatformTags.Add(tag);
            await _db.SaveChangesAsync();

            return Ok(tag);
        }
    }
}
