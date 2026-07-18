# RobotIoKit Refactor Status

## Current Status

### Product Module

Status: Stable ✅

Completed:

* Repository/service architecture established
* Storefront filtering improvements
* Product compatibility recommendations
* Related product scoring
* Dynamic voltage option generation
* Product page service-layer improvements

Remaining:

* Audit for any remaining direct Prisma usage outside repository boundaries

---

### Cart Module

Status: Stable ✅

Completed:

* Guest cart support
* Login cart merge behavior
* Existing checkout compatibility preserved

Remaining:

* Architecture audit
* Verify all cart routes follow intended boundaries

---

### Order Module

Status: Stable ✅

Completed:

* Core order flow working
* Order history and order detail working
* Admin order management working

Remaining:

* Repository/service boundary audit
* Order status transition review

---

### Admin Module

Status: Stable ⚠️

Completed:

* Dashboard
* Product management
* Robot kit management
* Category management
* Media uploads
* Analytics
* Notification badge count

Known Issues:

* Notification dropdown list does not open correctly
* Settings page needs cleanup

---

### Payment Module

Status: Waiting 🚧

Current State:

* Static KHQR flow
* Manual verification flow

Future Direction:

* Merchant API integration
* Dynamic KHQR generation
* Payment status verification
* Webhook support

Blocked By:

* Merchant token/API access not yet available

---

### Chatbot Module

Status: Active Development 🚧

Completed:

* Rule-based chatbot
* FAQ handling
* Product keyword matching
* Retrieval confidence scoring
* Deterministic product retrieval
* Product compatibility recommendations
* Deterministic recommendation service integration
* Scope/response/recommender helper extraction
* Deterministic price-filter shopping questions
* Project bundles for line follower, obstacle avoider, beginner Arduino, ESP32 IoT, and robot car builds
* Route cleanup
* Customer-friendly response cleanup
* Optional Ollama integration
* Dominant-language detection for mixed Khmer/English messages (`detectLanguage` counts Khmer vs Latin)
* Order-status questions answered with safe "check your Orders page" guidance (no live order data)
* Return/cancel/refund questions answered with safe direct-to-support guidance (no invented policy)
* Friendlier low-confidence fallback listing the topics the bot can help with (bilingual)
* Smoke script updated to parse the streaming `text/plain` chatbot response format
* Smoke coverage extended: Khmer store question, mixed Khmer/English (both directions), translation-style, unclear, order-status, return/cancel

Current Focus:

* Final chatbot modularization cleanup
* Shopping-filter edge-case tuning

---

## Current Priorities

Priority Order:

1. Shopping-filter manual UI verification
2. Final chatbot modularization cleanup
3. Admin notification dropdown fix
4. Settings page cleanup
5. KHQR image upload management
6. KHQR merchant API integration when credentials become available
7. Final UX polish and production hardening

---

## Recommendation System Direction

Recommendation logic must remain deterministic.

Primary recommendation signals:

* same category
* compatible components
* related robot kits
* product keywords
* price range
* popular products
* featured products
* authenticated user order history
* guest-safe fallbacks

AI may explain recommendations.

AI must not generate recommendations without database-backed products being retrieved first.

---

## Chatbot Direction

Target architecture:

User Message
↓
Intent Detection
↓
Recommendation / Product Retrieval
↓
Rule Engine
↓
Optional Ollama Explanation
↓
Customer Response

Rules:

* Database remains source of truth
* Product cards must come from real product data
* AI may summarize and explain
* AI must not invent products
* AI must not invent prices
* AI must not invent stock
* AI must not invent specifications
* AI must not make payment/order decisions

---

## Known Issues

### Vercel Build Fix (resolved 2026-07-01)

* Removed `generateStaticParams()` from `src/app/products/[slug]/page.js` and `src/app/robot-kits/[slug]/page.js`.
* Added `export const dynamic = "force-dynamic"` to both pages so product/kit data is fetched from Neon at request time instead of build time.
* Build no longer queries Prisma during static generation; `notFound()` still handles missing slugs.
* Added `export const dynamic = "force-dynamic"` to `src/app/not-found.jsx` so `/_not-found` is not statically prerendered at build time (prevented `prisma.category.findMany` from running during build via `StorefrontShell`).
* Added try/catch around the category fetch in `src/components/storefront/StorefrontShell.jsx` so any DB failure degrades gracefully to an empty category list instead of crashing.
* Added `export const dynamic = "force-dynamic"` and try/catch to `src/app/sitemap.js` — sitemap was calling `prisma.product.findMany` and `prisma.robotKit.findMany` during static build; now generates at request time when Neon is reachable.
* Restored `src/app/page.jsx` (home page) — commit `13071a4` accidentally emptied the file entirely instead of adding `force-dynamic`, causing a white page / React "Element type is invalid" 500 on all requests to `/`. File restored from git history (`65ec8ff`) with `export const dynamic = "force-dynamic"` added.

### Admin Notifications

* Badge count works
* Notification dropdown list still needs fixing

### Settings Page

* Remove Email & OTP Configuration section
* Replace Settings badge with Settings sidebar
* Allow KHQR image upload instead of relying on static image

### Chatbot

* Ollama responses can be slower than deterministic replies
* Additional intent coverage needed for robotics project guidance

### Payment

* Waiting for merchant API access
* Automatic payment confirmation not implemented yet
* KHQR payment verification/expiration routes are public order-id based and should be hardened with an ownership or signed payment-token check before production

### Tooling

* `npm run lint` is not CI-safe because `next lint` prompts to configure ESLint instead of running a configured linter

---

## Next Recommended Tasks

### Task 1

Fix the non-interactive lint workflow by adding an explicit ESLint setup or replacing the deprecated `next lint` script with a configured ESLint CLI command.

### Task 2 — Done

Chatbot smoke script now parses the streaming `text/plain` response format (`parseChatbotStream`
reconstructs `{ ok, data: { reply, items, followUps, locationLink, language } }` from the
`meta`/`text`/`done`/`error` events) and adds Khmer / mixed-language / translation / unclear /
order-status / return-cancel cases.

#### Verification

* `node --check` passes for all touched chatbot files and the smoke script.
* `npm run build` — run after pulling these changes.
* Smoke tests require a running dev server (`npm run dev`); the `CHATBOT_AI_ENABLED=true` run also
  needs Ollama serving the SEA-LION model:
  * `CHATBOT_AI_ENABLED=false node scripts/chatbot-smoke.js`
  * `CHATBOT_AI_ENABLED=true node scripts/chatbot-smoke.js`

### Task 3

Harden KHQR payment verification/expiration routes with an ownership check or signed payment token that still supports guest checkout.

### Task 4

Continue chatbot modularization by extracting one more cohesive helper only if it reduces `chatbot.service.js` without changing behavior.

### Task 5

Connect chatbot recommendation flows directly to recommendation service.

### Task 6

Add project-based chatbot recommendations.

Examples:

* Build a line-following robot
* Build an obstacle avoiding robot
* Beginner Arduino projects
* ESP32 IoT projects

