# Christ Embassy CBD — Building Fund portal

A phone-first book for the church building: **pledges**, **cash in**, **gifts in kind**, and **spend**, in **USD$** and **ZWG$**. Built around how ministries actually run capital campaigns — not a full accounting package, and not a chart of accounts with fifty lines for cement.

USD$ and ZWG$ are both primary. Record each gift or bill in the currency it actually moved. Reports show the two side by side. Never add them together.

## What you capture (and why)

Church building campaigns that stay clean keep **four books**, never mixed:

| Book | What it is | What it is not |
| --- | --- | --- |
| Pledges | A promise to give | Money you can spend |
| Cash donations | Money received | A pledge still outstanding |
| In-kind | Bricks, labour, chairs, professional time | Cash in the bank |
| Expenditure | Bills and payments, in **eleven** buckets | A new category for every supplier |

**Cash available = cash received − paid expenses.** Pledges and in-kind do not sit in that number. Leadership can still see “if pledges are honoured” as a separate figure.

### The eleven expense categories

Detail belongs in the description (“2 000 bricks + delivery”), not as its own account.

1. Land, legal & permits
2. Professional fees
3. Site works
4. Structure & building works (bricks, cement, steel, masonry labour)
5. Roofing & waterproofing
6. Electrical, plumbing & HVAC
7. Interior finishes
8. Furniture & equipment
9. Audio, visual & IT
10. Campaign & admin
11. Contingency / unplanned

In-kind gifts are valued at a **fair estimate** of what you would have paid, then tagged to one of those buckets so they reduce what is still needed there.

## How to use it on the go

1. Install Node.js from https://nodejs.org (LTS).
2. In this folder, run:

```bash
npm install
npm run dev:lan
```

3. On this computer open http://localhost:3000
4. First PIN is **1234**. Change it under **More → Settings**.
5. On your phone, same Wi-Fi: open `http://YOUR-PC-IP:3000` (your IP is on the `npm run dev:lan` screen).
6. In the phone browser, use **Add to Home Screen** so it opens like an app.

To reach it from anywhere (4G, another city), leave this running and put a tunnel in front of it (Cloudflare Tunnel, ngrok) or deploy the folder to a small host such as Railway / Render with a persistent disk for the `data` folder. The books live in `data/store.json` — copy that file to back up.

For a steadier local server after the first run:

```bash
npm run build
npm start
```

## Daily rhythm

- **Sunday / midweek:** Capture → Pledge / Cash / In-kind / Spend. Search the person, type the amount, save.
- **When a pledge is paid:** Cash in → “Pledge payment” → pick that pledge. Receipt numbers are issued automatically (`CE-00001`).
- **When a contractor invoices before you pay:** save the expense and untick **Already paid**. Cash available will not drop until you mark it paid.
- **Board / pastor:** Reports → Snapshot. Download CSV when the auditor or Excel needs the ledger.

## Files that matter

- `data/store.json` — the books. Keep a copy.
- `data/store.json.bak` — previous save.

Do not publish this folder to a public website without a new PIN and `AUTH_SECRET`. Donor names and amounts live in that JSON file.
