# Perception track plan — skin tone, body type and the recommendations built on them

> **Status:** DRAFT (21 Nov 2026); every §9 decision answered 22–23 Nov (DEC-35 … DEC-40). Nothing is built yet. The §8 tasks were approved into the checklist as Stage P on 23 Nov 2026 (SP-01 … SP-12); the checklist is now the source of truth for them, including who does each (DEC-41, "Work split").
>
> **Why this exists:** DEC-32 makes perception FitFirst's core track: understanding a shopper's skin tone and body type and recommending from them is "the main whole purpose of this app". The S1-08 owner check (20 Nov 2026) showed the Stage 1 camera is not good enough: in a backlit room it gave a clearly lighter tone.

---

## 1. What "good" means

No camera reads skin tone or body shape perfectly; lighting, makeup, clothing and posture always move the result. The goal is **reliable, then confirmed**:

1. **Measure carefully** (find real skin, correct the light, check quality).
2. **Show a short choice** ("one of these 3 tones", "closest to this shape") that the shopper or stylist confirms in two seconds.
3. **Say "not sure" instead of guessing** when quality is poor.
4. **Learn from every confirmation**, so the estimate improves at each shop.

**Accuracy bars, accepted 23 Nov 2026 (DEC-38).** No shopper, including at the pilot shop, sees an estimate until it meets every bar on the full 200-person evaluation set (§6), **in every skin-depth group separately**:

| Measure | Skin tone | Body type |
|---|---|---|
| Matches the stylist's label exactly | ≥ 70% | ≥ 65% |
| Within one step of the stylist's label | ≥ 95% | ≥ 90% |
| Same answer in three different lights (repeatability) | ≥ 85% | ≥ 85% |
| Says "not sure" (abstains) | ≤ 15% of scans | ≤ 20% of scans |
| Never off by two or more steps | ≥ 99% | ≥ 98% |

## 2. Where we are today (Stage 1)

| Part | Today | Problem |
|---|---|---|
| Skin tone | `kiosk/src/utils/visionAnalyzer.ts`: averages "reddish" pixels in a fixed centre box, converts to ITA°, 4 buckets | No face detection, no exposure or white-balance correction, no quality check, no confidence; untested on real people |
| Body type | Shopper picks one of 4 shapes by hand (`AttributeEntry.tsx`) | Fine as a fallback; no estimate |
| Recommendations | `backend/src/scoring/tables.ts`: one score per tone × colour family and per shape × fit type | Hand-written numbers, not stylist-reviewed; ignores undertone, contrast, height, garment type and drape |
| Missing answers | `kiosk/src/screens/Recommendations.tsx:80-81, 97-98` send Tone 2 (`WHEATISH`) and Hourglass when tone or shape is missing | A silent guess (DEC-33 follow-up). Unreachable today because the picker requires both, but once both become optional the API and scoring must accept "unknown" and score without that input. Fixed in SP-09 |
| Garment data | AI tagger (S05-01 … S05-03) gives colour family, fit type and more | Colour family is coarse; no measured colour |

## 3. Skin tone v2

Follows `MASTER_PLAN.md` §5.3 "Skin tone v2" (already researched), summarised:

1. **Capture:** kiosk front camera, shopper 50–80 cm away, guided on screen. A **grey reference card** in view; exposure and white balance **locked** where the camera allows it (a hardware buying criterion, §7).
2. **Find skin:** MediaPipe Face Landmarker (face position, angle, eyes open) plus the selfie multiclass segmenter (face-skin vs hair, beard, clothes).
3. **Sample:** forehead and upper cheeks inside the face-skin mask; drop highlights and shadows; 20–30 frames; median.
4. **Correct the light** with the grey card, then measure in CIELAB.
5. **Depth:** ITA° → five depth groups → show the **3 nearest Monk swatches**; the shopper's tap is the label.
6. **Undertone** (warm / cool / olive / neutral) and **skin–hair contrast**, each allowed to answer "unknown".
7. **Confidence** from frame agreement, card found, cheek/forehead agreement and a makeup check; low confidence shows more swatches.
8. **Output** `{depthGroup, mstPick, undertone, contrast, confidence, method}`; no image is stored or sent.

## 4. Body type (new; DEC-04 amended by DEC-32)

**Capture:** the shopper's **phone** (or a staff tablet in assisted mode), not the kiosk: a kiosk camera sees head and shoulders only. Front-facing, full body, about 2–3 m away, arms slightly out. A second side photo is optional and improves the estimate.

