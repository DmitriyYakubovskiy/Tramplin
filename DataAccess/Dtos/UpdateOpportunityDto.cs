using hhru.DataAccess.Models.Enums;

namespace hhru.DataAccess.Dtos
{
    public class UpdateOpportunityDto
    {
        public string Title { get; set; } = string.Empty;
        public string ShortDescription { get; set; } = string.Empty;
        public string FullDescription { get; set; } = string.Empty;

        public OpportunityType Type { get; set; }
        public WorkFormat WorkFormat { get; set; }
        public OpportunityStatus Status { get; set; }

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

        public DateTime? ExpiresAt { get; set; }
        public DateTime? EventDate { get; set; }

        public bool IsVerifiedOnly { get; set; }
        public bool IsDeleted { get; set; }
        public string ModerationComment { get; set; } = string.Empty;
    }
}
