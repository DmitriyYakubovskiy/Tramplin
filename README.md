# Трамплин

**Трамплин** — веб-платформа для поиска карьерных возможностей, стажировок и вакансий.

Сервис объединяет соискателей и работодателей: пользователи могут создавать профили, публиковать карьерные возможности, отправлять отклики, сохранять интересные предложения и получать персональные рекомендации.

## Возможности

### Для соискателей

- регистрация и авторизация;
- заполнение профиля соискателя;
- просмотр вакансий, стажировок и других возможностей;
- фильтрация предложений;
- добавление возможностей в избранное;
- отправка откликов;
- просмотр статусов отправленных заявок;
- получение персональных рекомендаций;
- просмотр контактной информации работодателей.

### Для работодателей

- регистрация организации;
- заполнение профиля работодателя;
- создание и редактирование карьерных возможностей;
- управление опубликованными предложениями;
- просмотр откликов соискателей;
- изменение статусов заявок;
- работа с контактными данными.

### Для модераторов и кураторов

- модерация опубликованных возможностей;
- управление справочниками и тегами;
- просмотр пользователей и организаций;
- контроль содержимого платформы.

## Система рекомендаций

В проекте реализована система персональных рекомендаций вакансий для соискателей.

Рекомендации формируются с помощью контентно-поведенческого скоринга. Алгоритм учитывает:

- данные профиля соискателя;
- профессиональные интересы;
- теги и категории;
- параметры карьерных возможностей;
- действия пользователя;
- ранее просмотренные и сохранённые предложения.

Система сначала отбирает подходящие предложения, а затем рассчитывает итоговый рейтинг каждого варианта.

## Технологии

### Backend

- .NET 8
- ASP.NET Core Web API
- Entity Framework Core
- ASP.NET Core Identity
- JWT Bearer Authentication
- PostgreSQL
- Npgsql
- Swagger / OpenAPI

### Frontend

- React 19
- TypeScript
- Vite
- Material UI
- Emotion
- React Router
- React Hook Form
- Axios
- jwt-decode

### Дополнительно

- Yandex Maps API
- ESLint
- REST API
- ролевая модель доступа

## Архитектура проекта

```text
Tramplin/
├── Client/                 # React-приложение
│   ├── public/             # Статические файлы
│   ├── src/                # Исходный код frontend
│   ├── .env.example        # Пример переменных окружения
│   ├── package.json        # Зависимости и npm-команды
│   └── vite.config.ts      # Конфигурация Vite
│
├── Controllers/            # REST API контроллеры
│   ├── AuthController.cs
│   ├── ApplicantProfileController.cs
│   ├── EmployerProfileController.cs
│   ├── OpportunityController.cs
│   ├── ApplicationController.cs
│   ├── FavoritesController.cs
│   ├── RecommendationsController.cs
│   ├── ModerationController.cs
│   ├── CuratorsController.cs
│   ├── ContactsController.cs
│   └── PlatformTagsController.cs
│
├── DataAccess/
│   ├── Context/            # Контекст Entity Framework Core
│   ├── Dtos/               # Объекты передачи данных
│   ├── Migrations/         # Миграции базы данных
│   └── Models/             # Модели предметной области
│
├── Services/
│   ├── JwtService.cs
│   ├── RecommendationService.cs
│   └── DatabaseSeederService.cs
│
├── Pages/                  # Razor Pages
├── Properties/             # Настройки запуска
├── Program.cs              # Конфигурация приложения
├── appsettings.json        # Конфигурация backend
└── hhru.csproj             # Файл проекта .NET
```

## Требования

Перед запуском необходимо установить:

