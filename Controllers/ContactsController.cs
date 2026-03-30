using hhru.DataAccess.Context.DbContext;
using hhru.DataAccess.Dtos;
using hhru.DataAccess.Models;
using hhru.DataAccess.Models.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace hhru.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Applicant")]
    public class ContactsController : ControllerBase
    {
        private readonly AppDbContext _db;

        public ContactsController(AppDbContext db)
        {
            _db = db;
        }

        [HttpGet("my")]
        public async Task<IActionResult> GetMy()
        {
            var applicantProfile = await GetApplicantProfileAsync();
            if (applicantProfile == null)
                return BadRequest("Сначала создайте профиль соискателя");

            var contacts = await _db.Contacts
                .Include(x => x.SenderApplicantProfile)
                .ThenInclude(x => x!.User)
                .Include(x => x.ReceiverApplicantProfile)
                .ThenInclude(x => x!.User)
                .Where(x => x.SenderApplicantProfileId == applicantProfile.Id || x.ReceiverApplicantProfileId == applicantProfile.Id)
                .OrderByDescending(x => x.CreatedAt)
                .ToListAsync();

            return Ok(contacts.Select(x => BuildContactResponse(x, applicantProfile.Id)));
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateContactDto dto)
        {
            var applicantProfile = await GetApplicantProfileAsync();
            if (applicantProfile == null)
                return BadRequest("Сначала создайте профиль соискателя");

            if (dto.ReceiverApplicantProfileId == applicantProfile.Id)
                return BadRequest("Нельзя добавить себя в контакты");

            var receiver = await _db.ApplicantProfiles
                .Include(x => x.User)
                .FirstOrDefaultAsync(x => x.Id == dto.ReceiverApplicantProfileId);

            if (receiver == null)
                return NotFound("Соискатель не найден");

            var exists = await _db.Contacts.AnyAsync(x =>
                (x.SenderApplicantProfileId == applicantProfile.Id && x.ReceiverApplicantProfileId == dto.ReceiverApplicantProfileId) ||
                (x.SenderApplicantProfileId == dto.ReceiverApplicantProfileId && x.ReceiverApplicantProfileId == applicantProfile.Id));

            if (exists)
                return BadRequest("Контакт уже существует или ожидает подтверждения");

            var contact = new Contact
            {
                SenderApplicantProfileId = applicantProfile.Id,
                ReceiverApplicantProfileId = dto.ReceiverApplicantProfileId,
                Message = dto.Message,
                Status = ContactStatus.Pending
            };

            _db.Contacts.Add(contact);
            await _db.SaveChangesAsync();

            contact = await _db.Contacts
                .Include(x => x.SenderApplicantProfile)
                .ThenInclude(x => x!.User)
                .Include(x => x.ReceiverApplicantProfile)
                .ThenInclude(x => x!.User)
                .FirstAsync(x => x.Id == contact.Id);

            return Ok(BuildContactResponse(contact, applicantProfile.Id));
        }

        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateContactStatusDto dto)
        {
            var applicantProfile = await GetApplicantProfileAsync();
            if (applicantProfile == null)
                return BadRequest("Сначала создайте профиль соискателя");

            var contact = await _db.Contacts
                .Include(x => x.SenderApplicantProfile)
                .ThenInclude(x => x!.User)
                .Include(x => x.ReceiverApplicantProfile)
                .ThenInclude(x => x!.User)
                .FirstOrDefaultAsync(x => x.Id == id);

            if (contact == null)
                return NotFound("Контакт не найден");

            if (contact.ReceiverApplicantProfileId != applicantProfile.Id)
                return Forbid();

            contact.Status = dto.Status;
            await _db.SaveChangesAsync();

            return Ok(BuildContactResponse(contact, applicantProfile.Id));
        }

        private async Task<ApplicantProfile?> GetApplicantProfileAsync()
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userIdClaim == null)
                return null;

            var userId = Guid.Parse(userIdClaim);
            return await _db.ApplicantProfiles.FirstOrDefaultAsync(x => x.UserId == userId);
        }

        private static object BuildContactResponse(Contact contact, Guid currentApplicantProfileId)
        {
            var peer = contact.SenderApplicantProfileId == currentApplicantProfileId
                ? contact.ReceiverApplicantProfile
                : contact.SenderApplicantProfile;

            return new
            {
                contact.Id,
                contact.Message,
                contact.Status,
                contact.CreatedAt,
                IsIncoming = contact.ReceiverApplicantProfileId == currentApplicantProfileId,
                Peer = peer == null ? null : new
                {
                    peer.Id,
                    peer.FullName,
                    peer.University,
                    peer.CourseOrGraduationYear,
                    peer.City,
                    peer.CareerInterests,
                    User = peer.User == null ? null : new
                    {
                        peer.User.Id,
                        peer.User.DisplayName
                    }
                }
            };
        }
    }
}
