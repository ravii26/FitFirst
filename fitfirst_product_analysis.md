> ⚠️ **SUPERSEDED DOCUMENT**


> **Historical — superseded.** An August 2026 product assessment, kept for its reasoning. Its missing-feature list and completion estimate are stale — `SYSTEM_IMPROVEMENT_PLAN.md` says so explicitly. Do not plan from this file. Current: [docs/PROJECT_STATUS.md](docs/PROJECT_STATUS.md), [docs/END_TO_END_CHECKLIST.md](docs/END_TO_END_CHECKLIST.md), [docs/MASTER_PLAN.md](docs/MASTER_PLAN.md).

# FitFirst — Full Product Strategy, UX & Gap Analysis

> *A senior product strategist's honest assessment of what was built, what works, what's missing, and what to do next.*

---

## 1. What Exactly Is Being Solved?

### The Real Problem

Independent clothing retailers in India (particularly showroom-style stores) suffer from a **recommendation gap**. Staff instinctively push inventory they remember or what's been slow-moving — not what is genuinely best for the customer standing in front of them. This creates:

- Customers who walk out without buying because nothing "clicked"
- Customers who buy the wrong item and don't return
- Staff who are undertrained or unavailable during peak hours
- Inventory aging because slow-moving items never get surfaced correctly

**The trigger:** A customer walks in, doesn't know what to pick, staff is busy or defaulting to habit, and the customer leaves — or worse, buys something that doesn't fit their skin tone, body type, or occasion.

### Symptom → Root Cause → Behavioral Pattern → Consequence → Desired Outcome

| Layer | Detail |
|---|---|
| **Symptom** | Customers walk out without buying, or return items |
| **Root Cause** | No systematic matching between customer attributes and store inventory |
| **Behavioral Pattern** | Staff recommendation = inventory pressure + memory + bias |
| **Consequence** | Lower basket value, lower conversion, aging stock, poor repeat-visit rate |
| **Desired Outcome** | Each customer gets 3–5 items that genuinely fit them → higher basket value, higher conversion |

### Is Your Framing Correct?

**Mostly yes.** You correctly identified this as a *recommendation quality* problem, not purely a *discovery* problem. The killer insight — baked into your scoring engine — is that **color-skin tone compatibility and body shape-fit type compatibility are the primary signal drivers**, not just category preference. That's smart and non-obvious.

However, one assumption needs scrutiny: **the purchase-logging model is fragile.** Right now, a customer taps "Selected ✓" on the kiosk themselves to log a purchase. In the real world, most customers won't do this — they'll look at the recommendations, hand the tablet back to staff, and go try things on. Purchase attribution will be severely under-counted unless you build a staff-side logging mechanism.

---

## 2. What Was Built — Honest Assessment

### ✅ What Exists & Works Well

#### Kiosk App (port 5174)

| Screen | Status | Quality |
|---|---|---|
| Welcome | ✅ Built | Clean entry point |
| Privacy Notice | ✅ Built | Correct — DPDP Act awareness |
| Gender Select | ✅ Built | Simple, fast |
| Size Entry | ✅ Built | Works |
| Style Preferences | ✅ Built | Gender-contextual preference tags — smart |
| Attribute Entry | ✅ Built | Manual skin tone + body shape selection |
| Camera Scan | ✅ Built (prototype) | Pixel-sampling only — not real ML, but correct pattern |
| Recommendations | ✅ Built | Horizontal scroll, match %, reasons, purchase logging |
| Staff Handoff | ✅ Built | Short 6-char code + auto-reset. Elegant. |

**Flow:** `WELCOME → PRIVACY → GENDER → SIZE → PREFS → ATTRIBUTES → RECOMMENDATIONS → HANDOFF`

The flow is well-sequenced. Back navigation works. 90-second auto-reset on HANDOFF is the right default.

#### Scoring Engine (`backend/src/scoring/engine.ts`)

The scoring engine is the **crown jewel** of this system. It is:
- Fully deterministic — no ML, fully testable
- Layered correctly: hard filters first (stock, size, gender), then scoring
- Weighted sensibly: color (40%) + fit (40%) + preferences (20%) + aging tiebreak (10%)
- Has a minimum base score gate (0.55) — prevents aging boost from rescuing a bad match
- Has unit tests

This is genuinely good engineering for Phase 1.

