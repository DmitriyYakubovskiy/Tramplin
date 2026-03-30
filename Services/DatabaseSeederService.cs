using hhru.DataAccess.Context.DbContext;
using hhru.DataAccess.Models;
using hhru.DataAccess.Models.Enums;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace hhru.Services
{
    /// <summary>
    /// Сервис для заполнения базы данных начальными данными.
    /// </summary>
    public class DatabaseSeederService
    {
        private readonly AppDbContext _context;
        private readonly UserManager<AppUser> _userManager;
        private readonly RoleManager<IdentityRole<Guid>> _roleManager;
        private readonly ILogger<DatabaseSeederService> _logger;

        // Фиксированный seed для воспроизводимости
        private static readonly Random _rng = new Random(42);

        public DatabaseSeederService(
            AppDbContext context,
            UserManager<AppUser> userManager,
            RoleManager<IdentityRole<Guid>> roleManager,
            ILogger<DatabaseSeederService> logger)
        {
            _context = context;
            _userManager = userManager;
            _roleManager = roleManager;
            _logger = logger;
        }

        // ─────────────────────────────────────────────────────────────
        // ПУБЛИЧНЫЕ МЕТОДЫ
        // ─────────────────────────────────────────────────────────────

        /// <summary>
        /// Применяет миграции и засевает обязательные данные (роли + администратор).
        /// Вызывается при каждом запуске приложения.
        /// </summary>
        public async Task SeedEssentialAsync()
        {
            await _context.Database.MigrateAsync();
            await SeedRolesAsync();
            await SeedAdminAsync();
        }

        /// <summary>
        /// Дополнительно засевает тестовые данные для разработки.
        /// Вызывается только по явному запросу разработчика.
        /// </summary>
        public async Task SeedDevelopmentDataAsync()
        {
            _logger.LogInformation("Начало заполнения тестовых данных...");

            await SeedPlatformTagsAsync();
            var curators = await SeedCuratorsAsync();
            var employers = await SeedEmployersAsync();
            var applicants = await SeedApplicantsAsync();
            var opportunities = await SeedOpportunitiesAsync(employers);
            await SeedApplicationsAsync(applicants, opportunities);
            await SeedFavoritesAsync(applicants, opportunities, employers);
            await SeedContactsAsync(applicants);
            await SeedRecommendationsAsync(applicants, opportunities);

            _logger.LogInformation("Тестовые данные успешно загружены.");
        }

        // ─────────────────────────────────────────────────────────────
        // ОБЯЗАТЕЛЬНЫЕ ДАННЫЕ
        // ─────────────────────────────────────────────────────────────

        private async Task SeedRolesAsync()
        {
            string[] roles = { "Applicant", "Employer", "Curator", "Admin" };
            foreach (var role in roles)
            {
                if (!await _roleManager.RoleExistsAsync(role))
                {
                    await _roleManager.CreateAsync(new IdentityRole<Guid>(role));
                    _logger.LogInformation("Создана роль: {Role}", role);
                }
            }
        }

        private async Task SeedAdminAsync()
        {
            const string adminEmail = "admin@trampoline.com";
            var adminUser = await _userManager.FindByEmailAsync(adminEmail);

            if (adminUser == null)
            {
                adminUser = new AppUser
                {
                    UserName = adminEmail,
                    Email = adminEmail,
                    DisplayName = "Administrator",
                    EmailConfirmed = true
                };

                var result = await _userManager.CreateAsync(adminUser, "Admin123!");
                if (result.Succeeded)
                {
                    await _userManager.AddToRoleAsync(adminUser, "Admin");
                    await _userManager.AddToRoleAsync(adminUser, "Curator");
                    _logger.LogInformation("Создан администратор: {Email}", adminEmail);
                }
                else
                {
                    var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                    _logger.LogError("Ошибка создания администратора: {Errors}", errors);
                    return;
                }
            }

            var profileExists = await _context.CuratorProfiles.AnyAsync(x => x.UserId == adminUser.Id);
            if (!profileExists)
            {
                _context.CuratorProfiles.Add(new CuratorProfile
                {
                    UserId = adminUser.Id,
                    FullName = "Администратор платформы",
                    OrganizationName = "КодИнсайт",
                    Position = "Главный куратор",
                    IsAdmin = true
                });
                await _context.SaveChangesAsync();
                _logger.LogInformation("Создан профиль куратора для администратора.");
            }
        }

        // ─────────────────────────────────────────────────────────────
        // ТЕГИ
        // ─────────────────────────────────────────────────────────────

        private async Task SeedPlatformTagsAsync()
        {
            if (await _context.PlatformTags.AnyAsync()) return;

            var tags = new List<PlatformTag>
            {
                // Technology
                new() { Name = "Python",     Category = TagCategory.Technology,     IsSystem = true },
                new() { Name = "Java",       Category = TagCategory.Technology,     IsSystem = true },
                new() { Name = "C#",         Category = TagCategory.Technology,     IsSystem = true },
                new() { Name = "JavaScript", Category = TagCategory.Technology,     IsSystem = true },
                new() { Name = "TypeScript", Category = TagCategory.Technology,     IsSystem = true },
                new() { Name = "SQL",        Category = TagCategory.Technology,     IsSystem = true },
                new() { Name = "Go",         Category = TagCategory.Technology,     IsSystem = true },
                new() { Name = "Rust",       Category = TagCategory.Technology,     IsSystem = true },

                // Direction
                new() { Name = "DevOps",       Category = TagCategory.Direction, IsSystem = true },
                new() { Name = "Data Science", Category = TagCategory.Direction, IsSystem = true },
                new() { Name = "QA",           Category = TagCategory.Direction, IsSystem = true },
                new() { Name = "Frontend",     Category = TagCategory.Direction, IsSystem = true },
                new() { Name = "Backend",      Category = TagCategory.Direction, IsSystem = true },
                new() { Name = "Mobile",       Category = TagCategory.Direction, IsSystem = true },

                // Level
                new() { Name = "Junior", Category = TagCategory.Level, IsSystem = true },
                new() { Name = "Middle", Category = TagCategory.Level, IsSystem = true },
                new() { Name = "Senior", Category = TagCategory.Level, IsSystem = true },
                new() { Name = "Intern", Category = TagCategory.Level, IsSystem = true },
                new() { Name = "Lead",   Category = TagCategory.Level, IsSystem = true },

                // EmploymentType
                new() { Name = "Part-time",    Category = TagCategory.EmploymentType, IsSystem = true },
                new() { Name = "Full-time",    Category = TagCategory.EmploymentType, IsSystem = true },
                new() { Name = "Project Work", Category = TagCategory.EmploymentType, IsSystem = true },
                new() { Name = "Internship",   Category = TagCategory.EmploymentType, IsSystem = true },

                // Other (пользовательские)
                new() { Name = "Agile",       Category = TagCategory.Other, IsSystem = false },
                new() { Name = "Scrum",       Category = TagCategory.Other, IsSystem = false },
                new() { Name = "English B2",  Category = TagCategory.Other, IsSystem = false },
                new() { Name = "Team Lead",   Category = TagCategory.Other, IsSystem = false },
                new() { Name = "Linux",       Category = TagCategory.Other, IsSystem = false },
            };

            _context.PlatformTags.AddRange(tags);
            await _context.SaveChangesAsync();
            _logger.LogInformation("Теги платформы созданы ({Count}).", tags.Count);
        }

        // ─────────────────────────────────────────────────────────────
        // КУРАТОРЫ
        // ─────────────────────────────────────────────────────────────

        private async Task<List<CuratorProfile>> SeedCuratorsAsync()
        {
            var existingProfiles = await _context.CuratorProfiles.ToListAsync();
            if (existingProfiles.Count > 1) return existingProfiles; // уже есть кроме admin

            var curatorsData = new[]
            {
                ("curator1@trampoline.com", "Мария Иванова",    "МГУ",      "Координатор по карьере"),
                ("curator2@trampoline.com", "Алексей Петров",   "МФТИ",     "Куратор стажировок"),
                ("curator3@trampoline.com", "Светлана Кузнецова","НИУ ВШЭ", "Менеджер по партнёрствам"),
            };

            var profiles = new List<CuratorProfile>();

            foreach (var (email, fullName, org, position) in curatorsData)
            {
                if (await _userManager.FindByEmailAsync(email) != null) continue;

                var user = new AppUser
                {
                    UserName = email,
                    Email = email,
                    DisplayName = fullName,
                    EmailConfirmed = true
                };

                var result = await _userManager.CreateAsync(user, "Curator123!");
                if (!result.Succeeded) continue;

                await _userManager.AddToRoleAsync(user, "Curator");

                var profile = new CuratorProfile
                {
                    UserId = user.Id,
                    FullName = fullName,
                    OrganizationName = org,
                    Position = position,
                    IsAdmin = false
                };

                _context.CuratorProfiles.Add(profile);
                profiles.Add(profile);
            }

            await _context.SaveChangesAsync();
            _logger.LogInformation("Кураторы созданы ({Count}).", profiles.Count);
            return await _context.CuratorProfiles.ToListAsync();
        }

        // ─────────────────────────────────────────────────────────────
        // РАБОТОДАТЕЛИ
        // ─────────────────────────────────────────────────────────────

        private async Task<List<EmployerProfile>> SeedEmployersAsync()
        {
            if (await _context.EmployerProfiles.AnyAsync())
                return await _context.EmployerProfiles.ToListAsync();

            var employersData = new[]
            {
                ("employer1@yandex-team.ru", "Яндекс",           "ИТ / Интернет-сервисы",
                 "Одна из крупнейших технологических компаний России.",
                 "https://yandex.ru", "Москва", true),

                ("employer2@sber.ru",        "Сбер",             "Финтех / Банкинг",
                 "Крупнейший банк страны с собственной экосистемой.",
                 "https://sber.ru", "Москва", true),

                ("employer3@vk.com",         "VK",               "Социальные сети / ИТ",
                 "Ведущая социальная сеть и технологическая компания.",
                 "https://vk.com", "Санкт-Петербург", true),

                ("employer4@ozon.ru",        "Ozon",             "E-commerce / Маркетплейс",
                 "Один из крупнейших маркетплейсов в России.",
                 "https://ozon.ru", "Москва", true),

                ("employer5@2gis.ru",        "2ГИС",             "Геосервисы / Картография",
                 "Российский картографический сервис с картами 300+ городов.",
                 "https://2gis.ru", "Новосибирск", true),

                ("employer6@avito.ru",       "Авито",            "E-commerce / Объявления",
                 "Крупнейшая платформа частных объявлений.",
                 "https://avito.ru", "Москва", false),

                ("employer7@tinkoff.ru",     "Тинькофф",         "Финтех / Страхование",
                 "Онлайн-банк нового поколения.",
                 "https://tinkoff.ru", "Москва", false),

                ("employer8@kaspersky.com",  "Kaspersky Lab",    "Кибербезопасность",
                 "Мировой лидер в области информационной безопасности.",
                 "https://kaspersky.com", "Москва", true),
            };

            var profiles = new List<EmployerProfile>();

            foreach (var (email, company, industry, desc, website, city, verified) in employersData)
            {
                var user = new AppUser
                {
                    UserName = email,
                    Email = email,
                    DisplayName = company,
                    EmailConfirmed = true
                };

                var result = await _userManager.CreateAsync(user, "Employer123!");
                if (!result.Succeeded) continue;

                await _userManager.AddToRoleAsync(user, "Employer");

                var profile = new EmployerProfile
                {
                    UserId = user.Id,
                    CompanyName = company,
                    Description = desc,
                    Industry = industry,
                    WebsiteUrl = website,
                    City = city,
                    IsVerified = verified,
                    VerificationStatus = verified
                        ? EmployerVerificationStatus.Verified
                        : EmployerVerificationStatus.Pending,
                    VerifiedAt = verified ? DateTime.UtcNow.AddDays(-_rng.Next(10, 90)) : null,
                    VerificationMethod = verified ? "Документы компании" : string.Empty,
                    VerificationData = verified ? "ИНН, ОГРН предоставлены" : string.Empty,
                };

                _context.EmployerProfiles.Add(profile);
                profiles.Add(profile);
            }

            await _context.SaveChangesAsync();
            _logger.LogInformation("Работодатели созданы ({Count}).", profiles.Count);
            return profiles;
        }

        // ─────────────────────────────────────────────────────────────
        // СОИСКАТЕЛИ
        // ─────────────────────────────────────────────────────────────

        private async Task<List<ApplicantProfile>> SeedApplicantsAsync()
        {
            if (await _context.ApplicantProfiles.AnyAsync())
                return await _context.ApplicantProfiles.ToListAsync();

            var applicantsData = new[]
            {
                ("ivan.ivanov@student.msu.ru",    "Иван Иванов",     "МГУ им. Ломоносова",   "Факультет ВМК",          "3 курс",  "Москва",          "Backend-разработка, Python, Django"),
                ("anna.smirnova@student.hse.ru",  "Анна Смирнова",   "НИУ ВШЭ",              "Факультет компьютерных наук","4 курс","Москва",         "Data Science, ML, Python"),
                ("dmitry.kozlov@student.mipt.ru", "Дмитрий Козлов",  "МФТИ",                 "ФПМИ",                   "2 курс",  "Москва",          "Алгоритмы, C++, спортивное программирование"),
                ("elena.petrova@spbgu.ru",        "Елена Петрова",   "СПбГУ",                "Математико-механический", "2022",    "Санкт-Петербург", "Frontend, React, TypeScript"),
                ("sergey.novikov@ngu.ru",         "Сергей Новиков",  "НГУ",                  "ФИТ",                    "3 курс",  "Новосибирск",     "DevOps, Linux, Docker"),
                ("maria.kuznetsova@urfu.ru",      "Мария Кузнецова", "УрФУ",                 "ИРИТ-РтФ",               "4 курс",  "Екатеринбург",    "Мобильная разработка, Flutter"),
                ("alexey.morozov@kafu.ru",        "Алексей Морозов", "КФУ",                  "ИМиМех",                 "2023",    "Казань",          "Java, Spring, Backend"),
                ("olga.volkova@spbstu.ru",        "Ольга Волкова",   "СПбПУ Петра Великого", "Институт КНиТ",          "3 курс",  "Санкт-Петербург", "QA, тестирование, автоматизация"),
                ("nikita.sokolov@mstu.ru",        "Никита Соколов",  "МГТУ им. Баумана",     "ИБМ",                    "4 курс",  "Москва",          "C#, .NET, системное программирование"),
                ("daria.lebedeva@nngu.ru",        "Дарья Лебедева",  "ННГУ им. Лобачевского","ИИТММ",                  "2 курс",  "Нижний Новгород", "Data Science, SQL, аналитика"),
                ("Pavel.orlov@tusur.ru",          "Павел Орлов",     "ТУСУР",                "ФСУ",                    "3 курс",  "Томск",           "Embedded, C, RTOS"),
                ("yuliya.fedorova@vgu.ru",        "Юлия Фёдорова",   "ВГУ",                  "ФКН",                    "2023",    "Воронеж",         "Go, микросервисы, Kubernetes"),
                ("artem.popov@istu.ru",           "Артём Попов",     "ИГЭУ",                 "ФАЭ",                    "4 курс",  "Иваново",         "JavaScript, Node.js, React"),
                ("tatyana.mishina@samsu.ru",      "Татьяна Мишина",  "СамГУ",                "Факультет математики и IT","2 курс", "Самара",         "UI/UX, Figma, Frontend"),
                ("igor.zaharov@dvfu.ru",          "Игорь Захаров",   "ДВФУ",                 "ШЦЭ",                    "3 курс",  "Владивосток",     "Кибербезопасность, сети, Rust"),
            };

            var profiles = new List<ApplicantProfile>();

            foreach (var (email, fullName, uni, faculty, course, city, interests) in applicantsData)
            {
                var user = new AppUser
                {
                    UserName = email,
                    Email = email,
                    DisplayName = fullName,
                    EmailConfirmed = true
                };

                var result = await _userManager.CreateAsync(user, "Applicant123!");
                if (!result.Succeeded) continue;

                await _userManager.AddToRoleAsync(user, "Applicant");

                var profile = new ApplicantProfile
                {
                    UserId = user.Id,
                    FullName = fullName,
                    University = uni,
                    Faculty = faculty,
                    CourseOrGraduationYear = course,
                    City = city,
                    CareerInterests = interests,
                    About = $"Студент(ка) {uni}, увлекаюсь разработкой и новыми технологиями.",
                    Skills = interests,
                    IsOpenToWork = _rng.NextDouble() > 0.2,
                    IsProfilePublic = _rng.NextDouble() > 0.3,
                    ShowEmail = _rng.NextDouble() > 0.6,
                    ShowPhone = _rng.NextDouble() > 0.7,
                    ShowContactsOnlyForVerifiedEmployers = _rng.NextDouble() > 0.4,
                    CreatedAt = DateTime.UtcNow.AddDays(-_rng.Next(30, 365))
                };

                _context.ApplicantProfiles.Add(profile);
                profiles.Add(profile);
            }

            await _context.SaveChangesAsync();
            _logger.LogInformation("Соискатели созданы ({Count}).", profiles.Count);
            return profiles;
        }

        // ─────────────────────────────────────────────────────────────
        // ВАКАНСИИ / ВОЗМОЖНОСТИ
        // ─────────────────────────────────────────────────────────────

        private async Task<List<Opportunity>> SeedOpportunitiesAsync(List<EmployerProfile> employers)
        {
            if (await _context.Opportunities.AnyAsync())
                return await _context.Opportunities.ToListAsync();

            if (!employers.Any()) return new List<Opportunity>();

            var opportunities = new List<Opportunity>();

            // ---------- ВАКАНСИИ (Vacancy) ----------
            var vacanciesData = new[]
            {
                ("Backend-разработчик Python",       "Разработка высоконагруженных сервисов на Python/FastAPI.",           OpportunityStatus.Active,      WorkFormat.Remote,  60000m,  120000m),
                ("Frontend-разработчик React",       "Создание современных веб-интерфейсов на React + TypeScript.",        OpportunityStatus.Active,      WorkFormat.Hybrid,  55000m,  110000m),
                ("Java-разработчик (Spring Boot)",   "Разработка корпоративных приложений на Java.",                       OpportunityStatus.Active,      WorkFormat.Office,  70000m,  140000m),
                ("Go-разработчик",                   "Разработка микросервисов на Go в высоконагруженной системе.",        OpportunityStatus.Active,      WorkFormat.Remote,  80000m,  160000m),
                ("Data Engineer",                    "Построение пайплайнов данных, ETL-процессов.",                       OpportunityStatus.Active,      WorkFormat.Hybrid,  75000m,  150000m),
                ("DevOps-инженер",                   "Сопровождение инфраструктуры, CI/CD, Kubernetes.",                   OpportunityStatus.Active,      WorkFormat.Remote,  85000m,  170000m),
                ("QA-инженер (автоматизация)",       "Написание автотестов на Python/Selenium/Playwright.",                OpportunityStatus.Active,      WorkFormat.Hybrid,  50000m,   90000m),
                ("iOS-разработчик Swift",            "Разработка мобильных приложений под iOS.",                          OpportunityStatus.Active,      WorkFormat.Office,  75000m,  150000m),
                ("Android-разработчик Kotlin",       "Разработка Android-приложений, jetpack compose.",                   OpportunityStatus.Active,      WorkFormat.Hybrid,  70000m,  140000m),
                ("C#/.NET-разработчик",              "Создание сервисов на ASP.NET Core, работа с PostgreSQL.",            OpportunityStatus.Active,      WorkFormat.Office,  65000m,  130000m),
                ("ML-инженер",                       "Обучение и деплой моделей машинного обучения.",                     OpportunityStatus.Active,      WorkFormat.Remote,  90000m,  180000m),
                ("Аналитик данных",                  "Анализ бизнес-метрик, SQL, Python, Tableau.",                       OpportunityStatus.Active,      WorkFormat.Hybrid,  55000m,  100000m),
                ("Специалист по кибербезопасности",  "Анализ уязвимостей, пентест, защита инфраструктуры.",               OpportunityStatus.Active,      WorkFormat.Office,  80000m,  160000m),
                ("Fullstack-разработчик",            "Node.js + React, разработка продуктовых фичей.",                    OpportunityStatus.OnModeration,WorkFormat.Remote,  60000m,  120000m),
                ("Rust-разработчик",                 "Системное программирование, разработка высокопроизводительного ПО.", OpportunityStatus.OnModeration,WorkFormat.Remote,  90000m,  180000m),
                ("SQL-разработчик / DBA",            "Оптимизация запросов, проектирование схем БД.",                     OpportunityStatus.Active,      WorkFormat.Hybrid,  65000m,  120000m),
                ("Embedded-разработчик",             "Разработка прошивок для микроконтроллеров, RTOS.",                  OpportunityStatus.Closed,      WorkFormat.Office,  60000m,  110000m),
                ("Tech Lead Backend",                "Руководство командой backend-разработки.",                          OpportunityStatus.Active,      WorkFormat.Hybrid, 130000m, 250000m),
                ("UI/UX-дизайнер (с навыками верстки)","Проектирование интерфейсов, прототипирование в Figma.",           OpportunityStatus.Archived,    WorkFormat.Remote,  50000m,   90000m),
                ("Platform-инженер",                 "Разработка и поддержка внутренних платформенных решений.",          OpportunityStatus.Active,      WorkFormat.Remote, 100000m, 200000m),
            };

            var tags = await _context.PlatformTags.ToListAsync();

            string TagNames(params string[] names) =>
                string.Join(",", names.Where(n => tags.Any(t => t.Name == n)));

            var vacancyTags = new[]
            {
                TagNames("Python","Backend","Junior","Full-time"),
                TagNames("TypeScript","Frontend","Junior","Full-time"),
                TagNames("Java","Backend","Middle","Full-time"),
                TagNames("Go","Backend","Middle","Remote"),
                TagNames("Python","SQL","Data Science","Full-time"),
                TagNames("DevOps","Linux","Middle","Full-time"),
                TagNames("QA","Python","Junior","Part-time"),
                TagNames("Mobile","Middle","Full-time"),
                TagNames("Mobile","Middle","Hybrid"),
                TagNames("C#","Backend","Junior","Full-time"),
                TagNames("Python","Data Science","Middle","Remote"),
                TagNames("SQL","Python","Junior","Full-time"),
                TagNames("Rust","Middle","Full-time"),
                TagNames("JavaScript","TypeScript","Full-time","Junior"),
                TagNames("Rust","Middle","Remote"),
                TagNames("SQL","Middle","Full-time"),
                TagNames("C#","Junior","Full-time"),
                TagNames("Backend","Lead","Full-time"),
                TagNames("Frontend","Middle","Remote"),
                TagNames("DevOps","Lead","Full-time"),
            };

            for (int i = 0; i < vacanciesData.Length; i++)
            {
                var (title, desc, status, format, from, to) = vacanciesData[i];
                var employer = employers[_rng.Next(employers.Count)];

                opportunities.Add(new Opportunity
                {
                    EmployerProfileId = employer.Id,
                    Title = title,
                    ShortDescription = desc,
                    FullDescription = $"{desc}\n\nТребования:\n— Опыт работы от 1 года\n— Знание Git\n— Умение работать в команде\n\nМы предлагаем:\n— Конкурентную зарплату\n— Гибкий график\n— ДМС",
                    Type = OpportunityType.Vacancy,
                    WorkFormat = format,
                    Status = status,
                    CompanyName = employer.CompanyName,
                    City = employer.City,
                    SalaryFrom = from,
                    SalaryTo = to,
                    ContactEmail = $"hr@{employer.CompanyName.ToLower().Replace(" ", "")}.ru",
                    Tags = vacancyTags.ElementAtOrDefault(i) ?? string.Empty,
                    PublishedAt = DateTime.UtcNow.AddDays(-_rng.Next(1, 60)),
                    ExpiresAt = DateTime.UtcNow.AddDays(_rng.Next(30, 90)),
                    IsVerifiedOnly = employer.IsVerified && _rng.NextDouble() > 0.7,
                });
            }

            // ---------- СТАЖИРОВКИ (Internship) ----------
            var internshipsData = new[]
            {
                ("Стажёр-разработчик Python",        "Погружение в разработку backend-сервисов под менторством.",   OpportunityStatus.Active,      WorkFormat.Hybrid),
                ("Data Science стажёр",              "Работа с реальными данными, участие в ML-проектах.",          OpportunityStatus.Active,      WorkFormat.Remote),
                ("Стажёр Frontend (React)",          "Разработка UI-компонентов и интеграция с REST API.",           OpportunityStatus.Active,      WorkFormat.Hybrid),
                ("Стажёр DevOps",                    "Автоматизация деплоя, работа с CI/CD пайплайнами.",           OpportunityStatus.OnModeration,WorkFormat.Office),
                ("Java-стажёр",                      "Разработка модулей корпоративной системы под руководством.",  OpportunityStatus.Active,      WorkFormat.Office),
                ("QA-стажёр",                        "Ручное и автоматизированное тестирование продукта.",          OpportunityStatus.Active,      WorkFormat.Remote),
                ("Стажёр-аналитик данных",           "SQL-аналитика, дашборды, работа с BI-инструментами.",         OpportunityStatus.Closed,      WorkFormat.Hybrid),
            };

            var internshipTags = new[]
            {
                TagNames("Python","Backend","Intern"),
                TagNames("Python","Data Science","Intern"),
                TagNames("TypeScript","Frontend","Intern"),
                TagNames("DevOps","Intern"),
                TagNames("Java","Backend","Intern"),
                TagNames("QA","Intern"),
                TagNames("SQL","Data Science","Intern"),
            };

            for (int i = 0; i < internshipsData.Length; i++)
            {
                var (title, desc, status, format) = internshipsData[i];
                var employer = employers[_rng.Next(employers.Count)];

                opportunities.Add(new Opportunity
                {
                    EmployerProfileId = employer.Id,
                    Title = title,
                    ShortDescription = desc,
                    FullDescription = $"{desc}\n\nЧто тебя ждёт:\n— Реальные задачи\n— Опытный ментор\n— Возможность перехода в штат",
                    Type = OpportunityType.Internship,
                    WorkFormat = format,
                    Status = status,
                    CompanyName = employer.CompanyName,
                    City = employer.City,
                    SalaryFrom = 20000m,
                    SalaryTo = 45000m,
                    Tags = internshipTags.ElementAtOrDefault(i) ?? string.Empty,
                    PublishedAt = DateTime.UtcNow.AddDays(-_rng.Next(1, 30)),
                    ExpiresAt = DateTime.UtcNow.AddDays(60),
                });
            }

            // ---------- МЕРОПРИЯТИЯ (Event) ----------
            var eventsData = new[]
            {
                ("IT-хакатон «КодФест 2025»",               "24-часовой хакатон для студентов технических специальностей.",  DateTime.UtcNow.AddDays(20)),
                ("Карьерная встреча в Яндексе",              "Открытый день для студентов: экскурсия и Q&A с командой.",       DateTime.UtcNow.AddDays(14)),
                ("Митап «Путь в Data Science»",              "Практический митап для тех, кто хочет войти в Data Science.",   DateTime.UtcNow.AddDays(7)),
                ("Воркшоп: CI/CD для начинающих DevOps",     "Практический воркшоп по настройке пайплайнов.",                 DateTime.UtcNow.AddDays(30)),
                ("Форум «Технологии будущего 2025»",         "Ежегодный форум с докладами лидеров индустрии.",                DateTime.UtcNow.AddDays(45)),
            };

            foreach (var (title, desc, eventDate) in eventsData)
            {
                var employer = employers[_rng.Next(employers.Count)];

                opportunities.Add(new Opportunity
                {
                    EmployerProfileId = employer.Id,
                    Title = title,
                    ShortDescription = desc,
                    FullDescription = $"{desc}\n\nПрограмма:\n— Открытие\n— Доклады и воркшопы\n— Нетворкинг\n— Призы для победителей",
                    Type = OpportunityType.Event,
                    WorkFormat = WorkFormat.Office,
                    Status = OpportunityStatus.Active,
                    CompanyName = employer.CompanyName,
                    City = employer.City,
                    Tags = TagNames("Agile", "Scrum"),
                    PublishedAt = DateTime.UtcNow.AddDays(-_rng.Next(1, 10)),
                    EventDate = eventDate,
                });
            }

            // ---------- ПРОЕКТНЫЕ РАБОТЫ (Mentorship / Project) ----------
            var projectsData = new[]
            {
                ("Разработка open-source инструмента мониторинга", "Создание Prometheus-экспортёра для корпоративной системы.",  OpportunityType.Mentorship),
                ("Pet-project: маркетплейс с AI-рекомендациями",  "Совместная разработка продукта с командой студентов.",       OpportunityType.Mentorship),
                ("Оптимизация legacy backend на PHP → Go",        "Рефакторинг и переписывание модулей на Go.",                OpportunityType.Mentorship),
                ("Разработка Telegram-бота для HR-автоматизации", "Создание бота с интеграцией API и базы данных.",             OpportunityType.Mentorship),
            };

            foreach (var (title, desc, type) in projectsData)
            {
                var employer = employers[_rng.Next(employers.Count)];

                opportunities.Add(new Opportunity
                {
                    EmployerProfileId = employer.Id,
                    Title = title,
                    ShortDescription = desc,
                    FullDescription = $"{desc}\n\nФормат:\n— Гибкий график\n— Удалённая работа\n— Менторская поддержка",
                    Type = type,
                    WorkFormat = WorkFormat.Remote,
                    Status = _rng.NextDouble() > 0.3 ? OpportunityStatus.Active : OpportunityStatus.OnModeration,
                    CompanyName = employer.CompanyName,
                    City = employer.City,
                    Tags = TagNames("Project Work", "Agile", "Scrum"),
                    PublishedAt = DateTime.UtcNow.AddDays(-_rng.Next(5, 30)),
                });
            }

            _context.Opportunities.AddRange(opportunities);
            await _context.SaveChangesAsync();
            _logger.LogInformation("Возможности созданы ({Count}).", opportunities.Count);
            return opportunities;
        }

        // ─────────────────────────────────────────────────────────────
        // ОТКЛИКИ
        // ─────────────────────────────────────────────────────────────

        private async Task SeedApplicationsAsync(
            List<ApplicantProfile> applicants,
            List<Opportunity> opportunities)
        {
            if (await _context.Applications.AnyAsync()) return;
            if (!applicants.Any() || !opportunities.Any()) return;

            var activeOpportunities = opportunities
                .Where(o => o.Status == OpportunityStatus.Active &&
                            (o.Type == OpportunityType.Vacancy || o.Type == OpportunityType.Internship))
                .ToList();

            var applications = new List<Application>();
            var usedPairs = new HashSet<(Guid, Guid)>();

            var statusWeights = new[]
            {
                (ApplicationStatus.Pending,  40),
                (ApplicationStatus.Reserved, 25),
                (ApplicationStatus.Accepted, 15),
                (ApplicationStatus.Rejected, 20),
            };

            foreach (var opportunity in activeOpportunities)
            {
                int count = _rng.Next(2, 4);
                var shuffled = applicants.OrderBy(_ => _rng.Next()).Take(count * 2).ToList();

                int added = 0;
                foreach (var applicant in shuffled)
                {
                    if (added >= count) break;
                    var pair = (applicant.Id, opportunity.Id);
                    if (usedPairs.Contains(pair)) continue;
                    usedPairs.Add(pair);
                    added++;

                    applications.Add(new Application
                    {
                        ApplicantProfileId = applicant.Id,
                        OpportunityId = opportunity.Id,
                        Message = PickMessage(applicant.FullName, opportunity.Title),
                        Status = WeightedRandom(statusWeights),
                        CreatedAt = DateTime.UtcNow.AddDays(-_rng.Next(1, 30)),
                    });
                }
            }

            _context.Applications.AddRange(applications);
            await _context.SaveChangesAsync();
            _logger.LogInformation("Отклики созданы ({Count}).", applications.Count);
        }

        // ─────────────────────────────────────────────────────────────
        // ИЗБРАННОЕ
        // ─────────────────────────────────────────────────────────────

        private async Task SeedFavoritesAsync(
            List<ApplicantProfile> applicants,
            List<Opportunity> opportunities,
            List<EmployerProfile> employers)
        {
            if (await _context.Favorites.AnyAsync()) return;
            if (!applicants.Any()) return;

            var favorites = new List<Favorite>();
            var usedOppPairs = new HashSet<(Guid, Guid)>();
            var usedEmpPairs = new HashSet<(Guid, Guid)>();

            foreach (var applicant in applicants)
            {
                // 2-4 избранных вакансий
                int oppCount = _rng.Next(2, 5);
                var shuffledOpps = opportunities
                    .Where(o => o.Status == OpportunityStatus.Active)
                    .OrderBy(_ => _rng.Next())
                    .Take(oppCount * 2)
                    .ToList();

                int oppAdded = 0;
                foreach (var opp in shuffledOpps)
                {
                    if (oppAdded >= oppCount) break;
                    var pair = (applicant.Id, opp.Id);
                    if (usedOppPairs.Contains(pair)) continue;
                    usedOppPairs.Add(pair);
                    oppAdded++;

                    favorites.Add(new Favorite
                    {
                        ApplicantProfileId = applicant.Id,
                        OpportunityId = opp.Id,
                        Type = FavoriteType.Opportunity,
                        CreatedAt = DateTime.UtcNow.AddDays(-_rng.Next(1, 30)),
                    });
                }

                // ~10-15% добавляют компании в избранное
                if (_rng.NextDouble() < 0.13 && employers.Any())
                {
                    var employer = employers[_rng.Next(employers.Count)];
                    var pair = (applicant.Id, employer.Id);
                    if (!usedEmpPairs.Contains(pair))
                    {
                        usedEmpPairs.Add(pair);
                        favorites.Add(new Favorite
                        {
                            ApplicantProfileId = applicant.Id,
                            EmployerProfileId = employer.Id,
                            Type = FavoriteType.Employer,
                            CreatedAt = DateTime.UtcNow.AddDays(-_rng.Next(1, 30)),
                        });
                    }
                }
            }

            _context.Favorites.AddRange(favorites);
            await _context.SaveChangesAsync();
            _logger.LogInformation("Избранное создано ({Count}).", favorites.Count);
        }

        // ─────────────────────────────────────────────────────────────
        // КОНТАКТЫ
        // ─────────────────────────────────────────────────────────────

        private async Task SeedContactsAsync(List<ApplicantProfile> applicants)
        {
            if (await _context.Contacts.AnyAsync()) return;
            if (applicants.Count < 2) return;

            var contacts = new List<Contact>();
            var usedPairs = new HashSet<(Guid, Guid)>();

            var statusWeights = new[]
            {
                (ContactStatus.Pending,  35),
                (ContactStatus.Accepted, 45),
                (ContactStatus.Rejected, 15),
                (ContactStatus.Blocked,   5),
            };

            var messages = new[]
            {
                "Привет! Видел твой профиль — хотел бы пообщаться насчёт стажировок в Яндексе, у тебя есть опыт?",
                "Здравствуй! Ты занимаешься ML? Хочу обсудить один проект, ищу команду.",
                "Привет, нашёл твой профиль через платформу. Интересно, как ты получил оффер от Сбера на последнем курсе?",
                "Добрый день! Хотел бы познакомиться — вижу, мы оба из Питера и оба в Backend. Можем поделиться опытом?",
                "Привет! Ты упоминал DevOps — у меня есть пара вопросов по Kubernetes, не против?",
                "Здравствуй! Нашёл тебя через тег QA. Хочу перейти в тестирование, посоветуешь с чего начать?",
                "Привет! Занимаюсь похожими вещами — Data Science. Может, вместе поучаствуем в хакатоне?",
                "Добрый день! Видел тебя на митапе по Go, хотел поговорить про открытые вакансии в вашей компании.",
                "Привет! Можешь порекомендовать меня на стажировку в 2ГИС? Вижу, ты там работал.",
                "Здравствуй! Ищу ментора по Rust — ты выглядишь опытным. Можем пообщаться?",
                "Привет! Мы учились в одном вузе, хотел узнать как у тебя дела с поиском работы.",
                "Добрый день, хочу поговорить про переход из Junior в Middle: сколько у тебя ушло времени?",
                "Привет! Есть вопрос по System Design — не против объяснить основы распределённых систем?",
            };

            int targetCount = _rng.Next(10, 16);
            int attempts = 0;

            while (contacts.Count < targetCount && attempts < 200)
            {
                attempts++;
                var sender = applicants[_rng.Next(applicants.Count)];
                var receiver = applicants[_rng.Next(applicants.Count)];

                if (sender.Id == receiver.Id) continue;

                var pair = (sender.Id, receiver.Id);
                var reversePair = (receiver.Id, sender.Id);
                if (usedPairs.Contains(pair) || usedPairs.Contains(reversePair)) continue;

                usedPairs.Add(pair);

                contacts.Add(new Contact
                {
                    SenderApplicantProfileId = sender.Id,
                    ReceiverApplicantProfileId = receiver.Id,
                    Message = messages[_rng.Next(messages.Length)],
                    Status = WeightedRandom(statusWeights),
                    CreatedAt = DateTime.UtcNow.AddDays(-_rng.Next(1, 60)),
                });
            }

            _context.Contacts.AddRange(contacts);
            await _context.SaveChangesAsync();
            _logger.LogInformation("Контакты созданы ({Count}).", contacts.Count);
        }

        // ─────────────────────────────────────────────────────────────
        // РЕКОМЕНДАЦИИ
        // ─────────────────────────────────────────────────────────────

        private async Task SeedRecommendationsAsync(
            List<ApplicantProfile> applicants,
            List<Opportunity> opportunities)
        {
            if (await _context.Recommendations.AnyAsync()) return;
            if (applicants.Count < 2 || !opportunities.Any()) return;

            var recommendations = new List<Recommendation>();
            var usedTriples = new HashSet<(Guid, Guid, Guid)>();

            var messages = new[]
            {
                "Отличный разработчик, умеет работать в команде и быстро вникает в задачи. Рекомендую на эту позицию!",
                "Работали вместе на хакатоне — очень ответственный и технически сильный кандидат.",
                "Знаю его/её лично: глубокие знания в SQL и Data Science, умеет объяснять сложное просто.",
                "Наблюдал(а) за его/её прогрессом — за полгода вырос(ла) до уверенного Junior. Рекомендую!",
                "Совместно участвовали в open-source проекте. Пишет чистый код и не боится задавать вопросы.",
                "Очень мотивированный кандидат, самостоятельно изучает DevOps и уже имеет практический опыт.",
                "Знаком с его/её проектами на GitHub — уровень выше среднего по рынку для студента 3 курса.",
                "Участвовали в одном учебном проекте. Берёт инициативу, предлагает нестандартные решения.",
                "Рекомендую как перспективного QA-специалиста — внимателен к деталям и методичен.",
                "Лично занимался(ась) менторством — готов к реальным задачам в продуктовой команде.",
                "Встречались на митапе по Go — эрудирован, задаёт правильные вопросы. Перспективный специалист.",
                "Давний знакомый по StudyProject: честный, обязательный, технически растёт быстро.",
            };

            var activeOpps = opportunities
                .Where(o => o.Status == OpportunityStatus.Active)
                .ToList();

            int targetCount = _rng.Next(8, 13);
            int attempts = 0;

            while (recommendations.Count < targetCount && attempts < 200)
            {
                attempts++;

                var recommender = applicants[_rng.Next(applicants.Count)];
                var recommended = applicants[_rng.Next(applicants.Count)];
                var opportunity = activeOpps[_rng.Next(activeOpps.Count)];

                if (recommender.Id == recommended.Id) continue;

                var triple = (recommender.Id, recommended.Id, opportunity.Id);
                if (usedTriples.Contains(triple)) continue;
                usedTriples.Add(triple);

                recommendations.Add(new Recommendation
                {
                    RecommenderApplicantProfileId = recommender.Id,
                    RecommendedApplicantProfileId = recommended.Id,
                    OpportunityId = opportunity.Id,
                    Message = messages[_rng.Next(messages.Length)],
                    CreatedAt = DateTime.UtcNow.AddDays(-_rng.Next(1, 45)),
                });
            }

            _context.Recommendations.AddRange(recommendations);
            await _context.SaveChangesAsync();
            _logger.LogInformation("Рекомендации созданы ({Count}).", recommendations.Count);
        }

        // ─────────────────────────────────────────────────────────────
        // ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ
        // ─────────────────────────────────────────────────────────────

        private static T WeightedRandom<T>(IEnumerable<(T item, int weight)> weights)
        {
            var list = weights.ToList();
            int total = list.Sum(x => x.weight);
            int roll = _rng.Next(total);
            int cumulative = 0;
            foreach (var (item, weight) in list)
            {
                cumulative += weight;
                if (roll < cumulative) return item;
            }
            return list.Last().item;
        }

        private static string PickMessage(string applicantName, string opportunityTitle)
        {
            var templates = new[]
            {
                $"Здравствуйте! Меня зовут {applicantName.Split(' ')[0]}, очень заинтересовала позиция «{opportunityTitle}». Готов(а) пройти техническое интервью в любое удобное время.",
                $"Добрый день! Хочу откликнуться на вакансию «{opportunityTitle}». Считаю, что мои навыки и опыт соответствуют требованиям.",
                $"Привет! Увидел(а) вакансию «{opportunityTitle}» и сразу захотел(а) откликнуться — это именно то, чем я хочу заниматься.",
                $"Здравствуйте! Я {applicantName.Split(' ')[0]}, студент(ка). Очень хочу попробовать свои силы на позиции «{opportunityTitle}».",
                $"Добрый день! Ваша компания давно в моём списке мест, где хочется работать. Отклик на «{opportunityTitle}» — первый шаг.",
            };
            return templates[_rng.Next(templates.Length)];
        }
    }
}