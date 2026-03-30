namespace hhru.DataAccess.Dtos
{
    public class CreateApplicantProfileDto
    {
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
    }
}