#### Dashboard App (port 5173)

| Page | Status | Quality |
|---|---|---|
| Analytics | ✅ Built | Pilot verdict card (PASSING/FAILING/INSUFFICIENT_DATA) is excellent |
| Baseline Log | ✅ Built | Daily manual entry, kill threshold reminder |
| Inventory | ✅ Built | Full CRUD, photo upload, stock updates |
| Sessions | ✅ Built | Session log with expandable rows |

#### Backend API (port 3000)

7 route files, 14+ endpoints. Full coverage:
- Sessions CRUD
- Recommendations (scoring + persistence)
- Purchase events
- Analytics summary + chart data
- Products CRUD + stock patch + soft delete
- Baseline logging + kill threshold
- File upload for product images

#### Database Schema

6 models: `Product`, `CustomerSession`, `Recommendation`, `PurchaseEvent`, `DailyBaseline`, `KillThreshold`.

The `KillThreshold` model with `lockedAt` + `lockedBy` — explicitly preventing post-hoc rationalization — is **exceptional product thinking**. Few builders think to make this a first-class concern.

---

## 3. What Is NOT Built (Honest Gap Map)

### Critical Gaps (Will Break Real-World Use)

#### Gap 1: Staff-Side Purchase Logging ❌ CRITICAL

**The problem:** Right now, the only way to log a purchase is if the *customer* taps "Selected ✓" on the kiosk before they walk to the fitting room. In reality:
- Customers complete the kiosk flow, get their handoff code, and walk away
- They will never return to the kiosk to tap "Selected ✓"
- Purchase data will be ~0% in production

**What's needed:** Staff must be able to look up a session by the 6-char code in the Sessions page and mark which items were actually purchased. The Sessions page currently shows data but has no "log purchase" action.

**Impact:** Without this, your primary outcome metric — `recommendedPurchaseRate` — will always be 0% or near-0%, making the pilot verdict permanently "FAILING" for the wrong reason.

#### Gap 2: Sessions Page Has No Staff Action ❌ CRITICAL

The Sessions page is read-only. Staff can see sessions but cannot:
- Search by the 6-char handoff code (critical for the handoff workflow)
- Log a purchase against a session
- Mark which recommended items the customer actually tried or bought

**What's needed:** A search-by-code input + a "Log Purchase" action on the session detail view.

#### Gap 3: Inventory Enum Mismatch ❌ HIGH

The `Inventory.tsx` page uses hardcoded arrays that don't match the Prisma schema:
- `COLOR_FAMILIES` in Inventory.tsx: `["RED", "BLUE", "GREEN"...]` — does not match schema enums like `BRIGHT_WARM`, `JEWEL_TONES`, `DARK_NEUTRAL`
- `FIT_TYPES` in Inventory.tsx: `["REGULAR", "SLIM", "TAILORED", "RELAXED"...]` — schema has `RELAXED_LOOSE`, `FLARED_ANARKALI`, `STRAIGHT_CUT`, `A_LINE`, `WRAPAROUND`, `TAILORED_STRUCTURED`
- `PATTERNS` in Inventory.tsx: `["STRIPED", "CHECKS"...]` — schema has `STRIPES` not `STRIPED`

**Impact:** Products added through the UI dashboard will have invalid enum values rejected by the database.

#### Gap 4: Camera Scan is a Demo, Not a Feature ⚠️ MEDIUM

The `visionAnalyzer.ts` utility does pixel sampling — it takes the average RGB of a canvas region and bucket-maps it. This is not real skin tone detection. Body shape detection from canvas pixels is essentially random. The comment in the code correctly labels it "Phase 2 Vision AI Prototype."

**This is fine for now**, but it needs to be communicated clearly — if it's shown to real customers, they will lose trust when the "detected" skin tone is wrong.

#### Gap 5: No Real-World Image System ⚠️ MEDIUM

Product images default to generic Unsplash photos categorized by garment type (e.g., all KURTAs get the same Unsplash kurta photo). In a real store, customers need to see the *actual item* from the store's inventory. The upload system exists but may not be used by the store owner.

#### Gap 6: No Session Search in Dashboard ⚠️ MEDIUM

Staff cannot search sessions by:
- Handoff code (6-char)
- Time range
- Customer attributes
- Purchase status

