# FitFirst system improvement plan

Reviewed: 8 September 2026. Scope: application source across the kiosk, dashboard, Fastify API, Prisma schema and seed, Python garment service, tests, configuration, and existing product documents. Generated dependencies and private environment values were excluded.

## Assessment

FitFirst is a working single-store recommendation prototype with much of its visible workflow implemented. It needs stronger inventory, sales, session, and reporting foundations before a store can depend on it daily. Keep the existing React/Fastify/PostgreSQL architecture and warm ivory visual identity. Complete one store's operating workflow before expanding to multiple stores.

The existing `fitfirst_product_analysis.md` is stale: staff purchase logging, handoff-code search, CSV import, top-recommendation reporting, manual body illustrations, and empty-result handling now exist. Its old missing-feature list and completion estimate should not guide implementation.

Verification: `npm run build` succeeded for backend, dashboard and kiosk. `npm test` passed 34 tests across five backend files. Python tests could not run because the available Python interpreter lacks pytest. The kiosk welcome screen was visually inspected at 1280 × 720. Other UI findings are based on component and CSS review; no complete database-backed checkout, camera accuracy, production deployment, or device performance test was performed.

## Existing strengths to retain

- Separate customer and staff applications with a small, understandable API.
- Explicit stock, department, size and eligibility gates in the deterministic scoring engine.
- Manual entry alongside optional camera assistance.
- Staff session lookup, purchase logging, no-purchase UI, inventory upload/import and pilot reporting.
- Garment tagger exposes whether CLIP or the heuristic fallback produced results.
- Server-side PIN checks for staff endpoints and image signature validation have tests.
- Consistent warm backgrounds, serif headings and strong primary buttons.

## Confirmed gaps in the current implementation

### 1. Inventory cannot guarantee the recommended size is available — critical

`backend/prisma/schema.prisma` stores one `stockQty` against a product and a separate `sizeRange`. If M is sold out but L remains, the product can still be recommended for M. There is no variant, location, reservation or stock-movement record.

Introduce ProductVariant with size, colour/SKU where appropriate, and store-level inventory balances. Record receipts, sales, returns, adjustments and reservations as stock movements. Require an initial physical count when migrating: aggregate stock cannot be reliably split between sizes automatically.

### 2. Purchase logging is not a complete sale — critical

`backend/src/routes/purchaseEvents.ts` creates an event and decrements stock in two separate writes. There is no positive-stock condition, transaction encompassing both writes, quantity, order grouping or retry key. Repeated submissions can count twice and stock can go negative. Recommendation attribution is accepted from the client.

`dashboard/src/pages/Sessions.tsx` offers “Other In-Store Item” but submits the literal `__other__` as a product ID. “Update Sale” opens the create-event form; it does not edit a recorded sale.

Create Sale and SaleLine records with variant, quantity, price snapshot, discounts, status, staff identity and external receipt reference. Save the sale and stock change atomically, reject unavailable stock, deduplicate retries, and calculate recommendation attribution on the server. Add corrections, voids and returns with an audit trail. Use a searchable catalogue picker for non-recommended items.

### 3. Reported conversion and basket value are misleading — critical

`backend/src/routes/analytics.ts` divides recommended purchase-event count by session count. One session buying three recommendations contributes three conversions. It divides revenue by item-event count to calculate “basket value,” and labels purchase-event count as sessions with purchase. Baseline basket value is an unweighted average of daily averages. The verdict evaluates all-time data after 20 sessions and does not enforce the stored pilot duration or usage target.

Correct definitions:

- Session conversion = distinct eligible sessions with a qualifying completed purchase / eligible sessions.
- Recommended conversion = distinct eligible sessions buying at least one recommended item / eligible sessions.
- Average basket = completed sale revenue / completed sales, with an explicit returns/discount policy.
- Baseline basket = total baseline revenue / total baseline transactions.
- Usage = kiosk visits / recorded eligible footfall for the same period; it cannot be measured without footfall data.