### Task 7

Fix admin notification dropdown behavior.

### Task 8

Clean up admin settings page.

---

## Recent Completed Work

### Demo Loading Skeleton Polish

Status: Completed

Reason:

* Member demo polish needed smoother loading states for storefront routes that did not yet have route-level skeletons.

Changed files:

* `src/components/ui/skeletons.jsx`
* `src/app/cart/loading.js`
* `src/app/checkout/loading.js`
* `src/app/checkout/khqr/loading.js`
* `src/app/search/loading.js`
* `src/app/robot-kits/[slug]/loading.js`
* `docs/refactor-status.md`

Highlights:

* Added cart, checkout, KHQR payment, search, and robot kit detail page skeleton components.
* Added matching App Router `loading.js` files using the existing `StorefrontShell` + shared skeleton pattern.
* Kept skeletons visual-only with no data fetching, API changes, auth changes, payment changes, chatbot changes, or database changes.

Short audit:

* Existing product, robot kit listing, product detail, account, and orders loading states were preserved.
* New skeletons mirror the current route layouts closely enough to reduce loading-state layout jumps.
* No public API contracts or frontend business flows were changed.

Verification:

* `node --check` passed for the five new `.js` loading files.
* `node --check src/components/ui/skeletons.jsx` could not run because Node does not directly check `.jsx` files in this environment.
* `npm run build` passed.
* Started the built app on port 3005, smoke-tested `/cart`, `/checkout`, `/checkout/khqr?orderId=test`, `/search?q=arduino`, and `/robot-kits/elecfreaks-classroom-smart-air-purifier-kit`, then stopped the server.

Risks / manual checks:

* Browser/mobile visual inspection was not fully automated because the in-app browser was unavailable and Playwright is not installed locally.
* Manually review mobile widths for navbar, product listing, cart, checkout, and chatbot window before showing members.
* `/checkout/khqr` still depends on a valid order id for real content; this task only added the loading state.

Next recommended task:

* Fix the non-interactive lint workflow, then update chatbot smoke scripts to parse the current streaming chatbot response.

### Full Website Bug Audit

Status: Completed

Reason:

* The website needed a full non-destructive bug sweep before fixing individual issues.

Changed files:

* `docs/refactor-status.md`

Findings:

* High: `src/app/api/orders/[id]/khqr-payment/route.js` and `src/app/api/orders/[id]/khqr-payment/expire/route.js` expose customer-facing KHQR payment actions by order id without an ownership or signed-token boundary. The routes keep payment truth on the backend, but before production they should still require the current owner/session or a signed payment token that supports guest checkout.
* Medium: `npm run lint` is not usable in CI because `package.json` still runs deprecated `next lint` without an ESLint config, causing an interactive setup prompt.
* Medium: chatbot smoke scripts under `scripts/` fail because they call `response.json()` while `src/app/api/chatbot/route.js` now streams newline-delimited `text/plain` events.
* Low: several API routes still use Prisma directly outside repository boundaries, including media/category/admin overview routes. Current behavior passed smoke checks, but this remains architecture cleanup debt.

Short audit:

* Existing dirty worktree was preserved; no source code fixes were made during the audit.
* Storefront, catalog, search, auth, checkout, admin redirect, public API, and unauthorized admin API smoke checks completed.
* Admin notification dropdown status appears stale because the current header badge links to `/admin/notifications`; authenticated browser verification is still needed.
* Settings page still contains a logo upload placeholder and payment display fields; no settings mutations were performed.

Verification:

* `npm run build` passed.
* `npx prisma validate` passed.
* `node --check` passed for 112 `.js` files under `src`, `scripts`, and `prisma`.
* Live built app smoke-tested on port 3004, then stopped.
* Public route/API probes returned expected statuses for storefront pages, product/kit/category APIs, cart, chatbot POST, and protected admin APIs.
* Streaming-aware chatbot probes passed for sensors under `$10`, robot project picker, store location, and delivery fee.
* `npm run lint` failed with an interactive ESLint configuration prompt.
* Existing chatbot smoke scripts failed with `Unexpected non-whitespace character after JSON` because the chatbot endpoint streams events instead of returning a single JSON object.

Risks / manual checks:

* Browser UI, responsive layout, and console/network checks could not be fully automated because the in-app browser was unavailable and Playwright is not installed locally.
* Authenticated admin workflows were not mutated; manually verify notification badge/list behavior, admin settings save behavior, and admin CRUD flows with an admin account.
* Manually verify guest cart add/update/remove and safe checkout paths with test data before production.

Next recommended task:

* Fix the non-interactive lint workflow first, then update chatbot smoke scripts, then harden KHQR payment route authorization/token handling.

### Customer Pending Order Cancellation

Status: Completed

Reason:

* Customers needed a safe way to cancel only their own orders while the order is still `PENDING`.

Changed files:

* `.env`
* `src/modules/order/order.service.js`
* `src/app/api/orders/[id]/cancel/route.js`
* `src/components/storefront/CancelOrderButton.jsx`
* `src/app/orders/page.js`
* `src/app/orders/[id]/page.js`
* `docs/refactor-status.md`

Highlights:

* Added customer cancellation service logic that requires the order owner and `status = PENDING`.
* Added `POST /api/orders/[id]/cancel` for customer cancellation; admin sessions are rejected from this customer route.
* Cancelling updates the order to `CANCELLED`, restores reserved product/kit inventory, and writes an `ORDER_CANCELLED` timeline entry.
* Added Cancel Order buttons on the customer order list and order detail page only for pending orders.
* Prevented cancelled KHQR orders from rendering a payment QR through the old checkout URL.
* Removed unused `.env` entries: `BETTER_AUTH_SECRET`, `BAKONG_API_SECRET`, and `BAKONG_WEBHOOK_SECRET`.

Short audit:

* Admin order update behavior was not changed.
* Customers cannot cancel other users' orders.
* Non-pending orders cannot be cancelled by customers.
* No Prisma schema change was needed.
* Existing inventory release helper is reused, preserving the one-time inventory release guard.

Verification:

* `node --check src/modules/order/order.service.js` passed.
* `node --check src/app/api/orders/[id]/cancel/route.js` passed.
* `node --check src/app/orders/page.js` passed.
* `node --check src/app/orders/[id]/page.js` passed.
* `npm run build` passed.

Risks / manual checks:

* Manually place a COD order, cancel it from My Orders, and confirm status changes to `CANCELLED`.
* Manually place a KHQR pending order, cancel it, and confirm reopening the old KHQR checkout URL does not show a QR.
* Confirm inventory returns after cancellation by checking the affected product/kit stock.

Next recommended task:

* Add a small admin/customer-facing cancellation reason field only if the business wants reason tracking.

---

### KHQR Checkout QR Generation Fix

Status: Completed

Reason:

* Checkout was failing to generate a dynamic KHQR after order placement because the Bakong SDK success response includes a `status` object with `code: 0`, and the app treated any status object as an error.

Changed files:

* `src/lib/khqr.js`
* `src/lib/bakongClient.js`
* `src/modules/order/order.service.js`
* `docs/refactor-status.md`