A store with 30+ sessions per day will need search to find a specific customer.

#### Gap 7: Stock Depletion Not Automatic ⚠️ LOW (for now)

`stockQty` and `daysInStock` are manually managed. There's no cron job to auto-decrement stock or auto-increment aging. This is fine for Phase 1 but must be addressed before real deployment.

---

## 4. What Is Unnecessarily Complicated

### Remove / Simplify

1. **The "CAMERA" flow from PRIVACY screen** — the PrivacyNotice has two paths: "Continue Manually" and "Scan with Camera." Adding a camera entry point at the privacy stage creates decision paralysis. The camera option should only appear on the ATTRIBUTES screen as an opt-in shortcut, not as a primary fork at step 2.

2. **The body shape detection in the camera scan** — body shape from a front-facing camera at a kiosk is not deterministically possible. Even MediaPipe would struggle. Consider removing body shape from the camera scan entirely and only auto-detecting skin tone (which pixel sampling can approximate reasonably for Indian skin tones).

3. **"Selected ✓" button on the kiosk** — this is the wrong place for purchase logging. Remove it from the kiosk entirely. Purchase logging belongs in the staff dashboard.

4. **The Sessions expanded row showing Product IDs** — staff don't need to see raw Product IDs. They need to see product names, SKUs, and a "mark as purchased" action.

---

## 5. Core Problem, Outcome, and Minimum System

### Core Problem
*A customer walks into a clothing store. Staff recommends based on habit, not fit. The customer leaves without buying, or buys the wrong thing.*

### Core Outcome
**Measurably higher basket value and conversion rate** because every customer gets relevant, in-stock, right-size recommendations — even when staff is busy.

### Minimum System (Phase 1 — Currently 80% Built)

| Component | Status |
|---|---|
| Customer self-service kiosk (5-step flow) | ✅ Built |
| Rules-based scoring engine | ✅ Built |
| Staff dashboard with session lookup + purchase logging | ⚠️ Missing purchase logging |
| Inventory management | ✅ Built (enum mismatch bug) |
| Pilot analytics with baseline comparison | ✅ Built |
| Kill threshold framework | ✅ Built |

### Nice-to-Have (Phase 2)
- Real camera-based skin tone detection (MediaPipe)
- Product image upload with auto-tagging (CLIP)
- Session search by handoff code
- Automated stock aging cron job
- SMS/WhatsApp handoff code delivery

### Do Not Build Yet
- Multi-store SaaS
- Customer loyalty profiles / return visit tracking
- Outfit combination suggestions ("complete the look")
- AI chat interface
- Any ML that requires training data you don't yet have

---

## 6. The Full User Journey — Annotated

### Stage 1: Trigger
**Trigger:** Customer walks in. Staff is busy or unavailable. Kiosk is visible near store entrance.

- User sees: A premium dark-themed kiosk with "FitFirst" branding
- Effort: Zero — purely passive
- System: Idle on WELCOME screen

### Stage 2: Capture (WELCOME → PRIVACY → GENDER → SIZE → PREFS → ATTRIBUTES)
- User sees: Clear one-question-per-screen flow
- User does: 5 taps/selections
- System: Accumulates session state in memory (no backend calls yet)
- Effort: ~90 seconds total (this is the target — current flow may be 3–4 minutes)
- Risk point: ATTRIBUTES screen (skin tone + body shape) causes hesitation. Many customers don't know their "body shape bucket." This is the highest drop-off risk.

**Fix:** Pre-illustrate body shape options with silhouette drawings, not just text labels.

### Stage 3: Processing (RECOMMENDATIONS screen)
- User sees: Loading spinner ("Scoring Store Inventory…")
- System: Creates session in DB → runs scoring engine → persists recommendations
- Effort: 0 (waiting)
- Duration: Should be <1 second with a healthy DB

### Stage 4: Decision (RECOMMENDATIONS screen)
- User sees: Horizontal scroll of 3–8 product cards with match %, price, SKU, 1 reason
- System: Shows top-ranked matches only
- Effort: Low browsing effort, but the horizontal scroll is risky on a fixed kiosk tablet (less intuitive than vertical scroll for most Indian users)
- Risk: If 0 recommendations are returned (no stock in size), user sees nothing — no graceful fallback

**Fix:** If <3 recommendations, relax the size constraint and show "Nearby sizes also available."