Add date ranges, store timezone, explicit pilot windows, sample counts and missing-data states. Distinguish attributed revenue from evidence of incremental lift. The revenue chart currently reads daily baseline entries while its description calls them kiosk consultation transactions; correct the label or source.

### 4. Staff authentication ships the credential to browsers — critical

`dashboard/src/lib/api.ts` embeds `VITE_DASHBOARD_PIN` in the frontend and sends it with staff requests. `dashboard/src/App.tsx` checks it locally and displays the demo PIN. Backend checks exist, but the credential is recoverable from the delivered JavaScript.

Use server-validated staff login, password/PIN hashing, expiring sessions, rate limiting, logout and Owner/Manager/Staff permissions. Scope kiosk access separately. Session detail currently returns attributes and purchase records without staff authentication to anyone possessing the full session ID; return a minimal customer view through an expiring, scoped token.

### 5. Size and preference rules exclude valid merchandise — high

- `seed.ts` contains FREE-size sarees, dupattas, dhotis and accessories. `SizeEntry.tsx` never offers FREE, while `engine.ts` requires an exact size intersection. These seeded products cannot appear through the normal picker.
- The picker and seed use `2XL`; adjacent-size fallback uses `XXL`.
- In `recommendations.ts`, `parseInt('4Y')` succeeds before the child-size branch, generating `2`/`6` instead of `2Y`/`6Y`.
- Multi-select sizes are joined into a string, but session validation caps that string at ten characters.
- Waist and chest selections share one untyped set of numbers.
- `CASUAL`, `FESTIVE` and `BRIGHT_WARM` preference choices are not among the category/pattern/gender signals inspected by the engine.
- Category choice is a soft boost, so a requested category is not guaranteed to define the results.

Introduce shared, typed size definitions with category-specific sizing, explicit free-size eligibility, aliases and real arrays. Distinguish requested category from optional preferences. Map every visible preference to a supported catalogue attribute. Offer nearby sizes explicitly as alternatives requiring a fitting check.

### 6. Customer and staff views can diverge — high

`recommendations.ts` recomputes results on each call but persists only when no recommendations already exist. A stock change can cause the customer to see a different list from the staff's stored list. The count-then-create check can race and there is no unique session/product constraint. The kiosk's creation effect has no idempotency protection, including under development StrictMode.

Persist a versioned recommendation run with matched variant, reasons, score breakdown and stock timestamp. Let refresh create an explicit new run and retain which run was shown. Add uniqueness and request deduplication.

### 7. Session operations are local and incomplete — high

No-purchase reasons exist only in browser localStorage. The staff list loads on mount and after local saves; it does not receive new kiosk arrivals automatically. Search only examines the latest 100 fetched sessions. There is no stored unique short code, staff assignment, fitting status or help request.

Persist status and outcome events. Add a searchable server-side handoff code with uniqueness/expiry, cursor pagination, staff assignment and an updating queue. Suggested statuses: Waiting, Assigned, Trying, Purchased, No Purchase and Abandoned. Preserve closure reasons across devices.

### 8. Kiosk recovery and privacy copy need work — high

Only the handoff screen resets automatically. Abandoned sessions on earlier screens remain visible. “Adjust Preferences” resets the entire journey. Tone and shape are mandatory, with guessed defaults in session creation. The privacy screen describes temporary use, but the database persists the derived attributes without an implemented expiry policy or consent record.

Add an all-screen inactivity warning and reset, Start Over and Help controls, recoverable retry, editable answers, and a preference-only route that genuinely omits unprovided attributes. Define retention and implement deletion/anonymisation accordingly; record notice version and consent choice where appropriate. Rewrite privacy text to describe the actual data flow. Existing legal-compliance assertions have not been established by this code review.

### 9. Media and AI need integration validation — high

