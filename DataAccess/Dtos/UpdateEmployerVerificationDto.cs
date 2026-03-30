using hhru.DataAccess.Models.Enums;

namespace hhru.DataAccess.Dtos
{
    public class UpdateEmployerVerificationDto
    {
        public EmployerVerificationStatus Status { get; set; }
        public string Comment { get; set; } = string.Empty;
    }
}
