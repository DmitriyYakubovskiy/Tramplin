namespace hhru.DataAccess.Dtos
{
    public class CreateRecommendationDto
    {
        public Guid RecommendedApplicantProfileId { get; set; }
        public Guid OpportunityId { get; set; }
        public string Message { get; set; } = string.Empty;
    }
}
