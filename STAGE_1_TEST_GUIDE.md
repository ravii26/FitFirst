# Stage 1 — ready for testing

Open the kiosk at http://localhost:5174 and dashboard at http://localhost:5173 (not `127.0.0.1`: the dev servers and the backend's allowed origins use `localhost`). Use the staff PIN configured in backend/.env.

## Test checklist

1. **Staff login:** sign in, refresh, then Lock. The dashboard should require the PIN again. Incorrect PINs should display an error.
2. **Customer journey:** choose a department, multiple sizes and preferences. Choose skin tone and body shape manually. Review recommendations and use Edit preferences to change the selection. FREE garments may match any selected size; adjacent-size suggestions are labelled.
3. **Camera:** choose Estimate Skin Tone, allow the camera, and capture in even light. Confirm or correct the estimate. Deny camera access or try poor lighting: the app should show a helpful failure and let you continue manually. The camera estimates skin tone only; it does not measure body shape, dimensions or clothing size. Accuracy is not validated for store use yet.
4. **Idle reset:** leave an active selection screen untouched for 100 seconds. A warning should appear; Keep shopping should preserve your choices. Without interaction the kiosk resets at 120 seconds. Start over should also clear your choices.
5. **Sales:** on a test customer session, record a recommended item or choose Other Item. A successful save should reduce stock by one. Add another item records a separate item; it does not edit the previous sale. Sales here change the local database: use dedicated test stock. Full receipts, payments and returns come in later stages.
6. **Inventory and reporting:** check product images, invalid stock values, and CSV validation messages. Analytics count purchasing sessions distinctly and describe spend per buying session. The pilot verdict stays insufficient data until the required POS/footfall evidence exists.

## Verification completed

- 42 backend unit tests passed.
- Backend, dashboard and kiosk production builds passed.
- PostgreSQL integration checks passed in a disposable schema: repeat session requests, stable recommendation snapshots, duplicate sale requests, concurrent last-unit sales, transaction rollback, invalid stock updates and distinct-session metrics.
- Additive database migration applied after a private local backup. Existing product records retained.
- Browser check reached Step 4 through privacy, department, size and preference screens.

## Browser test log — 25 Sep 2026

Tester: Claude (Claude Code built-in browser, Chromium) on the local demo database (47 demo products, no real stock). Kiosk and dashboard were opened at `http://localhost:5174` / `http://localhost:5173`: the Vite dev servers listen on `localhost` (IPv6) only, so the `127.0.0.1` URLs this guide used to give did not open (issue 5). Ravindra entered the staff PIN; Claude did not.

Setup faults found and fixed before testing: `DATABASE_URL` in `backend/.env` had lost its `postgresql` prefix and closing quote (every kiosk session failed with 500); Docker/Postgres was not running; another local app on port 3000 was intercepting `localhost:3000`.

| ID | Check | Expected | Actual | Result |
|---|---|---|---|---|
| S1-06 | Wrong PIN | Error shown, no access | "Incorrect passcode" shown | Pass |
| S1-06 | Sign in, then refresh | Still signed in | Sessions page reloaded signed in | Pass |
| S1-06 | Lock | PIN required again, API refuses | PIN screen; stays locked after refresh; `GET /api/sessions` → 401 | Pass |
| S1-07 | Privacy → department → sizes (M, L) → preferences → tone/shape (manual) | Recommendations load | 8 in-stock pieces; FREE-size items matched M/L | Pass |
| S1-07 | Edit preferences → Designer Sarees | New list reflects the change | 4 sarees | Pass — see issue 1 (fixed, re-tested below) |
| S1-07 | Handoff | Code shown; staff can find it | Code `MKB93L`; found in dashboard search (lower-case input works) with the edited preferences and 4 pieces | Pass |
| S1-08 | Camera: success, denied, poor light | — | Not run: needs a real camera and store lighting | **Owner** |
| S1-09 | Idle on size screen | Warning, then Keep shopping keeps choices | Warning at ~105 s ("cleared in 15 seconds"); Keep shopping kept XL | Pass |
| S1-09 | Idle without interaction | Reset to welcome at 120 s | Returned to welcome; sizes cleared on re-entry | Pass |
| S1-09 | Start over | Choices cleared | Sizes cleared on re-entry | Pass |
| S1-10 | Recommended sale, save double-clicked | One sale, stock −1 | One `POST /api/purchase-events` (201); Teal Chanderi Saree 5 → 4; "Rec'd Piece Purchased (₹4,999)" | Pass |
| S1-10 | Add another item (non-recommended) | Separate sale, first sale unchanged | Ivory Embroidered Dupatta 18 → 17; session total ₹5,798; saree stock unchanged | Pass |
| S1-11 | Product images | Images or clear placeholder | No demo product has a photo; placeholders shown | Pass (no data to show) |
| S1-11 | Invalid stock (−1 in UI; −1, 2.5, "abc" to API) | Rejected, stock unchanged | UI: "Enter a whole stock quantity of zero or more."; API 400 "Stock must be a nonnegative whole number" (403 without the dashboard header); stock stayed 3 | Pass — see issue 2 |
| S1-11 | CSV validation (bad category, price 0, stock −2, short row) | Clear per-row errors, nothing imported | 4 row-numbered errors; product count stayed 47 | Pass |
| S1-11 | Analytics | Distinct buying sessions, spend per buying session, no verdict | 10 sessions, 2 buying (20%); spend/buying session ₹3,324 = ₹6,647 ÷ 2; attributed sales ₹5,848 (recommended items only); "Pilot verdict not available yet" | Pass — see issue 1 |

