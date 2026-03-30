namespace hhru.DataAccess.Dtos
{
    public class CreateEmployerProfileDto
    {
        public string CompanyName { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Industry { get; set; } = string.Empty;
        public string LogoUrl { get; set; } = string.Empty;
        public string VideoPresentationUrl { get; set; } = string.Empty;

        public string WebsiteUrl { get; set; } = string.Empty;
        public string SocialLinks { get; set; } = string.Empty;

        public string VerificationMethod { get; set; } = string.Empty;
        public string VerificationData { get; set; } = string.Empty;

        public string OfficeAddress { get; set; } = string.Empty;
        public string City { get; set; } = string.Empty;
    }
}
