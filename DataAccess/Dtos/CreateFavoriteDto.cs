using hhru.DataAccess.Models.Enums;

namespace hhru.DataAccess.Dtos
{
    public class CreateFavoriteDto
    {
        public FavoriteType Type { get; set; }
        public Guid? OpportunityId { get; set; }
        public Guid? EmployerProfileId { get; set; }
    }
}
