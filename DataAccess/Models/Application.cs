using hhru.DataAccess.Models.Enums;

namespace hhru.DataAccess.Models
{
    public class Application
    {
        public Guid Id { get; set; }

        public Guid OpportunityId { get; set; }
        public Opportunity? Opportunity { get; set; }

        public Guid ApplicantProfileId { get; set; }
        public ApplicantProfile? ApplicantProfile { get; set; }

        public string Message { get; set; } = string.Empty;
        public ApplicationStatus Status { get; set; } = ApplicationStatus.Pending;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
    }
}