Test data left in the demo database: sessions `MKB93L`, `ORIW2V` and `S9EULG`; two sales on `MKB93L` (₹4,999 saree, ₹799 dupatta).

### Issues found

1. **Edit preferences creates a second session.** The first set of answers stays as its own pending session (`ORIW2V`, 8 recs) beside the edited one (`MKB93L`). One shopper therefore counts as two consultations, which lowers the conversion rate and adds a stale code to the staff list.
   **Fixed 25 Sep 2026** (owner chose "update in place"): Edit preferences now keeps the same session and handoff code; a kiosk-only `PUT /api/sessions/:id/answers` replaces the answers and clears the recommendations so they are recalculated, and refuses (409) once a purchase is recorded. *Re-test:* journey with an edit added exactly one session (10 → 11, `S9EULG`): answers `{SAREE}`, 4 stored recommendations matching the 4 shown. Integration checks cover access, no second session, recalculation, a repeated edit keeping the snapshot, and the purchase lock.
2. **The stock error appears at the top of the page**, away from the row being edited, so staff may not see why Save did nothing.
   **Fixed 25 Sep 2026:** the error now shows under the stock field in that row (announced to screen readers), and decimals such as 2.5 are rejected instead of being cut to 2. *Re-test:* on Black Men's Pocket Square Set, `-1` and `2.5` each showed "Enter a whole number, 0 or more." under the field in the same row with no request sent; the message cleared on typing; Cancel left stock at 20; saving a valid value (20) returned 200.
3. **The handoff screen's "Session generated & logged" label is clipped** above the heading.
   **Fixed 25 Sep 2026:** the content sat under the fixed 72 px header (label top at 40 px). The handoff screen now starts below it. *Re-test:* label top at 96 px, whole screen visible at 1280×720.
4. **Kiosk department and skin-tone/body-shape buttons have no accessible names** (screen readers announce just "button").
   **Fixed 25 Sep 2026:** on closer inspection the buttons did contain text, so a screen reader would have read the whole card and not said which option was chosen. They now have short labels ("Women's Department", "Skin tone: Medium / Olive", "Body shape: Pear / A-Line", "Estimate skin tone with the camera") and announce whether they are selected. *Re-test:* confirmed in the accessibility tree.
5. **Test guide URLs:** `127.0.0.1:5174/5173` do not open, because Vite listens on `localhost` only.
   **Fixed 25 Sep 2026:** this guide and the checklist now use `localhost`, which also matches the backend's allowed origins.

## Stage boundary

This stage stabilises the existing pilot. Stock is still counted per product, not per size/colour variant. This is not yet a complete POS. Variant inventory, stock movement history, receipts, returns and staff workflow are subsequent stages. Camera body-shape detection and validated sizing are not implemented. Historical demo baseline entries should not be treated as real sales evidence.

Report the screen, steps and expected/actual result for any issue. Stage 2 begins after this checkpoint has been tested.
