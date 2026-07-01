# RobotIoKit

RobotIoKit is a full-stack robotics e-commerce platform for selling robotics components and robot kits. It includes a customer storefront, cart and checkout flow, account pages, admin management, analytics, media uploads, and a rule-based chatbot with optional local AI reply rewriting.

## Tech Stack

- Next.js App Router
- React 19
- PostgreSQL
- Prisma
- NextAuth credentials auth with JWT sessions
- Tailwind CSS
- Chart.js
- Optional Ollama integration for grounded chatbot reply rewriting

## Features

- Storefront homepage with live database content
- Product catalog, product detail pages, category filtering, search, voltage filtering, and price filtering
- Robot kit listing with difficulty and price filters
- Guest and authenticated cart flows
- Checkout with pickup/delivery details and dynamic Bakong KHQR payment flow
- User registration, login, account profile, order history, and order detail pages
- Admin dashboard for products, robot kits, categories, orders, analytics, and media uploads
- Floating chatbot with deterministic store rules, live catalog matching, and optional local AI rewrite support

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Create a `.env` file in the project root:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
NEXTAUTH_SECRET="replace-with-a-long-random-secret"
NEXTAUTH_URL="http://localhost:3000"

# Optional chatbot AI rewriting with local Ollama
CHATBOT_AI_ENABLED=false
OLLAMA_URL="http://localhost:11434"
OLLAMA_MODEL="llama3.1"

# Bakong KHQR payments
KHQR_MERCHANT_NAME="RobotIoKit"
KHQR_ACCOUNT_ID="merchant@bank"
KHQR_BANK_NAME="Your Bank"
KHQR_CITY="Phnom Penh"
KHQR_CURRENCY="USD"
KHQR_PAYMENT_EXPIRY_MINUTES="5"
BAKONG_API_BASE_URL="https://api-bakong.nbc.gov.kh"
BAKONG_API_TOKEN="replace-with-bakong-open-api-token"

# Optional merchant KHQR fields if Bakong/bank provides them
KHQR_MERCHANT_ID=""
KHQR_ACQUIRING_BANK=""
KHQR_MERCHANT_CATEGORY_CODE="5999"
KHQR_STORE_LABEL="RobotIoKit"
KHQR_TERMINAL_LABEL="WEB"
```

`DATABASE_URL` and `NEXTAUTH_SECRET` are required for normal local development. KHQR generation requires the `KHQR_*` merchant values; automatic payment verification also requires `BAKONG_API_TOKEN`. The Ollama variables are only needed if you want chatbot replies rewritten by a local model after the deterministic store logic has already produced a grounded answer.

### 3. Set Up the Database

Run migrations, generate Prisma Client, and seed demo data:

```bash
npx prisma migrate deploy
npm run prisma:generate
npm run prisma:seed
```

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
npm run prisma:generate  # Generate Prisma Client
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
- If `npm run prisma:generate` fails on Windows with an `EPERM` error, close processes that may be locking Prisma's native engine file and run it again.

## Chatbot AI Mode

The chatbot works without AI by using deterministic store rules and live catalog data. To enable optional local rewrite mode:

1. Install and run Ollama locally.
2. Pull the model configured in `OLLAMA_MODEL`.
3. Set `CHATBOT_AI_ENABLED=true`.
4. Restart the Next.js dev server.

AI rewriting is server-side only and should stay grounded in the deterministic chatbot reply and live catalog summary.