### Stage 5: Handoff (HANDOFF screen)
- User sees: 6-char handoff code, instruction to show it to stylist
- System: Auto-resets after 90 seconds
- Effort: Zero
- Risk: **User might forget the code** by the time they reach a stylist

**Fix:** Add a "Send to my phone" option (SMS/WhatsApp with a phone number input) as a V2 feature.

### Stage 6: Purchase (CURRENTLY MISSING in the system)
- Staff looks up the code in the dashboard → pulls up the customer's recommendations → helps them try items on → marks which items were purchased
- **This stage is not implemented on the staff side**

### Stage 7: Reflection (Analytics dashboard)
- Owner sees: Pilot verdict, basket lift, conversion rate vs. threshold
- System: Auto-computes and auto-classifies PASSING/FAILING/INSUFFICIENT_DATA
- Effort: Very low — just check the dashboard weekly

---

## 7. Screen-by-Screen UX Analysis

### Kiosk Screens

#### WELCOME
- **Purpose:** Attract and invite
- **Primary action:** "Start" button
- **Gap:** No idle animation or ambient motion — kiosk sitting idle looks dead. Add a subtle pulsing animation or ambient particle effect to attract attention.

#### PRIVACY
- **Purpose:** Consent
- **Gap:** Two CTAs ("Continue Manually" and "Scan with Camera") create unnecessary decision. Simplify to one CTA: "Continue →"

#### GENDER
- **Purpose:** Department selection
- ✅ Clean. No issues.

#### SIZE
- **Purpose:** Size capture
- **Gap:** Free-text input creates normalization problems. Size "Medium", "M", "m", "38" all need to be handled. Consider a smart picker with common Indian size options (XS/S/M/L/XL/XXL + numeric) and text fallback.

#### STYLE PREFERENCES
- **Purpose:** Category/pattern preference tags
- ✅ Gender-contextual, optional, well-designed
- **Gap:** "CASUAL" and "FORMAL" tags appear in the preferences but don't exist as Product enum values in the schema — they'll have no effect on scoring.

#### ATTRIBUTES (Skin Tone + Body Shape)
- **Purpose:** The most important scoring inputs
- **Gap:** Body shape labels ("RECTANGLE", "TRIANGLE", "INVERTED_T", "HOURGLASS") are meaningless to most customers. Must include visual silhouette illustrations.
- **Gap:** "INVERTED_T" is not a standard term. Most people know "Apple," "Pear," "Hourglass," "Rectangle." Consider friendly labels.

#### CAMERA SCAN
- **Purpose:** Auto-detect skin tone + body shape
- **Gap:** Body shape detection from camera pixels is unreliable. Only skin tone detection has any validity here.
- **Gap:** The current visionAnalyzer samples pixels — it is not ML. Label this clearly as "Estimate" not "Detected."

#### RECOMMENDATIONS
- **Purpose:** Show the curated results
- **Gap:** "Selected ✓" button should be removed — purchase logging belongs on the staff side.
- **Gap:** No fallback if 0 results.
- **Gap:** Horizontal scroll is less intuitive on tablet than vertical card grid.

#### HANDOFF
- **Purpose:** Give customer their code
- ✅ Auto-reset countdown is excellent
- **Gap:** No option to send code to phone (V2)
- **Gap:** "Store Stylists: Enter code in FitFirst Dashboard → Sessions" — staff currently cannot *search by code* in Sessions. This instruction points to a missing feature.

---

### Dashboard Screens

#### ANALYTICS
- ✅ Best page in the dashboard. Pilot verdict card is genuinely excellent.
- **Gap:** No way to know which *products* are driving conversions (top performers).
- The `GET /api/analytics/top-recommendations` endpoint exists — wire it up.

#### BASELINE LOG
- ✅ Clean form with instructions.
- **Gap:** Kill threshold is configured via API/seed only. Should be configurable in the UI for non-developer store owners.

#### INVENTORY
- ⚠️ Enum mismatch will prevent products from being added correctly.
- **Gap:** No bulk import (CSV) — adding 50+ products one-by-one is not realistic.
- **Gap:** No "daysInStock" manual update field in the add/edit form — staff need to be able to set this for items already on the floor.

#### SESSIONS
- ⚠️ Read-only — no staff action available.
- **Critical gap:** No search by 6-char handoff code.
- **Critical gap:** No "Log Purchase" action on session detail.

