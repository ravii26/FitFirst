> ⚠️ **SUPERSEDED DOCUMENT**


> **Historical — superseded.** This describes the Phase 1 screens and API as of August 2026. Its theme, camera, authentication and phase labels no longer match the code. For current work use [docs/PROJECT_STATUS.md](docs/PROJECT_STATUS.md), [docs/END_TO_END_CHECKLIST.md](docs/END_TO_END_CHECKLIST.md) and [docs/PROJECT_CONTEXT.md](docs/PROJECT_CONTEXT.md); for direction use [docs/MASTER_PLAN.md](docs/MASTER_PLAN.md). The screen-by-screen detail below is still useful as reference.

# FitFirst — Complete Project & Page Reference

> Purpose of this file: a single reference doc you can paste into an AI prompt (ChatGPT, Claude, v0, etc.) to explain the whole product and every screen, so the AI has full context when asked to redesign or modify any page's UI.

---

## 1. What FitFirst Is

**FitFirst** is an in-store recommendation kiosk for independent Indian clothing/fashion retailers (sarees, kurtas, sherwanis, lehengas, western wear, kidswear). A customer walks up to a tablet kiosk in the store, answers a few quick questions (department, size, style taste, skin tone, body shape — either manually or via an optional on-device camera scan), and the kiosk shows **real, in-stock garments from that store's live inventory**, ranked by fit and color compatibility — not by "what needs to sell." The customer gets a short handoff code, hands it to a floor stylist, who pulls up the same recommendations on a staff dashboard to help with fitting and checkout.

It is explicitly **not** a generic e-commerce app — it's a boutique-store fitting aid, positioned with a luxury-atelier visual style (gold accents, serif display type, dark theme).

### Monorepo structure
```
FitFirst/
├── backend/          Fastify + Prisma + PostgreSQL API (port 3000)
│   └── ai-service/    Python microservice (CLIP-based) for garment photo auto-tagging
├── dashboard/        React staff dashboard, luxury dark theme (port 5173)
└── kiosk/            React customer-facing touchscreen kiosk (port 5174)
```

### Tech stack
- **Backend**: Fastify (Node/TypeScript), Prisma ORM, PostgreSQL. PIN-based staff auth via `x-dashboard-pin` header (`backend/src/authGuard.ts`).
- **Dashboard**: React + React Router, Chart.js (`react-chartjs-2`) for graphs, plain CSS (no Tailwind) with a custom dark "luxury" design system (CSS variables like `--gold-primary`, `--bg-card`, `--accent`).
- **Kiosk**: React, no router (manual screen-state machine in `App.tsx`), same luxury design language but touch-optimized (large tap targets, big type), gold/dark theme.
- **AI service**: Python (`backend/ai-service/`), CLIP-based zero-shot classifier for auto-tagging uploaded garment photos (category, gender, color family, fit type, pattern) with a heuristic fallback if the model isn't loaded.

### The recommendation engine (rules-based, Phase 1 — no ML)
```
score = colorScore × 0.40  (skin tone → color family compatibility)
      + fitScore   × 0.40  (body shape → fit type compatibility)
      + prefBoost  × 0.20  (customer's tapped style-preference tags)
      + agingBoost ≤ 0.10  (tiebreak boost for slow-moving stock, applied only after threshold gate)
```
Hard gates before scoring: product must be **active**, **in stock**, in the **customer's exact size**, base score ≥ 0.55, and **gender must match** (or product is UNISEX). All lookup tables live in `backend/src/scoring/tables.ts`.