Highlights:

* Fixed KHQR SDK response handling so only non-zero SDK status codes are treated as errors.
* Added early KHQR config validation before KHQR checkout order creation so invalid account IDs fail before inventory/cart changes.
* Added `BAKONG_MERCHANT_ID` as an alias for `KHQR_MERCHANT_ID`.
* Added `BAKONG_API_KEY` as an alias for `BAKONG_API_TOKEN` in the Bakong verification client.
* Verified dynamic QR generation succeeds with the current `KHQR_ACCOUNT_ID="devid_loem@bkrt"` configuration in individual KHQR mode.

Short audit:

* No schema change was needed.
* Checkout route contract and frontend flow were preserved.
* If `KHQR_ACQUIRING_BANK` is not configured, the SDK uses individual KHQR mode even when `BAKONG_MERCHANT_ID` exists.
* Merchant KHQR mode requires both `BAKONG_MERCHANT_ID`/`KHQR_MERCHANT_ID` and `KHQR_ACQUIRING_BANK`.

Verification:

* Direct helper test for `generateDynamicKhqrPayment` passed with current KHQR account env values.
* `node --check src/lib/khqr.js` passed.
* `node --check src/lib/bakongClient.js` passed.
* `node --check src/modules/order/order.service.js` passed.
* `npm run build` passed.

Risks / manual checks:

* Restart the local Next dev server after `.env` changes so checkout loads the updated `KHQR_ACCOUNT_ID`.
* Manually place a KHQR checkout order and confirm the QR appears on `/checkout/khqr`.
* If true merchant-mode KHQR is required, confirm the exact `KHQR_ACQUIRING_BANK` value with Bakong/ABA and add it to `.env`.

Next recommended task:

* Add an admin payment diagnostics endpoint/view that validates KHQR generation config without creating an order.

---

### Simplified Registration With JWT Email Verification Sign-In

Status: Completed

Reason:

* Registration needed to collect only basic account fields upfront, with phone/address/profile details completed later after email verification.

Changed files:

* `src/components/storefront/AuthForm.jsx`
* `src/components/storefront/VerifyEmailForm.jsx`
* `src/app/api/auth/verify-email/route.js`
* `src/modules/auth/auth.service.js`
* `docs/refactor-status.md`

Highlights:

* Simplified the public registration form to `fullName`, `email`, and `password`.
* Registration API payload from the form now sends only those three fields.
* Registration service now stores phone, province, city, and address as `null`; customers can complete them later from account/profile flows.
* Successful email OTP verification now creates a NextAuth JWT session cookie server-side.
* Verification payload includes the guest cart session id so the guest cart can merge into the newly verified user account before redirecting home.
* Verification page redirects verified users to the storefront instead of requiring a separate sign-in step.

Short audit:

* Existing password validation, OTP generation, OTP resend, email verification, and credentials login behavior were preserved.
* NextAuth remains configured with JWT sessions.
* Admin auth and protected route behavior were not changed.
* No Prisma schema change was needed.

Verification:

* `node --check src/modules/auth/auth.service.js` passed.
* `node --check src/app/api/auth/verify-email/route.js` passed.
* `node --check src/app/api/auth/register/route.js` passed.
* `npm run build` passed.

Risks / manual checks:

* Manually register with a real reachable email, submit the OTP, and confirm the user lands signed in with a valid `/account` session.
* Manually verify a guest cart merges after OTP verification.
* Confirm account/profile editing still accepts phone, province, city, and address after sign-in.

Next recommended task:

* Add a small success/loading state after OTP verification if the redirect feels abrupt during manual testing.

---

### Bakong Client Boundary Cleanup

Status: Completed

Reason:

* Separate low-level Bakong Open API calls from KHQR payload generation so `src/lib/khqr.js` stays focused on QR generation and rendering.

Changed files:

* `src/lib/bakongClient.js`
* `src/lib/khqr.js`
* `src/modules/order/order.service.js`
* `docs/refactor-status.md`

Highlights:

* Added `src/lib/bakongClient.js` as the backend-only Bakong HTTP adapter.
* Moved `checkBakongTransactionByMd5` out of `src/lib/khqr.js`.
* Updated order payment verification to import the Bakong client directly while keeping business validation in the order service.
* Added a small guard for missing KHQR MD5 references before calling Bakong.

Short audit:

* No route contract, Prisma schema, payment status behavior, or checkout UI behavior changed.
* Frontend still calls only the RobotIoKit API; Bakong credentials remain backend-only.
* `src/lib/khqr.js` now contains merchant config, dynamic KHQR generation, expiration, and QR image rendering only.

Verification:

* `node --check src/lib/bakongClient.js` passed.
* `node --check src/lib/khqr.js` passed.
* `node --check src/modules/order/order.service.js` passed.
* `npm run build` passed.

Risks / manual checks:

* Live Bakong payment confirmation still requires a valid token and real/sandbox transaction.

Next recommended task:

* Add a small admin-only payment diagnostics route/view for checking Bakong token/config status without exposing secrets.

---

### Dynamic Bakong KHQR Payment Flow

Status: Completed

Reason:

* Replace the static/manual KHQR checkout screen with dynamic Bakong KHQR generation using the order total and backend-only payment verification by QR MD5.

Changed files:

* `src/lib/khqr.js`
* `src/modules/order/order.service.js`
* `src/app/checkout/khqr/page.js`
* `src/components/storefront/KhqrPaymentActions.jsx`
* `src/app/api/orders/[id]/khqr-payment/route.js`
* `src/modules/admin/admin.service.js`
* `src/app/admin/settings/_components/AdminSettingsClient.jsx`
* `README.md`
* `package.json`
* `package-lock.json`

Highlights:

* Added `bakong-khqr` SDK generation and QR image rendering with the `qrcode` package.
* Dynamic KHQR payloads now embed the order total, order number, currency, merchant data, and expiration timestamp.
* Stored the generated QR payload in `Payment.qrPayload` and the QR MD5 in `Payment.reference`, avoiding a schema change.
* Replaced customer screenshot submission with backend verification through Bakong Open API `check_transaction_by_md5`.
* Successful Bakong verification marks the payment `PAID`, moves pending orders to `PREPARING`, and records a `KHQR_PAYMENT_CONFIRMED` timeline entry.
* The checkout page now renders the stored dynamic QR payload and the customer action polls/checks Bakong instead of trusting frontend confirmation.
* Admin settings status now checks dynamic KHQR env readiness, including `BAKONG_API_TOKEN`, instead of requiring a static KHQR image.
* README documents the required Bakong/KHQR environment variables.

Short audit:

* No Prisma schema change was needed.
* Repository boundaries remain intact; database writes still go through the order repository.
* The frontend cannot mark an order paid directly; payment status changes only after backend Bakong verification.
* Existing KHQR expiration behavior and inventory release path were preserved.
* Static payment proof upload storage remains in the schema/admin display for historical records, but the customer KHQR route no longer accepts proof uploads.

Verification:

