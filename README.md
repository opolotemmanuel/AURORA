# Aura

Web-based AI skin intelligence for Aurora Organics. Users scan their face, receive a cosmetic skin assessment, and get personalized product recommendations — plus a downloadable PDF report and a scan history in the dashboard.

Built with Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, shadcn/ui, PostgreSQL (Neon) + Prisma 7, and better-auth.

> **Not a medical tool.** All output is cosmetic and wellness guidance only.

## Prerequisites

- [Node.js](https://nodejs.org/) 20 or later
- npm (included with Node.js)
- A [Neon](https://neon.tech/) PostgreSQL database (or compatible Postgres)
- [Docker](https://www.docker.com/) (optional, for containerized runs)

## Getting started (local)

1. Clone the repository and enter the project directory.

2. Install dependencies:

   ```bash
   npm install
   ```

3. Copy environment variables and fill in required values:

   ```bash
   cp .env.example .env
   ```

   At minimum you need `DATABASE_URL`, `BETTER_AUTH_SECRET`, and `BETTER_AUTH_URL`. See [Environment variables](#environment-variables) below.

4. Run database migrations:

   ```bash
   npm run db:migrate
   ```

5. (Optional) Seed an admin user and product catalog:

   ```bash
   npm run db:seed-admin
   npm run db:seed-products
   ```

6. Start the development server:

   ```bash
   npm run dev
   ```

7. Open [http://localhost:3000](http://localhost:3000).

The first `dev` or `build` run generates Next.js type files under `.next/`. If TypeScript reports missing `.next/dev/types` files, run `npm run build` or `npm run dev` again.

## Scan flow (`/scan`)

The scan wizard runs entirely in the browser until results are saved:

| Step | What happens |
| ---- | ------------ |
| **Capture** | Upload a photo or use the live camera (camera permission is requested **only** when the Camera tab is active) |
| **Crop** | Adjust framing with the image editor |
| **Quality** | On-device MediaPipe face + lighting checks |
| **Analyze** | Mock AI assessment today (real adapter planned); photo stays visible with a loading overlay |
| **Results** | Two-column layout on desktop — photo left, assessment right |

**Privacy:** Photos stay in browser memory for the session and are **not** stored in the database (`imageRetained: false`). Only the assessment text, recommendations, and report metadata are persisted.

**Reports:**

- **View report** opens a modal with the same layout as the results screen
- **Download PDF** generates a server-side PDF via `@react-pdf/renderer` (`GET /api/reports/[scanId]/pdf`)
- Past scans are listed at `/reports` (text-only in the modal — no photo for historical reports)

**Desktop camera:** The embedded preview height is draggable (grip below the view); double-click the grip to reset. Preference is saved in `localStorage`.

## Scripts

| Command | Description |
| ------- | ----------- |
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Generate Prisma client and create a production build |
| `npm run start` | Serve the production build locally |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript without emitting |
| `npm run format` | Format TypeScript files with Prettier |
| `npm run db:migrate` | Apply Prisma migrations (`prisma migrate dev`) |
| `npm run db:generate` | Regenerate Prisma client |
| `npm run db:seed-admin` | Bootstrap admin user from `BOOTSTRAP_ADMIN_EMAIL` |
| `npm run db:seed-products` | Seed Aurora product catalog |

## Docker

Build and run the app in a container (production mode):

```bash
docker build -t aura .
docker run --rm -p 3000:3000 --env-file .env aura
```

Then open [http://localhost:3000](http://localhost:3000).

The image uses Next.js [standalone output](https://nextjs.org/docs/app/api-reference/config/next-config-js/output) for a minimal production bundle.

## Project structure

```
app/
  (marketing)/     # Landing page — top navbar
  (scan)/          # Scan wizard — /scan
  (auth)/          # Login and OTP verification
  (onboarding)/    # Onboarding steps — no nav/sidebar
  (dashboard)/     # User dashboard, reports, admin — sidebar
  api/             # API routes (auth, report PDF, etc.)
components/
  scan/            # Scan wizard UI, report layout, modal
  layouts/         # Route-group shells
  ui/              # shadcn primitives
lib/
  scan/            # Quality gate, mock analysis, persist actions
  pdf/             # React-PDF report document
  auth/            # better-auth config and session helpers
  db/              # Prisma client
prisma/
  schema.prisma    # Users, scans, results, reports, tokens, products
```

See [AGENTS.md](AGENTS.md) for full conventions and stack details.

## Adding shadcn components

```bash
npx shadcn@latest add button
```

Components are added to `components/ui/`. Import them in your app:

```tsx
import { Button } from "@/components/ui/button"
```

## Environment variables

Copy `.env.example` to `.env` for local development.

| Variable | Required | Description |
| -------- | -------- | ----------- |
| `DATABASE_URL` | Yes | Neon pooled PostgreSQL URL; use `sslmode=verify-full` |
| `BETTER_AUTH_SECRET` | Yes | Secret for better-auth sessions |
| `BETTER_AUTH_URL` | Yes | App URL, e.g. `http://localhost:3000` |
| `RESEND_API_KEY` | For email OTP | Resend API key |
| `EMAIL_FROM` | For email OTP | Sender address for transactional mail |
| `SIGNUP_TOKEN_BONUS` | No | Tokens granted on signup (default `10000`) |
| `SCAN_TOKEN_COST` | No | Tokens debited per saved scan (default `1000`) |
| `BOOTSTRAP_ADMIN_EMAIL` | No | Email promoted to admin by `db:seed-admin` |
| `GEMINI_API_KEY` | Planned | Google AI Studio key for real skin analysis |

Server-only secrets must not be exposed to the client. See [AGENTS.md](AGENTS.md).

## Planned next

- Real AI adapter (`lib/ai/adapter.ts`) replacing mock analysis
- Object storage (R2) for PDF `storageKey` and optional image retention
- Product recommendations loaded from the database catalog