### Data model concepts to know (used across every screen)
- **Session**: one kiosk visit — captures gender, size, skin tone bucket, body shape bucket, style preference tags, timestamp.
- **Recommendation**: a ranked, scored product tied to a session (rank #1, #2, #3…, match %, "reasons" like "Complements your tone").
- **PurchaseEvent**: what the customer actually bought, logged manually by staff on the dashboard, flagged `wasRecommended` true/false — this is what powers the pilot's before/after analytics.
- **Product** (inventory item): SKU, name, category, gender, colorFamily, pattern, fitType, sizeRange, price, stockQty, daysInStock, imageUrl, isActive.
- **BaselineEntry**: a manually logged daily sales summary (pre-kiosk or during-kiosk) used to prove the kiosk actually lifts basket value/conversion vs. a "kill threshold."
- **Handoff Code**: last 6 characters of the session ID, shown big on the kiosk, typed into the dashboard's Sessions search by staff.

### Business/legal framing worth knowing when redesigning
- No biometric photos are ever stored — skin tone/body shape are derived categories from an on-device (browser) analysis; camera frames are never uploaded.
- A Privacy Notice screen (DPDP Act-aligned, India) is shown before any attribute capture, with an explicit "I'd rather not" decline path.
- The dashboard is gated by a 4-digit PIN (default `1234`), not real auth — this is Phase-1 MVP, single-store, single-shared-PIN.
- There's a defined "kill threshold" (15% basket lift, 30% recommended-purchase conversion, 40% kiosk usage rate) — the Analytics page renders a pass/fail "pilot verdict" against it.

---

## 2. Kiosk App (customer-facing, port 5174) — full screen flow

Screen order (state machine, not routes): **Welcome → Privacy → (Camera scan branch) → Gender → Size → Style Preferences → Attribute Entry (skin tone + body shape) → Recommendations → Staff Handoff**. A progress bar + 5 step-dots (Gender/Size/Prefs/Attributes/Recommendations) shows at the top of every screen except Welcome/Privacy/Handoff. A "← Back" button appears everywhere except Welcome, Privacy, Recommendations, and Handoff. Design language: dark background, gold (`#D4AF37`) primary accent, serif display headings ("ATELIER COLLECTION" branding), large touch targets (kiosk-sized, 48–64px tall buttons), rounded "selection cards" and "tiles."

### 2.1 Welcome (`kiosk/src/screens/Welcome.tsx`)
- **Role**: attract/idle screen, sits on the tablet when no one is using it.
- **Content**: gold pill badge "Personal In-Store Recommendation Engine," FitFirst logo mark + "ATELIER COLLECTION" subtag, big serif headline "Curated for your fit & silhouette," subtitle about scanning preferences against the live showroom floor, single large primary CTA button **"Discover My Collection →"**, trust line ("60-Second Consultation • On-Device Privacy Guaranteed • Live In-Stock"), and a footer strip with privacy badges ("🔒 Zero Photo Storage", "✓ Store Inventory Sync") plus a small link to the Staff Dashboard.
- **No progress bar / no header** — this is the only fully "clean" screen.

### 2.2 Privacy Notice (`PrivacyNotice.tsx`)
- **Role**: DPDP-aligned consent screen shown before any personal attribute is captured.
- **Content**: heading "Privacy & Data Guarantee," 4 explainer rows each with an icon + bold title + body text: 🔒 "What we observe," 🚫 "No photos stored," 📋 "What you share," ✋ "Your choice." Three buttons: primary gold **"⚡ Start Fast Camera Scan →"** (jumps straight to Camera screen), ghost **"Manual Selection →"** (goes to Gender screen), and a muted ghost **"I'd rather not"** (declines, resets to Welcome). Footnote about DPDP Act compliance and zero cloud photo storage.

### 2.3 Gender / Department Select (`GenderSelect.tsx`)
- **Role**: choose shopping department, first hard filter on inventory.
- **Content**: heading "Select Department," subtitle about filtering the live catalog. Grid of 3 large selection cards (custom SVG icon + title + subtitle each): **Men's Collection** (Kurtas, Shirts, Trousers & Ethnic Wear), **Women's Collection** (Sarees, Suits, Lehengas & Kurtis), **Junior Collection** (Boys & Girls Ethnic & Formal Wear). Selecting a card advances immediately to Size. (Note: `UNISEX` exists as a data value but has no dedicated card here — it's only selectable via the Camera Scan screen's department selector.)

### 2.4 Size Entry (`SizeEntry.tsx`)
- **Role**: capture the customer's size; size-lists differ by department (Men: XS–3XL + numeric 28–44; Women: XS–2XL + numeric 24–32; Kids: 2Y–14Y).
- **Content**: heading "What is your tailored size?", subtitle noting only in-stock items in that exact size will show. A responsive tile grid of tappable size chips. Footer pill: "📏 Need fitting help? Ask any store stylist on the floor for instant measurement." Tapping a tile advances to Style Preferences.

### 2.5 Style Preferences (`StylePreferences.tsx`)
- **Role**: optional multi-select of garment types/patterns the customer likes, used as the `prefBoost` scoring input.
- **Content**: heading "Select Desired Styles & Patterns" (marked optional), a live counter ("N preferences selected"), a tile grid of toggleable pills — options vary by department (Men: Kurta, Shirt, Trousers, Jeans, Sherwani, Solid, Checks, Embroidered, Block Print, Stripes; Women: Saree, Salwar Kameez, Kurta, Lehenga, Dress, Floral, Solid, Embroidered, Block Print, Paisley; Kids: Kids Kurta, Kids Dress, Kids Shirt, Floral, Checks, Bright/Warm tones, Festive, Casual). CTA button label changes contextually: **"Continue to Fit Profile →"** if anything is selected, or **"Skip & Continue →"** if none selected — this screen can never block progress.

### 2.6 Attribute Entry — skin tone + body shape (`AttributeEntry.tsx`)
- **Role**: manual fallback (and default entry point) for the two attributes that drive `colorScore` and `fitScore`.
- **Content**: an optional gold banner button at top — **"⚡ Use Fast On-Device Camera Scan"** — that jumps to the Camera screen instead. Section 1 "Select Complexion Tone": 4 selection cards, each a colored swatch circle + label + "complements X colors" subtext — Fair/Warm Porcelain, Wheatish/Golden Warmth, Medium/Olive Tan, Deep/Rich Ebony. Section 2 "Select Body Silhouette": 4 selection cards with custom geometric SVG icons — Athletic & Straight (rectangle), Pear/A-Line (triangle), Broad Shoulder (inverted triangle), Curvy & Defined (hourglass). Primary CTA at bottom, disabled/dimmed with text "Select Tone & Cut to Proceed" until both are chosen, then becomes **"Generate Recommendations →"**.

### 2.7 Camera Scan (`CameraScan.tsx`) — optional branch, Phase 2 prototype
- **Role**: on-device webcam capture that estimates skin tone + body shape automatically instead of manual taps (via `kiosk/src/utils/visionAnalyzer.ts`, pixel-sampling — no ML model, no upload).
- **Content**: gold "🔒 100% On-Device • No Photos Saved" badge. A circular video preview (mirrored) that starts large (300px) with a rotating gold "scanning sweep" overlay animation and a 3-second countdown ("Scanning… 3s / 2s / 1s"); the circle shrinks to 160px and turns green-bordered once complete. On completion, a results card appears: a department re-picker (Men's/Women's/Kids/Unisex pill buttons — this is the only screen where Unisex is directly selectable), two attribute badges showing the detected Skin Tone and Body Silhouette, and two actions: primary **"Use These Attributes →"** (confirms and jumps straight to Recommendations) or ghost **"Adjust Manually ✏️"** (goes to the manual Attribute Entry screen instead, pre-filled). If camera permission fails, shows a fallback card: "Camera Access Unavailable" with a **"Select Manually →"** button.

### 2.8 Recommendations (`Recommendations.tsx`)
- **Role**: the payoff screen — shows ranked, scored, real-inventory product matches. On mount it POSTs a new session (or reuses one) then GETs `/api/sessions/:id/recommendations`.
- **States**:
  - **Loading**: spinner + "Scoring Store Inventory…" / "Matching color tones, fit cuts, and live availability."
  - **Error**: "Unable to Load Collection" + message + "Try Again" button (resets kiosk).
  - **Empty** (no matches): 🔍 icon, "No Exact Matches Right Now," suggestion text, two buttons — "Try Different Preferences" (reset) and "Speak with a Stylist →" (goes straight to Handoff so staff can help manually).
  - **Results**: gold pill "✨ N Precision Matches Found," heading "Your Curated Showroom Recommendations," subtitle confirming the size. A **horizontal-scrolling row of product cards** — each has a product photo (category-based Unsplash stock photo fallback if no real photo uploaded) with a "match %" badge overlaid bottom-left, a "SELECTION #N" rank tag, product name, price in ₹, a green checkmark "reason" pill (top scoring reason, e.g. "Complements your tone"), and the SKU. Rank #1 card gets a "top-pick" style treatment. Bottom CTA: **"Complete & Get Stylist Handoff Code →"**.

### 2.9 Staff Handoff (`StaffHandoff.tsx`)
- **Role**: closing screen — gives the customer a short code to hand to a floor stylist, then auto-resets the kiosk for the next customer.
- **Content**: green "✓ Session Generated & Logged" badge, heading "Your Stylist Handoff Code," instructions to present the code to a stylist. A large **code card** showing the 6-character uppercase code (last 6 chars of the session ID) in big display type, with a note "Store Stylists: Enter code in FitFirst Dashboard → Sessions." A ghost button "Finish & Return to Start." A live countdown ("Session auto-resets in Ns") with a shrinking gold progress bar fixed to the bottom of the screen — auto-resets to Welcome after 90 seconds of inactivity.

---

## 3. Staff Dashboard (internal, port 5173) — full page reference

Auth: a full-screen **PIN Login** gate (not a route — a client-side boolean flip) — logo, "FitFirst / Staff Dashboard — Enter PIN to continue," a 4–6 digit password-style input, error shake state on wrong PIN, "Unlock Dashboard" button, footnote showing the default PIN and the env var to change it.

Once unlocked: persistent **left sidebar** (dark, fixed) — logo block, 4 nav links (Analytics / Baseline Log / Inventory / Sessions, each with a small line-icon), and a sidebar footer with a "Phase 1 · MVP Pilot" badge, a **"🖥️ Open Kiosk App ↗"** button (opens the kiosk in a new tab), and a "Lock Dashboard" button (re-locks, does not clear the PIN). Main content area renders the routed page. Routes: `/analytics` (default/root redirect), `/baseline`, `/inventory`, `/sessions`.

### 3.1 Analytics (`dashboard/src/pages/Analytics.tsx`) — default landing page
- **Role**: the pilot's report card — proves (or disproves) that the kiosk is worth keeping, using Chart.js graphs and a pass/fail verdict against the pre-agreed kill threshold.
- **Content**:
  - Page header: "Pilot Analytics," subtitle with total session count.
  - **Pilot Verdict card** (large, color-coded banner): ✅ PASSING (green), ❌ FAILING (red), or ⏳ "Collecting Data / INSUFFICIENT_DATA" (needs ≥20 sessions) — shows title, description, and the three target numbers (basket lift %, conversion %, usage rate %).
  - **Stats grid** (6 stat cards): Kiosk Sessions (total count), Recommended Purchases (count + conversion % + vs-target indicator), Avg Basket — Kiosk Period (₹ + lift % vs baseline + vs-target indicator), Avg Basket — Baseline (₹ + days logged), Total Recommended Revenue (₹, green), Recommendations Made (total count served).
  - **Charts grid** (2 charts, side by side): a **bar chart** "Avg Basket Value by Day" (amber bars = kiosk-active days, gray = baseline days, with a small legend), and a **line/area chart** "Daily Revenue Trend" (green filled line). If no baseline data exists yet: empty-state card pointing the user to the Baseline Log page.

### 3.2 Baseline Log (`BaselineLog.tsx`)
- **Role**: manual daily data-entry form staff fill in every day (pre-launch and during the pilot) so Analytics has something to compare against.
- **Content**:
  - Page header: "Baseline Sales Log," subtitle explaining Phase 0 before/after comparison purpose.
  - Blue info card: "How to use this log" — bulleted instructions (log every day, leave "Kiosk Active" unchecked pre-launch / check it once live, aim for ≥14 baseline days, revenue = gross INR for the day).
  - Success/error alert banners after submit.
  - **"Add Daily Entry" form card**: Date picker, Total Transactions (number), Total Revenue in ₹ (number), Avg Units per Customer (decimal) — laid out in a responsive form grid. A live-computed "Avg Basket Value" pill appears once revenue+transactions are both filled (revenue ÷ transactions). Notes textarea (optional, e.g. "Diwali weekend, higher footfall"). A "Kiosk was active on this day" checkbox with helper text. "Save Entry" primary button.
  - Amber warning card at bottom: "Kill Threshold — Set Before Pilot Starts" — reminds staff the current threshold (15% basket lift, 30% conversion, 40% usage) was pre-seeded and should be confirmed with the store owner and then treated as immutable; includes the raw API path to change it.

### 3.3 Inventory (`Inventory.tsx`)
- **Role**: full product/SKU management — the catalog the kiosk scores against. This is the most feature-dense page.
- **Content**:
  - Page header: "Inventory & Garment Media," subtitle with live filtered product count. A **"+ Add New SKU"** primary button top-right opens the Add Product modal.
  - **Search & filter bar** (card): text search (name/SKU), Gender/Dept dropdown (All/Men/Women/Kids/Unisex), Category dropdown (18 categories: Kurta, Saree, Salwar Kameez, Lehenga, Sherwani, Dhoti, Dupatta, Shirt, Trousers, Jeans, Dress, Skirt, Jacket, Kids Kurta/Shirt/Trousers/Dress, Accessories), "Filter" button.
  - Amber notice banner (conditional): "N products have been in stock over 60 days — aging tiebreak boost automatically applies in kiosk recommendations."
  - **Inventory table** columns: Photo (small clickable thumbnail, opens photo modal; camera-icon placeholder if none), SKU (monospace), Name, Category, Gender (colored badge), Color (family label), Fit (type label), Price (₹), Stock (inline-editable — click "Stock" action to reveal a number input + Save/Cancel, shows red if 0, amber if ≤3, green flash "Saved" confirmation), Days In (flags amber if >60d), Status (Active/Inactive badge), Actions (Photo / Stock / Deactivate buttons — Deactivate asks a confirm dialog and soft-deletes so the item won't score in kiosk recommendations, dims the whole row to 40% opacity when inactive).
  - **Photo Upload modal** (per product): live image preview box, upload via **file picker** (goes through the AI scan/upload pipeline) or **paste an image URL**, "Save Photo" / "Cancel."
  - **Add New SKU modal** (largest UI surface in the app): a gold-bordered **"✨ AI Garment Auto-Tagger"** banner at top — staff upload a garment photo and it's sent through `POST /api/scan-garment` (proxies to the Python AI microservice, CLIP zero-shot classification with a heuristic fallback) which auto-fills Category/Gender/Color Family/Fit Type/Pattern and shows a per-field confidence % row; a warning note appears if the fallback heuristic (not the real CLIP model) was used. Below that, the manual form fields (2-column grid): SKU Code, Garment Name, Category (18 options), Department/Gender, Color Family (9 families: White, Cream/Ivory, Light Pastels, Warm Earth, Bright Warm, Bright Cool, Dark Neutral, Jewel Tones, Multicolor), Fit Type (8 types: Slim, Regular, Relaxed/Loose, Flared/Anarkali, Straight Cut, A-Line, Wraparound, Tailored/Structured), Pattern (10 patterns: Solid, Stripes, Checks, Floral, Geometric, Paisley, Embroidered, Block Print, Abstract, Animal Print), Available Sizes (comma-separated text), Price (₹), Initial Stock Qty, optional Photo URL field. "Create SKU" / "Cancel."

### 3.4 Sessions (`Sessions.tsx`)
- **Role**: the operational bridge between kiosk and floor staff — look up a customer's session by their handoff code, see what was recommended, and log what they actually bought (this data feeds Analytics).
- **Content**:
  - Page header: "Session Log," subtitle with total session count and a hint to search by handoff code.
  - **"Find Session by Handoff Code"** search card: uppercase text input (matches the 6-char code or a partial session ID), a "Clear" button when active, and inline feedback ("No session found for code…" in red, or "✓ N sessions found" in green).
  - **Sessions table** columns: Code (gold monospace pill, the 6-char handoff code), Time (dd MMM, HH:mm), Gender (colored badge), Size, Skin Tone, Body Shape, Preferences (first 2 tags + "+N" overflow), Recs (count), Purchased (count), Revenue (₹ total), Outcome badge (green "✓ Rec'd" if a recommended item was bought, blue "Purchased" if something else was bought, gray "No sale" otherwise), Action ("+ Log Sale" button).
  - **Row expansion**: clicking a row expands an inline detail panel showing every recommendation served in that session as small cards (rank, match %, product name, SKU, price), with a green highlight + "✓ Purchased" tag on any item that was actually bought.
  - **Log Purchase modal**: title shows the handoff code, a dropdown of that session's recommended items (auto-fills the sale amount from the product's price when selected) plus an "Other item (not from recommendations)" option, a Sale Amount (₹) field, Save/Cancel — success message then auto-closes and refreshes the table.

---

## 4. Backend API surface (for context, not UI, but useful when a UI change needs new data)

| Method | Endpoint | Used by |
|---|---|---|
| POST | `/api/sessions` | Kiosk — create session on Recommendations screen mount |
| GET | `/api/sessions/:id` | Session detail |
| GET | `/api/sessions` | Dashboard Sessions page |
| GET | `/api/sessions/:id/recommendations` | Kiosk Recommendations screen |
| POST | `/api/purchase-events` | Dashboard Sessions — Log Purchase modal |
| GET | `/api/purchase-events` | Analytics aggregation |
| GET/POST/PUT | `/api/products` | Dashboard Inventory — list/create/update |
| PATCH | `/api/products/:id/stock` | Dashboard Inventory — inline stock edit |
| PATCH | `/api/products/:id/image` | Dashboard Inventory — photo modal save |
| DELETE | `/api/products/:id` | Dashboard Inventory — Deactivate |
| POST | `/api/upload` | Dashboard Inventory — file-based photo upload |
| POST | `/api/scan-garment` | Dashboard Inventory — AI auto-tagger (proxies to Python `ai-service`) |
| POST/GET | `/api/baseline` | Dashboard Baseline Log |
| GET | `/api/analytics/summary` | Dashboard Analytics — stat cards + pilot verdict |
| GET | `/api/analytics/baseline-chart` | Dashboard Analytics — charts |
| GET | `/api/analytics/top-recommendations`, `/api/analytics/slow-stock` | Analytics (secondary) |
| GET | `/health` | Ops |

Staff-only endpoints require an `x-dashboard-pin` header matching `DASHBOARD_PIN` (see `backend/src/authGuard.ts`).

---

## 5. How to use this doc in a UI-change prompt

When asking an AI to redesign or tweak a page, paste the relevant section(s) above plus something like:

> "Here is the full context for FitFirst, a luxury in-store fashion recommendation kiosk [paste Section 1]. I want you to redesign the **[page name]** page. Here's what it currently does and contains: [paste that page's subsection from Section 2 or 3]. Keep the dark/gold luxury-atelier visual language consistent with the rest of the app. [Describe the specific change you want.]"

This gives the AI the product's purpose, the exact current content/behavior of the page, the data model it's bound to, and the design system it must stay consistent with — everything needed to produce a UI change that fits the rest of the app rather than a generic redesign.
