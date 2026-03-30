using hhru.DataAccess.Models.Enums;

namespace hhru.DataAccess.Models
{
    public class EmployerProfile
    {
        public Guid Id { get; set; }

        public Guid UserId { get; set; }
        public AppUser? User { get; set; }

        public string CompanyName { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Industry { get; set; } = string.Empty;
        public string LogoUrl { get; set; } = string.Empty;
        public string VideoPresentationUrl { get; set; } = string.Empty;

        public string WebsiteUrl { get; set; } = string.Empty;
        public string SocialLinks { get; set; } = string.Empty;

        public string VerificationMethod { get; set; } = string.Empty;
        public string VerificationData { get; set; } = string.Empty;
        public bool IsVerified { get; set; } = false;
        public DateTime? VerifiedAt { get; set; }
        public EmployerVerificationStatus VerificationStatus { get; set; } = EmployerVerificationStatus.Pending;
        public string VerificationComment { get; set; } = string.Empty;

        public string OfficeAddress { get; set; } = string.Empty;
        public string City { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public List<Opportunity> Opportunities { get; set; } = new();
        public List<Favorite> Favorites { get; set; } = new();
    }
}
