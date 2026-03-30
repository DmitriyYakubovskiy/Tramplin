namespace hhru.DataAccess.Models
{
    public class ApplicantProfile
    {
        public Guid Id { get; set; }

        public Guid UserId { get; set; }
        public AppUser? User { get; set; }

        public string FullName { get; set; } = string.Empty;
        public string University { get; set; } = string.Empty;
        public string Faculty { get; set; } = string.Empty;
        public string CourseOrGraduationYear { get; set; } = string.Empty;

        public string About { get; set; } = string.Empty;
        public string CareerInterests { get; set; } = string.Empty;
        public string Skills { get; set; } = string.Empty;
        public string ProjectExperience { get; set; } = string.Empty;
        public string PortfolioUrl { get; set; } = string.Empty;
        public string GitHubUrl { get; set; } = string.Empty;
        public string ResumeFileUrl { get; set; } = string.Empty;

        public string City { get; set; } = string.Empty;
        public bool IsOpenToWork { get; set; } = true;

        public bool ShowEmail { get; set; } = false;
        public bool ShowPhone { get; set; } = false;
        public bool ShowContactsOnlyForVerifiedEmployers { get; set; } = true;
        public bool IsProfilePublic { get; set; } = false;
        public bool ShowResumeToAuthenticatedUsers { get; set; } = false;
        public bool ShowApplicationsToApplicants { get; set; } = false;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public List<Application> Applications { get; set; } = new();
        public List<Favorite> Favorites { get; set; } = new();

        public List<Contact> SentContacts { get; set; } = new();
        public List<Contact> ReceivedContacts { get; set; } = new();
        public List<Recommendation> SentRecommendations { get; set; } = new();
        public List<Recommendation> ReceivedRecommendations { get; set; } = new();
    }
}
