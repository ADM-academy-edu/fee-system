# Intelligence Academy — Fee Management & Voucher System (v2)

A frontend-only fee voucher, payment, and tracking system for a small
academy. No backend, no database — HTML, CSS, and vanilla JavaScript,
deployable straight to Netlify from GitHub. `js/students.js` and
`js/vouchers.js` are your manually-maintained data files.

---

## 1. Project structure

```text
/
├── index.html                 Login page
│
├── pages/
│   ├── dashboard.html          4 module cards
│   ├── issue-voucher.html      Module 1 — Issue Fee
│   ├── receive-payment.html    Module 2 — Receive Payment
│   ├── tracking.html           Module 3 — Track Voucher
│   └── register-student.html   Module 4 — Register New Student
│
├── css/
│   ├── style.css               Design tokens, layout, navbar, login, dashboard
│   ├── components.css          Panels, forms, tables, voucher, toasts, loading
│   └── responsive.css          All breakpoints (tablet/mobile/print)
│
├── js/
│   ├── config.js                Academy info, login, fee rules, classes
│   ├── students.js               STUDENT DATA — edit this to add/remove students
│   ├── vouchers.js                VOUCHER DATA — edit this to add/update vouchers
│   ├── calculations.js            All fee/fine formulas, in one place
│   ├── app.js                     Shared helpers: session, toasts, search, ID
│   │                               generation, JSON/copy, nav highlighting
│   ├── export.js                  PNG/JPG/PDF export + WhatsApp sharing
│   ├── auth.js                    Login page logic
│   ├── issue-voucher.js           Issue Fee page logic
│   ├── receive-payment.js         Receive Payment page logic
│   ├── tracking.js                Track Voucher page logic
│   └── register-student.js        Register New Student page logic
│
├── images/
│   ├── academy-logo.png        Placeholder — replace with your real logo
│   └── README.txt              How to replace the logo
│
├── assets/                     Reserved for any future static assets
├── README.md                   This file
└── .gitignore
```

---

## 2. How to run locally

No Node.js or build step needed — it's a static site.

**Option 1 — just open it:** double-click `index.html`.

**Option 2 — local server (recommended):** in VS Code, install the
"Live Server" extension, right-click `index.html`, choose **Open with
Live Server**. Or with Python:

```bash
python3 -m http.server 8000
```

then visit `http://localhost:8000`.

**Default login:** `admin` / `admin123` — change in `js/config.js` (see §16).

---

## 3. How to deploy to GitHub

```bash
git init
git add .
git commit -m "Initial commit — Intelligence Academy v2"
```

Create an empty repository on GitHub, then:

```bash
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO.git
git branch -M main
git push -u origin main
```

## 4. How Netlify deployment works