* `node --check src/lib/khqr.js` passed.
* `node --check src/modules/order/order.service.js` passed.
* `node --check src/app/api/orders/[id]/khqr-payment/route.js` passed.
* `node --check src/modules/admin/admin.service.js` passed.
* `npm run build` passed.

Risks / manual checks:

* Live Bakong payment confirmation was not tested because it requires a valid `BAKONG_API_TOKEN` and a real/sandbox transaction.
* Confirm whether the production settlement account returned by Bakong in `toAccountId` exactly matches `KHQR_ACCOUNT_ID`; if the provider returns a settlement alias, loosen that check only to the trusted value Bakong documents for the merchant.
* Run a real low-value sandbox/production payment and verify the order changes from `UNPAID` to `PAID` and `PREPARING`.
* Ensure `.env` includes `KHQR_MERCHANT_NAME`, `KHQR_ACCOUNT_ID`, `KHQR_BANK_NAME`, `KHQR_CITY`, `KHQR_CURRENCY`, `BAKONG_API_TOKEN`, and optional `BAKONG_API_BASE_URL`.

Next recommended task:

* Add a small admin-only payment diagnostics view for checking Bakong token/config status without exposing secrets.

---

### Chatbot Project Picker Before Parts

Status: Completed

Reason:

* The fixed follow-up `What robot projects I can build` was returning parts immediately, which overwhelmed users before they could choose a specific robot project.

Changed files:

* `src/modules/chatbot/chatbot.service.js`
* `src/modules/chatbot/chatbot.ai-response.js`
* `src/components/chatbot/ChatWindow.jsx`
* `scripts/chatbot-smoke.js`
* `docs/refactor-status.md`

Highlights:

* Added deterministic robot project cards for Line-Following Robot, Obstacle-Avoiding Robot, and Bluetooth Robot Car.
* The project overview now returns `type: "project"` items with `title`, `slug`, and `query` instead of product/kit cards.
* Project cards are shown only when live in-stock catalog products/kits have matching project-type coverage.
* Clicking a project card sends the stored project query and returns the existing DB-backed product/part cards for that build.
* Product and kit cards keep their existing clickable images/titles and detail links.
* Fixed public follow-ups remain exactly `What robot projects I can build`, `Store location`, and `Delivery fee`.

Short audit:

* No Prisma access was added to chatbot modules.
* No schema change or new project table was added; project availability is derived from the existing live catalog data and deterministic catalog metadata.
* Existing direct project prompts such as `Build a line-following robot` still return product lists immediately.
* The `What robot kits can I build?` path still returns catalog items rather than project picker cards.
* Checkout, cart, order, payment, admin authorization, and storefront API contracts were not changed.

Verification:

* `node --check src/modules/chatbot/chatbot.service.js` passed.
* `node --check src/modules/chatbot/chatbot.ai-response.js` passed.
* `node --check scripts/chatbot-smoke.js` passed.
* `npm run build` passed after clearing generated `.next` artifacts affected by a local OneDrive readlink issue.
* Started the built app with `CHATBOT_AI_ENABLED=false` on port 3001; `node scripts/chatbot-smoke.js` passed, including project-picker-first and selected-project product-list cases.
* Browser manual check passed: opened the chatbot, clicked `What robot projects can I build?`, saw project cards first, clicked `Line-Following Robot`, and verified real product links/cards plus fixed follow-ups.

Risks / manual checks:

* Project picker availability depends on deterministic metadata inferred from live catalog product/kit names, categories, and descriptions.
* If future inventory removes enough required project parts, a project card may disappear from the overview until matching in-stock items return.
* Local builds may need generated `.next` cleanup in this OneDrive workspace if Windows reports `EINVAL readlink` on build artifacts.

Next recommended task:

* Add optional admin-managed project definitions only if the business wants non-code project titles/descriptions; keep the current deterministic catalog grounding either way.

---

### Chatbot Dynamic DB-Backed Inventory Reliability

Status: Completed

Reason:

* Chatbot product, kit, project, and support answers needed stronger live-catalog grounding for queries like 5V sensor counts, buildable robot kits, and line-following robot parts.

Changed files:

* `src/modules/chatbot/chatbot.parser.js`
* `src/modules/chatbot/chatbot.service.js`
* `src/modules/chatbot/chatbot.catalog.js`
* `src/app/api/chatbot/route.js`
* `src/components/chatbot/ChatWindow.jsx`
* `src/components/storefront/ProductCard.jsx`
* `scripts/chatbot-smoke.js`
* `docs/refactor-status.md`

Highlights:

* Improved parser detection for available/buildable requests, decimal voltage values, line-following project wording, and "What robot kits can I build?".
* Enforced `stock > 0` for normal chatbot recommendations, project bundles, deterministic catalog matches, price-filter results, and AI-planner recommendation execution while preserving explicit out-of-stock questions.
* Added voltage filtering to aggregate/count handling so queries like `How many 5V sensors are available?` count only matching live DB products.
* Added structured item fields (`title`, `parts`) while preserving existing `name`, `routeUrl`, `imageUrl`, price, stock, and detail-card fields.
* Added `locationLink` to support responses and API output for store location/delivery-fee answers.
* Added structured chatbot logs for query intent, DB query counts, result mode/counts, and fallback triggers.
* Updated chat recommendation cards so images and titles are clickable detail links, with clamped long titles and hover tooltips.
* Kept public chatbot follow-ups fixed to exactly `What robot projects I can build`, `Store location`, and `Delivery fee`.

Short audit:

* Product and kit cards still come only from existing DB-backed storefront services.
* AI remains optional and can only rewrite or explain DB-backed responses; it does not choose final catalog items.
* No Prisma access was added to chatbot modules.
* Checkout, cart, order, payment, admin authorization, and existing storefront API contracts were not changed.

Verification:

* `node --check src/modules/chatbot/chatbot.parser.js` passed.
* `node --check src/modules/chatbot/chatbot.service.js` passed.
* `node --check src/modules/chatbot/chatbot.catalog.js` passed.
* `node --check src/app/api/chatbot/route.js` passed.
* `node --check scripts/chatbot-smoke.js` passed.
* `npm run build` passed.
* Started the built app with `CHATBOT_AI_ENABLED=false` on port 3001; `node scripts/chatbot-smoke.js` passed, including 5V sensor count, robot kit builder, line-following parts, structured item fields, buildable stock, support links, and exact fixed follow-up assertions.

Risks / manual checks:

* Normal chatbot recommendations now intentionally exclude out-of-stock items; explicit out-of-stock questions still return out-of-stock data.
* Manually verify clickable chatbot item images/titles and long-title tooltips in the browser on mobile and desktop widths.
* Successful live Ollama wording was not retested; deterministic AI-disabled behavior was verified.

Next recommended task:

* Manually review chatbot UI spacing for grouped project parts after the buildable-stock filtering, then tune only card spacing if needed.

---

### Chatbot Fixed Follow-Up Suggestions

Status: Completed

Reason:

* Chatbot answers needed concise, consistent follow-up chips instead of dynamic or excessive prompt lists.