---

## 8. Behavioral Design Assessment

### What's Working

| Mechanism | Where Used | Effect |
|---|---|---|
| Progressive disclosure | Kiosk: one question per screen | ✅ Reduces overwhelm |
| Defaults | Camera scan falls back to manual | ✅ Graceful degradation |
| Completion signals | Progress bar + step dots | ✅ Reduces drop-off anxiety |
| Commitment device | Kill threshold + lockedAt | ✅ Prevents rationalization |
| Auto-reset | 90s HANDOFF reset | ✅ Kiosk stays clean for next customer |
| Immediate feedback | "✓ Added to Fitting" | ✅ Positive reinforcement |

### What's Missing or Broken

| Missing Mechanism | Impact |
|---|---|
| Visual body shape illustrations | Customers can't self-classify without them |
| Staff attribution for purchases | Primary metric is untracked |
| Fallback for 0 recommendations | Dead-end experience |
| Ambient idle animation on kiosk | Kiosk looks off/broken when idle |
| Session search for staff | Handoff workflow breaks |

---

## 9. Information Architecture

### Current Entities and Status

| Entity | Fields Complete? | Issues |
|---|---|---|
| `Product` | ✅ | Enum mismatch in UI |
| `CustomerSession` | ✅ | — |
| `Recommendation` | ✅ | — |
| `PurchaseEvent` | ✅ | Never populated in practice (no staff UI action) |
| `DailyBaseline` | ✅ | — |
| `KillThreshold` | ✅ | — |

### What's Missing as an Entity

- **StaffLookup** (implied): Staff need to query session by short code — the short code is currently just the last 6 chars of CUID, not stored separately. Add a dedicated index or lookup helper.
- **ProductVariant** (future): Right now a product has a single SKU. In reality, the same item comes in different colors/sizes. This is V3 territory.

---

## 10. Automation Opportunities

| Automation | Input | Output | Priority |
|---|---|---|---|
| Stock aging increment | Cron (daily) | `daysInStock += 1` for all active products | Medium (not needed until going live) |
| Slow-stock alert | `daysInStock > 30` | Dashboard badge / notification | Low |
| Pilot verdict auto-email | Weekly cron | "Your pilot is PASSING/FAILING" email to owner | Low (V2) |
| Recommendation re-ranking | Purchase event logged | Update scoring weights based on actual conversion | V3 (needs data first) |
| CLIP auto-tagging | Product image upload | Auto-classify `colorFamily`, `pattern` | Phase 3 |

---

## 11. Metrics

### Primary Metric
**Recommended Purchase Rate** — what percentage of kiosk sessions result in a customer purchasing at least one recommended item.

*Target: ≥30% (pre-seeded kill threshold)*

### Secondary Metrics

| Metric | Why It Matters |
|---|---|
| Basket Value Lift vs. Baseline | Core business outcome — are kiosk customers spending more? |
| Kiosk Usage Rate | Are staff directing customers to use it? If <40%, the kiosk is being ignored. |
| Average Recommendations Returned | If consistently <3, inventory or size range needs attention |
| Session Completion Rate | What % of sessions reach HANDOFF vs. dropping off at ATTRIBUTES? |

### Failure Metrics (System Health)

| Signal | What It Means |
|---|---|
| `recommendedPurchaseRate` = 0% | Purchase logging is broken (staff not using dashboard) |
| `sessions.total` = 0 per day | Staff are not directing customers to the kiosk |
| `basketValue.liftPct` = null | No baseline data logged |
| Inventory has 0 items in a size | Recommendations return empty for that size |

---

## 12. Real-Life Scenario Testing

| Scenario | Current System Behavior | Pass/Fail |
|---|---|---|
| **Normal day** | Customer completes kiosk → gets recs → shows code → staff looks up session | ⚠️ Fails (no session search by code) |
| **Busy day** | Customers self-serve on kiosk → staff processes handoff codes quickly | ⚠️ Fails (no purchase logging in dashboard) |
| **Low-energy day** | No one actively directs customers to kiosk | ❌ No recovery mechanism — kiosk just sits idle |
| **0 recommendations returned** | Customer sees blank screen, no guidance | ❌ Fails — need fallback |
| **Size not in inventory** | All products filtered out, 0 results | ❌ Fails — need graceful message |
| **Staff can't find session** | Staff searches Sessions page — no search | ❌ Fails |
| **Owner reviews pilot** | Opens Analytics → sees pilot verdict | ✅ Works well |
| **Product enum mismatch** | Staff adds product via dashboard → DB rejects | ❌ Fails |
| **Camera unavailable** | Falls back to manual gracefully | ✅ Works |
| **Customer forgets handoff code** | No recovery path | ⚠️ Minor — auto-reset means code is gone |

