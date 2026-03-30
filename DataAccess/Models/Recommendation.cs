namespace hhru.DataAccess.Models
{
    public class Recommendation
    {
        public Guid Id { get; set; }

        public Guid RecommenderApplicantProfileId { get; set; }
        public ApplicantProfile? RecommenderApplicantProfile { get; set; }

        public Guid RecommendedApplicantProfileId { get; set; }
        public ApplicantProfile? RecommendedApplicantProfile { get; set; }

        public Guid OpportunityId { get; set; }
        public Opportunity? Opportunity { get; set; }

        public string Message { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