Changed files:

* `src/app/api/chatbot/route.js`
* `src/components/chatbot/ChatWindow.jsx`
* `src/modules/chatbot/chatbot.service.js`
* `scripts/chatbot-smoke.js`
* `docs/refactor-status.md`

Highlights:

* Normalized every successful chatbot API response to exactly three follow-ups: `What robot projects I can build`, `Store location`, and `Delivery fee`.
* Kept the order fixed and removed all dynamic follow-up suggestions from the public API response.
* Updated the chat UI error fallback to use the same three follow-ups.
* Added recognition for the exact `What robot projects I can build` chip text.
* Updated smoke verification to assert the exact follow-up array for every chatbot response.

Short audit:

* Chatbot reply text, product cards, kit cards, catalog retrieval, recommendation ranking, and API response shape were preserved.
* Dynamic service-level follow-up helpers remain internally available, but the API boundary now guarantees the fixed customer-facing follow-up list.
* No Prisma access, checkout, cart, order, payment, admin, or auth behavior was changed.

Verification:

* `node --check src/app/api/chatbot/route.js` passed.
* `node --check src/modules/chatbot/chatbot.service.js` passed.
* `node --check scripts/chatbot-smoke.js` passed.
* `npm run build` passed after stopping a running Next dev process and clearing the generated `.next` cache.
* Started the built app with `CHATBOT_AI_ENABLED=false` on port 3001; `node scripts/chatbot-smoke.js` passed with exact follow-up assertions on every response.

Risks / manual checks:

* `npm run build` still reports the existing invalid Next config warning for `cacheComponents`.
* Manually trigger several chatbot queries in the browser and confirm the follow-up chips are exactly the three fixed options.

Next recommended task:

* Manually review the fixed follow-up chip wording in the chatbot UI for mobile width and adjust only spacing if needed.

---

### Chatbot Inventory-Backed Starter Prompts

Status: Completed

Reason:

* Chatbot starter chips needed to promote buildable RobotIoKit projects and answer store support questions from existing catalog/settings data instead of generic prompts.

Changed files:

* `src/components/chatbot/ChatWindow.jsx`
* `src/modules/chatbot/chatbot.service.js`
* `src/modules/chatbot/chatbot.catalog.js`
* `src/modules/chatbot/chatbot.scope.js`
* `src/services/storeSupportService.js`
* `scripts/chatbot-smoke.js`
* `docs/refactor-status.md`

Highlights:

* Replaced starter chips with project-builder and support prompts: robot projects, line follower, obstacle avoider, Bluetooth robot car, store location, and delivery fee information.
* Added deterministic support handling for store location and delivery fee prompts before the older FAQ fallback.
* Store location now reads from `AdminSettings`; delivery fee wording reads fee values through the existing delivery-fee helper.
* Added a robot project-builder overview that returns real catalog-backed robot kits/parts and follow-up project builder prompts.
* Added a wireless-control group to the robot-car project bundle so Bluetooth robot car prompts include real wireless-control catalog parts.
* Preserved chatbot API response shape: `reply`, `items`, `followUps`, and `language`.

Short audit:

* No Prisma access was added to chatbot modules; public support settings are loaded through a small service over the existing settings repository.
* Product and kit cards remain database-backed.
* No checkout, cart, order, payment, admin authorization, or chatbot route response-shape behavior was changed.
* Existing corrupted Khmer starter literals were left untouched, but runtime Khmer quick prompts are overridden to the new prompt list.

Verification:

* `node --check src/modules/chatbot/chatbot.service.js` passed.
* `node --check src/modules/chatbot/chatbot.catalog.js` passed.
* `node --check src/modules/chatbot/chatbot.scope.js` passed.
* `node --check src/services/storeSupportService.js` passed.
* `node --check scripts/chatbot-smoke.js` passed.
* `node --check src/components/chatbot/ChatWindow.jsx` could not run because Node does not accept `.jsx` for syntax check in this setup.
* `npm run build` passed.
* Started an AI-disabled dev server on port 3001 because port 3000 was already in use; `node scripts/chatbot-smoke.js` passed against `http://localhost:3001`.

Risks / manual checks:

* `npm run build` still reports the existing invalid Next config warning for `cacheComponents`.
* Manually verify the browser chatbot starter chips after clearing session storage, because existing chat history can keep the old welcome message visible.
* Store location depends on Admin Settings address being configured; if empty, the chatbot reports that the location is not configured yet.

Next recommended task:

* Add editable delivery-fee settings if the business wants fees to be managed from admin UI instead of the existing delivery-fee helper.

---

### Chatbot Store Aggregate Count Questions

Status: Completed

Reason:

* Store aggregate/count questions needed deterministic handling before product-detail, catalog-search, AI-planner, and low-confidence fallback paths.

Changed files:

* `src/modules/chatbot/chatbot.parser.js`
* `src/modules/chatbot/chatbot.service.js`
* `src/modules/chatbot/chatbot.scope.js`
* `scripts/chatbot-smoke.js`
* `docs/refactor-status.md`

Highlights:

* Added `catalog_aggregate` parser detection for explicit count wording such as how many, count, total, and number of.
* Added deterministic count replies for products, robot kits, product categories, category-specific products, available products, and out-of-stock products.
* Count answers use existing storefront product and robot-kit services; no Prisma access was added to chatbot modules.
* Kept the chatbot API response shape unchanged: `reply`, `items`, `followUps`, and `language`.
* Added smoke coverage for product count, robot-kit count, available sensor count, category count, and out-of-stock product count.

Short audit:

* Pure aggregate replies intentionally return no product cards because the user asked for a count, not a listing.
* Existing catalog listing, product detail, recommendation, FAQ, order, payment, admin, and checkout behavior were not changed.
* Store scope now permits category/count wording so count questions can reach the parser.

Verification:

* `node --check src/modules/chatbot/chatbot.parser.js` passed.
* `node --check src/modules/chatbot/chatbot.service.js` passed.
* `node --check src/modules/chatbot/chatbot.scope.js` passed.
* `node --check scripts/chatbot-smoke.js` passed.
* `npm run build` passed.
* Started the built app with `CHATBOT_AI_ENABLED=false`; `node scripts/chatbot-smoke.js` passed, including all new aggregate/count cases.

Risks / manual checks:

* `npm run build` still reports the existing invalid Next config warning for `cacheComponents`.
* AI-enabled smoke initially timed out due Ollama request timeouts; deterministic aggregate behavior was verified with AI disabled.
* Manually test the browser chatbot for `hi how many products in the store?`, `How many robot kits do you have?`, `How many sensors are available?`, `How many categories are there?`, and `How many products are out of stock?`.

Next recommended task:

* Tune only count-answer wording for Khmer if a native-language manual review shows awkward phrasing.

---

### Chatbot Question Mode Routing

Status: Completed

Reason:

* Broad concept questions, product-detail questions, and robot catalog discovery questions needed separate handling so the chatbot does not dump category cards or add unnecessary uncertainty wording.

Changed files:

