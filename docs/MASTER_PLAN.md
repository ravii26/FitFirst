# FitFirst — Master Plan: from pilot prototype to a product you can pitch and sell

## Context

FitFirst today is a working **single-store pilot prototype** on branch `feature/stage-1-pilot-stabilization`. It has four parts:
- a kiosk
- a staff dashboard
- an API (Fastify, Prisma and Postgres)
- a Python garment tagger

**The goal** is a product you can pitch to clothing shops, which does three things:
1. **Shoppers** quickly get clothes that genuinely suit them (skin tone, body, size, occasion, budget) from **that shop's live stock**. They can see the clothes on themselves (try-on).
2. **Owners** clear **aged stock**.
3. **Salespeople** stop wasting time.

You added **`AI Creation/saree-studio`**, a working virtual try-on prototype, to integrate. You also want:
- POS options, **including shops that want to use *our own* POS** (§7.3)
- sellable plans
- readiness for every scenario
- stronger algorithms (skin tone is vague today)

**Your decisions that shape this plan:**
- **Target shops:** a mix. The catalogue must cover women's ethnic, men's, kids and western wear from day one.
- **POS:** unknown. Work with *any* billing software, or be the billing software.
- **Pilot:** one pilot contact. It must be pitch-ready first.
- **Scope now:** plan only, no code yet.

This plan **builds on** `SYSTEM_IMPROVEMENT_PLAN.md` (SIP, the engineering plan of record, Stages 1–6) and reorders a few items because pitching needs them earlier (§11). It merges an independent architecture review of the code (schema, algorithms, risks).

---

## 1. My honest take

### What is genuinely good (keep it)
- **It solves a real, expensive problem.** About 24% of Indian apparel and footwear on-shelf stock is past its optimal selling window (Vector Consulting, Feb 2026).
- **Recommendations are deterministic and explainable.** A stylist or owner can audit why an item was shown.
- **Engineering discipline is above typical MVPs:**
  - session creation is safe to repeat
  - recommendation snapshots are frozen
  - the sale of the last unit is atomic
  - a locked kill threshold is set before the pilot
  - the SIP is honest about gaps
- **The camera is privacy-first.** No frames leave the device.
- **saree-studio is a well-built MVP.** It has separate consents, redacts provider errors, and has tests that mock the provider.

### What a shop owner or investor would find weak

| # | Weakness | Evidence |
|---|---|---|
| 1 | **The "AI" doesn't do the core job yet.** Skin tone is the average colour of a fixed rectangle over at most 3 frames. There is no face detection, no lighting correction and no undertone (a\* is never computed). Warm shop lights push people into darker buckets. Body shape is a manual pick. The garment AI returns 5 coarse labels and silently swaps invalid answers for the first enum value. | `kiosk/src/utils/visionAnalyzer.ts:77-108`, `backend/ai-service/classifier.py:392-393` |
| 2 | **It can recommend a size that is sold out.** Stock is one number per product. | `backend/prisma/schema.prisma:105-107` |
| 3 | **The dead-stock promise isn't real yet.** `daysInStock` never changes. The boost is a fixed +0.10 the owner can't control, and it can tie a poorly suited old item with a well-suited new one. | `tables.ts:180-186`, `engine.ts:123` |
| 4 | **Matching is too coarse.** 4 depth buckets × 9 colour families; one body table for sarees, shirts and kids. The 0.55 quality gate practically never triggers (lowest table values are 0.60 and 0.50). | `tables.ts:32-132,190`, `engine.ts:80-120` |
| 5 | **It can't be sold to a second shop.** No stores, users, roles or POS link; "Ahmedabad Showroom" is hard-coded. | `Welcome.tsx:35`, dashboard `App.tsx:179` |
| 6 | **Try-on is a separate demo** whose default model **shuts down 2 Oct 2026**. | `AI Creation/saree-studio/app.py:28` |
| 7 | **Colourism risk in the UI.** Swatches are labelled "Fair / Porcelain", "Wheatish / Golden", "Deep / Ebony". | `kiosk/src/screens/AttributeEntry.tsx:8-13` |
| 8 | **Two silent killers aren't addressed anywhere:** the **cataloguing effort** (photos × 1,000+ pieces) and **salesperson adoption**. | — |

### The positioning shift I recommend
- **Sell to owners as a "sell-through engine":** *"We show your older stock to the customers it actually suits, and your salesman gets a stylist's brain."* Styling is the shopper hook; the owner's return on investment is why they pay.
- **Promise "we never recommend what doesn't suit"** (a hard gate, §5.6). It protects trust and answers the owner's fear that the system just pushes old stock.
- **Assisted and phone first.** Saree and lehenga shops serve seated customers at a counter. A staff tablet (assisted mode) and a QR code for the shopper's phone fit that better than a self-serve kiosk. The kiosk becomes the premium option.
- **"Works with your billing software, or *is* your billing software"** (§7). No shop is turned away because of its POS situation.

### At a glance: what's missing, what to improve, what to remove

**Missing:**
- stores, users and roles
- per-size stock
- a real stock age
- sales with the bill number
- POS/Excel sync, and **our own billing option**
- garment attributes (fabric, occasion, neckline, border, measured colours)
- undertone and contrast
- height and fit goals
- a quick/full intake workflow and barcode labels
- a review gate for AI tags
- consent records and data retention
- a live staff queue
- the QR lookbook
- try-on in the product
- Hindi and Gujarati
- owner clearance controls
- demand-gap and holdout-measured reports
- pitch material and pricing

**Improve:**
- skin tone (§5.3)
- per-category rules (§5.5)
- bounded clearance ranking (§5.6)
- garment AI (§5.2)
- kiosk flow: category first, 3 hero picks (§3.3)
- handoff: unique code plus QR (§4)

**Remove:** see §10.

---

## 2. Urgent — Phase 0 (do before any demo; about 2–3 days)

| # | Problem | Why now | Fix |
|---|---|---|---|
| 1 | The garment tagger tries `gemini-2.5-flash` → `gemini-2.0-flash` → `gemini-1.5-flash` (`classifier.py:371`) | 2.0 was shut down 1 Jun 2026 and 1.5 is long gone, so **only 2.5 Flash still works**. Its end date is unclear: Google's deprecations page lists none, other sources say 16 Oct 2026, some users already get 404s, and 2.5 is restricted for new projects. **Treat it as at risk now.** When Gemini fails, it silently falls back to CLIP or to an aspect-ratio heuristic. | <ul><li>Model from env `GEMINI_TAG_MODEL`: a current stable Flash-Lite, e.g. `gemini-3.5-flash-lite`. `gemini-3.1-flash-lite` is also GA but retires 7 May 2027.</li><li>Use a response schema. An invalid value becomes empty and "needs review", never the first enum value.</li><li>Fail loudly: `/health` reports the real engine and the dashboard shows an "AI off" banner.</li><li>Fix `load_dotenv("../.env")`, which depends on the working directory.</li></ul> |
| 2 | saree-studio's model: your local `.env` already uses `google/gemini-3.1-flash-lite-image`, but `DEFAULT_MODEL` in `app.py:28`, the README and `.env.example` still say `google/gemini-2.5-flash-image` | That model **shuts down 2 Oct 2026**. Anyone who clones the code breaks. | Default to `google/gemini-3.1-flash-image` (quality) or `…-flash-lite-image` (cheaper), and update the docs |
| 3 | **Three live keys** (Gemini, OpenRouter, AICredits) are in `AI Creation/saree-studio/.env`. The `.env` was inside the Mac zip (`__MACOSX/saree-studio/._.env` exists). `backend/.env` also has a Gemini key; it's git-ignored, and no key is in git history. | The keys may have been shared | **Rotate all three**, set per-key spend caps, and keep keys only in server env files |
| 4 | Repo hygiene | Reproducible setup | <ul><li>Delete `AI Creation/__MACOSX/`, the macOS `.venv` and `__pycache__`.</li><li>Stop tracking `backend/uploads/*.png`.</li><li>Commit `package-lock.json` (currently ignored) and add `.gitattributes`.</li><li>`.env.example`: add `GEMINI_API_KEY`, `GEMINI_TAG_MODEL` and `AI_SERVICE_URL`; set `DATABASE_URL` to port 5434 to match your `docker-compose.yml` change; update the README.</li><li>Add an `ai-service` entry to `.claude/launch.json`.</li></ul> |
| 5 | The Stage 1 browser check stopped at the preferences screen; recommendations, handoff and the dashboard were never browser-tested | You will demo exactly these screens | Run all 6 checks in `STAGE_1_TEST_GUIDE.md` and record the results |
| 6 | Demo-embarrassing UI | Pitch credibility and colourism risk | <ul><li>Remove the shopper-visible "Staff Dashboard → localhost:5173" link (`Welcome.tsx:129-136`).</li><li>Fix the `&arr;` typo (`SizeEntry.tsx:192`).</li><li>Replace the skin-tone labels with **numbered swatches** (`AttributeEntry.tsx:8-13`).</li></ul> |
| 7 | No CI | Stops regressions | GitHub Actions: build, vitest, pytest and a secret scanner |

> **Update 25 Sep 2026:** item 1 was done differently from this table. Per DEC-16 the tagger now calls **AICredits** (one configurable model) instead of Gemini direct, so the Gemini model list is gone and the `openai` package is now used (see §10). Progress is tracked in the checklist (S05-01 … S05-03).

Item 2 has a **hard deadline (2 Oct)**, item 1 can break any day, and item 3 involves possibly leaked keys. Even though you chose "plan only", I recommend approving Phase 0 before 2 Oct.

---

## 3. The product we're building

### 3.1 Who gets what
| Person | Pain today | What FitFirst gives |
|---|---|---|
| Shopper | 30–60 minutes of browsing; unsure what suits; needs family approval | 3 picks that suit them and are **in stock in their size**; "see it on me"; share with family on WhatsApp |
| Salesperson | Time lost on undecided shoppers; doesn't remember all stock | A live queue showing each shopper's profile, picks, **rack location** and talking points; credit for sales |
| Owner | Aged stock, markdowns, no idea why items don't sell | Aged stock shown first to shoppers it suits, a clearance report in ₹ (holdout-measured), demand gaps, and optionally one system for billing too |

### 3.2 Operating modes (same software, different packaging)
| Mode | Hardware | Best for |
|---|---|---|
| **Assisted** (first-class) | A staff tablet or phone plus a clip-on light | Counter-service shops (sarees, lehengas) where staff unfold pieces for seated customers; your "1 person scans and manages" idea |
| **QR Stylist** (phone-first) | A printed QR standee and the shopper's phone | Small shops, lowest price, and pre-visit use at home |
| **Kiosk** | Portrait touchscreen, webcam with manual white balance, LED light and a grey reference patch | Larger showrooms; most accurate skin tone; the "wow" |