**Pipeline (on the device):**
1. **Quality gates:** whole body in frame, facing the camera, standing straight, enough light. Fail → clear guidance and retry, or skip to manual.
2. **Pose:** MediaPipe Pose Landmarker (33 body points) gives shoulder and hip positions and height in the frame.
3. **Outline:** the selfie segmenter gives the body outline; measure widths at shoulder, bust, waist and hip lines.
4. **Ratios, not sizes:** shoulder ÷ hip, waist ÷ hip, waist ÷ shoulder. Ratios cancel out distance, so no tape measure is needed. Height comes from the shopper (a band: petite / average / tall).
5. **Clothing check:** loose or draped clothing (saree, anarkali, dupatta, oversized kurta) hides the outline. The app asks the shopper to note it, and a loose outline lowers confidence or abstains. This is the main accuracy risk.
6. **Classify** into the shape set (DEC-40: five women's shapes including a fuller middle, three men's shapes; DEC-39: shown as unnamed drawings with fit-goal words), with confidence; "not sure" when the ratios sit on a boundary.
7. **Confirm:** show the result as the closest silhouette with its neighbours; the shopper confirms or changes it. Shown in **fit-goal language** ("defines the waist", "balances shoulders"), never as a judgement.
8. **Output** `{shape, ratios, heightBand, confidence, method}`; photos are processed in the phone's browser and discarded, never uploaded or stored.

**Hard limits:** adults only (18+); no body estimate on a Kids profile; never "slimmer", "bigger" or weight words; the manual picker and fit goals always available.

## 5. Recommendations that use both

Perception is only worth something if the suggestions improve:

1. **Better garment colour:** measured garment colour (CIELAB from the product photo, S5-03) instead of a coarse colour family, so "suits warm undertone, medium depth" can be scored.
2. **Stylist rule tables:** replace today's hand-written numbers with tables a stylist writes and signs off, per garment type (saree, kurta, lehenga, shirt…), for depth × undertone × contrast and shape × silhouette × drape.
3. **Confidence-aware scoring:** a low-confidence tone or shape counts less, so a doubtful scan cannot dominate the list.
4. **Neutral reasons:** "this jewel tone sits well with your colouring", "the A-line balances your shape". No colourist or body-judging words, in EN/HI/GU.
5. **Measure the effect:** sessions with confirmed perception vs manual only; picks tried, bought and returned (ties to Stage 4 measurement).

## 6. Evaluation set (proves it works)

- **People:** 200 adults (DEC-38), about 40 per depth group; the first 60 are an internal checkpoint to catch big problems early and never switch a scan on. Spread across all depth groups, men and women, ages 18–60. Signed consent; the photos are kept only inside the evaluation set, encrypted, deleted at the end.
- **Labels:** a stylist labels each person's depth, undertone, contrast and shape in person, under daylight; the person's self-report is recorded too.
- **Conditions:** each person scanned in three lights (daylight, shop LED, warm bulb) and, for body, in fitted and loose clothing.
- **Report:** the §1 table per condition and per depth group, so the camera is checked to work as well on darker skin as on lighter skin.

## 7. Hardware and privacy

**Kiosk camera (buying criteria):** 1080p, supports locked exposure and white balance through the browser (`getCapabilities()` shows `exposureMode` / `whiteBalanceMode` "manual"); fixed mount at face height; a soft, even light at the kiosk (a ring or panel light). Candidates are listed and tested before buying.

**Privacy rules:**
- All processing on the device; no image leaves it, none is stored (except the consented evaluation set, §6).
- Separate, plain-language consent for the face scan and for the body photo; both optional; shopping never depends on them.
- 18+ for body photos; nothing for children beyond age and height.
- Results (tone group, shape, ratios) are kept with the visit only for the period S0-08 sets.
- **S0-08 (DPDP review with a qualified reviewer) must finish before any real shopper uses either scan.**

## 8. Proposed tasks (drafts; not yet in the checklist)

Track ID prefix **SP** (Stage P, perception). Order: SP-01 … SP-04 first, in parallel where noted.