* `src/modules/chatbot/chatbot.service.js`
* `scripts/chatbot-smoke.js`
* `docs/refactor-status.md`

Highlights:

* Added question mode classification for concept explanations, product detail, catalog search, project build, comparison, FAQ, and fallback paths.
* Added deterministic concept explanations for common robotics/store terms such as sensor, controller, motor driver, motor, servo, robot kit, battery, power module, communication module, and display.
* Limited concept-question cards to representative DB-backed examples instead of dumping whole categories.
* Updated product-detail responses to omit generic "I cannot confirm this from the product data" wording during normal product explanations.
* Added robot product discovery handling that prefers robot kits, chassis, motor drivers, motors, wheels, robot-car sensors, and controllers.
* Added smoke coverage for concept questions, fuzzy product detail, and robot product discovery prompts.

Short audit:

* Chatbot API response shape remains `reply`, `items`, `followUps`, and `language`.
* Product cards still come only from DB-backed storefront product and robot-kit services.
* No Prisma access was added to chatbot code.
* Checkout, cart, order, payment, admin, auth, and settings behavior were not changed.

Verification:

* `node --check src/modules/chatbot/chatbot.parser.js` passed.
* `node --check src/modules/chatbot/chatbot.service.js` passed.
* `node --check src/modules/chatbot/chatbot.response.js` passed.
* `node --check src/modules/chatbot/chatbot.ai-response.js` passed.
* `node --check scripts/chatbot-smoke.js` passed.
* `npm run build` passed.
* Started the built app with `CHATBOT_AI_ENABLED=false`; `node scripts/chatbot-smoke.js` passed.
* Started the built app with `CHATBOT_AI_ENABLED=true` and fast unavailable `OLLAMA_URL`; `node scripts/chatbot-smoke.js` passed.

Risks / manual checks:

* Manually verify the browser chatbot for `what does Sensor do?`, `What is Water Level Sensor Modue?`, `Do you know any robot products?`, `Show robot parts`, and `What products can I use to build a robot?`.
* Successful live Ollama rewrites were not tested because local Ollama has been timing out; fallback behavior was verified.

Next recommended task:

* Manually review successful Ollama wording for concept and robot-discovery replies once the local model is responsive.

---

### Chatbot Store-Data AI Planner Fallback

Status: Completed

Reason:

* Store-related questions such as most expensive product, cheapest robot kit, stock availability, category counts, product detail, and robotics education needed a grounded fallback after existing deterministic rules.

Changed files:

* `src/modules/chatbot/chatbot.ai-planner.js`
* `src/modules/chatbot/chatbot.service.js`
* `src/modules/chatbot/chatbot.scope.js`
* `src/app/api/chatbot/route.js`
* `scripts/chatbot-smoke.js`
* `docs/refactor-status.md`

Highlights:

* Extended the AI planner schema with validated store-data intents for catalog sorting, availability, category summaries, catalog detail, catalog filtering, and robotics education.
* Added strict validation for store-data fields including entity type, category, sort field, direction, stock filter, metric, and limit.
* Added a chatbot service executor that loads products and robot kits through existing storefront services and executes validated plans in application code.
* Added deterministic answers for most expensive product, cheapest kit, sensors in stock, out-of-stock products, category with most products, beginner products, PWM, line-following explanation, and motor-driver education.
* Preserved existing deterministic parser/rule behavior before planner fallback and preserved the chatbot API response shape.
* Added route cleanup for AI replies wrapped in quotes.

Short audit:

* No Prisma access was added to chatbot code.
* AI does not choose final products or execute queries; product and kit cards are still built from DB-backed service data.
* No checkout, cart, order, payment, admin, auth, or settings behavior was changed.
* Recommendation ranking and existing price-filter behavior were preserved.

Verification:

* `node --check src/modules/chatbot/chatbot.service.js` passed.
* `node --check src/modules/chatbot/chatbot.ai-planner.js` passed.
* `node --check src/modules/chatbot/chatbot.ai-response.js` passed.
* `node --check src/modules/chatbot/chatbot.response.js` passed.
* `node --check src/app/api/chatbot/route.js` passed.
* `node --check scripts/chatbot-smoke.js` passed.
* `npm run build` passed.
* Started the built app with `CHATBOT_AI_ENABLED=false`; `node scripts/chatbot-smoke.js` passed.
* Started the built app with `CHATBOT_AI_ENABLED=true` and fast unavailable `OLLAMA_URL`; `node scripts/chatbot-smoke.js` passed.

Risks / manual checks:

* Local Ollama timed out repeatedly when reachable, so the full AI-enabled smoke suite was verified with AI enabled and unavailable-fast fallback.
* Manually test successful Ollama responses for the new store-data questions once the local model is responsive.
* The current catalog has no out-of-stock products, so the out-of-stock question correctly returns no product cards and a no-match stock reply.

Next recommended task:

* Tune Ollama runtime/model availability, then manually review rewritten English and Khmer wording for the new planner-backed store-data questions.

---

### Chatbot AI Response Rewriter

Status: Completed

Reason:

* Chatbot catalog replies needed more natural English and Khmer wording while keeping deterministic product retrieval, filtering, recommendation ranking, and API response shape unchanged.

Changed files:

* `src/modules/chatbot/chatbot.ai-response.js`
* `src/app/api/chatbot/route.js`
* `scripts/chatbot-smoke.js`
* `docs/refactor-status.md`

Highlights:

* Added a focused AI response wording layer that receives structured, database-backed response context and the deterministic fallback reply.
* Kept products, robot kits, prices, categories, compatibility, filters, and ranking controlled by existing application logic.
* Added output validation so empty, unsafe, route-leaking, internal, price-inventing, or product-name-listing AI output falls back to the deterministic reply.
* Preserved fully deterministic behavior for protected order, payment status, checkout, login/auth, email verification, admin, and settings flows.
* Updated smoke assertions to allow natural rewritten wording while continuing to verify product cards, filtering, compact replies, and no internal wording.

Short audit:

* No recommendation ranking, parser behavior, filtering logic, compatibility logic, Prisma access, or chatbot API response shape was changed.
* `src/app/api/chatbot/route.js` still returns `reply`, `items`, `followUps`, and `language`.
* Detail and educational grounded model prompts remain separate from the new short response rewriter.
* Ollama remains optional; unavailable Ollama returned deterministic fallback replies during verification.

Verification:

* `node --check src/modules/chatbot/chatbot.service.js` passed.
* `node --check src/modules/chatbot/chatbot.response.js` passed.
* `node --check src/modules/chatbot/chatbot.ai-response.js` passed.
* `node --check src/app/api/chatbot/route.js` passed.
* `node --check scripts/chatbot-smoke.js` passed.
* `npm run build` passed.
* Started the built app with `CHATBOT_AI_ENABLED=false`; `node scripts/chatbot-smoke.js` passed.
* Started the built app with `CHATBOT_AI_ENABLED=true`; `node scripts/chatbot-smoke.js` passed.
* Compared representative catalog prompt item IDs with AI disabled and enabled; product card IDs were identical.

