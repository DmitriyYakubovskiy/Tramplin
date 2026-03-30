using hhru.DataAccess.Models.Enums;

namespace hhru.DataAccess.Dtos
{
    public class CreatePlatformTagDto
    {
        public string Name { get; set; } = string.Empty;
        public TagCategory Category { get; set; } = TagCategory.Other;
    }
}