- **One consultation flow** runs in all three modes.
- **Try-on photos always come from a phone** (the shopper's, or staff in assisted mode). A tablet or kiosk front camera can't capture a full body, and a public camera looks bad for privacy. The kiosk shows a QR: "Try it on you".

### 3.3 Journeys

**A. Intake: new stock arrives**
1. Items arrive via a POS/Excel import, FitFirst Billing's *purchase inward*, or manually.
2. **Quick intake** (front photo + tag photo + barcode) takes about 90 s or less and is enough to go live.
3. **Full intake** (all angles) is done for high-value and aged pieces.
4. AI extracts the attributes and measures the colours.
5. Staff review only the highlighted fields.
6. The item goes LIVE with its rack location. If the shop has no barcodes, FitFirst prints labels.

**B. Shopper**
1. Language (EN/HI/GU).
2. Consent, split by purpose.
3. Who it's for: me, someone else, or family.
4. Department, then **category, occasion and budget**.
5. Size, asking only what's relevant.
6. Colour likes and dislikes.
7. Optional tone (camera + confirm, or swatch + quiz) and optional **fit goals**.
8. **3 hero picks** plus more, each with "why it suits you".
9. Shortlist, or "see it on me" (phone).
10. Handoff code plus a QR code. Staff are notified.

**C. Staff**
1. Live queue → claim.
2. See the profile, shortlist, sizes, rack locations and clearance flags.
3. Bring the pieces.
4. Mark each one tried, rejected (with a reason) or bought.

**D. Sale and attribution**
- **Their POS:** the handoff code is typed into the bill narration or remarks, and the sale is imported later.
- **FitFirst Billing:** the cashier scans the shopper's QR and attribution is automatic.
- Staff-app entry is the fallback.

**E. Owner.** A dashboard or WhatsApp daily summary with:
- sessions
- conversions
- **aged stock cleared (₹)**
- clearance lift vs the holdout group
- demand gaps
- staff activity

### 3.4 Architecture (keep React + Fastify + Prisma + Postgres)
```
Kiosk app (kiosk + assisted modes) ─┐
Phone app (lookbook + QR Stylist)  ├──> API (Fastify+Prisma; org/store scoped; SSE for live queue)
Dashboard (owner + staff + intake  │        ├─> Postgres (+ pg-boss job queue: tagging, try-on, POS sync,
  + FitFirst Billing counter)      ─┘        │    retention purge, WhatsApp, daily metrics; LISTEN/NOTIFY)
                                             ├─> Object storage: product images (CDN) · shopper photos in a PRIVATE
                                             │    India-region bucket, 1-day lifecycle, 5-min signed URLs
                                             └─> AI service (Python FastAPI, private, shared-secret, stateless, no DB):
                                                  /garments/analyze · /garments/colors · /tryon/render · /tryon/qa
POS path A: Excel wizard · Tally bridge (Windows service on shop PC) · cloud APIs (Zoho/Shopify/Ginesys/GoFrugal)
POS path B: FitFirst Billing (offline-first counter inside the dashboard app)
```

**Principles:**
- **Skin analysis stays on the device.** Keys stay on the server.
- **Node owns the database; Python owns no state.** Two ORMs on one schema is a trap.
- **Models live in a registry,** each behind a provider adapter. A fixed evaluation set is **re-run on every model swap**. Expect model churn about once a year; we're hitting it right now.
- **Tenancy is set from day one:** `orgId`/`storeId` on every table, a Prisma client extension for scoping, and cross-tenant isolation tests in CI. Add Postgres row-level security later.
- **Shared packages:**
  - `reco-engine`: pure TypeScript, so the kiosk can recommend **offline** from a cached snapshot.
  - `contracts`: zod schemas for every JSON column and API.
  - `consultation-ui`
- **Offline handoff codes** come from a device-prefixed range.
- **The "mobile app" is a PWA first.** Shoppers won't install an app for one shop. Staff install the dashboard PWA. Go native only if a real need appears.

---

## 4. The data we must capture (data dictionary)

"P" = needed for the pilot, "L" = later. The concrete schema and migration are in **Appendix A**. **Money is stored in paise (integers).**

| Area | Entity | Key fields | When |
|---|---|---|---|
| Tenant | Organization, Store, StoreLocation | GSTIN, city/state, timezone, locales, settings; **rack/shelf codes** | P (one org and one store to start) |
| People | User, Membership, AuthSession | Owner logs in by phone OTP; **per-person staff PIN** on enrolled devices (the manager resets it when staff change); roles OWNER/MANAGER/STAFF/INTAKE; POS staff code | P |
| Devices | Device, DeviceEnrollment | kind KIOSK/ASSISTED_TABLET/INTAKE_STATION/BRIDGE_AGENT; **token** (kiosk API calls are public and unthrottled today, `backend/src/index.ts:69-71`); **camera calibration** (colour matrix, white-balance gains, grey reference, expiry); app version; last seen | P |
| Taxonomy (as data) | Category tree, AttributeDefinition/Value, ColorName, SizeSystem, SizeChart, BodyShape | Global defaults plus **per-org overrides** (regional garments without code changes). A category carries its attribute schema, **intake spec** (quick/full angles), **aging policy** and **face-proximity weights**. Colour names are Indian (rani pink, mehendi green, peacock blue…) for the HI/GU UI. | P |
| Catalogue | Product (style), ProductVariant | style code, category, department (WOMEN/MEN/GIRLS/BOYS/UNISEX_ADULT/UNISEX_KIDS), MRP/price, status, sell-by date for festive stock. Variant: SKU, **barcode** (theirs or FitFirst-printed), size system and code (incl. FREE/UNSTITCHED), `isAlterable`, blouse stitched/unstitched. | P |
| Stock | StockBalance, StockMovement, InventoryLot (first in, first out), Reservation, StockCount | on hand/reserved per variant per store; `stockVerifiedAt`; signed movements with source; **lot `receivedAt` + `ageSource`** (RECEIPT / POS_PURCHASE / ESTIMATED_STAFF / ESTIMATED_LEGACY); count sessions | P |
| Media | MediaObject, IntakeSession, ProductImage | storage class (public catalogue vs private short-lived), sha256, expiry; angle, calibrated, cut-out, quality | P |
| Garment intelligence | GarmentAnalysis, ProductAttributeSet (versioned), ProductColor | the raw AI output with model, prompt and cost; the reviewed attribute values with per-field source and confidence; **measured colours in Lab/LCh with role** (BASE/BORDER/PALLU/BLOUSE/DUPATTA/ACCENT) and metallic flag | P |
| Shopper | Visit, ShopperProfile (several per visit = family) | channel, status (WAITING/ASSIGNED/TRYING/PURCHASED/NO_PURCHASE/ABANDONED), **handoff code** (e.g. `FF-7K2Q`, no 0/O/1/I, unique among active visits, also in the QR) with expiry, holdout flag. Profile: categories, occasions, sizes, height, budget, colour likes/dislikes, **fit goals**, depth group, undertone, contrast, method and confidence, `isMinor`. | P |
| Shopper | Customer, CustomerProfile | phone (hashed) → several profiles ("Me", "Mother"); only with an opt-in to be remembered | L |
| Consent | NoticeVersion, ConsentRecord | purpose (personalisation, camera, try-on processing, **provider transfer**, save profile, WhatsApp), notice version and language, method, adult self-attestation, withdrawal | P (DPDP) |
| Recommendations | Ruleset (versioned, immutable once active), MerchPolicy, ProductPush, RecommendationRun/Item | λ, cap on boosted items, holdout %; per item: S, B, boost, final, components, reason codes, business reason; `filterStats` feeds **demand gaps**. **"Edit preferences" becomes a new run on the same visit**; today it creates a second session left "Pending" (`kiosk/src/App.tsx:96-100`). | P |
| Feedback | InteractionEvent, DemandGap | shown/viewed/shortlisted/try-on/tried/rejected (**reason**)/bought/shared; client event id for offline sync | P |
| Try-on | TryOnJob | template/version, provider/model, cache key, **automated QA scores**, cost, latency, consent reference, expiry | P (Phase 4) |
| Sales | Sale, SaleLine, SaleReturn | source (staff app / POS file / bridge / API / **FitFirst Billing**), external bill number (unique per POS), handoff code on bill; per line: attribution method and confidence, **age at sale** | P |
| Our POS | Supplier, PurchaseInward, TaxRule, InvoiceSeries, Invoice, Payment, CreditNote, DayClose, PrintTemplate | see §7.3 | Phase 5B |
| POS sync | ConnectorConfig, MappingTemplate, SyncRun, SyncIssue, ExternalIdMapping | **stock authority** flag, cursors, templates per POS (Tally/Marg/Busy/Vyapar) | P (Excel), L (others) |
| Commercial | Plan, Subscription, Entitlement, UsageCounter, UsageEvent | feature keys (assisted, kiosk, AI tagging, try-on, catalogue photos, POS level, **billing**, multi-store); try-on quota **reserved on enqueue and committed on success** | UsageEvent P, billing L |
| Pilot | DailyBaseline, PilotConfig (from KillThreshold), DailyStoreMetric | store-scoped; holdout %; footfall | P |

**Derived metrics the owner cares about:**
- **Aged stock cleared (₹):** the sum of sale lines that were past the aged threshold at the time of sale.
- **Clearance lift:** aged sell-through in boosted sessions vs the **10% holdout** sessions.
- **Demand gaps:** sessions with fewer than 3 eligible items, grouped by category × size × budget × palette. That becomes a *buying list*: "22 shoppers wanted festive kurtis in XL under ₹2,000 in warm colours; you had 1."
- **Time to purchase** and **items tried per purchase**, which measure salesperson time saved.

**Taxonomy v1 (seeded from today's `backend/ai-service/prompts.py`):**

| Category group | Categories | Attributes that matter most |
|---|---|---|
| Drapes | saree, dupatta, stole | fabric (silk / cotton / georgette / chiffon / crepe / organza / tissue / net), drape weight, border width, pallu heaviness, work (zari / embroidery / print / woven), weave tradition (Banarasi / Kanjeevaram / Bandhani / Patola / Chanderi …), blouse (stitched / unstitched) |
| Ethnic tops and sets | kurta, kurti, anarkali, salwar/churidar suit, co-ord, Indo-western, dress material (unstitched) | silhouette (straight / A-line / anarkali / kaftan / peplum), length, neckline, sleeve, near-face work, bottom type |
| Lehenga sets | lehenga, ghagra-choli, sharara/gharara | skirt flare, embellishment placement, choli coverage, dupatta style |
| Men's ethnic | kurta-pyjama, sherwani, bandhgala, Nehru jacket, dhoti set, pathani | structure, length, collar, embellishment, fabric weight |
| Western tops | shirt, t-shirt, top, blouse, blazer/jacket | fit, neckline, sleeve, collar, pattern scale |
| Western bottoms | trousers, jeans, skirt, shorts | rise, leg shape, length |
| Dresses | dress, gown, jumpsuit | silhouette, length |
| Kids | the same groups by age | comfort fabric, occasion, age/height sizing |

**Every garment** also gets: measured colours with their role, pattern type, scale and contrast, craft/work, occasions, seasons, and price band.

---

## 5. Algorithms — the core of the product

### 5.1 Principle: "AI sees, rules decide, outcomes tune"
- **Perception (AI):** extract objective facts about garments and people.
- **Judgement (rules):** versioned rules written and validated with 1–2 professional stylists.
- **Tuning (outcomes):** adjust weights from purchases, rejection reasons and the holdout comparison.

An LLM's "who does this suit" opinion is stored only as **staff talking points**, never as the decision.

### 5.2 Garment understanding (inventory intake)

**Two intake levels (cataloguing effort is the real adoption killer):**
- **Quick:** FRONT + TAG photo + a barcode scan. About 90 s per item or less; enough to go live.
- **Full:** the category's full intake spec, e.g. saree: FRONT, PALLU, BORDER, FABRIC, BLOUSE PIECE; kurta: FRONT, BACK, NECKLINE, FABRIC. About 3 minutes or less; done for high-value and aged items.

**Supporting rules:**
- Photos are per style; all sizes share them. Unique pieces like sarees are the exception.
- **Onboarding "dead-stock sprint":** we catalogue your 300 oldest pieces first. That's where the owner's money is.
- **Import the item master and 12–24 months of sales and purchase history** from the POS when available. That gives real stock ages and a year-on-year seasonal baseline, and less manual work.
- FitFirst **prints barcode labels** for shops that have none.

**Pipeline:**
1. The grey card in the first shot of each intake session drives white balance for the batch.
2. Background removal and cut-out.
3. **Measured colours:** k-means (k = 3–5) in CIELAB on garment pixels, giving Lab/LCh, area share, **role** (base / border / pallu / blouse…) and metallic flag.
4. **Vision LLM** with per-category **JSON schema** from the taxonomy: per-field confidence; "unknown" allowed; invalid values never replaced by a guess.
5. OCR of the tag pre-fills SKU, MRP and size.
6. **Review queue:** fields are highlighted when confidence is below 0.7 or the LLM's colour name disagrees with the measured colour. Staff approve, and the item goes LIVE.
7. The difference between the AI draft and the approved version gives a **per-field accuracy report**.

**Cost:** about ₹0.5–1 per style.

### 5.3 Skin tone v2 (on the device; nothing uploaded)

1. **Controlled capture (kiosk):**
   - LED panel at 5000–5600 K with CRI 90 or higher.
   - A **grey reference patch** in view.
   - Exposure and white balance locked with `MediaStreamTrack.applyConstraints`, where `getCapabilities()` allows it (Chrome 101+ on Windows). This is a **hardware buying criterion**.
   - Per-device calibration with an expiry.

   Assisted and phone modes use a clip-on light and on-screen guidance, and rely more on confirmation.
2. **Find skin:**
   - MediaPipe Tasks-Vision **Face Landmarker**, with quality gates: face size, yaw/pitch under 15°, eyes open.
   - **Image Segmenter `selfie_multiclass_256x256`**: face-skin, body-skin, hair and clothes classes. Using face-skin excludes beards.
3. **ROIs:** forehead plus upper cheeks, intersected with the face-skin mask. Drop the top ~5% L\* (highlights) and bottom ~10% (shadows).
4. **20–30 frames:** take the median in linear RGB, normalise exposure with the grey patch (grey read to Y = 0.18), then convert to CIELAB (D65), **keeping a\***.
5. **Depth:**
   - ITA → **depth groups D1–D5** (standard colorimetry bands: D1 above 41°, D2 28–41°, D3 10–28°, D4 −30° to 10°, D5 below −30°).
   - **Do not match camera colours to Monk swatch hex values.** They are display colours (MST-1 L\* ≈ 94, MST-10 ≈ 15), far outside measured skin.
   - Instead, show the 3 **Monk swatches** nearest the predicted group. The shopper's pick is the label.
   - Fit an ITA→Monk mapping after about 200 confirmed labels.
6. **Undertone** is judged relative to the depth group, not by a global cut-off. Indian skin's median hue angle is about 61°; darker skin sits around 42–65°.
   - Hue residual Δh = h − median hue for that depth group. Use the store's own median after 50 or more samples; start from population priors.
   - Default thresholds:
     - **warm** if Δh ≥ +3.5°
     - **cool** if Δh ≤ −3.5°
     - **olive** if Δh ≥ +2° and the a\* residual ≤ −2
     - **neutral** otherwise
   - **Abstain** (unknown) if the frame-to-frame hue spread is over 3° or the calibration has expired.
   - Undertone gets **at most 0.3** of the colour score.
   - Calibrate on 200 or more labelled shoppers (stylist plus self-report).
7. **Contrast:** skin–hair ΔL\* ≥ 45 is HIGH, 25–45 MEDIUM, under 25 LOW. Covered hair gives UNKNOWN.
8. **Confidence** comes from:
   - good frames
   - cheek/forehead agreement
   - grey patch found and within range
   - **makeup check:** face-skin vs neck-skin ΔE00 over 6 lowers confidence

   When confidence is low, show nearby swatches and let the shopper pick.
9. **Output:** `{depthGroup, mstPick, undertone, contrast, lab, method, confidence}`. No images are stored.

**Language rules (colourism is a real brand and legal risk):**
- Never say fair, dark or wheatish.
- Show "Tone 6 · warm undertone · medium contrast".
- Never promise "look fairer" or "look slimmer".
- A stylist and a sensitivity reviewer check all copy in EN/HI/GU.

**Fallbacks:** when there's no camera, the shopper declines, wears a hijab, or it's a Kids profile, use a swatch pick plus 3 questions:
- Gold or silver jewellery?
- Wrist veins green, blue, or both?
- In the sun you tan, burn, or both?

### 5.4 Fit goals, body shape, height, size

**Default: ask about fit goals, not body labels.** "What should your outfit do?"
- balance hips
- define waist
- look taller
- streamline midsection
- broaden shoulders (men)
- relaxed and comfortable

The rules map goals to silhouettes directly. This avoids body-shaming.

**Optional:** a 2-question **shape quiz** confirmed on silhouettes, for shoppers who like it.
- Women: hourglass, pear, inverted triangle, rectangle, apple.
- Men: rectangle, triangle, inverted triangle, oval, trapezoid.

**Also:**
- **Height** is asked, giving a band: petite, average or tall.
- **Kids:** age and height only.
- **No camera body estimate for the pilot.** It is only an experiment later (Phase 6), on fitted clothing, after evaluation. Draped and loose garments break silhouette estimates.

**INDIAsize (NIFT):**
- 3 height groups × 5 shapes.
- Charts are **paid, ₹20,000 per chart plus tax**. Buy only the pilot's height groups, and only after the pilot proves value.

**Size is asked per category:**
- letter size for tops and kurtas
- waist for bottoms
- age for kids
- FREE for sarees and dupattas
- **UNSTITCHED** items (blouse pieces, dress material) are shown as "stitching required", with "stitching available" when the shop offers it, instead of being filtered by size
- an `isAlterable` flag on variants

### 5.5 Suitability knowledge base (stylist rules)

**Structure:**
- Rulesets are **versioned JSON, immutable once active**: clone → edit → activate. A Rules Studio UI comes later.
- There are rules per category group.
- **Each rule** has the form: `when (person features AND garment features) → score effect + explanation (EN/HI/GU)`.

**Example rules** (for stylist validation):

| Group | When | Effect |
|---|---|---|
| Drapes | Petite + broad border or large motifs | − "Thin borders elongate a petite frame" |
| Drapes | Tall + broad border / heavy silk | + |
| Drapes | Goal "streamline midsection" + stiff fabric (organza, tissue) | −; flowing georgette, chiffon or crepe is + |
| Ethnic tops | Goal "balance hips" + A-line or anarkali | + |
| Ethnic tops | Goal "streamline midsection" + empire or straight long kurta | +; heavy waist belt is − |
| Lehenga | Goal "balance shoulders" + flared, embellished skirt with plain choli | + |
| Men's ethnic | Petite + long kurta with contrasting bottom | −; tonal or vertical lines are + |
| All | High personal contrast + high-contrast print | +; low contrast + soft tonal is + |

**Colour harmony is numeric.** Each garment colour cluster is weighted by area × (0.3 + 0.7 × face-proximity). Face-proximity comes from the category, e.g. saree: pallu 1.0, blouse 0.8, base 0.4.

| Term | Weight |
|---|---|
| Hue-sector fit to the shopper's palette | 0.45 |
| Contrast fit (lightness gap vs the contrast target) | 0.30 |
| Chroma fit | 0.25 |
| Washout penalty (garment within ΔE00 10 of the skin and chroma under 25) | −0.35 |
| Metallic bonus (gold zari for warm, silver for cool) | ±0.05 |

The palette comes from undertone, depth and contrast. Warm favours reds, rusts, mustards, olives and gold. Cool favours blues, purples, magentas, emerald and silver.

**The "Suits" card (your "AI tells us which type of people it suits" idea, done transparently):** every product shows a card *computed* from its approved attributes and the rules. For example:
- **Best for:** warm and neutral undertones; goals "balance hips" and "define waist"; average or tall height.
- **Occasions:** festive and wedding.
- **Less ideal for:** petite frames (broad border).

It updates everywhere when a stylist edits a rule.

### 5.6 Ranking and dead-stock logic (with guardrails)

1. **Hard filters:**
   - store and LIVE status
   - department
   - requested category and occasion
   - **a variant in size with stock** (or FREE, alterable, or unstitched)
   - price up to 1.15 × budget
   - no minors' try-on
2. **Suitability S (0–1):**
   - A weighted sum over components **with known inputs**, with the weights renormalised per category group. The defaults below change by group; bottoms, for example, lower colour and raise silhouette.

     | Component | Default weight |
     |---|---|
     | Colour | 0.35 |
     | Silhouette vs fit goals and shape | 0.30 |
     | Proportion | 0.10 |
     | Occasion, season and fabric | 0.10 |
     | Preferences | 0.15 |
   - **Unreviewed AI tags shrink toward neutral:** s̃ = c·s + (1 − c)·0.5.
   - **Size factor:** exact 1.0, free 0.97, alterable 0.90, adjacent 0.80.
3. **Gates, relative to the best match** (they replace the 0.55 gate that never fires):
   - Show an item only if S ≥ max(0.45, S_top − 0.30).
   - An item may be boosted only if S ≥ max(0.60, S_top − 0.12).
4. **Business priority B (0–1)** = max(aging, 0.8 × overstock-in-size, owner push weight, festive sell-by urgency).
   - B is divided by (1 + impressions over 7 days / 20), which **spreads exposure** so not every shopper sees the same saree.
   - Aging = clamp((lot age − fresh) / (dead − fresh), 0, 1).
   - Default fresh→dead days (configurable per category):

     | Group | Fresh → dead days |
     |---|---|
     | Western | 60 → 180 |
     | Everyday ethnic | 90 → 270 |
     | Occasion wear | 150 → 450 |
5. **Final = S + λ · B** (boost-eligible items only).
   - λ comes from the owner's **"Clearance priority"**: Off 0, Low 0.03, Medium 0.06, High 0.09.
   - Since the boost is always below 0.10, **an aged item can never outrank one that suits 0.10 or more better**. This holds by construction.
   - At most **2 boosted items in the top 5**.
6. **Transparency (and dark-pattern safety):**
   - Items with an active offer show "Store pick · offer".
   - A one-line "How picks are chosen" note: *we rank pieces that suit you; the store may highlight pieces on offer*.
   - There is never a match %.
7. **Holdout:** 10% of sessions get no boost, so the **clearance lift is measured**, not claimed.
8. **Diversity:** MMR (μ = 0.75) over category, colour ΔE, pattern, silhouette and price, giving **3 hero picks + up to 6 more**.
9. **Persist everything:**
   - S components, B, λ, the holdout flag, ruleset version and stock timestamp.
   - **Shoppers see "why it suits you".** Staff also see "Priority: in stock 140 days".

### 5.7 Explanations
- Built from **templates** using the top 2 components, e.g. "Deep maroon brings out your warm undertone" and "A-line cut balances your hips".
- Translated into EN/HI/GU. They are deterministic and auditable.
- An LLM may polish **staff talking points** at intake time only.

### 5.8 Proving it works (evaluation) and learning later

| Test | Sample | Target |
|---|---|---|
| Garment attributes | 150–300 stylist-labelled garments | category and silhouette ≥ 90% |
| Garment colour | same garments | measured colour ΔE ≤ 5 |
| Skin repeatability | the same person scanned 5 times, 2 lighting set-ups | **same depth group ≥ 90%** |
| Skin agreement | 50–100 volunteers × 3 lighting set-ups | depth within 1 group of the stylist or self-pick ≥ 80% |
| Undertone | same volunteers, where not abstained | agreement ≥ 70–75% |
| Intake speed | 50 items | median ≤ 90 s quick / ≤ 3 min full |

- **Engine property tests:**
  - a boosted item never outranks one that is ≥ λ better suited
  - at most 2 boosted items in the top 5
  - it still recommends offline
- **Blind stylist panel:** 30 shopper profiles, old engine vs v2.
- **Pilot:**
  - log the funnel: shown → shortlisted → tried → bought or rejected, with the reason
  - holdout lift
  - tune weights monthly
  - try learned re-weighting after 1,000 or more sessions

---

## 6. Integrating "AI Creation" (virtual try-on)

**Reuse from `saree-studio/app.py`:**
- `normalize_image`, `closest_aspect`, `chat_image`
- `redact`, `provider_error_message` and the HTTP status → message map
- the prompt skeleton
- the two consent gates, the one-job-in-flight rule and deduplication
- the before/after slider
- the mocked-provider tests

**Discard:**
- in-memory sessions, jobs and semaphore
- the localhost-only host check
- `catalogue.json` (CC BY-SA images)
- the hard-coded AICredits URL and default model

**Integration design:**
1. **Location:** `backend/ai-service/tryon/` (`/tryon/render`, `/tryon/qa`). The Node API owns the `TryOnJob` records, and the pg-boss worker runs them.
2. **Provider routing:**
   - **Gemini image editing** (`gemini-3.1-flash-image`; `…-flash-lite-image` for cheaper previews) for sarees, lehengas, kurta sets and sherwanis.
   - **Vertex AI Virtual Try-On** only for western tops, bottoms and one-pieces. It doesn't support draped garments, and its quota is 50 requests per minute.
   - AICredits and OpenRouter stay as optional gateways.
3. **Prompt templates per category group:**
   - The saree template takes a **drape style**: Nivi, **Gujarati seedha pallu**, Bengali or Nauvari.
   - Every template uses **up to 3 real product photos** (front, fabric, pallu/border) plus the approved attributes.
4. **Photo capture:** from a phone. The pose is checked for a full body in frame before sending.
5. **Consent, privacy and law:**
   - A separate consent for **sending the photo to the AI provider**.
   - **18+ only.**
   - Photos go to a private India-region bucket with a **1-day lifecycle** and 5-minute signed URLs, never the public `/uploads` route. Today every upload is public (`backend/src/index.ts:58-61`).
   - **Paid API tiers only;** on the free tier, Google may use the data to improve its products.
   - **A DPA (data processing agreement)** with any gateway before shopper photos pass through it. Otherwise go direct to Google.
   - **India's IT Amendment Rules 2026 (in force 20 Feb 2026):** a visible "AI-generated preview" label plus embedded metadata.
6. **Automated QA before showing a result:**
   - **skin preserved:** ΔE00 ≤ 5 and lightness drop ≤ 3. This is a colourism guard: never lighten skin.
   - exactly one person
   - garment colour within ΔE00 10 of the product's base colour
   - shoulder/hip width change ≤ 5% (no body reshaping)

   On failure, regenerate once, then show "couldn't render this one well".
7. **Performance and cost:**
   - p50 ≤ 25 s.
   - About **₹6–7 per 1K image including GST**. 30 sessions a day × 3 renders ≈ ₹18k/month, so this needs quotas:
     - try-ons only when the shopper taps
     - 3 per visit, and staff can extend
     - monthly credits per plan, reserved when a job is queued
     - a platform kill-switch
8. **Growth loop:** "Share to WhatsApp" with the **shop's branding** is free marketing for the owner.
9. **Enable a category** only once **80% or more** of outputs pass the rubric on its evaluation set.
10. **Keep the standalone saree-studio** as a demo tool, pointed at *our own* photographed garments.
11. **Second revenue line:** "AI catalogue photos", on-model images of the owner's stock using the **batch API (−50%)**.

---

## 7. POS — two paths: "works with your billing software" or "use ours"

### 7.1 Which path for which shop
| Shop situation | Path |
|---|---|
| Uses billing software and is happy with it | **A: Integrate** (§7.2) |
| Chain on a retail ERP (Ginesys, GoFrugal, Logic) | **A only.** Never try to replace an ERP. |
| Uses outdated or disliked software, or wants one system | **B: switch to FitFirst Billing** (§7.3) |
| No software (manual bill book) | **B.** Start with the counter-sale subset; add GST invoicing when v1 is ready |

### 7.2 Path A: integrate with their POS

| Level | How | For | Freshness | Effort |
|---|---|---|---|---|
| **L0 Manual** | Staff mark sales in the staff app | Everyone (fallback) | Real time if disciplined | None |
| **L1 Excel/CSV** | Export from their software → upload or drop in a folder. A **column-mapping wizard** with saved templates (Tally, Vyapar first; then Marg, Busy, generic), size regex transforms, and a **preview/diff** before applying. | Most small shops | Daily | Low (build first; **test on the pilot shop's real export**) |
| **L2 Bridge** | A Windows service on the billing PC | Tally/Marg/Busy shops | ~15 min | Medium |
| **L3 Cloud API** | Zoho, Shopify POS, Ginesys, GoFrugal | Chains and modern shops | Real time | Built only when a paying shop needs it |

**L1 details:**
- Replace the hand-rolled CSV parser in `backend/src/routes/products.ts:124-297` (it can't handle quoted newlines) with a maintained CSV parser plus an `.xlsx` reader.
- Take the file as an upload, not in a JSON body (which has a ~1 MB limit).
- Never silently reset age or reactivate items. Both happen today.

**L2 details:**
- Read-only; outbound HTTPS only.
- Reads Tally over XML or **JSON (TallyPrime 7.0+)** on port 9000, with ALTERID incremental cursors, or watches an export folder.
- The handoff code goes in the voucher **Narration** field.
- Build it in Go as a signed service (needs Windows 10+), with a .NET 4.8 fallback for older shop PCs.

**Stock authority:**
- A per-connector flag says whether the POS owns quantities.
- If it does, a staff "mark sold" in FitFirst creates a *reservation* that the imported POS sale confirms. That prevents double-decrementing.
- A **reconciliation report** flags where FitFirst and the POS disagree. It also catches POS quirks such as negative stock, which Tally allows.

**Attribution (only deterministic links count in headline numbers):**
1. The handoff code on the bill's narration or remarks. This works with *any* POS.
2. QR scanned at billing, or a Shopify POS extension or order note.
3. Staff linked the sale to the session.

Probabilistic matching (a recommended item sold within 3 h) is shown **only as the upper end of a range**.

**Day one:** import 12–24 months of sales and purchase history.

**Discovery checklist for the pitch meeting:**
- Which software and version?
- Barcode tags on garments?
- Can you export items with stock and purchase date?
- Who enters stock?
- How many pieces and styles?
- Internet at the counter?
- Can we install an agent on the billing PC?
- Are you happy with your billing software (→ path B)?

### 7.3 Path B: "FitFirst Billing", our own POS for shops that want it

**Recommendation:** build it as a **focused counter-billing module**, not a general POS or accounting company.

**Why it's worth it:**
- No integration friction.
- **Perfect attribution** (scan the shopper's QR at billing).
- Real-time stock truth.
- One vendor and one login.
- Very sticky.
- Most of the foundation already comes with Phase 1: variants, barcodes, stock movements, Sale/SaleLine, returns.

**Why be careful:**
- Billing is mission-critical. If it stops, the shop stops selling, so it must be **offline-first**.
- It must be GST-correct.
- Printers are a support burden.
- India's standalone billing-app market is crowded and cheap. **Don't try to win on billing alone.**

**MVP scope (v1, "counter billing"):**
- **Sell:**
  - scan a barcode (USB/Bluetooth scanners act as keyboards; phone camera scan also works) or search
  - **scan the shopper's FitFirst QR** to pull their shortlist, which makes attribution automatic
  - line and bill discounts (bargaining); overrides need a manager PIN above a limit
  - **never sell above MRP** (Legal Metrology)
- **GST, with tax rules as data:** keyed by HSN, versioned with effective dates, since rates change.
  - Readymade garments currently: **5% if the sale value per piece is ≤ ₹2,500, 18% above**, since 22 Sep 2025.
  - The slab is based on the **actual price after discount**: a ₹3,000 kurta sold at ₹2,400 is 5%.
  - Fabric items (many sarees, dress material) follow their own HSN rules.
  - CGST+SGST within the state, IGST across states; back-calculation from tax-inclusive MRP.
  - **The shop's CA reviews the rules and templates before the first live bill.**
- **Documents:**
  - Tax Invoice for regular GST shops.
  - **Bill of Supply** for composition-scheme shops.
  - A plain receipt for unregistered shops.
  - Invoice numbers are consecutive, **unique per financial year**, at most 16 characters, and multiple series are allowed. **One series per counter device** (e.g. `C1/26-27/00123`) means offline billing never collides.
  - B2B invoices carry the customer's GSTIN.
  - Invoices are **immutable**: corrections happen only through credit and debit notes.
- **Payments:**
  - cash
  - **UPI dynamic QR with the exact amount** via a UPI intent link: no payment gateway needed; staff confirm receipt
  - card on the shop's existing terminal (recorded)
  - split payment
- **Outputs:** 58/80 mm thermal receipt, A4/A5 PDF, and a **WhatsApp e-bill link** with the shop's branding.
- **Returns and exchanges** (exchange is the Indian norm): a credit note in its own series; exchange = return + new sale in one screen; restock to the right variant and lot.
- **Day close:** cash count vs expected, payment-mode summary, Z-report.
- **Reports and exports:**
  - sales register
  - GST summary by rate and HSN
  - **GSTR-1 export** in the portal's current format
  - **Tally voucher export**, so the shop's CA keeps using Tally
  - Excel export
- **Offline-first:** a local queue plus the per-device series; sync later; stock conflicts are flagged, never blocking.
- **Purchase inward** (it also feeds stock age):
  1. Enter the supplier bill: items, sizes, quantity, cost and MRP.
  2. This creates inventory lots.
  3. **Print barcode labels.**
  4. The items flow into intake photos.

**Later (v2+):**
- auto-confirmed UPI and card through a payment partner or soundbox API
- khata (customer credit)
- loyalty and gift vouchers
- multi-counter
- store transfers
- supplier ledger and purchase returns
- **e-invoicing (IRN), only for shops over ₹5 crore turnover with B2B sales** (B2C retail invoices are currently outside the mandate)

**Never:** full accounting (ledgers, balance sheet). Export to Tally or Zoho Books instead.

**Hardware (indicative):**
- thermal receipt printer: ~₹3–6k
- barcode label printer: ~₹8–15k
- scanner: ~₹1.5–3k
- cash drawer: optional

It runs on the existing PC, tablet or phone. Keep a **supported-hardware list** of 2–3 models per device type.

**Switching a shop over:**
1. Import the item master and opening stock (L1 wizard).
2. Print any missing barcode labels.
3. Run in **parallel with the old system for 1 week**.
4. Cut over on a quiet day, never during Diwali or wedding peaks.
5. Keep the old exports for the CA.

**Retention:** GST records must be kept for years (72 months under the CGST Act; confirm with the CA). That's a legal-retention exception to DPDP minimisation, so it needs to be documented.

**Effort:**
- The **MVP** is about 4–6 weeks for 1–2 developers on top of Phase 1, plus CA review and printer testing.
- The **counter-sale subset** (sale + receipt + UPI QR + WhatsApp e-bill, no GST invoice) is about 1–2 weeks, if the pilot shop has no software.

**Where it fits in the roadmap:**
- By default, Phase 5B, after the pilot proves the recommendations.
- Pull the counter-sale subset forward if your pilot shop has no billing software.

---

## 8. Plans and pricing (hypotheses: validate them in the pilot and the first 5–10 pitches)

| Plan | For | Includes | Indicative ₹/month |
|---|---|---|---|
| **Pilot** | First shops | Everything for 6–8 weeks, success criteria agreed in advance | Free (or a refundable setup fee) |
| **Lite: QR Stylist** | Small shops | Phone-first flow, staff app, owner dashboard, ~1,000 live styles, AI tagging, POS L0/L1 | 1,499–2,499 |
| **Pro: Assisted/Kiosk** | Mid-size showrooms | Lite + assisted/kiosk modes, calibrated tone, clearance controls, lookbook sharing, ~100 try-ons/month, **FitFirst Billing included** | 3,999–5,999 + hardware |
| **Premium** | Large and multi-store | Pro + POS L2/L3 connectors, multi-store, ~300 try-ons, WhatsApp summaries, priority support | 9,999+ |

**Module matrix** (your "with/without POS, AI suggestions, 1 person, AI photos" ideas):

| Module | Lite | Pro | Premium | Sold separately |
|---|---|---|---|---|
| Core: inventory, intake app, staff app, owner dashboard | ✔ | ✔ | ✔ | — |
| AI suggestions (suitability + clearance ranking) | ✔ | ✔ | ✔ | — |
| Shopper modes | QR/phone | + Assisted + Kiosk | All | Hardware rent/buy |
| **Use their POS** | L0 manual, L1 Excel | L0/L1 | + L2 Tally bridge, L3 cloud connector | Connector setup fee |
| **Use our POS (FitFirst Billing)** | Add-on | ✔ | ✔ | Printers and scanners |
| Virtual try-on | Demo only | ~100/month | ~300/month | Extra packs |
| AI catalogue photos | — | — | Some included | Per image |
| Managed service ("1 person scans and manages") | — | — | Optional | Per piece or retainer |
| Multi-store, WhatsApp summaries | — | — | ✔ | — |

**Add-ons:**
- **FitFirst Billing on Lite:** e.g. ₹499–999/month.
- **Extra try-ons:** e.g. ₹10–15 each.
- **Managed cataloguing** (we photograph and tag): e.g. ₹10–25 per piece or a retainer.
- **AI catalogue photos:** ₹15–30 per image.
- **POS connector setup:** ₹5k–25k, one-time.
- **Hardware:** rent (₹1.5k–3k/month) or buy.

**Optional "Billing-only" entry plan:** land shops with billing and upsell AI later. Validate the demand in pitches first, and don't let it turn FitFirst into a POS company.

**Performance option** (once deterministic attribution is reliable): a lower fixed fee plus a small % of **attributed aged-stock sales**, i.e. "pay when it sells".

**Unit costs:**

| Item | Cost |
|---|---|
| AI tagging | ₹0.5–1 per style |
| Try-on | ₹6–7 per image incl. GST |
| WhatsApp utility message | ~₹0.15 |
| Hosting (early stage) | ₹3–8k/month total |

Try-on is the only cost that grows with usage, so it is capped by quota.

**Hardware (indicative; get quotes):**
- **Assisted:** tablet + stand + light, ₹20–30k.
- **Kiosk:** 24–32" portrait touch display + mini-PC + webcam with manual white balance and exposure + LED panel, ₹60k–1.2L.

**Illustrative return on investment:** ₹10L of aged stock at MRP × 3% a month extra sell-through × (40% margin + ~20% markdown avoided) ≈ **₹18k/month** of benefit against a ₹4,999 plan. The pilot's holdout measures the real number.

---

## 9. Scenario playbook: "what if…"

| Area | Scenario | How FitFirst handles it | Phase |
|---|---|---|---|
| Shopper | Declines the camera, hijab, uncomfortable | Swatch + quiz; never blocks shopping | 2 |
| Shopper | Bad lighting, heavy makeup | Makeup check, low confidence → pick a swatch; abstain rather than guess | 2 |
| Shopper | Wearing a saree or loose clothes | No body estimate anyway; fit goals | 2 |
| Shopper | Shopping for someone else, or a gift | "Someone else" path: manual attributes | 3 |
| Shopper | Family or couple | Several profiles in one visit; share the lookbook with family | 3 |
| Shopper | Minor (under 18) | Parent enters details; no camera, no try-on (DPDP verifiable parental consent) | 2 |
| Shopper | Elderly, low literacy | Assisted mode; icon-led UI; large text; Hindi/Gujarati; optional voice prompts | 3 |
| Shopper | Nothing suits in their size or budget | Labelled nearest alternatives (adjacent size, alterable, slightly over budget); "notify me"; logged as a **demand gap** | 2–3 |
| Shopper | Unstitched item (blouse piece, dress material) | "Stitching required / available" instead of a size filter | 2 |
| Shopper | Item sells out before it's fetched | Live stock check on claim; reservation; swap suggestion | 1 |
| Shopper | Walks away mid-flow | Idle wipe → ABANDONED (funnel data) | 1 |
| Shopper | Returns next week | Optional phone OTP "remember me", with profiles per family member | 5 |
| Shopper | Asks to delete their data | Erase or anonymise by code or phone; audited; automatic retention purge (except bills GST law requires us to keep) | 1 |
| Shopper | Shows an Instagram photo: "something like this" | Visual similar-item search | 6 |
| Shopper | Try-on slow, fails, or looks wrong | Non-blocking; QA gate; regenerate once; failures not charged | 4 |
| Staff | All busy; codes waiting | Live queue with waiting time; codes expire | 1 |
| Staff | Doesn't trust a pick | "Why" + override with a reason (feedback) | 2 |
| Staff | Ignores the system (biggest adoption risk) | Make it *their* tool: sales credited to their name, incentives on pushed aged items, a leaderboard, and faster than their current way | 1–3 |
| Staff | High turnover | Per-person PINs the manager resets; a 10-minute training script | 1 |
| Staff | Gaming attribution | Deterministic evidence only (bill code, QR); audit log | 1–5 |
| Sale | Bargaining, exchange, return, alteration | Actual price stored; credit notes; exchange flow; `isAlterable` | 1 / 5B |
| Billing | Internet down while billing (our POS) | Offline-first counter; per-device invoice series; sync later | 5B |
| Billing | GST rate changes | Tax rules are data with effective dates; the CA reviews the change | 5B |
| Billing | Printer fails | WhatsApp e-bill or PDF fallback; supported-hardware list | 5B |
| Billing | B2B customer wants a GST invoice | Invoice with the customer's GSTIN; B2B section in the GSTR-1 export | 5B |
| Owner | New stock arrives | Purchase inward or import → labels → quick intake → LIVE; items stay DRAFT until reviewed | 1–2 |
| Owner | Festival or wedding season (Navratri, Diwali 8 Nov, weddings) | Sell-by dates, push campaigns, seasonal aging windows; no go-live or cut-over during peaks | 2 |
| Owner | Hides cost price (cost codes on tags) | Aged value = MRP × a configurable cost ratio | 1 |
| Owner | Hide reserved or damaged items | Reservation or DAMAGE movement | 1 |
| Owner | Price changes and discounts | Synced (path A) or native (path B); markdown suggestions for aged items shown a lot but not selling | 1 / 6 |
| Owner | Multiple stores | Store-scoped everything; transfer suggestions | 5 / 6 |
| Owner | SKU codes differ between POS and tags | Mapping tool + reconciliation report | 1 / 5 |
| Tech | Internet down (kiosk) | Offline engine + cached snapshot; on-device tone; queued events; try-on off | 4 |
| Tech | Power cut or reboot | Kiosk auto-launches (Android lock-task or Fully Kiosk Browser); session recovered from the server | 4 |
| Tech | AI model retired (**happening now**) | Model registry, evaluation set on every swap, loud alerts, monthly deprecation check | 0 / 2 |
| Tech | AI costs spike | Quotas reserved on enqueue; budget alerts; kill-switch | 4 |
| Tech | Device theft or tampering | Enrolment and revocation, heartbeat, remote config | 1 |
| Tech | Cross-tenant data leak | Scoping extension + isolation tests in CI; RLS later | 1 |
| Legal | DPDP (consent managers from Nov 2026; everything else from **13 May 2027**) | <ul><li>**The shop is the data fiduciary and FitFirst its processor**, with a DPA template per shop; AI providers are sub-processors.</li><li>Consent by purpose and version; notice in 3 languages; retention jobs; erasure; grievance contact; **breach runbook** (reporting deadlines).</li><li>One-time legal review before the camera or try-on goes beyond the pilot shop.</li></ul> | 1–4 |
| Legal | AI-image labelling (IT Amendment Rules 2026) | Visible "AI-generated preview" label + metadata on every try-on | 4 |
| Legal | Dark patterns (disguised ads) | "Store pick · offer" label + a "How picks are chosen" note | 3 |
| Brand | Colourism or body-shaming complaints | Neutral tone language; fit goals instead of labels; QA blocks skin lightening; copy reviewed by a stylist and a sensitivity reviewer | 0.5–4 |

---

## 10. What to remove or simplify

| Remove | Why |
|---|---|
| CLIP + pixel-heuristic engines, `torch`/`transformers` (`backend/ai-service/classifier.py`, `requirements.txt`) | ~2 GB of dependencies for weak accuracy; the heuristics guess category from aspect ratio. Replace with a vision LLM + measured colour, with manual entry as the fallback. |
| ~~Dead Gemini model list; unused `openai` package and `OPENAI_API_KEY`~~ (done 25 Sep 2026: model list removed; `openai` now calls AICredits);  `test_ai_scan.py` (a manual script that never fails) | Dead or unused |
| `@mediapipe/pose`, `@tensorflow/*` in `kiosk/package.json` (never imported) | Replace with `@mediapipe/tasks-vision` |
| `CATEGORY_PATTERN_AFFINITY` (`tables.ts:138-173`) | Dead code |
| `FAIR/WHEATISH/MEDIUM/DEEP` enum and labels; the depth-only colour table | Depth groups + undertone + Lab harmony; colourism risk |
| The static `daysInStock` | Lot-based age |
| "Score 0.87" / match % displays | Scores aren't probabilities |
| No-purchase reasons in localStorage (`Sessions.tsx`) | Server-side events |
| Hard-coded "Ahmedabad Showroom", localhost links | Store settings |
| Manual `DailyBaseline` ledger | Keep only for shops with no POS history; otherwise import sales |
| `PROJECT_OVERVIEW.md`, `fitfirst_product_analysis.md` | Historical. This plan + the SIP become the documents of record. |
| saree-studio in-memory sessions, hard-coded URL, `catalogue.json` | Durable jobs, provider adapters, our own photos |

---

## 11. Roadmap

**Calendar anchors:** Diwali is 8 Nov 2026 and the wedding season restarts in late November.
- **Pitch in October**, before the festive rush.
- **Go live early December**, targeting **post-Diwali leftover festive stock** during the wedding season. It's the perfect dead-stock story.

| Phase | Window (1–2 devs) | Scope | Done when | SIP mapping |
|---|---|---|---|---|
| **0 Urgent** | now → 1 Oct | §2 | Tagging runs on current models via config; keys rotated; CI green; Stage 1 checklist recorded | Stage 1 close-out, then **freeze v1 features** |
| **0.5 Pitch kit** | 1 → 14 Oct | <ul><li>Demo tenant with ~60 garments **we photograph ourselves**</li><li>Numbered swatches</li><li>saree-studio on our photos + pre-generated try-ons (labelled)</li><li>Dead-stock/ROI calculator</li><li>Tier sheet, demo script, discovery checklist</li></ul> | A 7-minute demo runs on a laptop and tablet; every synthetic number is labelled "illustrative" | New |
| **1 Foundation v2** | Oct | <ul><li>Schema v2 + importer (Appendix A)</li><li>Owner OTP + per-staff PINs + roles</li><li>Device enrolment</li><li>Tenancy + isolation tests</li><li>pg-boss worker; object storage</li><li>Consent + notice records; audit log</li><li>Live staff queue (SSE)</li><li>Sale/SaleLine</li><li>**Deploy:** Mumbai-region VM with HTTPS, managed Postgres with point-in-time restore, error monitoring, a restore drill</li></ul> | SIP Stage 2 acceptance; store A can't read store B; restore recovers rows and images | Stage 2 + tenancy/deploy **pulled forward** |
| **2 Intake and stock truth** | late Oct → Nov | <ul><li>Intake PWA (quick/full, barcode scan/print, grey card)</li><li>`/garments/analyze` + `/garments/colors`</li><li>Review queue</li><li>Lots, aging and count workflow</li><li>**L1 wizard on the pilot's real export**; POS history import</li></ul> | Intake ≤ 90 s quick; per-field accuracy report; ≥ 95% of the pilot's export rows auto-mapped; aged list matches a 30-item audit | Stage 2 + POS L1 from Stage 6 |
| **3 Recommendations v2 and flows** | Oct → early Dec | <ul><li>`reco-engine` (§5.6)</li><li>Ruleset `2026.10-pilot-1` written with the stylist</li><li>One consultation flow (kiosk + assisted)</li><li>Staff PWA</li><li>QR lookbook (no try-on yet)</li><li>Skin tone v2 (may slip past go-live; swatches are enough)</li><li>EN/HI/GU</li></ul> | Property tests pass; offline recommend works; repeatability target met | Stage 3 + versioned rules from Stage 5 |
| **→ PILOT go-live** | ~1–7 Dec | Phases 1–3 (quick intake, count, L1, lookbook), assisted mode first, 10% holdout | Kill threshold + aged-stock KPI with holdout | — |
| **4 Try-on + lookbook** | late Nov → Dec | §6 in full: jobs, QA, quotas, 18+ gate, labelling, retention | p50 ≤ 25 s; ≤ ₹8 per delivered image; photos provably deleted within 24 h; quality bar met on the saree/kurta evaluation set | New |
| **5 POS path A + analytics** | Dec → Jan | Tally bridge + folder watcher; one L3 connector for the pilot's POS; reconciliation; attribution; owner dashboard (aged cleared, lift, demand gaps); WhatsApp daily summary | Replays never duplicate; a hand-audited day reconciles | Stages 4 + 6 |
| **5B FitFirst Billing (path B)** | Jan → Feb (**or the counter-sale subset before go-live** if the pilot shop has no POS) | §7.3 MVP | GST unit tests; CA sign-off; GSTR-1 and Tally exports accepted; offline billing test | **New** (you've now decided POS is in scope) |
| **6 Scale and learning** | Feb onward | Plans/entitlements UI and billing; multi-store and transfers; AI catalogue photos (batch); Rules Studio; outcome-based tuning; OTP profiles; experimental camera body estimate; WhatsApp marketing (consent manager) | SIP Stage 5/6 criteria | Stages 5–6 |

**With 1 developer:**
- Go live in **"pilot-lite"** form (about 7–8 weeks): Phase 1, the quick-intake part of Phase 2, Phase 3 without camera v2, assisted mode, and L1 sync.
- Show try-on as a demo only.

**Your next 30 days:**

| Week | Build | Business |
|---|---|---|
| 1 | Phase 0 | Rotate keys. Meet your pilot contact with the §7.2 discovery checklist. Learn their POS situation, stock size and aged stock. Decide **path A or B** for them. |
| 2 | Phase 0.5 pitch kit | Photograph 60–100 real pieces (with permission). Find a stylist advisor. Get a sample POS export and history. (If they have no POS: start a manual baseline log now.) |
| 3 | Phase 1 starts | Pitch the pilot; agree the kill threshold, aged-stock KPI and holdout in writing. |
| 4 | Phase 1 + L1 wizard on *their* export | Stylist drafts rules v1 and labels the golden set. Book the DPDP (and, for path B, CA) review. |

**Where this plan departs from earlier decisions in the docs:**

| Earlier decision | This plan | Why |
|---|---|---|
| Store/Org, POS integration, deploy late (SIP Stages 4 and 6) | Tenancy, deploy and L1 sync in Phases 1–2 | Cheap now, costly later; pitching and the pilot need them |
| "Full POS replacement is a separate scope decision" | **FitFirst Billing as an optional module (§7.3)** | You've now asked for it; kept focused (no accounting) |
| Garment tagging = CLIP + heuristics | Vision LLM + measured colour; drop CLIP/torch | Weak on ethnic wear; heavy; Gemini already runs first |
| Camera never estimates body shape | Still true for the pilot; fit goals instead; camera estimate only as a Phase 6 experiment | Safety and sensitivity |
| SaaS subscriptions are a separate decision | Plans and entitlements (Phase 6); usage metering from Phase 4 | You want sellable plans |
| Messaging only in Stage 6 | QR lookbook in Phase 3; WhatsApp summaries opt-in in Phase 5 | Core to the assisted and phone strategy |

**Reuse, don't rebuild:**

| Existing code | Reuse it for |
|---|---|
| `routes/sessions.ts`, `purchaseEvents.ts`: `requestKey` idempotency, P2002 race handling | Sales, sync runs, invoices, try-on jobs |
| `routes/recommendations.ts`: `pg_advisory_xact_lock` + frozen snapshot | RecommendationRun |
| `authGuard.ts`: hashed token cookie, CSRF header, rate limit | Per-user auth (limits move to the DB) |
| `imageSniff.ts` | Every upload path |
| `scoring/sizes.ts`: aliases, adjacent sizes | SizeSystem module |
| `analyticsMetrics.ts`: distinct-session metrics | Reports |
| `scripts/check-stage1.ts`: disposable-schema Postgres harness | All new integration checks |
| `visionAnalyzer.ts` `classifySkinToneFromRGB` sRGB→Lab math | Tone v2 (add a\* and hue) |
| saree-studio helpers and tests | `ai-service/tryon/` |
| `ai-service/prompts.py` | Taxonomy seed |

**File-level impact:**

| File | Action |
|---|---|
| `backend/prisma/schema.prisma`, migrations, `seed.ts` | Replace with a v2 baseline; seed splits into taxonomy, rulesets and a guarded demo tenant |
| `backend/src/scoring/*` | Replace with `packages/reco-engine`; `tables.ts` values archived as `rulesets/v1-legacy.json` |
| `backend/src/routes/*` | Move to `src/modules/{visits, reco, sales, catalog, imports, media, intake, analytics, billing}` |
| `backend/src/index.ts` | Modify: modules, tenancy, pg-boss, storage, SSE |
| `backend/ai-service/{classifier,prompts,main}.py` | Patch in P0; replace in P2 with `garments/*` + schemas; add shared-secret auth; remove `CORS *` |
| `AI Creation/saree-studio/app.py` | Port to `backend/ai-service/tryon/`; the UI stays as a demo |
| `kiosk/src/utils/visionAnalyzer.ts` | Replace with `kiosk/src/perception/*` |
| `kiosk/src/screens/*`, `App.tsx` | Rewrite into `packages/consultation-ui` |
| `dashboard/src/pages/Inventory.tsx` | Split into Catalogue, Review queue, Import wizard, Count, Labels |
| `dashboard/src/pages/Sessions.tsx` | Replace with Staff queue + Visit detail |
| `dashboard/src/pages/Analytics.tsx` | Rewrite |
| `docker-compose.yml` | Add api, worker, ai-service and object storage |
| New | `packages/{reco-engine, contracts, consultation-ui}`, `apps/lookbook`, `agents/tally-bridge`, dashboard `billing/` routes |

---

## 12. Pitch and pilot kit

**Deck, 9 slides:**
1. The problem, three ways: the shopper's time, **24% of stock beyond its selling window**, and the salesperson's time.
2. FitFirst in one line.
3. How it works in 3 steps.
4. Live demo.
5. Owner ROI (holdout-measured in the pilot).
6. "Works with your billing software, or use ours".
7. Plans.
8. Privacy and trust: DPDP-ready, no photos stored, respectful language, AI images labelled.
9. Pilot offer.

**Competition and your wedge** (verify the details before they go in the deck):

| Type | Examples | What they miss that FitFirst does |
|---|---|---|
| In-store smart mirrors and virtual trial rooms | Dharpan.ai (India, since 2022, in-store try-on with an inventory count), TCS smart mirror (AI Impact Summit 2026), Retailr, Try My Style | Expensive hardware for brands, focused on try-on. No suitability ranking, no **aged-stock engine**, no phone-first tier, no billing integration or billing option for small shops. |
| Catalogue and on-model tools | CatalogX, TryVastra, FASHN, Vue.ai | Online catalogues; they don't know who is in the store |
| Consumer styling apps | Fabulyst, Glance AI | Not tied to *this shop's* stock |
| Billing software | Vyapar, Tally, Marg, GoFrugal… | Records sales but doesn't *create* them. We integrate with them or replace them. |

**Your wedge:** "suits you + in stock here + clears old stock", with ethnic-wear depth, at small-shop prices, with any POS or ours.

**Demo mode:**
- A demo store of real photographed pieces.
- Pre-generated, labelled try-ons.
- 30 days of simulated analytics labelled **DEMO**.
- One-tap reset.

**Pilot agreement:**
- **Scope:** aged stock + key categories, 200–400 pieces.
- **Timing:** go-live after Diwali.
- **Baseline:** ideally year-on-year from imported POS history; otherwise 2 weeks of manual baseline.
- **Duration:** 6 weeks live.
- **Metrics:**
  - the locked kill threshold
  - **aged-stock sell-through lift vs the 10% holdout**
  - time to purchase
  - staff adoption
  - try-on use and shares
  - a 1-tap shopper rating
- **What the shop provides:** space, 1 staff champion, exports or billing access.
- **What we provide:** setup, the dead-stock cataloguing sprint and weekly reviews.
- **Also:** a DPA and privacy terms.

**People you need (part-time is fine):**
- a professional stylist advisor (rules, golden sets, copy)
- a sensitivity reviewer for tone and body language
- a cataloguing helper
- a one-time DPDP legal review
- the **shop's CA** (for FitFirst Billing and GST)
- a staff champion inside the pilot shop

---

## 13. Verification (how each phase will be proven when built)

- **Unit tests:**
  - vitest for `reco-engine`: gates, λ guardrail, top-5 boost cap, MMR, confidence shrinkage
  - taxonomy and contract validation
  - pytest for `garments/*` and `tryon/*` with mocked provider transports (saree-studio's `tests/test_app.py` pattern)
- **Billing tests (path B):**
  - GST slab boundaries: ₹2,500.00 vs ₹2,500.01, after discount
  - CGST/SGST vs IGST
  - consecutive per-series numbering under concurrency; reset on 1 April
  - offline series sync
  - credit notes and exchanges
  - day-close variance
  - GSTR-1 export validated in the government's offline tool
  - Tally import of the voucher export, checked with the CA
  - printers on the supported-hardware list
- **Integration tests:** extend `backend/scripts/check-stage1.ts` to cover:
  - variants, lots and movements
  - Sale/SaleLine and returns
  - handoff uniqueness and expiry
  - Excel sync idempotency (replaying a sync never duplicates)
  - cross-tenant isolation
  - retention purge with a mocked clock
- **Golden sets and the lighting matrix:** targets as in §5.8, run on the actual hardware.
- **End-to-end:** `preview_start` for `backend` (3000), `kiosk` (5174), `dashboard` (5173) and a new `ai-service` (8000) entry in `.claude/launch.json`. Walk intake → shopper → handoff → staff → sale (via import *and* via FitFirst Billing) → report, and screenshot each step.
- **Pilot:** a weekly review of holdout lift, kill threshold and the aged-stock KPI.

---

## After approval
You chose **plan only**, so approving this plan means exactly one action:
- Save it in the repo as `docs/MASTER_PLAN.md`. That's documentation only; no code, config or dependency changes.

**Phase 0 code fixes will wait for your explicit go-ahead.** Please give it before **2 Oct**, when the try-on model shuts down; the tagging model is at risk any day. Rotate the possibly leaked keys now.

---

## Appendix A — Schema v2 sketch and migration

**Conventions:**
- Every tenant-owned model has `orgId`/`storeId` plus an index.
- Money is `Int` in paise.
- JSON columns are validated by shared zod `contracts` with a `schemaVersion`.
- Only code-coupled lifecycles are enums.
- The taxonomy is data.

```prisma
// Tenancy, identity, devices
model Organization { id; name; gstin String?; createdAt }
model Store        { id; orgId; code; name; city; state; timezone @default("Asia/Kolkata"); locales String[]; settings Json }
model StoreLocation{ id; storeId; code /*"R3-S2"*/; label }
model User         { id; phoneE164 @unique; name; email? }
model Membership   { id; userId; orgId; storeId?; role Role /*OWNER MANAGER STAFF INTAKE*/; pinHash?; posStaffCode?; isActive }
model Device       { id; orgId; storeId; kind DeviceKind; tokenHash @unique; config Json?; calibration Json?; appVersion?; lastSeenAt?; isActive }
model AuditLog     { id; orgId; storeId?; actorUserId?; actorDeviceId?; action; entityType; entityId; before Json?; after Json?; at }

// Taxonomy (global rows have orgId = null; orgs can override)
model Category { id; orgId?; code; parentId?; departments Department[]; names Json; sizeSystemCodes String[]
                 attributeSchema Json; intakeSpec Json; agingPolicy Json?; faceProximity Json? }
model AttributeDefinition { id; orgId?; key; dataType; unit?; names Json; appliesTo String[] }
model AttributeValue { id; definitionId; code; names Json; sortOrder; isActive }
model ColorName  { id; code @unique; names Json; L; a; b; family }
model SizeSystem { id; code @unique /*WOMEN_ALPHA, WAIST_IN, KIDS_AGE, FREE, UNSTITCHED…*/; values Json }
model SizeChart  { id; orgId; storeId?; brand?; categoryCode; sizeSystemCode; rows Json; source /*BRAND|STORE|INDIASIZE*/ }
model BodyShape  { code @id; department; names Json; indiaSizeCode? }

// Catalogue and stock
model Product        { id; orgId; styleCode; name; categoryId; department; mrpPaise?; pricePaise; status; currentAttributeSetId?; sellByDate? }
model ProductVariant { id; orgId; productId; sku; barcode?; sizeSystemCode; sizeCode; colorway?; isAlterable; blouse?; isActive }
model StockBalance   { variantId; storeId; onHand; reserved; locationId?; stockVerifiedAt? }   // CHECK onHand >= 0 unless POS-authoritative
model InventoryLot   { id; variantId; storeId; receivedAt; ageSource; qtyReceived; qtyRemaining; unitCostPaise?; receiptRef? }
model StockMovement  { id; storeId; variantId; type /*RECEIPT SALE RETURN ADJUST_COUNT ADJUST_SYNC TRANSFER_IN/OUT DAMAGE*/; qty; occurredAt; saleLineId?; syncRunId?; requestKey? @unique }
model Reservation    { id; variantId; storeId; visitId?; qty; expiresAt; releasedAt? }
model StockCountSession / StockCountLine   // physical count incl. age bucket for unknown-age stock

// Media and perception
model MediaObject { id; orgId; class /*CATALOG_PUBLIC PRIVATE_EPHEMERAL IMPORT_FILE*/; storageKey @unique; sha256; expiresAt?; deletedAt? }
model ProductImage { id; productId; mediaId; angle ImageAngle; isPrimary; calibrated; cutoutMediaId?; quality Json? }
model GarmentAnalysis { id; productId; kind /*VLM_ATTRIBUTES|COLOR_EXTRACT|STYLIST_OPINION*/; provider; model; promptVersion; output Json; costMicros? }
model ProductAttributeSet { id; productId; version; status /*AI_DRAFT IN_REVIEW APPROVED SUPERSEDED*/; values Json; fieldSource Json; fieldConfidence Json }
model ProductColor { id; productId; attributeSetId; role; L; a; b; C; h; areaFraction; colorNameCode?; isMetallic }

// Shoppers, consent, visits, recommendations
model NoticeVersion   { id; orgId?; version; locale; contentHash; url; effectiveFrom }
model Customer        { id; orgId; phoneHash; phoneEnc?; name?; deletedAt? }
model CustomerProfile { id; customerId; label /*Me, Mother*/; department; sizes Json; skin Json?; prefs Json }
model ConsentRecord   { id; orgId; storeId; visitId?; customerId?; noticeVersionId; purpose; granted; method; ageAttestation?; grantedAt; withdrawnAt? }
model Visit           { id; orgId; storeId; deviceId?; channel; status; requestKey @unique; accessTokenHash @unique; handoffCode; handoffExpiresAt; assignedToId?; isHoldout; locale }
                      // partial UNIQUE(storeId, handoffCode) WHERE status is active (raw SQL)
model ShopperProfile  { id; visitId; label; department; isMinor; categories; occasions; sizes Json; heightCm?; budgetMin/MaxPaise?
                        colorLikes; colorDislikes; fitGoals String[]; depthGroup?; mstPick?; undertone; contrast; skinMethod?; skinConfidence?; skinMeasure Json? }
model Ruleset         { id; orgId?; version; status /*DRAFT ACTIVE ARCHIVED*/; document Json; approvedById? }
model MerchPolicy     { storeId @id; lambda @default(0.06); maxBoostedInTop5 @default(2); holdoutPct @default(0.10); agingOverrides Json? }
model ProductPush     { id; storeId; productId; reason /*AGED|OVERSTOCK|OWNER_PICK|CLEARANCE*/; weight; offerText Json?; spiffPaise?; startsAt; endsAt }
model RecommendationRun  { id; visitId; shopperProfileId; rulesetId; engineVersion; trigger; inputSnapshot Json; filterStats Json; lambda; isHoldout; stockAsOf }
model RecommendationItem { id; runId; productId; variantId?; rank; sizeMatch; suitability; business; boostApplied; final; components Json; reasonCodes; businessReason? }
model InteractionEvent   { id; storeId; visitId?; runItemId?; productId?; actorUserId?; type; reasonCode?; occurredAt; clientEventId? @unique }
model DemandGap          { id; storeId; runId; categoryCode; sizeCode?; budgetMaxPaise?; occasion?; reason; occurredAt }
model TryOnJob           { id; storeId; visitId; productId; personMediaId; resultMediaId?; templateId; templateVersion; provider; model
                           cacheKey; status; qa Json?; costMicros?; latencyMs?; consentRecordId; expiresAt }

// Sales (both paths)
model Sale       { id; storeId; visitId?; staffMembershipId?; source /*STAFF_APP POS_FILE POS_BRIDGE POS_API FITFIRST_BILLING LEGACY*/
                   externalSystem?; externalRef?; billedAt; status; subtotalPaise; discountPaise; totalPaise; requestKey? @unique; handoffCodeOnBill? }
model SaleLine   { id; saleId; variantId?; qty; unitPricePaise; discountPaise; lineTotalPaise; recItemId?; wasRecommended
                   attribution /*HANDOFF_CODE QR_SCAN STAFF_LINKED PROBABILISTIC NONE*/; ageDaysAtSale?; wasAgedAtSale? }
model SaleReturn { id; saleLineId; qty; kind /*REFUND|EXCHANGE*/; restock; exchangeSaleId? }

// Path A: POS connectors
model ConnectorConfig   { id; storeId; kind; stockAuthority Boolean; settings Json; secretEnc?; mappingTemplateId?; schedule?; cursors Json; deviceId? }
model MappingTemplate   { id; orgId?; posKind; name; version; headerSignature; columnMap Json; transforms Json }
model SyncRun / SyncIssue / ExternalIdMapping   // cursors, stats, row-level issues, idempotent upserts

// Path B: FitFirst Billing (Phase 5B)
model Supplier       { id; orgId; name; gstin?; phone? }
model PurchaseInward { id; storeId; supplierId; billNo; billDate; lines Json → creates InventoryLots + label print jobs }
model TaxRule        { id; hsnPrefix; description; slabs Json /*[{maxUnitValuePaise, ratePct}] e.g. ≤250000→5%, else 18%*/; effectiveFrom; effectiveTo? }
model InvoiceSeries  { id; storeId; deviceId?; docType /*TAX_INVOICE BILL_OF_SUPPLY CREDIT_NOTE RECEIPT*/; fiscalYear /*"26-27"*/; prefix; nextNumber }
model Invoice        { id; saleId @unique; seriesId; number; docType; customerName?; customerGstin?; placeOfSupply; taxBreakup Json; pdfMediaId?; issuedAt }  // immutable
model Payment        { id; saleId; mode /*CASH UPI CARD SPLIT CREDIT*/; amountPaise; reference?; confirmedById?; at }
model CreditNote     { id; saleReturnId; seriesId; number; taxBreakup Json; issuedAt }
model DayClose       { id; storeId; deviceId; date; expectedCashPaise; countedCashPaise; variancePaise; byMode Json; closedById }
model PrintTemplate  { id; orgId; kind /*RECEIPT_58 RECEIPT_80 A5_INVOICE BARCODE_LABEL*/; layout Json }

// Plans and metering
model Plan / Subscription / Entitlement / UsageCounter /*reserve on enqueue, commit on success*/ / UsageEvent
// Kept, store-scoped: DailyBaseline; KillThreshold → PilotConfig (+ holdoutPct, window); new DailyStoreMetric. Queue: pg-boss schema.
```

**Migration:** only demo and test data exists today, so start from a **clean v2 baseline plus a one-off importer**:
1. Tag `v1-final` and run `npm run db:backup`. Archive the old migrations.
2. Create the v2 baseline (with the partial unique index on active handoff codes). Seed the taxonomy, size systems, colour names and rulesets (`v1-legacy` archived, `2026.10-pilot-1` draft).
3. Run `scripts/migrate-v1-to-v2.ts`, which is idempotent and keyed on v1 IDs:

| v1 | v2 |
|---|---|
| Nothing | One org and store. An OWNER whose PIN equals `DASHBOARD_PIN`, forced to change it on first login. |
| `Product` | Product. Each `sizeRange` entry becomes a variant. |
| `stockQty` | A single variant → onHand; several variants → 0 + a **count session** (the SIP's physical count). |
| `daysInStock` | InventoryLot with `receivedAt = updatedAt − daysInStock`, `ageSource = ESTIMATED_LEGACY`. |
| enums + `aiConfidence` | ProductAttributeSet v1 (`fieldSource = LEGACY`) + GarmentAnalysis. |
| `imageUrl` | MediaObject + ProductImage (local files only). |
| `CustomerSession` | Visit + ShopperProfile (bucket → D1–D4, method LEGACY). |
| Snapshot + `Recommendation` | RecommendationRun (`v1-legacy`) + items. |
| `PurchaseEvent` | Sale (LEGACY) + SaleLine + SALE movement. |
| `DailyBaseline` / `KillThreshold` | Store-scoped / PilotConfig. |

4. **Verify** with `scripts/check-v2-migration.ts`:
   - row counts
   - sums of sale amounts before and after
   - every product has at least one variant
   - every visit has a profile
   - uncounted variants are listed

   Keep v1 read-only for 30 days.

## Sources (external facts, checked Sept 2026)
- Gemini: https://ai.google.dev/gemini-api/docs/pricing · https://ai.google.dev/gemini-api/docs/deprecations · https://ai.google.dev/gemini-api/docs/models
- Vertex AI Virtual Try-On: https://docs.cloud.google.com/vertex-ai/generative-ai/docs/models/imagen/virtual-try-on-001 · categories: https://medium.com/google-cloud/convert-window-shoppers-into-buyers-using-vertex-ai-virtual-try-on-ca2b9ae6153c
- Ethnic-wear try-on comparison: https://catalogx.app/blog/best-ai-virtual-try-on-tools-india · FASHN: https://fashn.ai/pricing
- DPDP timeline: https://www.sansalegal.com/post/dpdp-act-2023-and-rules-2025-phased-implementation-timeline-and-business-compliance-deadlines
- IT Amendment Rules 2026 (AI labelling): https://www.khaitanco.com/thought-leadership/MeitY-notifies-the-IT-Amendment-Rules-2026
- GST on garments (5% ≤ ₹2,500 / 18% above, on sale value): https://busy.in/gst-rates/garments/ · https://taxguru.in/goods-and-service-tax/gst-garments-rs-2500-raised-18-percent-rationalise-tax-structure.html
- E-invoicing threshold: https://tallysolutions.com/accounting/e-invoicing-rules-in-india/
- INDIAsize: https://nift.ac.in/indiasize/ · https://www.onlineclothingstudy.com/2026/01/indiasize-body-size-charts-now.html
- WhatsApp pricing in India: https://myoperator.com/blog/whatsapp-business-api-pricing-india-2026
- Tally integration: https://help.tallysolutions.com/xml-integration/ · https://help.tallysolutions.com/tally-prime-integration-using-json-1/
- Ginesys: https://www.ginesys.in/products/all-integrations · Zoho Inventory API: https://www.zoho.com/inventory/api/v1/items/
- Ageing inventory study: https://apparelresources.com/business-news/retail/revenue-leakage-ageing-inventory-weigh-indias-retail-expansion-push-report/
- Skin colour science: https://onlinelibrary.wiley.com/doi/full/10.1002/col.70012 · https://en.wikipedia.org/wiki/Monk_Skin_Tone_Scale · https://arxiv.org/abs/2410.21005
- MediaPipe Image Segmenter: https://ai.google.dev/edge/mediapipe/solutions/vision/image_segmenter · Camera constraints: https://www.w3.org/TR/image-capture/
- Competitors: https://yourstory.com/2025/05/dharpanais-smart-mirrors-are-changing-how-india-shops · https://www.etvbharat.com/en/technology/ai-impact-summit-2026-smart-mirror-by-tcs-promises-to-transform-retail-shopping-experience-enn26021902639
- Diwali 2026: https://www.bda.ai/festival/diwali/2026
