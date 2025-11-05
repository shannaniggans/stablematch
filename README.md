# FullStride

FullStride is an MVP web application for equine practices to manage scheduling, clients, services, and invoicing. It is built with Next.js, Prisma, and TailwindCSS, and includes authentication with NextAuth and a Stripe-ready payment stub.

## Stack
- Frontend: Next.js 14, React, TypeScript, TailwindCSS, shadcn/ui
- Backend: Next.js API routes with Zod validation
- Database: SQLite via Prisma
- Auth: NextAuth (email magic link + Google OAuth)
- Payments: Stripe checkout stub with local PDF invoice generation
- Testing: Vitest (unit) and Playwright (smoke)

## Getting Started
1. Run npm install
2. Run npx prisma generate
3. Run npx prisma migrate dev
4. Run npx prisma db seed to load demo data
5. Start the app with npm run dev

Configure a .env file with DATABASE_URL and AUTH_SECRET. SMTP and Google OAuth credentials are optional; without them email and Google sign-in fall back to console logging in development.

### Local demo login

For quick local testing you can use the built-in demo credentials. Either set `DEV_LOGIN_EMAIL` and `DEV_LOGIN_PASSWORD` (plus the matching `NEXT_PUBLIC_` variants for the client button) or use the defaults:

- Email: `demo@fullstride.local`
- Password: `demo-login`

The “Continue with local demo” button on the sign-in page will log you in immediately using those credentials and create a demo practice if one doesn’t exist yet.

## Scripts
- npm run dev — start the development server
- npm run build — create a production build
- npm run lint — run ESLint
- npm run test — run Vitest
- npm run test:e2e — run Playwright smoke tests
- npm run format — check formatting
- npm run format:fix — apply Prettier

## Project Structure
- app/(auth) — public auth routes
- app/(app) — authenticated experience (dashboard, calendar, clients, appointments, invoices, settings)
- app/api — REST endpoints with multi-tenant guards and Zod validation
- components/ui — shared shadcn primitives
- components/clients, components/invoices, components/settings — feature-specific UI
- lib — Prisma client, auth helpers, validation schemas, PDF/Stripe utilities
- tests, e2e — Vitest and Playwright suites

## Notes
- Middleware injects x-practice-id and x-user-id headers for authenticated API calls.
- Stripe integration is stubbed when STRIPE_SECRET_KEY is missing and still returns a fake redirect URL.
- Invoice PDFs are streamed from /api/invoices/[id]/pdf using @react-pdf/renderer.
