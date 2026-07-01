# RobotIoKit Project Context

## What This Project Is
RobotIoKit is a full-stack robotics e-commerce platform.

It is not just a storefront. It includes:
- customer shopping flow
- cart and checkout
- authenticated user account
- order history
- admin management
- analytics
- chatbot assistance

The system should feel like a real product, not a demo-only CRUD app.

---

## Tech Stack
- Next.js App Router
- JavaScript-first codebase
- TypeScript where already used
- PostgreSQL
- Prisma
- NextAuth credentials + JWT

The repository primarily uses `.js` files. Refactors should follow the existing file style unless a change is clearly justified.

---

## Functional Areas

### Storefront
Current user-facing shopping experience includes:
- homepage with live DB data
- product catalog
- category filtering
- product detail pages
- robot kit listing
- cart
- checkout
- pickup/delivery logic
- KHQR placeholder payment flow

### User Account
Current account features include:
- login/register
- profile
- order history
- order detail

### Admin
Current admin features include:
- dashboard overview
- product management
- robot kit management
- category management
- order management
- media upload
- analytics dashboard

### Chatbot
Current chatbot features include:
- floating UI
- rule-based responses
- product keyword matching
- FAQ answers

Planned upgrade:
- smarter intent handling
- recommendation-aware responses
- optional LLM integration
- still grounded in rules and app data

---

## Current Engineering Goal

The main product, cart, and order architecture cleanup is mostly complete.

The current focus is final product intelligence and customer experience:

1. Recommendation system
2. Smarter chatbot grounded in live database data
3. KHQR merchant API integration when token/API access becomes available
4. Final UX polish and production hardening

Payment API work is paused until merchant token/API access is available.

---

## Incremental Refactor Philosophy
This repository has working features already.

That means:
- prioritize safety over elegance
- keep diffs small
- avoid broad rewrites
- preserve frontend compatibility
- update imports/usages carefully

The right approach is:
- one module at a time
- one boundary at a time
- verify after each step

---

## Current Work Priority

Current priority order:

1. recommendation system
2. chatbot intelligence
3. KHQR merchant API integration when credentials/token are available
4. final UX polish
5. remaining cleanup in `lib/`, admin, and support modules

---

## Architecture Intent
Desired flow:

route -> service -> repository -> database

### Repository
- Prisma access only

### Service
- business logic only

### Route
- request/auth/response only

### Lib
- shared utilities only

---

## Important Compatibility Expectation
Preserve current behavior unless there is a very strong reason to change it.

Examples of behavior that should remain stable:
- API response shape
- frontend expectations
- checkout flow
- guest cart behavior
- login cart merge behavior
- admin workflows

---

## Known Complexity Areas
These parts require extra care:
- guest vs authenticated cart behavior
- login-time guest cart merge
- checkout and order creation
- order status transitions
- payment update flow
- product data shaping for storefront vs admin
- chatbot grounding and fallback logic
- recommendation fallback behavior
- AI-assisted product explanation

---

## Recommendation System Direction

Recommendation logic should be deterministic first.

Recommended signals:
- same category
- related robot kit type
- compatible components
- product keywords
- price range
- popular products
- featured products
- user order history if authenticated
- fallback products for guests

AI may explain recommendations, but AI must not invent recommendations without retrieved database products.

---

## AI Integration Direction

AI may be used for:
- natural language understanding
- summaries
- comparisons
- customer-friendly explanations
- explaining why retrieved products match a user request

AI must not be the source of truth.

Product data, prices, stock, compatibility, order status, and payment status must come from the database or trusted APIs.

Recommendation logic should be deterministic first, then AI may explain why retrieved products match the user’s request.

Suggested chatbot structure:
- intent parser
- rule engine
- product recommender
- LLM adapter

Rule-based logic remains the safe fallback.

---

## Payment Integration Direction

Current KHQR API work is paused until merchant token/API access becomes available.

Until then:
- preserve existing KHQR placeholder/manual flow
- do not fake automatic payment confirmation
- do not mark orders as paid from frontend-only actions

When merchant API access is available:
- generate KHQR through backend payment service
- keep credentials in environment variables
- verify payment through webhook or trusted status API
- update payment/order status only from trusted backend logic

---

## What Good Progress Looks Like
A good task:
- improves one module boundary
- reduces mixed concerns
- preserves behavior
- updates status docs
- leaves the repo cleaner than before

A bad task:
- touches too many systems at once
- introduces fancy abstractions
- changes behavior casually
- creates architecture inconsistency

---

## Coding Principles
- simple beats clever
- explicit beats magical
- local consistency beats theoretical purity
- small safe refactor beats big risky rewrite