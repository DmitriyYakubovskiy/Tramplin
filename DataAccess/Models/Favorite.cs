using hhru.DataAccess.Models.Enums;

namespace hhru.DataAccess.Models
{
    public class Favorite
    {
        public Guid Id { get; set; }

        public Guid ApplicantProfileId { get; set; }
        public ApplicantProfile? ApplicantProfile { get; set; }

        public FavoriteType Type { get; set; }

        public Guid? OpportunityId { get; set; }
        public Opportunity? Opportunity { get; set; }

        public Guid? EmployerProfileId { get; set; }
        public EmployerProfile? EmployerProfile { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
