namespace hhru.DataAccess.Dtos
{
    public class CreateContactDto
    {
        public Guid ReceiverApplicantProfileId { get; set; }
        public string Message { get; set; } = string.Empty;
    }
}