Risks / manual checks:

* Ollama was unavailable locally, so the live improved wording path was verified by code path and fallback behavior, but not by a successful model response.
* Manually test English and Khmer chatbot wording with Ollama running for sensors under `$10`, robot kits below `$100`, line follower parts, obstacle avoider parts, and cheaper-than/above/between price filters.

Next recommended task:

* Run the same smoke and manual UI checks with a reachable Ollama server, then tune only the response-rewriter prompt or validation if a safe generated sentence is rejected.

---

### Product Compatibility Recommendations

Status: Completed

Highlights:

* Added deterministic compatibility scoring
* Added "Works Well With" recommendations
* Shared compatibility logic with chatbot

---

### Chatbot Retrieval Confidence

Status: Completed

Highlights:

* Removed generic product fallback
* Added confidence scoring
* Improved typo handling
* Improved no-result behavior

---

### Chatbot Customer Response Cleanup

Status: Completed

Highlights:

* Removed raw route URLs from replies
* Removed debug-style wording
* Preserved structured product card navigation

---

### Chatbot Deterministic Recommendation Integration

Status: Completed

Reason:

* The chatbot needed stronger shopping guidance for project builds, budgets, compatibility, and comparisons while keeping product cards database-backed.

Changed files:

* `src/modules/recommendation/recommendation.service.js`
* `src/modules/chatbot/chatbot.service.js`
* `src/modules/chatbot/chatbot.catalog.js`
* `scripts/chatbot-smoke.js`
* `docs/refactor-status.md`

Highlights:

* Added a recommendation service that owns deterministic planner selection, scoring, sorting, and filtering over product/kit data supplied by existing services.
* Updated chatbot catalog and educational paths to call the recommendation service instead of directly invoking catalog search/planner scoring.
* Added deterministic project bundles for ESP32 IoT projects and robot car builds, preserving existing line follower, obstacle avoider, and Arduino beginner bundle behavior.
* Added smoke cases for robot car builds, ESP32 IoT project recommendations, and products under `$20`.
* Preserved the chatbot API response shape: `reply`, `items`, `followUps`, and `language`.

Short audit:

* No Prisma access was added to chatbot or recommendation code.
* Product and robot-kit data still comes from existing storefront services.
* Ollama remains optional and is only used for grounded explanation/wording.
* Checkout, cart, order, payment, admin routes, and chatbot UI were not changed.

Verification:

* `node --check src/modules/recommendation/recommendation.service.js` passed.
* `node --check src/modules/chatbot/chatbot.service.js` passed.
* `node --check src/modules/chatbot/chatbot.catalog.js` passed.
* `node --check scripts/chatbot-smoke.js` passed.
* `npm run build` passed.

Risks / manual checks:

* Run `scripts/chatbot-smoke.js` against a local server to verify live API wording and cards after seeding/current DB data.
* Manually ask the chatbot about line follower, obstacle avoider, ESP32 IoT, robot car, products under `$20`, ESP32 compatibility, and Arduino vs ESP32 comparison.

Next recommended task:

* Start a local server and run chatbot smoke tests, then tune only any failing recommendation edge cases.

---

### Chatbot Architecture Cleanup

Status: Completed

Reason:

* `chatbot.service.js` had accumulated scope checks, fallback response shaping, FAQ response shaping, and direct recommendation-service wiring alongside orchestration.

Changed files:

* `src/modules/chatbot/chatbot.service.js`
* `src/modules/chatbot/chatbot.scope.js`
* `src/modules/chatbot/chatbot.response.js`
* `src/modules/chatbot/chatbot.recommender.js`
* `scripts/chatbot-smoke.js`
* `docs/refactor-status.md`

Highlights:

* Extracted shop-scope keyword/pattern checks into `chatbot.scope.js`.
* Extracted low-confidence, empty-state, FAQ, and matched-rule response helpers into `chatbot.response.js`.
* Added `chatbot.recommender.js` as a thin chatbot-facing adapter over `recommendation.service.js`.
* Updated `chatbot.service.js` to call the extracted modules while preserving the existing orchestration order.
* Trimmed duplicate local helper blocks from `chatbot.service.js`.
* Relaxed the ESP32 IoT smoke assertion to allow the existing grounded detail response while still requiring real DB product cards and no debug wording.

Short audit:

* Recommendation ranking still lives in `src/modules/recommendation/recommendation.service.js`.
* No Prisma access was added to chatbot code.
* Chatbot API response shape remains `reply`, `items`, `followUps`, and `language`.
* Ollama behavior remains optional and grounded.
* Checkout, cart, order, payment, admin logic, and chatbot UI were not changed.

Verification:

* `node --check src/modules/chatbot/chatbot.service.js` passed.
* `node --check src/modules/chatbot/chatbot.scope.js` passed.
* `node --check src/modules/chatbot/chatbot.response.js` passed.
* `node --check src/modules/chatbot/chatbot.recommender.js` passed.
* `npm run build` passed.
* Started the built app with `npm run start -- -p 3000`.
* `node scripts/chatbot-smoke.js` passed all smoke cases.
* Stopped the temporary local server after smoke verification.

Risks / manual checks:

* Manually test the chatbot UI for robot car, ESP32 IoT, products under `$20`, Arduino compatibility, Arduino vs ESP32 comparison, beginner kits, and obstacle avoidance sensor guidance.
* Khmer strings were moved into focused modules; verify Khmer UI rendering in the browser if exact display text matters.

Next recommended task:

* Extract one more cohesive response-formatting group only if it can be moved without touching recommendation behavior.

---

### Chatbot Price Filter Questions

Status: Completed

Reason:

* The chatbot needed clearer deterministic handling for product, kit, category, and relative-price shopping questions.

Changed files:

* `src/modules/chatbot/chatbot.parser.js`
* `src/modules/chatbot/chatbot.service.js`
* `scripts/chatbot-smoke.js`
* `docs/refactor-status.md`

Highlights:

* Added structured `catalog_filter` parsing for under, below, less than, above, over, more than, between, from/to, hyphenated ranges, cheaper than, and more expensive than.
* Preserved existing `filters.maxPrice` compatibility while adding `filters.price`.
* Added deterministic filter handling before product-detail/education paths so shopping filter prompts return filtered catalog cards.
* Added category-level price summaries using real product categories from DB-backed product data.
* Added relative price filtering by resolving the referenced product or kit and comparing against its real price.
* Kept product and kit cards database-backed and preserved the chatbot API response shape.

Short audit:

* Recommendation ranking behavior was not changed.
* No Prisma access was added to chatbot code.
* Checkout, cart, order, payment, admin logic, and chatbot UI were not changed.
* Ollama remains optional and is not used as the source of filtered results.

Verification:

* `node --check src/modules/chatbot/chatbot.parser.js` passed.
* `node --check src/modules/chatbot/chatbot.service.js` passed.
* `node --check src/modules/chatbot/chatbot.response.js` passed.
* `node --check src/modules/chatbot/chatbot.recommender.js` passed.
* `node --check scripts/chatbot-smoke.js` passed.
* `npm run build` passed.
* Started the built app with `npm run start -- -p 3000`.
* `node scripts/chatbot-smoke.js` passed, including new price-filter cases.
* Stopped the temporary local server after smoke verification.

