using hhru.DataAccess.Models.Enums;

namespace hhru.DataAccess.Models
{
    public class Opportunity
    {
        public Guid Id { get; set; }

        public Guid EmployerProfileId { get; set; }
        public EmployerProfile? EmployerProfile { get; set; }

        public string Title { get; set; } = string.Empty;
        public string ShortDescription { get; set; } = string.Empty;
        public string FullDescription { get; set; } = string.Empty;

        public OpportunityType Type { get; set; }
        public WorkFormat WorkFormat { get; set; }
        public OpportunityStatus Status { get; set; } = OpportunityStatus.OnModeration;

        public string CompanyName { get; set; } = string.Empty;

        public string City { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;

        public decimal? SalaryFrom { get; set; }
        public decimal? SalaryTo { get; set; }

        public string ContactEmail { get; set; } = string.Empty;
        public string ContactPhone { get; set; } = string.Empty;
        public string ExternalUrl { get; set; } = string.Empty;

        public string Tags { get; set; } = string.Empty;
        public string MediaUrl { get; set; } = string.Empty;

        public double? Latitude { get; set; }
        public double? Longitude { get; set; }

        public DateTime PublishedAt { get; set; } = DateTime.UtcNow;
        public DateTime? ExpiresAt { get; set; }
        public DateTime? EventDate { get; set; }
        public string ModerationComment { get; set; } = string.Empty;

        public bool IsVerifiedOnly { get; set; } = false;
        public bool IsDeleted { get; set; } = false;

        public List<Application> Applications { get; set; } = new();
        public List<Favorite> Favorites { get; set; } = new();
    }
}
