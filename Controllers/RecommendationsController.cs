using hhru.DataAccess.Models.Enums;
using hhru.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace hhru.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class RecommendationController : ControllerBase
    {
        private readonly RecommendationService _recommender;

        public RecommendationController(RecommendationService recommender)
        {
            _recommender = recommender;
        }

        /// <summary>
        /// GET /api/recommendation/feed
        /// Возвращает топ-10 персональных рекомендаций для авторизованного соискателя.
        /// </summary>
        [Authorize(Roles = "Applicant")]
        [HttpGet("feed")]
        public async Task<IActionResult> GetFeed([FromQuery] int topN = 10)
        {
            var userId = GetCurrentUserId();
            if (userId == null)
                return Unauthorized();

            topN = Math.Clamp(topN, 1, 20); // клиент не может запросить больше 20

            var results = await _recommender.GetTopRecommendationsAsync(userId.Value, topN);

            if (results.Count == 0)
                return Ok(new { items = Array.Empty<object>(), message = "Заполни профиль и навыки — мы подберём лучшие вакансии!" });

            // Возвращаем те же поля, что и в OpportunityController.GetAll
            var items = results.Select(s => new
            {
                s.Opportunity.Id,
                s.Opportunity.Title,
                s.Opportunity.ShortDescription,
                s.Opportunity.Type,
                s.Opportunity.WorkFormat,
                s.Opportunity.Status,
                s.Opportunity.CompanyName,
                s.Opportunity.City,
                s.Opportunity.SalaryFrom,
                s.Opportunity.SalaryTo,
                s.Opportunity.Tags,
                s.Opportunity.PublishedAt,
                s.Opportunity.ExpiresAt,
                s.Opportunity.IsVerifiedOnly,
                Employer = s.Opportunity.EmployerProfile == null ? null : new
                {
                    s.Opportunity.EmployerProfile.Id,
                    s.Opportunity.EmployerProfile.CompanyName,
                    s.Opportunity.EmployerProfile.LogoUrl,
                    s.Opportunity.EmployerProfile.IsVerified,
                }
            });

            return Ok(new { items });
        }

        private Guid? GetCurrentUserId()
        {
            var claim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return claim == null ? null : Guid.Parse(claim);
        }
    }
}