1. On [netlify.com](https://netlify.com): **Add new site → Import an
   existing project → GitHub** → select your repository.
2. Leave **Build command** empty; **Publish directory** as the project
   root (default/blank) — there is no build step.
3. Click **Deploy site**. You'll get a live URL like
   `your-site.netlify.app`.

Netlify then watches your `main` branch — every `git push` triggers an
automatic redeploy, usually within a minute.

## 17. How to update the application after a GitHub commit

```bash
git add .
git commit -m "Describe your change"
git push
```

That's it. Netlify detects the push and redeploys automatically —
refresh the site after a minute or two to see the update live.

---

## 5 & 6. Student data — where it lives, how to add one

**File: `js/students.js`**

### HOW TO ADD A NEW STUDENT

The easiest way is through the app itself:

```
Dashboard
  → Register New Student
  → Select Class
  → Enter Student Name
  → Enter Father Name
  → System generates Student ID
  → System generates Roll Number
  → Click "Register Student" (preview appears)
  → Click "Copy JSON"
  → Open js/students.js
  → Paste the copied object into the students array
    (just above the "// ADD NEW STUDENT HERE" comment / the closing "]")
  → Save the file
  → Commit the change to GitHub
  → Netlify automatically deploys the updated website
  → Refresh the live Netlify site once deployment finishes
```

**Student ID format:** `STD-{CLASS}-{SEQUENCE}` — sequence is 3 digits,
independent per class.

```
STD-9-001, STD-9-002, STD-9-003 ...
STD-10-001, STD-10-002 ...
```

**Roll Number format:** exactly 6 digits — `1` + class as 2 digits +
sequence as 3 digits.

```
Class 9,  sequence 004  →  109004
Class 10, sequence 004  →  110004
Class 11, sequence 004  →  111004
Class 12, sequence 004  →  112004
```

**Example generated object** (Register New Student page output):

```javascript
{
    studentId: "STD-9-004",
    rollNo: "109004",
    name: "Ali Ahmed",
    fatherName: "Muhammad Ahmed",
    className: "9"
}
```

**Exactly where to paste it inside `students.js`:**

```javascript
const students = [
    {
        studentId: "STD-9-001",
        rollNo: "109001",
        name: "Ahmed Khan",
        fatherName: "Aslam Khan",
        className: "9"
    },
    // ... other existing students ...
    // ADD NEW STUDENT HERE
    {
        studentId: "STD-9-004",
        rollNo: "109004",
        name: "Ali Ahmed",
        fatherName: "Muhammad Ahmed",
        className: "9"
    }
];
```

**Comma placement (read this carefully):**
- Every object in the array **except the last one** must be followed
  by a comma `,` right after its closing `}`.
- If you paste your new student **after** an existing one, add a comma
  after the *previous* student's closing `}` before your new object.
- If you paste your new student as the **very last** item, it should
  **not** have a trailing comma after its own closing `}` — but the
  object *before* it must have one.
- The Register New Student page's "Copy JSON" button already includes
  a trailing comma on the copied object for convenience — if you're
  pasting it as the new last item in the array, delete that trailing
  comma.

**Rules & warnings:**
- Student IDs and Roll Numbers must stay **unique** — the app checks
  this automatically when generating new ones, but be careful if
  entering data by hand.
- The Register New Student page always calculates the next sequence
  number by scanning existing students in that class, so IDs are never
  reused even if older students were removed.
- ⚠️ **Do not manually change an existing student's Student ID or Roll
  Number** unless you understand the effect on historical vouchers —
  every voucher record stores a snapshot of the student's ID/roll/name
  at issue time, so changing them later can make old vouchers harder
  to match up.
- **Adding multiple students safely:** register one at a time — select
  class, fill details, copy JSON, paste into `students.js`, save.
  Repeat for the next student. Doing them one at a time (rather than
  batching edits) makes it much easier to spot a misplaced comma.
- After editing `students.js`: save → commit → push → Netlify
  redeploys automatically → refresh the live site.

### To remove a student
Delete their entire `{ ... }` object from the array (fix up any stray
commas so the file stays valid JavaScript), save, commit, push.

### To edit a student's information
Find them by `studentId` in `js/students.js` and change `name`,
`fatherName`, or `className` as needed (avoid changing `studentId` or
`rollNo` — see the warning above).

**Every time you use Register New Student in the app**, it also shows
this reminder on-screen after generating the object:

> Student data generated successfully.
> Open: `js/students.js`
> Copy the generated code and add it to the students array.
> After saving, commit and push the change to GitHub.

---

## 7 & 8. How to issue a voucher / update vouchers.js

**File: `js/vouchers.js`**

```
Dashboard → Issue Fee → Select Class → Search/select student →
Fee details → Dates → Generate Voucher → Preview → Export/Share →
Copy the generated JSON → paste into js/vouchers.js (new array entry)
→ commit → push → Netlify redeploys.
```

The app blocks issuing a **second** voucher for the same student in the
same month/year and instead offers links to Track Voucher or Receive
Payment.

Each voucher gets a unique ID: `IA-YYYY-MM-XXXX`, e.g. `IA-2026-08-0001`.

---

## 9. How to receive payment

```
Dashboard → Receive Payment → (defaults to current month's vouchers) →
filter by class / search by ID or name → select a voucher →
set Payment Date (editable, defaults to today) → set Status
(Paid/Unpaid, defaults to Unpaid) → Generate Payment Voucher → Preview
→ Export/Share → Copy the updated JSON → open js/vouchers.js → find
the record with the same voucherId → REPLACE it (don't duplicate) →
commit → push.
```

The payment voucher reuses the original voucher's student info, fee
breakdown, issue date, and due date unchanged — only `paymentDate`,
`fine`, `finalPayable`, and `status` are updated.

---

## 10. How fine calculation works

Formula (see `js/calculations.js`):

```
If Payment Date <= Due Date:
    Late Days = 0, Fine = 0

If Payment Date > Due Date:
    Late Days = Payment Date - Due Date
    Fine = Late Days × Rs. 50/day   (rate from feeConfig.finePerDay)

Final Payable = Actual Fee + Fine
```

Example: Due `10-Aug-2026`, Payment `15-Aug-2026` → 5 late days →
Fine `Rs. 250`.

Dates are compared as local calendar dates (not UTC), so there's no
timezone off-by-one error.

---

## 11. How tracking works

```
Dashboard → Track Voucher → filter by class and/or search by ID/name →
select a student → choose a period (Current Month / Last Month /
Last Year / All History / Custom Range) → the table updates instantly,
showing both PAID and UNPAID vouchers → Preview Report → export as
PDF/PNG/JPG or share on WhatsApp.
```

---

## 12. How to change classes

Edit `classOptions` in `js/config.js`:

```javascript
const classOptions = ["1","2","3","4","5","6","7","8","9","10","11","12"];
```

Add or remove class numbers here — every class picker, Student ID
generator, and Roll Number generator reads from this single array.

## 13. How to change academy information

Edit the `academyConfig` object in `js/config.js` — `name`, `motto`,
`ownerName`, `phone`, `whatsapp`, `email`, `address`, `quote`. All
pages and vouchers read from this one object.

## 14. How to replace the logo

See `images/README.txt`. Short version: replace `images/academy-logo.png`
with your real logo, same filename.

## 15. How to change colors

Edit the CSS custom properties at the top of `css/style.css`:

```css
:root {
  --primary-color: #122a4e;   /* deep navy */
  --secondary-color: #7a1728; /* dark red */
  --accent-color: #a31f32;    /* brighter red, CTAs */
  --background-color: #f3f4f8;
  --surface-color: #ffffff;
  --text-color: #171b26;
  --muted-color: #5b6478;
  --success-color: #2e7d5b;
  --warning-color: #9c6b0a;
  --danger-color: #b3432b;
  --border-color: #dfe3ec;
}
```

Change these values and the whole app re-themes — buttons, navbar,
badges, vouchers, everything reads from these variables.

## 16. How to change login credentials

Edit `authConfig` in `js/config.js`:

```javascript
const authConfig = {
  username: "admin",
  password: "admin123"
};
```

---

## Fee rules (js/config.js)

```javascript
const feeConfig = {
  defaultTotalFee: 4500,
  tuitionPercentage: 80,
  assessmentPercentage: 20,
  finePerDay: 50
};
```

Change total fee, the tuition/assessment split, or the fine rate here —
every calculation reads from this one object via `js/calculations.js`.

---

## Voucher design note

The previous circular "IA" stamp/seal has been **completely removed**
from the voucher layout — it will not appear on issued vouchers,
payment vouchers, or tracking reports.

---

## Export & WhatsApp sharing

PNG/JPG/PDF export uses [html2canvas](https://html2canvas.hertzen.com/)
and [jsPDF](https://github.com/parallax/jsPDF), loaded from a free CDN
on the pages that need them — no paid API, no server.

WhatsApp sharing tries the native **Web Share API** first (available on
most mobile browsers) so the user can pick WhatsApp — or any other
app — from their device's normal share sheet, with the voucher image
attached directly. Where that isn't supported (most desktop browsers),
it falls back to opening a `wa.me` link with a pre-filled text summary;
the user picks the contact manually and attaches the exported
PNG/JPG/PDF themselves. **Browsers cannot universally auto-attach a
locally generated file to a specific WhatsApp contact** — this is a
platform limitation, not something any website can bypass, so we don't
claim otherwise.

---

## Security note

This is a **frontend-only prototype**. The login credentials in
`js/config.js` are visible to anyone who views the page source or
opens developer tools — there is no real authentication server. This
is fine for a small, low-stakes internal tool, but:

- Do not put real secrets in this repository.
- Do not treat the login as a real security boundary.
- For sensitive production data, replace `js/auth.js` with real backend
  authentication before relying on it.

---

## Data validation & duplicate protection

- Registering a student checks for duplicate Student IDs and Roll
  Numbers before generating the JSON.
- Issuing a voucher checks `js/vouchers.js` for an existing record with
  the same student + month + year, and blocks a second one with a clear
  error message and links to Track Voucher / Receive Payment.
- All fee inputs are validated (required, non-negative, actual fee
  cannot exceed total fee); all dates are validated as required where
  the workflow needs them.
- Malformed or missing fields in `students.js`/`vouchers.js` are
  skipped gracefully by search/filter functions rather than crashing
  the page.

---

## Calculation engine

All formulas live in `js/calculations.js`:
`calculateDiscount()`, `calculateDiscountPercentage()`,
`calculateTuitionFee()`, `calculateAssessmentFee()`,
`calculateLateDays()`, `calculateFine()`, `calculateFinalAmount()`,
plus the convenience wrappers `computeFeeBreakdown()` and
`computeFineBreakdown()`. No page re-implements these formulas.

---

## What changed from the previous version

- Restructured into `pages/` + `css/{style,components,responsive}.css`
  + expanded `js/` modules, per the new required project layout.
- Added `js/vouchers.js` as the voucher data store, `js/calculations.js`
  as the shared calculation engine, and `js/app.js`/`js/export.js` as
  shared helpers (replacing the old single `utils.js`).
- New navy + dark red theme built around centralized CSS variables
  (replacing the previous navy/brass theme).
- Removed the circular "IA" seal from the voucher design.
- Classes expanded from 9–12 to 1–12; Student ID/Roll Number formats
  changed to `STD-{class}-{seq}` / 6-digit roll numbers, generated
  automatically by the new Register New Student page.
- Added Receive Payment default current-month filtering, class filters,
  and real ID/name search (replacing the old dropdown-only lookup).
- Added the Track Voucher module (search, period filters, report
  preview, export/share) — entirely new.
- Added duplicate-monthly-voucher protection.
- Added PNG/JPG/PDF export's WhatsApp-sharing companion via
  `js/export.js`.
- Added generated-JSON + Copy button + exact save-location instructions
  for both new-student and new/updated-voucher data, on-screen after
  every generation.
- Kept and reused: the fee/discount/tuition/assessment/fine formulas,
  the voucher visual language (logo, motto, status badge, footer
  quote), the login flow, and the local-date math for fine calculation
  from the previous build.