Uploads return relative `/uploads/...` URLs, while both Vite applications proxy only `/api`. Under the documented separate-port setup, uploaded images resolve against the frontend rather than the backend. Generic Unsplash category images can visually misrepresent the actual item.

Proxy/serve media correctly in development and deployment. Use actual product images with a clearly labelled missing-photo placeholder, thumbnail generation and durable media storage/backup.

The customer camera currently estimates skin tone only, through pixel sampling. Its body-analysis helper and pose packages are unused by the active screen. No detected skin pixels falls back to WHEATISH, and the countdown begins before camera readiness. Treat failed/uncertain sampling as unknown, begin only after usable frames, and keep user correction easy.

The garment service is optional but not started by the root dev command or Compose. Its Node proxy has no timeout and its current tests mock fetch, leaving the real multipart integration unverified. The Python classifier performs synchronous image/model work in an async route and runs separate classification passes for five attributes. Add bounded requests, warm-up, real integration tests and load measurements before choosing a worker design. Model/fallback scores should not be presented as validated accuracy; require human review of uncertain tags.

### 10. Deployment and maintainability are unfinished — high

Migration SQL is absent from the checked-in migration tree, and `.gitignore` excludes migration directories. The seed deletes current business records and creates random baseline figures. Compose provisions PostgreSQL only. There is no checked-in CI workflow, production app deployment configuration, backup/restore procedure or database-readiness check.

Check in migrations; separate clearly marked demo data from production setup; protect seeding; add CI for build, business API tests and Python tests. Configure production routing for both SPAs, API and uploads, HTTPS, environment validation, backups and error monitoring. Replace hardcoded localhost/store branding. Extract shared contracts and common UI components as these flows are revised.

Inventory mutations also need consistent HTTP error handling: several callers treat a resolved fetch as success without checking its status. Enforce enums and nonnegative integer stock in every API path. Improve import preview, duplicate handling and CSV parsing. Add full product editing and reactivation to the UI.

## UI direction and screen plan

Keep the ivory/black/brass palette and serif brand headings. Use clear sans-serif text for decisions, forms and operations. The current welcome screen is composed well at desktop landscape size, but much supporting text is small, and the experience uses more retail jargon than customers need.

1. **Welcome:** “Find something you'll love” and “Find my style.” Offer English, Hindi and Gujarati for the intended store audience. Show real store merchandise and a concise privacy explanation. Replace the static “Live Floor Sync” claim with a real connection indicator.
2. **Shopping needs:** Ask category first, then relevant size, budget and occasion. Keep extras optional. Avoid asking for chest size when someone wants a saree.
3. **Personal preferences:** Ask preferred colours and fit. Keep tone/body guidance optional and skippable. Replace “Calibrate tone & silhouette cut” with “Any fit or colour preferences?”
4. **Results:** Show three strong picks initially with real photos, price, available size, a useful reason, View Details and Add to Try. Include More Options and Edit Preferences without losing answers. Save shortlisted items for staff.
5. **Handoff:** Show the code and selected items, then “Ask staff for these items.” Add a staff queue notification and later an expiring QR handoff. Only show “staff notified” once delivery is confirmed.
6. **Staff home:** Prioritise waiting shoppers, assigned fittings, pending sales and availability alerts. Keep reporting separate from the live queue.
7. **Inventory:** Reduce the default twelve-column table to photo/name, SKU, size availability, price, stock state and actions. Move metadata into a detail drawer. Provide full editing, stock-by-size, shelf/rack location, receipt history and import preview.
8. **Sales:** A basket that accepts any catalogue item, variant and quantity; clear total; receipt reference; explicit corrections and returns. Replace “Complete Attribution” with “Save Sale.”
9. **Reports:** Date-filtered business metrics and a visible explanation of how each is calculated. Display “Not enough data” when requirements are unmet.
10. **Settings:** Store details, staff access, kiosk devices, sizing rules, pilot configuration and feature switches.

