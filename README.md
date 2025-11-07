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

For quick local testing you can use the built-in demo credentials. Either set the environment variables below (and expose any `NEXT_PUBLIC_` variants if you want the buttons to display custom values) or rely on the defaults.

| Persona          | Email                      | Password       | Env overrides                                                  |
|------------------|----------------------------|----------------|----------------------------------------------------------------|
| Practice owner   | `demo@fullstride.local`    | `demo-login`   | `DEV_LOGIN_EMAIL`, `DEV_LOGIN_PASSWORD`                        |
| Client portal    | `client@fullstride.local`  | `client-login` | `DEV_CLIENT_EMAIL`, `DEV_CLIENT_PASSWORD`, `NEXT_PUBLIC_*`     |

- The **“Continue with local demo”** button on the staff sign-in page logs you in as the owner and seeds a demo practice if needed.
- The **“Use demo client”** button on the client portal sign-in screen logs you straight into the portal with a sample client account, creating one if it does not exist.


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