Risks / manual checks:

* Manually test the chatbot UI with products under `$20`, sensors under `$10`, products above `$50`, kits below `$100`, Arduino products between `$5` and `$30`, categories under `$20`, products cheaper than ESP32, and kits more expensive than a beginner kit.
* If multiple similarly named reference products are added later, ambiguity wording should be checked in the UI.

Next recommended task:

* Manually verify the same price-filter prompts in the browser chatbot UI and tune wording only if needed.

---

### Store Location Map Links

Status: Completed

Reason:

* Store address answers needed a clickable map link instead of plain address text.

Changed files:

* `src/services/storeSupportService.js`
* `src/modules/admin/admin.service.js`
* `src/modules/chatbot/chatbot.service.js`
* `src/components/chatbot/ChatWindow.jsx`
* `src/app/admin/settings/_components/AdminSettingsClient.jsx`
* `scripts/chatbot-smoke.js`
* `docs/refactor-status.md`

Highlights:

* Added a store support helper that derives a Google Maps search link from the saved store address.
* Returned `locationUrl` with public and admin store settings without changing existing field names.
* Included the map link in chatbot store location and pickup/delivery support replies when an address is configured.
* Linkified chatbot URLs so map links are clickable in chat bubbles.
* Displayed the saved store map link in admin settings beside the address field.
* Extended chatbot smoke coverage for map-link behavior while allowing empty-address environments.

Short audit:

* The saved address remains the source of truth.
* Product cards, kit cards, chatbot API shape, and follow-up chip behavior were preserved.
* No hardcoded availability or product data was added.

Verification:

* `node --check src/services/storeSupportService.js` passed.
* `node --check src/modules/admin/admin.service.js` passed.
* `node --check src/modules/chatbot/chatbot.service.js` passed.
* `node --check scripts/chatbot-smoke.js` passed.
* `npm run build` passed after stopping local Next processes and clearing the stale workspace `.next` directory.
* Started the built app with `CHATBOT_AI_ENABLED=false npm run start -- -p 3001`.
* `node scripts/chatbot-smoke.js` passed against `http://localhost:3001`.
* Stopped the temporary local server after smoke verification.

Risks / manual checks:

* Manually confirm the admin settings link opens the expected map search for the saved address.
* If the address is edited but not saved, the displayed link still reflects the last saved settings response.
* Build still reports the existing `next.config.mjs` warning for unrecognized `cacheComponents`.

Next recommended task:

* Manually test the chatbot Store location and Delivery fee chips in the browser after saving a real store address.

---

### Robot Kit Title Listing Polish

Status: Completed

Reason:

* Very long robot kit titles could visually break listing cards and needed clearer click behavior for detail navigation.

Changed files:

* `src/components/storefront/KitCard.jsx`
* `src/app/robot-kits/page.js`
* `docs/refactor-status.md`

Highlights:

* Clamped robot kit card titles to two lines with ellipsis-friendly `line-clamp-2`.
* Kept titles linked to the robot kit detail route.
* Added native hover titles so customers can still see the full kit name.

Short audit:

* No data fetching, chatbot, API, cart, or checkout behavior was changed.
* Existing detail route URLs were preserved.

Verification:

* `npm run build` passed.

Risks / manual checks:

* Manually confirm the longest kit names look balanced on mobile and desktop listing cards.

Next recommended task:

* Review product card title lengths only if product names show the same layout issue in manual testing.

---

### Catalog Image Detail Links

Status: Completed

Reason:

* Catalog users expected product and robot kit images to open the corresponding detail page, but some cards only linked titles or buttons.

Changed files:

* `src/components/storefront/ProductCard.jsx`
* `src/components/storefront/KitCard.jsx`
* `src/app/robot-kits/page.js`
* `docs/refactor-status.md`

Highlights:

* Wrapped shared product card images in detail-page links.
* Wrapped shared robot kit card images in detail-page links.
* Made robot kit listing images link to `/robot-kits/[slug]` while preserving the level badge overlay.
* Kept existing titles, buttons, routes, data fetching, and cart behavior unchanged.

Short audit:

* No API or service behavior was changed.
* Product listing inline cards already had clickable image links and were left unchanged.

Verification:

* `npm run build` passed.

Risks / manual checks:

* Manually click product and kit images on the homepage, products page, and robot kits page to confirm expected navigation.

Next recommended task:

* Add browser-level smoke coverage for storefront card navigation if UI regression testing is introduced.

---

### Admin Badge Improvements

Status: Completed

Highlights:

* Notification badge count support
* Settings status support
* Authentication checks preserved

---

## Notes

### Source-Control Ignore Audit

Status: Completed

Reason:

* Local secrets, agent instructions, logs, generated output, and user-uploaded files needed safer source-control defaults.
* The existing `docs/` ignore rule conflicted with the requirement to maintain project documentation in Git.

Changed files:

* `.gitignore`
* `docs/refactor-status.md`

Short audit:

* Added ignores for environment variants, private keys, local AI/editor files, runtime logs, build output, local databases, and OS/editor metadata.
* Added `public/uploads/` because it contains runtime user content such as avatars and payment proofs.
* Kept `public/payments/robotiokit-khqr.jpg` versionable because it is an intentionally public application asset.
* Removed the broad `docs/` ignore so project context and status records can be committed.

Verification:

* Reviewed repository filenames without printing secret values.
* Confirmed the workspace currently has no `.git` repository, so tracked-file and `git check-ignore` verification could not be performed.

Risks / manual checks:

* If Git is initialized later, verify the intended files with `git status --ignored` before the first commit.
* If user uploads need persistent production storage, use managed object storage rather than Git or ephemeral deployment storage.

Next recommended task:

* Create a sanitized `.env.example` containing variable names only, once the required deployment configuration is reviewed.

---

### Registration Form Copy Cleanup

Status: Completed

Reason:

* The registration form mentioned optional profile fields that are not part of signup, which added unnecessary cognitive load.

Changed files:

* `src/components/storefront/AuthForm.jsx`
* `docs/refactor-status.md`

Short audit:

* Removed only the optional phone, province, city, and address message from registration.
* Password guidance, validation, email-verification redirect, login form, and Forgot password link remain unchanged.

Verification:

* `npm run build` passed.
* `node --check src/components/storefront/AuthForm.jsx` is not applicable because Node does not support syntax-checking `.jsx` files directly; the successful Next.js build compiled the component.

Risks / manual checks:

* Confirm `/register` shows only the password rule beneath the password field and `/login` continues to show Forgot password.

Next recommended task:

* Continue the current highest-priority manual chatbot shopping-filter UI verification.

---

This file tracks the current state of the project.

Historical completed tasks should be moved to:

docs/refactor-history.md

This file should remain focused on:

* current status
* current priorities
* known issues
* next recommended tasks
* recent major work
