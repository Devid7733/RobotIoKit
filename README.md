# RobotIoKit

RobotIoKit is a full-stack robotics e-commerce platform for selling robotics components and robot kits. It includes a customer storefront, cart and checkout flow, account pages, admin management, analytics, media uploads, and a hybrid chatbot that combines deterministic catalog rules with a streaming SEA-LION AI tutor, bilingual in Khmer and English.

## Tech Stack

- Next.js App Router
- React 19
- PostgreSQL
- Prisma
- NextAuth credentials auth with JWT sessions
- Tailwind CSS
- Chart.js
- SEA-LION AI integration (`aisingapore/Qwen-SEA-LION-v4-32B-IT` via api.sea-lion.ai) for chatbot tutor and recommendation replies, streamed to the client
- `bakong-khqr` + `qrcode` for Bakong KHQR payment generation
- `nodemailer` for OTP and password-reset emails
- `@vercel/blob` for admin media uploads

## Features

- Storefront homepage with live database content
- Product catalog, product detail pages, category filtering, search, voltage filtering, and price filtering
- Robot kit listing with difficulty and price filters
- Guest and authenticated cart flows
- Checkout with pickup/delivery details and dynamic Bakong KHQR payment flow
- User registration, login, account profile, order history, and order detail pages
- Admin dashboard for products, robot kits, categories, orders, analytics, and media uploads
- Floating chatbot with deterministic catalog rules and live catalog matching as a baseline, plus an optional SEA-LION AI mode that adds:
  - Grounded product/kit recommendations from natural-language goals (e.g. project + budget)
  - General robotics and electronics Q&A ("tutor" answers, not just store questions)
  - Live robot news pulled from RSS feeds (IEEE Spectrum, The Robot Report, Robohub, ScienceDaily)
  - Order-status lookup in chat for signed-in users
  - Bilingual replies in Khmer or English based on the customer's message

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Create a `.env` file in the project root:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
DIRECT_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
NEXTAUTH_SECRET="replace-with-a-long-random-secret"
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"

# SEA-LION AI chatbot (optional — chatbot works with deterministic rules alone if unset)
CHATBOT_AI_ENABLED=false
SEA_LION_API_KEY="replace-with-sea-lion-api-key"
SEA_LION_MODEL="aisingapore/Qwen-SEA-LION-v4-32B-IT"
CHATBOT_NEWS_ENABLED=true
NEWS_CACHE_TTL_MINUTES=30

# Bakong KHQR payments
KHQR_MERCHANT_NAME="RobotIoKit"
KHQR_ACCOUNT_ID="merchant@bank"
KHQR_BANK_NAME="Your Bank"
KHQR_CITY="Phnom Penh"
KHQR_CURRENCY="USD"
KHQR_PAYMENT_EXPIRY_MINUTES="5"
BAKONG_API_BASE_URL="https://api-bakong.nbc.gov.kh"
BAKONG_API_KEY="replace-with-bakong-open-api-token"
BAKONG_MERCHANT_ID="replace-with-bakong-merchant-id"

# Optional merchant KHQR fields if Bakong/bank provides them
KHQR_MERCHANT_ID=""
KHQR_ACQUIRING_BANK=""
KHQR_MERCHANT_CATEGORY_CODE="5999"
KHQR_STORE_LABEL="RobotIoKit"
KHQR_TERMINAL_LABEL="WEB"

# Seed admin account (used by npm run prisma:seed)
SEED_ADMIN_EMAIL="admin@example.com"
SEED_ADMIN_PASSWORD="replace-with-a-strong-password"

# Email (OTP verification / password reset)
EMAIL_SERVER_USER="your-smtp-username"
EMAIL_SERVER_PASSWORD="your-smtp-password"
EMAIL_FROM="RobotIoKit <no-reply@example.com>"

