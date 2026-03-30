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
    [Authorize(Roles = "Applicant")]
    public class FavoritesController : ControllerBase
    {
        private readonly AppDbContext _db;

        public FavoritesController(AppDbContext db)
        {
            _db = db;
        }

        [HttpGet("my")]
        public async Task<IActionResult> GetMy()
        {
            var applicantProfile = await GetApplicantProfileAsync();
            if (applicantProfile == null)
                return BadRequest("Сначала создайте профиль соискателя");

            var favorites = await _db.Favorites
                .Include(x => x.Opportunity)
                .ThenInclude(x => x!.EmployerProfile)
                .Include(x => x.EmployerProfile)
                .ThenInclude(x => x!.User)
                .Where(x => x.ApplicantProfileId == applicantProfile.Id)
                .OrderByDescending(x => x.CreatedAt)
                .ToListAsync();

            return Ok(favorites.Select(BuildFavoriteResponse));
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateFavoriteDto dto)
        {
            var applicantProfile = await GetApplicantProfileAsync();
            if (applicantProfile == null)
                return BadRequest("Сначала создайте профиль соискателя");

            if (dto.Type == FavoriteType.Opportunity)
            {
                if (dto.OpportunityId == null)
                    return BadRequest("Укажите карточку возможности");

                var opportunity = await _db.Opportunities
                    .FirstOrDefaultAsync(x => x.Id == dto.OpportunityId && !x.IsDeleted);

                if (opportunity == null)
                    return NotFound("Карточка возможности не найдена");

                var exists = await _db.Favorites.AnyAsync(x =>
                    x.ApplicantProfileId == applicantProfile.Id &&
                    x.Type == FavoriteType.Opportunity &&
                    x.OpportunityId == dto.OpportunityId);

                if (exists)
                    return BadRequest("Карточка уже в избранном");
            }
            else
            {
                if (dto.EmployerProfileId == null)
                    return BadRequest("Укажите работодателя");

                var employerProfile = await _db.EmployerProfiles
                    .FirstOrDefaultAsync(x => x.Id == dto.EmployerProfileId);

                if (employerProfile == null)
                    return NotFound("Работодатель не найден");

                var exists = await _db.Favorites.AnyAsync(x =>
                    x.ApplicantProfileId == applicantProfile.Id &&
                    x.Type == FavoriteType.Employer &&
                    x.EmployerProfileId == dto.EmployerProfileId);

                if (exists)
                    return BadRequest("Компания уже в избранном");
            }

            var favorite = new Favorite
            {
                ApplicantProfileId = applicantProfile.Id,
                Type = dto.Type,
                OpportunityId = dto.Type == FavoriteType.Opportunity ? dto.OpportunityId : null,
                EmployerProfileId = dto.Type == FavoriteType.Employer ? dto.EmployerProfileId : null
            };

            _db.Favorites.Add(favorite);
            await _db.SaveChangesAsync();

            favorite = await _db.Favorites
                .Include(x => x.Opportunity)
                .ThenInclude(x => x!.EmployerProfile)
                .Include(x => x.EmployerProfile)
                .ThenInclude(x => x!.User)
                .FirstAsync(x => x.Id == favorite.Id);

            return Ok(BuildFavoriteResponse(favorite));
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var applicantProfile = await GetApplicantProfileAsync();
            if (applicantProfile == null)
                return BadRequest("Сначала создайте профиль соискателя");

            var favorite = await _db.Favorites
                .FirstOrDefaultAsync(x => x.Id == id && x.ApplicantProfileId == applicantProfile.Id);

            if (favorite == null)
                return NotFound("Элемент избранного не найден");

            _db.Favorites.Remove(favorite);
            await _db.SaveChangesAsync();

            return Ok(new { message = "Элемент удален из избранного" });
        }

        private async Task<ApplicantProfile?> GetApplicantProfileAsync()
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userIdClaim == null)
                return null;

            var userId = Guid.Parse(userIdClaim);
            return await _db.ApplicantProfiles.FirstOrDefaultAsync(x => x.UserId == userId);
        }

        private static object BuildFavoriteResponse(Favorite favorite)
        {
            return new
            {
                favorite.Id,
                favorite.Type,
                favorite.CreatedAt,
                Opportunity = favorite.Opportunity == null ? null : new
                {
                    favorite.Opportunity.Id,
                    favorite.Opportunity.Title,
                    favorite.Opportunity.CompanyName,
                    favorite.Opportunity.City,
                    favorite.Opportunity.Type,
                    favorite.Opportunity.Status
                },
                Employer = favorite.EmployerProfile == null ? null : new
                {
                    favorite.EmployerProfile.Id,
                    favorite.EmployerProfile.CompanyName,
                    favorite.EmployerProfile.City,
                    favorite.EmployerProfile.IsVerified,
                    User = favorite.EmployerProfile.User == null ? null : new
                    {
                        favorite.EmployerProfile.User.Id,
                        favorite.EmployerProfile.User.DisplayName
                    }
                }
            };
        }
    }
}
