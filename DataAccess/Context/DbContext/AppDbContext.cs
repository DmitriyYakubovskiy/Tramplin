using hhru.DataAccess.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace hhru.DataAccess.Context.DbContext
{
    public class AppDbContext : IdentityDbContext<AppUser, IdentityRole<Guid>, Guid>
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<Opportunity> Opportunities => Set<Opportunity>();
        public DbSet<ApplicantProfile> ApplicantProfiles => Set<ApplicantProfile>();
        public DbSet<EmployerProfile> EmployerProfiles => Set<EmployerProfile>();
        public DbSet<CuratorProfile> CuratorProfiles => Set<CuratorProfile>();
        public DbSet<Application> Applications => Set<Application>();
        public DbSet<Favorite> Favorites => Set<Favorite>();
        public DbSet<Contact> Contacts => Set<Contact>();
        public DbSet<PlatformTag> PlatformTags => Set<PlatformTag>();
        public DbSet<Recommendation> Recommendations => Set<Recommendation>();

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            // ---------------------------
            // AppUser -> ApplicantProfile (one-to-one)
            // ---------------------------
            builder.Entity<AppUser>()
                .HasOne(u => u.ApplicantProfile)
                .WithOne(p => p.User)
                .HasForeignKey<ApplicantProfile>(p => p.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // ---------------------------
            // AppUser -> EmployerProfile (one-to-one)
            // ---------------------------
            builder.Entity<AppUser>()
                .HasOne(u => u.EmployerProfile)
                .WithOne(p => p.User)
                .HasForeignKey<EmployerProfile>(p => p.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // ---------------------------
            // AppUser -> CuratorProfile (one-to-one)
            // ---------------------------
            builder.Entity<AppUser>()
                .HasOne(u => u.CuratorProfile)
                .WithOne(p => p.User)
                .HasForeignKey<CuratorProfile>(p => p.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // ---------------------------
            // EmployerProfile -> Opportunities (one-to-many)
            // ---------------------------
            builder.Entity<EmployerProfile>()
                .HasMany(e => e.Opportunities)
                .WithOne(o => o.EmployerProfile)
                .HasForeignKey(o => o.EmployerProfileId)
                .OnDelete(DeleteBehavior.Cascade);

            // ---------------------------
            // ApplicantProfile -> Applications (one-to-many)
            // ---------------------------
            builder.Entity<ApplicantProfile>()
                .HasMany(a => a.Applications)
                .WithOne(ap => ap.ApplicantProfile)
                .HasForeignKey(ap => ap.ApplicantProfileId)
                .OnDelete(DeleteBehavior.Cascade);

            // ---------------------------
            // Opportunity -> Applications (one-to-many)
            // ---------------------------
            builder.Entity<Opportunity>()
                .HasMany(o => o.Applications)
                .WithOne(a => a.Opportunity)
                .HasForeignKey(a => a.OpportunityId)
                .OnDelete(DeleteBehavior.Cascade);

            // ---------------------------
            // ApplicantProfile -> Favorites (one-to-many)
            // ---------------------------
            builder.Entity<ApplicantProfile>()
                .HasMany(a => a.Favorites)
                .WithOne(f => f.ApplicantProfile)
                .HasForeignKey(f => f.ApplicantProfileId)
                .OnDelete(DeleteBehavior.Cascade);

            // ---------------------------
            // Opportunity -> Favorites (optional many-to-one)
            // ---------------------------
            builder.Entity<Favorite>()
                .HasOne(f => f.Opportunity)
                .WithMany(o => o.Favorites)
                .HasForeignKey(f => f.OpportunityId)
                .OnDelete(DeleteBehavior.Cascade);

            // ---------------------------
            // EmployerProfile -> Favorites (optional many-to-one)
            // ---------------------------
            builder.Entity<Favorite>()
                .HasOne(f => f.EmployerProfile)
                .WithMany(e => e.Favorites)
                .HasForeignKey(f => f.EmployerProfileId)
                .OnDelete(DeleteBehavior.Cascade);

            // ---------------------------
            // ApplicantProfile -> SentContacts
            // ---------------------------
            builder.Entity<Contact>()
                .HasOne(c => c.SenderApplicantProfile)
                .WithMany(a => a.SentContacts)
                .HasForeignKey(c => c.SenderApplicantProfileId)
                .OnDelete(DeleteBehavior.Restrict);

            // ---------------------------
            // ApplicantProfile -> ReceivedContacts
            // ---------------------------
            builder.Entity<Contact>()
                .HasOne(c => c.ReceiverApplicantProfile)
                .WithMany(a => a.ReceivedContacts)
                .HasForeignKey(c => c.ReceiverApplicantProfileId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<Recommendation>()
                .HasOne(r => r.RecommenderApplicantProfile)
                .WithMany(a => a.SentRecommendations)
                .HasForeignKey(r => r.RecommenderApplicantProfileId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<Recommendation>()
                .HasOne(r => r.RecommendedApplicantProfile)
                .WithMany(a => a.ReceivedRecommendations)
                .HasForeignKey(r => r.RecommendedApplicantProfileId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<Recommendation>()
                .HasOne(r => r.Opportunity)
                .WithMany()
                .HasForeignKey(r => r.OpportunityId)
                .OnDelete(DeleteBehavior.Cascade);

            // ---------------------------
            // Ограничения и индексы
            // ---------------------------

            builder.Entity<AppUser>()
                .Property(u => u.DisplayName)
                .HasMaxLength(150);

            builder.Entity<ApplicantProfile>()
                .Property(a => a.FullName)
                .HasMaxLength(150);

            builder.Entity<ApplicantProfile>()
                .Property(a => a.University)
                .HasMaxLength(200);

            builder.Entity<ApplicantProfile>()
                .Property(a => a.Faculty)
                .HasMaxLength(200);

            builder.Entity<ApplicantProfile>()
                .Property(a => a.CourseOrGraduationYear)
                .HasMaxLength(100);

            builder.Entity<ApplicantProfile>()
                .Property(a => a.City)
                .HasMaxLength(100);

            builder.Entity<ApplicantProfile>()
                .Property(a => a.CareerInterests)
                .HasMaxLength(500);

            builder.Entity<EmployerProfile>()
                .Property(e => e.CompanyName)
                .HasMaxLength(200);

            builder.Entity<EmployerProfile>()
                .Property(e => e.Industry)
                .HasMaxLength(150);

            builder.Entity<EmployerProfile>()
                .Property(e => e.City)
                .HasMaxLength(100);

            builder.Entity<EmployerProfile>()
                .Property(e => e.LogoUrl)
                .HasMaxLength(500);

            builder.Entity<EmployerProfile>()
                .Property(e => e.VideoPresentationUrl)
                .HasMaxLength(500);

            builder.Entity<EmployerProfile>()
                .Property(e => e.VerificationComment)
                .HasMaxLength(1000);

            builder.Entity<CuratorProfile>()
                .Property(c => c.FullName)
                .HasMaxLength(150);

            builder.Entity<CuratorProfile>()
                .Property(c => c.OrganizationName)
                .HasMaxLength(200);

            builder.Entity<CuratorProfile>()
                .Property(c => c.Position)
                .HasMaxLength(150);

            builder.Entity<Opportunity>()
                .Property(o => o.Title)
                .HasMaxLength(200);

            builder.Entity<Opportunity>()
                .Property(o => o.ShortDescription)
                .HasMaxLength(500);

            builder.Entity<Opportunity>()
                .Property(o => o.CompanyName)
                .HasMaxLength(200);

            builder.Entity<Opportunity>()
                .Property(o => o.City)
                .HasMaxLength(100);

            builder.Entity<Opportunity>()
                .Property(o => o.Address)
                .HasMaxLength(300);

            builder.Entity<Opportunity>()
                .Property(o => o.ContactEmail)
                .HasMaxLength(200);

            builder.Entity<Opportunity>()
                .Property(o => o.ContactPhone)
                .HasMaxLength(50);

            builder.Entity<Opportunity>()
                .Property(o => o.ExternalUrl)
                .HasMaxLength(500);

            builder.Entity<Opportunity>()
                .Property(o => o.MediaUrl)
                .HasMaxLength(500);

            builder.Entity<Opportunity>()
                .Property(o => o.ModerationComment)
                .HasMaxLength(1000);

            builder.Entity<PlatformTag>()
                .Property(t => t.Name)
                .HasMaxLength(100);

            builder.Entity<Recommendation>()
                .Property(r => r.Message)
                .HasMaxLength(1000);

            builder.Entity<Favorite>()
                .HasIndex(f => new { f.ApplicantProfileId, f.OpportunityId });

            builder.Entity<Favorite>()
                .HasIndex(f => new { f.ApplicantProfileId, f.EmployerProfileId });

            builder.Entity<Application>()
                .HasIndex(a => new { a.ApplicantProfileId, a.OpportunityId });

            builder.Entity<Contact>()
                .HasIndex(c => new { c.SenderApplicantProfileId, c.ReceiverApplicantProfileId });

            builder.Entity<PlatformTag>()
                .HasIndex(t => t.Name)
                .IsUnique();

            builder.Entity<Recommendation>()
                .HasIndex(r => new { r.RecommenderApplicantProfileId, r.RecommendedApplicantProfileId, r.OpportunityId });
        }
    }
}
