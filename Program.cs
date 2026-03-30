using hhru.DataAccess.Models;
using hhru.DataAccess.Models.Enums;
using hhru.Services;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;
using hhru.DataAccess.Context.DbContext;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.SetIsOriginAllowed(origin =>
            Uri.TryCreate(origin, UriKind.Absolute, out var uri) &&
            (uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps) &&
            (string.Equals(uri.Host, "localhost", StringComparison.OrdinalIgnoreCase) ||
             string.Equals(uri.Host, "127.0.0.1", StringComparison.OrdinalIgnoreCase)))
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials();
    });
});
builder.Services.AddRazorPages();
builder.Services.AddEndpointsApiExplorer();

builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Hhru API",
        Version = "v1"
    });

    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "������ JWT ����� � �������: Bearer {�����}"
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services
    .AddIdentity<AppUser, IdentityRole<Guid>>(options =>
    {
        options.Password.RequiredLength = 6;
        options.Password.RequireDigit = false;
        options.Password.RequireUppercase = false;
        options.Password.RequireLowercase = false;
        options.Password.RequireNonAlphanumeric = false;
    })
    .AddEntityFrameworkStores<AppDbContext>()
    .AddDefaultTokenProviders();

builder.Services.AddScoped<JwtService>();

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidAudience = builder.Configuration["Jwt:Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!)
        )
    };
});

builder.Services.AddAuthorization();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
else
{
    app.UseHttpsRedirection();
}

app.UseCors("AllowFrontend");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapRazorPages();

// Seed data
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var context = services.GetRequiredService<AppDbContext>();
    var userManager = services.GetRequiredService<UserManager<AppUser>>();
    var roleManager = services.GetRequiredService<RoleManager<IdentityRole<Guid>>>();

    // Ensure database is created
    context.Database.Migrate();

    // Create roles
    string[] roles = { "Applicant", "Employer", "Curator", "Admin" };
    foreach (var role in roles)
    {
        if (!await roleManager.RoleExistsAsync(role))
        {
            await roleManager.CreateAsync(new IdentityRole<Guid>(role));
        }
    }

    // Create admin user
    var adminEmail = "admin@trampoline.com";
    var adminUser = await userManager.FindByEmailAsync(adminEmail);
    if (adminUser == null)
    {
        adminUser = new AppUser
        {
            UserName = adminEmail,
            Email = adminEmail,
            DisplayName = "Administrator"
        };
        var result = await userManager.CreateAsync(adminUser, "Admin123!");
        if (result.Succeeded)
        {
            await userManager.AddToRoleAsync(adminUser, "Admin");
            await userManager.AddToRoleAsync(adminUser, "Curator");

            context.CuratorProfiles.Add(new CuratorProfile
            {
                UserId = adminUser.Id,
                FullName = "Администратор платформы",
                OrganizationName = "КодИнсайт",
                Position = "Главный куратор",
                IsAdmin = true
            });
            await context.SaveChangesAsync();
        }
    }

    var adminCuratorProfileExists = await context.CuratorProfiles.AnyAsync(x => x.UserId == adminUser!.Id);
    if (!adminCuratorProfileExists)
    {
        context.CuratorProfiles.Add(new CuratorProfile
        {
            UserId = adminUser.Id,
            FullName = "Администратор платформы",
            OrganizationName = "КодИнсайт",
            Position = "Главный куратор",
            IsAdmin = true
        });
        await context.SaveChangesAsync();
    }

    if (!await context.PlatformTags.AnyAsync())
    {
        context.PlatformTags.AddRange(
            new PlatformTag { Name = "Python", Category = TagCategory.Technology, IsSystem = true },
            new PlatformTag { Name = "Java", Category = TagCategory.Technology, IsSystem = true },
            new PlatformTag { Name = "C#", Category = TagCategory.Technology, IsSystem = true },
            new PlatformTag { Name = "JavaScript", Category = TagCategory.Technology, IsSystem = true },
            new PlatformTag { Name = "TypeScript", Category = TagCategory.Technology, IsSystem = true },
            new PlatformTag { Name = "SQL", Category = TagCategory.Technology, IsSystem = true },
            new PlatformTag { Name = "DevOps", Category = TagCategory.Direction, IsSystem = true },
            new PlatformTag { Name = "Data Science", Category = TagCategory.Direction, IsSystem = true },
            new PlatformTag { Name = "QA", Category = TagCategory.Direction, IsSystem = true },
            new PlatformTag { Name = "Junior", Category = TagCategory.Level, IsSystem = true },
            new PlatformTag { Name = "Middle", Category = TagCategory.Level, IsSystem = true },
            new PlatformTag { Name = "Intern", Category = TagCategory.Level, IsSystem = true },
            new PlatformTag { Name = "Part-time", Category = TagCategory.EmploymentType, IsSystem = true },
            new PlatformTag { Name = "Full-time", Category = TagCategory.EmploymentType, IsSystem = true },
            new PlatformTag { Name = "Project Work", Category = TagCategory.EmploymentType, IsSystem = true }
        );
        await context.SaveChangesAsync();
    }
}

app.Run();
