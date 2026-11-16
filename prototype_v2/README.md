# FitFirst V2 — client-ready prototype

V2 is a separate, self-contained prototype. It keeps the look, terminology and structure of the real apps in `kiosk/` and `dashboard/`, and adds the strongest workflows from V1 (`../prototype/`).

- Plain HTML, CSS and JavaScript. No build step, no backend, no dependencies.
- It never calls the real API and changes nothing in `backend/`, `dashboard/`, `kiosk/` or `prototype/`.
- **All data is made up.** The shop, the people, the stock and every number are illustrative.

## Open it

**Quickest:** double-click `prototype_v2/index.html` (Chrome or Edge).

**For a live demo, serve the folder instead**, so a kiosk tab and a console tab update each other as you go:

```bash
npx serve prototype_v2
# or
python -m http.server 8090 --directory prototype_v2
```

Open the address it prints.

V2 keeps its own saved state (browser key `ff_v2_state`), so it never disturbs V1.

## Signing in to the console

| Who | How |
|---|---|
| Staff (owner, manager, sales staff, intake) | Tap your name, then PIN **1111** |
| Owner by phone | “Owner? Sign in with phone” → send code → **123456** |
| Manager approval (big discounts, refunds, activating rules) | **1111** |

Each role sees a different console:

| Role | What they see |
|---|---|
| Sales staff | Today, Sessions, Counter |
| Intake | Today, Inventory |
| Manager, owner | Everything, including Setup |

## Presenting it

- `index.html` is the **demo launcher**. It has three guided paths:
  - **Shop owner**, about 7 minutes: the business case.
  - **Sales staff**, about 10 minutes: training a salesperson.
  - **Customer**, about 3 minutes: letting them try it.
- Each step opens the right screen.
- In the console, open your avatar menu and choose **Show presenter notes**. A one-line note then explains what each screen is for, which helps with a non-technical audience.
- **Simulate a walk-in** (on Sessions and Today) creates a finished consultation, so the floor is never empty.
- Avatar menu → **Demo scenarios** lets you show unhappy paths: internet down, AI failing, camera denied, poor light, try-on failing.
- **All pages:** the ☰ icon in the console (or **More** on a phone) lists every page, grouped like V1's sidebar.
- **Light/dark:** the eye icon in the console, or the button on the launcher. The real console already has a dark theme.

## Files

| File | What it is |
|---|---|
| `index.html` | Demo launcher: the value story, guided demos, every surface |
| `kiosk.html` · `js/kiosk.js` | Shopper consultation. `?mode=kiosk` (default), `?mode=assisted` (staff tablet), `?mode=qr` (shopper's phone) |
| `phone.html` · `js/phone.js` | The shopper's phone: lookbook, family sharing, “see it on me”, e-bill, delete my data |
| `console.html` · `js/console*.js` | The shop console |
| `css/atelier.css` | The design system: the real apps' Alabaster Atelier tokens, light and dark, all components |
| `css/kiosk.css`, `css/console.css` | Shopper surfaces; console layout |
| `js/core.js`, `data.js`, `engine.js`, `i18n.js`, `shared.js` | State and components, demo data, recommendation rules, EN/HI/GU copy, GST and receipts |
| `PROTOTYPE_V2_IMPROVEMENTS.md` | What changed, why, the screen coverage checklist, and what still needs a decision |

The console files:

| File | What it holds |
|---|---|
| `console.js` | The shell, sign-in and Today |
| `console-sessions.js` | Sessions |
| `console-analytics.js` | Pilot analytics and the Baseline Log |
| `console-floor.js`, `console-catalogue.js`, `console-sales.js`, `console-insights.js`, `console-settings.js` | Session detail, Inventory, Counter, Clearance/Demand gaps/Team, and Setup |

Those last five are forked from V1 and restyled by the shared component classes.

## Starting again

On the launcher, choose **Reset demo**. In the console, choose Setup → Demo controls → Reset.
