# FitFirst — interactive product prototype

A clickable prototype of the whole intended product, built from `docs/MASTER_PLAN.md`, `docs/DECISIONS.md`, `docs/END_TO_END_CHECKLIST.md`, `docs/TEAM_GUIDE.md` and `SYSTEM_IMPROVEMENT_PLAN.md`.

It is plain HTML, CSS and JavaScript. No build step, no backend, no dependencies. It does not touch the real apps in `backend/`, `dashboard/` or `kiosk/`.

**Everything in it is synthetic.** The shop, the people, the stock and every number are made up. Nothing here is evidence about a real store.

## How to open it

**Simplest:** double-click `prototype/index.html`. It opens in your browser and works from the file system.

**If you want the surfaces to update each other live across tabs** (recommended), serve the folder instead. From the repo root:

```bash
npx serve prototype
# or
python -m http.server 8080 --directory prototype
```

Then open the address it prints (for example `http://localhost:3000` or `http://localhost:8080`).

Use Chrome or Edge. The optional camera preview on the kiosk only works when served from `localhost`; without it the same screens run with a placeholder.

## Signing in

| Who | How |
|---|---|
| Any staff member | Tap the name, PIN **1111** |
| Owner by phone | Tab “Owner · phone code”, send code, enter **123456** |
| Manager approval prompts | **1111** |

What you see depends on the role: sales staff get the floor and the counter, intake gets the stock room, the owner and manager get everything.

## A good first walk-through (about 10 minutes)

1. `index.html` → **Kiosk**. Go through the questions and finish on the handoff code.
2. On the handoff screen choose **Open on phone**. Add a piece to the try list, run **See it on me**.
3. `index.html` → **Salesperson**, sign in as Meera Joshi. The shopper is in the live queue. Claim them, mark a piece tried, add one to the bill.
4. **Bill at counter** → pay by UPI → look at the receipt.
5. Lock, sign in as the owner (123456). Open **Results**, **Clearance** and **Demand gaps**.
6. **Settings → Demo controls**: switch on “Internet is down” or “AI tagging is failing” and revisit the kiosk, intake and billing.

No shopper handy? **Simulate a walk-in** on the live queue creates a finished consultation.

## Resetting

`index.html` → **Reset demo data**, or Settings → Demo controls → Reset. State is kept in this browser's local storage under the key `ff_proto_v5`.

## What is in the folder

| File | What it is |
|---|---|
| `index.html` | Hub: every surface, grouped by who uses it |
| `kiosk.html` + `js/kiosk.js` | The consultation flow in three modes: `?mode=kiosk`, `?mode=assisted`, `?mode=qr` |
| `phone.html` + `js/phone.js` | Shopper's phone: lookbook, try-on, sharing, e-bill, privacy |
| `app.html` + `js/app*.js` | The shop workspace: floor, stock room, counter, insights, setup |
| `js/core.js` | State, events, UI components, garment illustrations, charts |
| `js/data.js` | Taxonomy and the synthetic demo data |
| `js/engine.js` | The recommendation engine (rules, gates, clearance nudge, variety) |
| `js/i18n.js` | Shopper copy in English, Hindi and Gujarati (drafts) |
| `js/shared.js` | GST, receipts and sale recording, shared by the phone and the workspace |
| `css/ff.css`, `css/app.css`, `css/kiosk.css` | Design tokens and components; workspace layout; shopper surfaces |

## What is simulated

Garment pictures are drawn illustrations. QR codes and barcodes are visual stand-ins with a “simulate scan” link. AI tagging, the camera measurement, try-on rendering, UPI payment, printing, SMS and WhatsApp are simulated. The full list, with what each would need in the real product, is in `../PROTOTYPE_GAPS_AND_IMPROVEMENTS.md`.
