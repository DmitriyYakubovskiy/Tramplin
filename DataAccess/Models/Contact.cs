using hhru.DataAccess.Models.Enums;

namespace hhru.DataAccess.Models
{
    public class Contact
    {
        public Guid Id { get; set; }

        public Guid SenderApplicantProfileId { get; set; }
        public ApplicantProfile? SenderApplicantProfile { get; set; }

        public Guid ReceiverApplicantProfileId { get; set; }
        public ApplicantProfile? ReceiverApplicantProfile { get; set; }

        public string Message { get; set; } = string.Empty;
        public ContactStatus Status { get; set; } = ContactStatus.Pending;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