| ID | Task | Depends on | Tier |
|---|---|---|---|
| SP-01 | Prove MediaPipe Tasks-Vision (DEC-35) runs on the target kiosk and phones: speed, model size, offline | P-D1 (decided, DEC-35) | deep |
| SP-02 | Choose and test the kiosk camera against §7's criteria; buy one. Runs before SP-03 / SP-10, not before SP-01 (DEC-36) | P-D2 (decided, DEC-36) | standard |
| SP-03 | Build the evaluation-set tool and consent form; recruit 200 people (first 60 as an internal checkpoint) | P-D4 (decided, DEC-38), S0-08 (consent wording) | standard |
| SP-04 | Stylist rule tables v1 (tone and shape × garment type): Claude drafts from published guidance, a stylist reviews and signs, an owner approves (DEC-37) | P-D3 (decided, DEC-37); a stylist reviewer (owners to find) | deep |
| SP-05 | Skin tone v2 on the kiosk (§3) — replaced draft S5-15 (removed) | SP-01, SP-02 | deep |
| SP-06 | Swatch-plus-quiz fallback (§3 fallbacks) — replaced draft S5-16 (removed) | — | standard |
| SP-07 | Body type from a phone photo (§4), behind a switch that stays off | SP-01, D-11 and D-25 (decided, DEC-39, DEC-40) | deep |
| SP-08 | Measured garment colour from product photos (§5.1) — takes over S5-03 | — (Pillow in the AI service, DEC-41) | standard |
| SP-09 | Confidence-aware scoring and neutral reasons (§5.3, §5.4); tone and shape may be "unknown", replacing the silent Tone 2 / Hourglass defaults (§2) | SP-04, SP-05 | deep |
| SP-10 | Run the evaluation (§6) and write the report; Ravindra decides whether each scan may be switched on | SP-03, SP-05, SP-07 | deep |
| SP-11 (owner) | Accept the perception track: review the report against the §1 bars | SP-10, S0-08 | none |
| SP-12 (owner) | Find a stylist who knows Indian wear to review and sign SP-04 (added 23 Nov) | DEC-37 | none |

## 9. Decisions needed before building

**P-D1 — Vision library. DECIDED 22 Nov 2026 (DEC-35): A, MediaPipe Tasks-Vision in the browser**, pinned version, model files hosted by FitFirst, images never leave the device. A single weak piece may later be swapped for another browser model (B style); a kiosk-only shop server (C) is reconsidered only if SP-01 shows kiosk scans over about 3 s; a cloud API (D) is ruled out for shopper images.

**P-D2 — Kiosk camera budget and model. DECIDED 22 Nov 2026 (DEC-36):** built-in cameras for development now; before the evaluation with real people (SP-03 / SP-10) or shop use, a mid-range lockable webcam, panel light and grey card (about ₹8,000–12,000 per kiosk). Accuracy is judged only on that kit.

**P-D3 — Who writes the stylist rule tables? DECIDED 22 Nov 2026 (DEC-37): C.** Claude drafts v1 from published guidance, adapted for Indian skin and garments, with sources and a fairness check; a stylist who knows Indian wear reviews and signs it; an owner approves; the pilot shop's staff refine it later. No stylist is known yet: finding one is an owner action, and nothing goes live unreviewed.

**P-D4 — Accuracy bars and evaluation size. DECIDED 23 Nov 2026 (DEC-38): A.** §1's bars as written, 200 people, every depth group passing on its own; no shopper sees a scan until then.

**D-11 — Body words. DECIDED 23 Nov 2026 (DEC-39): C.** Unnamed silhouette drawings; the shopper confirms the closest one; the system keeps the shape code; the screen speaks only in fit goals. **D-25 — Shape set. DECIDED 23 Nov 2026 (DEC-40):** five women's shapes (adding a fuller middle) and a separate three-shape men's set.

**Order against Stage 2.** DEC-32 puts this track before Stage 2. If a pilot shop wants to start within 2–3 weeks, Stage 2's stock and sales work may need to run alongside (D-04).

## 10. Rough size

Planning estimates for one developer with AI help, to be refined after SP-01:
- SP-01 … SP-04 (foundations): 2–3 weeks, partly waiting on hardware and people.
- SP-05, SP-06 (skin tone v2 and fallback): 2–3 weeks.
- SP-07 (body type): 3–4 weeks.
- SP-08, SP-09 (recommendations): 2 weeks.
- SP-10 (evaluation): 1–2 weeks of sessions plus the report.

About **10–14 weeks** to a perception track that has been tested and is ready to switch on, with skin tone v2 usable for the pilot after about 5–6 weeks if the accuracy bars are met.