---

## 13. MVP vs V2 vs Advanced

### MVP (Complete These Before Going Live)

- [ ] Fix enum mismatch in Inventory.tsx
- [ ] Add session search by 6-char code in Sessions page
- [ ] Add "Log Purchase" action on session detail (staff marks which items were bought)
- [ ] Add fallback message when 0 recommendations are returned
- [ ] Add body shape silhouette illustrations to AttributeEntry screen
- [ ] Remove "Selected ✓" purchase button from kiosk Recommendations screen
- [ ] Simplify PrivacyNotice to single CTA (remove camera fork from early flow)

### V2 (After 4 Weeks of Live Data)

- [ ] Real skin tone detection with MediaPipe (replace pixel sampler)
- [ ] Session search + filter (by date, gender, purchase outcome)
- [ ] Kill threshold configurable via UI (not just seed/API)
- [ ] CSV bulk inventory import
- [ ] Top-performing products widget in Analytics (endpoint exists, not wired)
- [ ] SMS/WhatsApp handoff code delivery
- [ ] Idle animation on kiosk welcome screen
- [ ] Friendly body shape labels ("Pear" instead of "TRIANGLE")

### Advanced (Phase 3+)

- [ ] CLIP auto-tagging from product images
- [ ] ML scoring that learns from purchase history
- [ ] Multi-store support
- [ ] Return visit / loyalty tracking
- [ ] "Complete the look" outfit pairing

---

## 14. Technical Architecture — Current State

```
┌──────────────────┐     ┌──────────────────┐
│   Kiosk App      │     │  Dashboard App   │
│  React + Vite    │     │  React + Vite    │
│  port 5174       │     │  port 5173       │
└────────┬─────────┘     └────────┬─────────┘
         │                        │
         └───────────┬────────────┘
                     ▼
         ┌───────────────────────┐
         │   Fastify API         │
         │   port 3000           │
         │   Prisma ORM          │
         └───────────┬───────────┘
                     ▼
         ┌───────────────────────┐
         │   PostgreSQL          │
         │   (Docker)            │
         └───────────────────────┘
```

**What's good:**
- Fastify is fast and appropriate for this use case
- Prisma schema is clean and well-typed
- Monorepo with shared `package.json` scripts — easy to run all 3 with `npm run dev`
- CORS correctly configured for both origins

**What needs attention:**
- No environment validation on startup (if `DATABASE_URL` is wrong, the app silently fails late)
- Dashboard PIN is stored in frontend env var — acceptable for MVP, not for multi-user
- Upload route stores files in local `uploads/` dir — not suitable for production (needs S3/Cloudinary)
- No rate limiting on the API (low risk for single-store, medium risk for multi-store)

---

## 15. What I Would Change If This Were My Product

### 🔴 What You're Misunderstanding

**The handoff workflow is the entire value delivery mechanism — and it's broken on the staff side.**

You've built an excellent customer-facing funnel. But the moment the customer gets their 6-char code and walks toward a stylist, the system falls apart. The stylist has no way to:
1. Find that session by the code (no search)
2. See what was recommended in a usable format (currently shows raw product IDs)
3. Log what was actually purchased (no action exists)

This means your primary metric will read 0%, your pilot verdict will say FAILING, and you'll conclude the system didn't work — when the system *did* work, you just couldn't measure it.

**This is the most important thing to fix before going live.**

### 🔴 What You're Overcomplicating

**The camera scan is a liability, not an asset, in Phase 1.**

Showing customers a "Analyzing Tone & Silhouette" animation and then attributing them a random body shape via pixel sampling will erode trust when the result is wrong. It looks impressive in a demo. In a real store, when a customer says "it says I'm Hourglass but I'm clearly Pear," the magic evaporates.

