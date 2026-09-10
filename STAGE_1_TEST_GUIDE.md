# Stage 1 — ready for testing

Open the kiosk at http://127.0.0.1:5174 and dashboard at http://127.0.0.1:5173. Use the staff PIN configured in backend/.env.

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

## Stage boundary

This stage stabilises the existing pilot. Stock is still counted per product, not per size/colour variant. This is not yet a complete POS. Variant inventory, stock movement history, receipts, returns and staff workflow are subsequent stages. Camera body-shape detection and validated sizing are not implemented. Historical demo baseline entries should not be treated as real sales evidence.

Report the screen, steps and expected/actual result for any issue. Stage 2 begins after this checkpoint has been tested.
