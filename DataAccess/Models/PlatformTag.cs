using hhru.DataAccess.Models.Enums;

namespace hhru.DataAccess.Models
{
    public class PlatformTag
    {
        public Guid Id { get; set; }

        public string Name { get; set; } = string.Empty;
        public TagCategory Category { get; set; } = TagCategory.Other;
        public bool IsSystem { get; set; } = false;

        public Guid? CreatedByUserId { get; set; }
        public AppUser? CreatedByUser { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