- [.NET SDK 8](https://dotnet.microsoft.com/download/dotnet/8.0);
- [Node.js](https://nodejs.org/) версии 20 или новее;
- npm;
- [PostgreSQL](https://www.postgresql.org/);
- Git.

Проверить установленные версии:

```bash
dotnet --version
node --version
npm --version
psql --version
```

## Установка

### 1. Клонирование репозитория

```bash
git clone https://github.com/DmitriyYakubovskiy/Tramplin.git
cd Tramplin
```

### 2. Создание базы данных

Создайте пользователя и базу данных PostgreSQL:

```sql
CREATE USER tramplin_user WITH PASSWORD 'change_this_password';
CREATE DATABASE tramplin_db OWNER tramplin_user;
```

Параметры можно изменить в соответствии с локальной конфигурацией PostgreSQL.

### 3. Настройка backend

Не рекомендуется хранить рабочие пароли и JWT-ключи непосредственно в `appsettings.json`.

Создайте файл `appsettings.Development.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=tramplin_db;Username=tramplin_user;Password=change_this_password"
  },
  "Jwt": {
    "Key": "replace_with_a_long_random_secret_key",
    "Issuer": "TramplinApi",
    "Audience": "TramplinClient"
  }
}
```

Для генерации JWT-ключа можно использовать PowerShell:

```powershell
[Convert]::ToBase64String((1..64 | ForEach-Object { Get-Random -Maximum 256 }))
```

Или OpenSSL:

```bash
openssl rand -base64 64
```

### 4. Установка зависимостей backend

Из корневой директории проекта:

```bash
dotnet restore
```

### 5. Применение миграций

```bash
dotnet ef database update
```

Когда команда `dotnet ef` недоступна:

```bash
dotnet tool install --global dotnet-ef
dotnet ef database update
```

### 6. Настройка frontend

Перейдите в директорию клиента:

```bash
cd Client
```

Создайте `.env` на основе примера:

```bash
cp .env.example .env
```

В Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Содержимое `.env`:

```env
VITE_YANDEX_MAPS_API_KEY=your_yandex_maps_api_key
VITE_YANDEX_MAPS_LANG=ru_RU
```

Для работы компонентов карты необходимо получить API-ключ в кабинете разработчика Яндекс.

### 7. Установка зависимостей frontend

```bash
npm install
```

## Запуск проекта

Backend и frontend запускаются в отдельных терминалах.

### Backend

Из корневой директории:

```bash
dotnet run
```

Для запуска с автоматической перезагрузкой:

```bash
dotnet watch run
```

После запуска адрес backend будет показан в консоли. Обычно приложение доступно по одному из адресов:

```text
http://localhost:5000
https://localhost:7000
```

Точный порт определяется файлом `Properties/launchSettings.json`.

Swagger обычно доступен по адресу:

```text
https://localhost:<порт>/swagger
```

### Frontend

Из директории `Client`:

```bash
npm run dev
```

Vite обычно запускает приложение по адресу:

```text
http://localhost:5173
```

## Сборка

### Сборка backend

```bash
dotnet build
```

Публикация release-версии:

```bash
dotnet publish -c Release -o ./publish
```

### Сборка frontend

```bash
cd Client
npm run build
```

Готовые файлы будут размещены в директории:

```text
Client/dist
```

Локальный просмотр production-сборки:

```bash
npm run preview
```

## Проверка кода frontend

Запуск ESLint:

```bash
cd Client
npm run lint
```

## Аутентификация и роли

Для авторизации используется JWT Bearer Token.

После успешного входа клиент получает токен и передаёт его в защищённые API-запросы:

```http
Authorization: Bearer <jwt-token>
```

Основные роли платформы:

- `Applicant` — соискатель;
- `Employer` — работодатель;
- роли администрирования и модерации.

Защищённые endpoints можно тестировать через Swagger, используя кнопку **Authorize**.

## Основные API-модули

| Модуль | Назначение |
|---|---|
| `Auth` | Регистрация и авторизация |
| `ApplicantProfile` | Профили соискателей |
| `EmployerProfile` | Профили работодателей |
| `Opportunity` | Вакансии, стажировки и возможности |
| `Application` | Отклики и заявки |
| `Favorites` | Избранные предложения |
| `Recommendations` | Персональные рекомендации |
| `Contacts` | Контактная информация |
| `Moderation` | Модерация контента |
| `Curators` | Управление кураторами |
| `PlatformTags` | Справочники и теги платформы |

## Конфигурация CORS

В режиме разработки backend принимает запросы с локальных адресов:

- `localhost`;
- `127.0.0.1`;
- HTTP и HTTPS.

При развёртывании необходимо ограничить CORS конкретным доменом frontend-приложения.

Пример:

```csharp
policy
    .WithOrigins("https://tramplin.example.ru")
    .AllowAnyMethod()
    .AllowAnyHeader()
    .AllowCredentials();
```

## Безопасность

Перед публикацией проекта рекомендуется:

- заменить стандартный JWT-ключ;
- удалить реальные пароли из Git-репозитория;
- хранить секреты в переменных окружения или Secret Manager;
- ограничить CORS рабочим доменом;
- использовать HTTPS;
- настроить сложные требования к паролям;
- отключить Swagger в production или ограничить к нему доступ;
- создать отдельного пользователя PostgreSQL с минимальными правами;
- настроить резервное копирование базы данных.

Настройка локальных секретов .NET:

```bash
dotnet user-secrets init
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Host=localhost;Port=5432;Database=tramplin_db;Username=tramplin_user;Password=change_this_password"
dotnet user-secrets set "Jwt:Key" "replace_with_a_long_random_secret_key"
```

## Возможные проблемы

### Не удаётся подключиться к PostgreSQL

Проверьте:

- запущена ли служба PostgreSQL;
- существует ли база `tramplin_db`;
- правильно ли указаны логин и пароль;
- используется ли правильный порт;
- разрешены ли локальные подключения.

### Команда `dotnet ef` не найдена

```bash
dotnet tool install --global dotnet-ef
```

После установки перезапустите терминал.

### Ошибка CORS

Убедитесь, что frontend работает на `localhost` или `127.0.0.1`. Для другого домена добавьте его в CORS-политику backend.

### Не отображается карта

Проверьте значение:

```env
VITE_YANDEX_MAPS_API_KEY
```

После изменения `.env` перезапустите Vite:

```bash
npm run dev
```

### API возвращает `401 Unauthorized`

Проверьте:

- передаётся ли JWT;
- используется ли префикс `Bearer`;
- не истёк ли срок действия токена;
- совпадают ли `Issuer`, `Audience` и ключ JWT;
- имеет ли пользователь необходимую роль.

## Разработка

Рекомендуемый порядок работы:

1. Создать отдельную ветку:

```bash
git checkout -b feature/feature-name
```

2. Внести изменения.

3. Проверить backend:

```bash
dotnet build
```

4. Проверить frontend:

```bash
cd Client
npm run lint
npm run build
```

5. Создать commit:

```bash
git add .
git commit -m "Добавлена новая возможность"
```

## Планы развития

- расширение системы рекомендаций;
- уведомления о новых возможностях;
- история взаимодействий соискателя;
- расширенный поиск и фильтрация;
- загрузка резюме и документов;
- аналитика для работодателей;
- автоматическое тестирование;
- Docker-конфигурация;
- CI/CD через GitHub Actions;
- развёртывание frontend и backend;
- административная панель.

## Лицензия

Проект распространяется по лицензии [MIT](LICENSE).

Разрешается использовать, копировать, изменять и распространять программное обеспечение при сохранении текста лицензии.

## Автор

**Dmitriy Yakubovskiy**

GitHub: [DmitriyYakubovskiy](https://github.com/DmitriyYakubovskiy)