Responsive/accessibility work is required across these screens: replace fixed inline multi-column layouts with working breakpoints; reserve header/footer space; allow content scrolling; make product selection keyboard accessible; add modal semantics and focus handling; expose selected states; improve muted text contrast; respect reduced motion; support zoom. Existing CSS for responsive `.recs-grid` is not applied to the inline results layout.

## Delivery sequence and acceptance criteria

### Stage 1 — Stabilise the current pilot

Implementation checkpoint: completed 9 September 2026; awaiting user testing. See [STAGE_1_TEST_GUIDE.md](STAGE_1_TEST_GUIDE.md). Findings above describe the original review; the checklist records the implemented changes and remaining limitations.

Fix shared frontend credentials, sales atomicity and retry safety, broken Other Item/Update Sale behaviour, FREE/2XL/child sizes, preference mismatches, media routing, HTTP errors, recommendation persistence and global idle reset. Correct current metric labels/definitions and stop treating invalid metrics as a pilot verdict. Check in a reproducible migration baseline and isolate demo seeding.

Acceptance: failed requests never display Saved; repeated sale requests never duplicate stock deductions; invalid stock is rejected; normal category/size paths show appropriate items; refresh preserves the recommendation history staff needs; no staff secret ships in browser JavaScript.

### Stage 2 — Complete single-store operations

Introduce variants and stock movements; migrate with a physical size count. Add sales/line items, returns, staff roles, durable session outcomes, unique handoff lookup, an updating queue, assignment, fitting shortlist and product editing.

Acceptance: two staff devices see the same session outcome; a new kiosk request appears without reloading; concurrent attempts to sell the final unit allow one sale; returns restore the correct variant; past sales remain auditable.

### Stage 3 — Redesign the customer and staff flows

Implement the screen plan, language options, optional attributes, budget/occasion, product details, Add to Try and contextual help. Consolidate UI components and responsive styles during this work.

Acceptance: representative shoppers can complete the journey without explanation; portrait and landscape tablets keep all actions reachable; changing preferences preserves unrelated answers; missing camera access never blocks shopping; staff can find and serve a shopper from the queue.

### Stage 4 — Make outcomes measurable and deployment supportable

Add correct sale-based reports, date windows, footfall input, funnel events, no-match reasons, real pilot setup, export, documented metric definitions, database readiness, monitoring, HTTPS, media backups and restore checks. Validate the complete deployment from a clean database.

Acceptance: report totals reconcile to a known sales dataset; one session buying three items counts once for conversion; demo baselines never enter production reports; restart and restore recover both database records and images.

### Stage 5 — Improve recommendations with evidence

Evaluate manual rules and AI tagging on real store inventory with staff-reviewed labels. Tune category relevance, budget, occasion, preference matching and diversity. Version scoring changes. Separate stock-aging priority from customer-match explanations: scores currently can reach 1.1 and should not be displayed as a probability or match percentage.

Acceptance: the retailer can explain why an item was offered, correct incorrect tags and compare changes against a defined evaluation set and live outcomes.

### Stage 6 — Expand into multiple stores

When daily single-store operation is dependable, add Store/Organisation, store-scoped staff memberships, per-store inventory, kiosk enrolment, tenant isolation, central catalogue management, stock transfers and POS integrations. Add loyalty and customer messaging only with a defined user need and consent flow. Full billing/POS replacement, SaaS subscriptions and online commerce are separate scope decisions.

Acceptance: store A cannot access store B's sessions, sales or stock; devices use the correct store; integration retries do not duplicate sales or movements.

## First implementation milestone

Make this sequence dependable: choose category and size → see real available products → shortlist → staff finds the request → log a multi-item sale → update the correct stock → report the result accurately.

The next development task should be the sales, inventory and authentication foundation, accompanied by focused business-flow tests. More visual polish or a larger AI model will not repair these underlying gaps.
