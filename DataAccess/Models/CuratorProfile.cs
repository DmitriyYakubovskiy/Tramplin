namespace hhru.DataAccess.Models
{
    public class CuratorProfile
    {
        public Guid Id { get; set; }

        public Guid UserId { get; set; }
        public AppUser? User { get; set; }

        public string FullName { get; set; } = string.Empty;
        public string OrganizationName { get; set; } = string.Empty;
        public string Position { get; set; } = string.Empty;

        public bool IsAdmin { get; set; } = false;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
