namespace hhru.DataAccess.Dtos
{
    public class CreateCuratorDto
    {
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string OrganizationName { get; set; } = string.Empty;
        public string Position { get; set; } = string.Empty;
        public bool IsAdmin { get; set; } = false;
    }
}
