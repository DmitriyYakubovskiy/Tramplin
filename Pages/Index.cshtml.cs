using hhru.DataAccess.Context.DbContext;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.EntityFrameworkCore;

namespace hhru.Pages
{
    public class IndexModel : PageModel
    {
        private readonly AppDbContext _db;

        public IndexModel(AppDbContext db)
        {
            _db = db;
        }

        public List<OpportunityListItem> Opportunities { get; set; } = new();

        public async Task OnGetAsync()
        {
            Opportunities = await _db.Opportunities
                .Where(x => !x.IsDeleted)
                .OrderByDescending(x => x.PublishedAt)
                .Select(x => new OpportunityListItem
                {
                    Id = x.Id,
                    Title = x.Title,
                    ShortDescription = x.ShortDescription,
                    CompanyName = x.CompanyName,
                    City = x.City,
                    Type = x.Type.ToString(),
                    Status = x.Status.ToString()
                })
                .ToListAsync();
        }

        public class OpportunityListItem
        {
            public Guid Id { get; set; }
            public string Title { get; set; } = string.Empty;
            public string ShortDescription { get; set; } = string.Empty;
            public string CompanyName { get; set; } = string.Empty;
            public string City { get; set; } = string.Empty;
            public string Type { get; set; } = string.Empty;
            public string Status { get; set; } = string.Empty;
        }
    }
}