# Vercel Blob storage (admin media uploads, account avatars)
BLOB_READ_WRITE_TOKEN="replace-with-vercel-blob-read-write-token"
```

`DATABASE_URL` and `NEXTAUTH_SECRET` are required for normal local development. KHQR generation requires the `KHQR_*` merchant values; automatic payment verification also requires `BAKONG_API_KEY`. `SEA_LION_API_KEY` (plus `CHATBOT_AI_ENABLED=true`) unlocks streamed AI tutor answers, robot news, and smarter recommendations — the chatbot still works with deterministic catalog rules alone if it's unset. `EMAIL_SERVER_*`/`EMAIL_FROM` are required for registration OTP and password-reset emails to send. `BLOB_READ_WRITE_TOKEN` is required for admin product/robot-kit media uploads and account avatar uploads (both use Vercel Blob storage) — Vercel injects this automatically when deployed on Vercel; for local development, pull it from your Vercel project's Storage settings (or run `vercel env pull`).

### 3. Set Up the Database

Run migrations, generate Prisma Client, and seed demo data:

```bash
npx prisma migrate deploy
npx prisma generate
npm run prisma:seed
```

(`npm install` already runs `prisma generate` once automatically via the `postinstall` hook — re-run `npx prisma generate` manually after pulling schema changes.)

For active schema development, use:

```bash
npm run prisma:migrate
```

Seeded product records reference image paths under `public/images/products/`. Add matching local images there if you want the seeded catalog to display real product photos.

### 4. Run the App

```bash
npm run dev
```

Open `http://localhost:3000`.

## Scripts

```bash
npm run dev              # Start the Next.js development server
npm run build            # Build the production app
npm run start            # Start the production server after building
npm run lint             # Run Next lint
npx prisma generate      # Generate Prisma Client (also runs automatically on npm install)
npm run prisma:migrate   # Create/apply a development migration
npm run prisma:seed      # Seed categories, products, robot kits, and sample data
```

## Project Structure

```text
src/app/              Next.js App Router pages and API routes
src/components/       Storefront, admin, layout, account, and chatbot UI
src/modules/          Domain modules with service/repository boundaries
src/repositories/     Shared repository helpers for existing modules
src/services/         Shared service helpers for existing flows
src/lib/              Low-level shared helpers and adapters
prisma/               Prisma schema, migrations, and seed script
docs/                 Project context, roadmap, and refactor status
public/               Static assets and uploaded media
```

## Architecture Direction

The codebase is being refactored incrementally toward this boundary:

```text
route -> service -> repository -> database
```

- Routes parse requests, check auth/session state, call services, and return responses.
- Services validate input, apply business rules, orchestrate repositories, and shape data for route/page consumers.
- Repositories own Prisma reads and writes.
- `src/lib` is reserved for shared helpers, constants, adapters, and low-level utilities.

The refactor is intentionally incremental. Preserve existing API contracts, frontend expectations, checkout behavior, cart behavior, and admin workflows when making changes.

## Important Development Notes

- Use small, bounded changes instead of broad rewrites.
- Read `AGENTS.md`, `docs/project-context.md`, and `docs/refactor-status.md` before architecture work.
- Update `docs/refactor-status.md` after each completed refactor or feature task.
- Run `npm run build` after code changes when possible.
- If `npx prisma generate` fails on Windows with an `EPERM` error, close processes that may be locking Prisma's native engine file and run it again.

## Chatbot AI Mode

The chatbot works without AI: deterministic catalog rules, FAQ matching, and Khmer/English synonym detection (`src/modules/chatbot/`) handle store questions, product search, and recommendations on their own.

Setting `CHATBOT_AI_ENABLED=true` plus a valid `SEA_LION_API_KEY` (no local model install required) layers a streaming AI tutor on top, grounded in the live catalog data the deterministic layer already resolved:

- **General robotics/electronics Q&A** — answers any robotics or technology question, not just store-specific ones.
- **Live robot news** — fetches and summarizes recent headlines from 4 RSS feeds (IEEE Spectrum, The Robot Report, Robohub, ScienceDaily), cached for `NEWS_CACHE_TTL_MINUTES` (default 30) and toggled independently via `CHATBOT_NEWS_ENABLED`.
- **Natural-language recommendations** — understands goals and budgets (e.g. "something for my school project to follow a line, under $30") and grounds the reply in real in-stock catalog items.
- **Order-status lookup** — signed-in users can ask "track my order" and get their real order number, status, and total pulled server-side from their own orders.
- **Bilingual replies** — responses are generated in Khmer or English based on the detected language of the customer's message, with technical/model names (Arduino, ESP32, etc.) kept in English either way.

The AI reply always falls back to the deterministic reply if the SEA-LION API is unavailable or disabled, so `/api/chatbot` never hard-fails on AI outages.

`POST /api/chatbot` streams newline-delimited JSON events: a `meta` event first (matched catalog items, follow-up prompts, detected language, news items), then one or more `text` events (response deltas), then a final `done` event (optionally with a cleaned full-text version), or an `error` event if something failed.