**Recommendation:** Disable the camera scan in production until Phase 2 MediaPipe integration is real. Keep the manual attribute selection — it's 10 seconds and accurate.

### 🟡 What You're Missing

**Inventory is the hidden constraint that will break recommendations.**

If your store has 60 products but only 10 are in size M, women's section — those 10 items will be recommended to every M-size woman regardless of fit quality. The scoring engine is smart, but it can only work with what's available.

Before going live:
- Ensure inventory is complete (all active products entered with correct enums)
- Ensure stock quantities are accurate
- Ensure `sizeRange` arrays are normalized (`["S","M","L","XL"]` not `["small","medium"]`)

### 🟡 What You Should Remove

- "Selected ✓" button on the kiosk Recommendations screen
- Camera option from the PrivacyNotice screen (keep only on AttributeEntry as opt-in)
- "CASUAL" and "FORMAL" tags from StylePreferences (they don't match any scoring signal)

### 🟢 What You Should Prioritize (In Order)

1. **Session search by handoff code** — 2 hours of work, unlocks the entire staff workflow
2. **"Log Purchase" action on Sessions page** — 4 hours of work, fixes primary metric
3. **Enum fix in Inventory.tsx** — 30 minutes, critical for data integrity
4. **Body shape illustrations in AttributeEntry** — 2 hours, reduces drop-off at highest-friction step
5. **0-result fallback on Recommendations screen** — 1 hour, prevents dead-end experience

### 🟢 What Could Make This Genuinely Valuable

**The Kill Threshold framework is your biggest differentiator.** No one building a kiosk product is making store owners pre-commit to kill criteria before seeing data. That's intellectually honest and it builds trust. Lean into this more. Make it front-and-center in your pitch — "We're the only system that tells you when to stop."

**The aging boost in the scoring engine is a hidden gem.** Slow-moving stock gets a tiebreak boost — this directly addresses inventory velocity without the store owner knowing it's happening. That's clever. Make sure it's communicated to the store owner as a business feature, not just an engineering detail.

### 🔴 What Will Probably Fail Without Intervention

**Staff adoption.** The kiosk will work. The technology is solid. What will fail is that staff will stop directing customers to use it after Week 1. They'll forget, or customers will say "I don't need that" and staff will stop insisting. 

**This is a people problem, not a product problem.** But you can design for it:
- Add a daily "sessions logged" counter visible to the store owner
- Celebrate first purchase attributed to kiosk with a visible dashboard notification
- Consider a weekly summary email/WhatsApp to the owner: "This week the kiosk helped 12 customers, 4 purchases logged, ₹8,400 in attributed revenue"

---

## 16. Final Prioritized Recommendation

### Before Going Live (This Week)

```
Priority 1 (Critical — system doesn't work without these):
  [ ] Fix enum mismatch in Inventory.tsx COLOR_FAMILIES, FIT_TYPES, PATTERNS
  [ ] Add session search by 6-char code in Sessions page
  [ ] Add "Log Purchase" action on session detail view in Sessions page
  [ ] Remove "Selected ✓" button from Recommendations screen

Priority 2 (High — major UX problems):
  [ ] Add body shape silhouette illustrations to AttributeEntry screen
  [ ] Add 0-result fallback message on Recommendations screen
  [ ] Simplify PrivacyNotice to remove camera fork
  [ ] Fix "CASUAL"/"FORMAL" tags (remove or map to real scoring signals)
```

### After 2 Weeks of Live Data

```
  [ ] Wire up top-recommendations endpoint to Analytics page
  [ ] Make kill threshold editable via UI
  [ ] Add CSV import for inventory
  [ ] Review scoring table weights based on actual purchase data
```

### The One Thing That Matters Most Right Now

**Build the staff-side purchase logging before you go live.**

Without it, you will collect session data but no outcome data. Your pilot verdict will say FAILING because `recommendedPurchaseRate = 0%`. You will conclude the product didn't work. But the real conclusion will just be that you couldn't measure it.

The scoring engine is solid. The kiosk flow is clean. The analytics framework is well-designed. The only thing standing between you and a valid pilot is completing the last mile: **staff can look up a session code and mark what was purchased.**

That is 6 hours of work. It is the most important 6 hours in this project.

---

*Analysis generated: August 2026 | FitFirst Phase 1 MVP · Built by Ravi · Ahmedabad, India*
