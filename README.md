You are generating the MVP for a SaaS web app called “StableMatch” for equine professionals (vets, farriers, physios, trainers). Build a production-ready starter with the following spec.

# 0. Tech Stack
- Frontend: Next.js (App Router) + TypeScript + TailwindCSS + shadcn/ui
- Backend: Next.js API routes (REST) + Zod validation
- Database: SQLite + Prisma ORM
- Auth: NextAuth (Email link + Google OAuth)
- Payments: Stripe (stub only in MVP; invoice PDFs generated locally)
- Testing: Vitest + Playwright (smoke tests)
- Tooling: ESLint, Prettier, Husky (pre-commit format & test)
- Timezone: Default Australia/Sydney (AET), ISO storage in DB

# 1. Core MVP Features (v1, 2–3 weeks)
1) Bookings & Scheduling  
   - Create/edit/cancel appointments  
   - Day/Week calendar view (prevent double-booking)  
   - Appointment statuses: scheduled | confirmed | completed | cancelled  
   - Practitioner availability blocks (recurring weekly + exceptions)  

2) Clients & Notes  
   - CRUD clients (person + horse(s))  
   - Secure practitioner notes per appointment (private by default)  
   - File attachments (local fs for MVP; later S3-compatible)  

3) Services & Invoicing  
   - CRUD services (name, duration, price incl/ex GST)  
   - Generate invoices from appointment(s)  
   - Invoice statuses: draft | sent | paid | void  
   - Export invoice as PDF (simple template)  

4) Org & Access  
   - Multi-tenant: each user belongs to a Practice (org)  
   - Roles: owner, practitioner, receptionist, read_only  
   - Row-level access scoped by practiceId  
   - Audit log for create/update/delete of key entities  

# 2. Data Model
All data stored in SQLite (file: ./dev.db).  
Monetary values stored as integer cents.  
Dates stored as ISO8601 UTC strings.

Entities:
- Practice(id, name, timezone="Australia/Sydney", createdAt)
- User(id, name, email, role: enum[owner, practitioner, receptionist, read_only], practiceId -> Practice)
- Client(id, practiceId, firstName, lastName, email?, phone?, address?, notes?)
- Horse(id, clientId -> Client, name, breed?, age?, notes?)
- Service(id, practiceId, name, durationMins, priceCents, taxRate=0.1, isActive=true)
- Availability(id, practitionerId -> User, weekday(0–6), startTime, endTime, effectiveFrom?, effectiveTo?)
- Appointment(id, practiceId, practitionerId -> User, clientId -> Client, horseId?, serviceId -> Service, start, end, status enum, locationText?)
- Note(id, appointmentId -> Appointment, authorId -> User, body, isPrivate=true, createdAt)
- Invoice(id, practiceId, number, clientId -> Client, issuedAt, dueAt, status enum, subtotalCents, taxCents, totalCents)
- InvoiceItem(id, invoiceId -> Invoice, description, qty, unitPriceCents, taxRate)
- Payment(id, invoiceId -> Invoice, amountCents, method, paidAt, stripePaymentIntentId?)
- AuditLog(id, practiceId, userId, entityType, entityId, action, diffJSON, createdAt)

# 3. API Routes
Base path: /api  

Implement standard CRUD routes for:  
- Clients & Horses  
- Services  
- Availability  
- Appointments & Notes  
- Invoices & InvoiceItems  
Include Zod validation and tenancy guards per practiceId.

# 4. UI Pages (App Router)
- /signin  
- /dashboard  
- /calendar  
- /clients  
- /clients/[id]  
- /appointments/[id]  
- /invoices  
- /invoices/[id]  
- /settings  

# 5. File/Folder Structure
- /app  
  - /(auth)/signin/page.tsx  
  - /dashboard/page.tsx  
  - /calendar/page.tsx  
  - /clients/...  
  - /appointments/...  
  - /invoices/...  
  - /settings/...  
  - /api/...  
- /components  
- /lib  
- /styles  
- /prisma (schema.prisma, seed.ts)  
- /tests  
- /scripts  

# 6. Commands to Scaffold
npx create-next-app@latest stablematch --ts --eslint --tailwind --src-dir --app  
cd stablematch  
npm i @prisma/client prisma zod next-auth @auth/prisma-adapter luxon @react-pdf/renderer  
npx prisma init  

Edit .env:  
DATABASE_URL="file:./dev.db"  

Then:  
npx prisma migrate dev --name init  
npm run dev  

# 7. SQLite Optimisation
- Enable WAL mode on start:
  ```sql
  PRAGMA journal_mode = WAL;
  PRAGMA synchronous = NORMAL;

    Query-based overlap checking for appointments (SQLite lacks exclusion constraints).

    PracticeId indexes across key tables.

8. Acceptance Criteria

A signed-in user can:

    Create a client + horse

    Define practitioner availability

    Create an appointment (no double-booking)

    Add a private note

    Generate a draft invoice + PDF

All data scoped to user’s practice.
Direct URL guessing must not reveal other tenants’ data.
9. MVP Stretch Goals

    ICS export for practitioner calendar

    Email reminders (stub)

    Stripe checkout link

    CSV import (clients)

    Basic audit log viewer
