using Microsoft.AspNetCore.Identity;

namespace hhru.DataAccess.Models
{
    public class AppUser : IdentityUser<Guid>
    {
        public string DisplayName { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public ApplicantProfile? ApplicantProfile { get; set; }
        public EmployerProfile? EmployerProfile { get; set; }
        public CuratorProfile? CuratorProfile { get; set; }
    }
}
