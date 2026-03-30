namespace hhru.DataAccess.Dtos
{
    public class CreateApplicationDto
    {
        public Guid OpportunityId { get; set; }
        public string Message { get; set; } = string.Empty;
    }
}
