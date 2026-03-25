# CBC Platform — Backend API

Multi-tenant SaaS school management system for Kenyan schools supporting CBC and 8-4-4 curricula.

---

## Tech Stack

- Node.js + Express.js + TypeScript
- MySQL + Prisma ORM
- JWT authentication (access + refresh tokens)
- Winston logging
- Nodemailer + Handlebars email templates
- Africa's Talking SMS
- Puppeteer PDF generation
- Joi validation
- Multer file uploads
- PM2 process management

---

## First Time Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
Copy and fill in your values:
```bash
cp .env.example .env
```

Required `.env` values:
```
DATABASE_URL=mysql://root:yourpassword@localhost:3306/cbc_platform
JWT_SECRET=your_secret
JWT_REFRESH_SECRET=your_refresh_secret
SEED_ADMIN_EMAIL=admin@cbcplatform.co.ke
SEED_ADMIN_PASSWORD=ChangeMe@2024!
```

### 3. Run database migrations (creates all tables)
```bash
npm run db:migrate
```
> On first run it will prompt you for a migration name — enter: `init`

### 4. Generate Prisma client
```bash
npm run db:generate
```
> Run this every time you change `prisma/schema.prisma`

### 5. Seed permissions and system admin
```bash
npm run seed
```
> Creates all Permission rows, RolePermission mappings, and the SYSTEM_ADMIN user
> defined in your `.env` (`SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`).
> Safe to run multiple times — fully idempotent.

### 6. Start development server
```bash
npm run dev
```

---

## Adding a New Permission (Future)

1. Add the key to `Permission` enum in `src/config/constants.ts`
2. Add a description in `PERMISSION_DESCRIPTIONS` in `scripts/seed.ts`
3. Add it to the relevant role(s) in `DEFAULT_ROLE_PERMISSIONS` in `src/config/constants.ts`
4. Run: `npm run seed`

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm run start` | Run compiled production build |
| `npm run seed` | Seed permissions + system admin |
| `npm run db:migrate` | Create + apply new migration (dev) |
| `npm run db:migrate:prod` | Apply existing migrations (production) |
| `npm run db:generate` | Regenerate Prisma client after schema change |
| `npm run db:studio` | Open Prisma Studio (database GUI) |
| `npm run db:reset` | Wipe all tables and reapply migrations (dev only) |
| `npm run pm2:start` | Start with PM2 |
| `npm run pm2:stop` | Stop PM2 process |
| `npm run pm2:restart` | Restart PM2 process |
| `npm run pm2:logs` | View PM2 logs |

---

## Schema Changes Workflow

```bash
# 1. Edit prisma/schema.prisma
# 2. Create and apply migration
npm run db:migrate

# 3. Regenerate Prisma client types
npm run db:generate

# 4. Restart server
npm run dev
```

---

## API Base URL

```
http://localhost:5000/api/v1
```

## Key Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/register` | Register system admin |
| POST | `/auth/login` | Login |
| POST | `/auth/refresh` | Refresh access token |
| POST | `/auth/logout` | Logout |
| POST | `/auth/forgot-password` | Request password reset |
| POST | `/auth/reset-password` | Reset password |
| GET | `/schools` | List all schools |
| POST | `/schools` | Create school |
| POST | `/schools/:schoolId/members` | Assign user role in school |
| POST | `/users` | Create user + assign role + school |
| GET | `/students` | List students |
| POST | `/pathways` | Create CBC pathway |
| POST | `/pathways/:id/enroll` | Enroll student in pathway |
| POST | `/exams/marks` | Enter student marks |
| POST | `/fees/payments` | Record fee payment |
| GET | `/reports/report-card` | Generate PDF report card |
| GET | `/health` | Health check |

---

## Architecture

```
Request → Controller → Service → Repository → Prisma → MySQL
```

- **Controllers** — HTTP only, no business logic
- **Services** — all business logic
- **Repositories** — all Prisma queries

---

## Roles & Permissions

| Role | Scope |
|---|---|
| `SYSTEM_ADMIN` | Global — full access to everything |
| `HEAD_TEACHER` | School-scoped — manages school operations |
| `TEACHER` | School-scoped — enters marks, views students |
| `FINANCE_OFFICER` | School-scoped — manages fees and payments |
| `PARENT` | School-scoped — views own child's data |

Permissions are stored in the database and linked to roles via `RolePermission` table.
SYSTEM_ADMIN bypasses all permission checks.
