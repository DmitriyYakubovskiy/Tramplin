using hhru.DataAccess.Models.Enums;

namespace hhru.DataAccess.Dtos
{
    public class ModerateOpportunityDto
    {
        public OpportunityStatus Status { get; set; } = OpportunityStatus.OnModeration;
        public string ModerationComment { get; set; } = string.Empty;
    }
}
