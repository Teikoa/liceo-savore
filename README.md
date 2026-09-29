# LICEO SAVORE

**Web-Based School Canteen Pre-Ordering and Pickup System with Hybrid Payment and No-Show Management**

Liceo de Cagayan University — Senior High School Department
Technical-Vocational Livelihood — Information and Communications Technology

---

## What this is

A **front-end prototype** of the system described in Chapters I–III of the research
paper. It is built with plain HTML, CSS, and JavaScript — no server, no database,
no PHP.

Everything the pages display comes from [assets/js/data.js](assets/js/data.js),
plus whatever you do while clicking through the demo (kept in the browser's
`localStorage`). This means the prototype is fully clickable: you can add items to
a tray, place an order, switch to the canteen console, verify the receipt you just
submitted, and record a no-show.

## How to open it

Double-click **`index.html`**. That's all — there is nothing to install.

It also works if you drop the folder into `C:\xampp\htdocs\` and open
`http://localhost/liceo-savore/`, but a web server is not required.

On the login screen, pick **Grade 12 student** or **Canteen personnel** and press
**Log in**. The credentials are not checked; the role buttons simply open that side
of the system.

---

## The pages

### Student side

| Page | What it shows |
|---|---|
| [index.html](index.html) | Login, with the role selector |
| [register.html](register.html) | Registration form with live validation |
| [student/dashboard.html](student/dashboard.html) | Hero, next pickup window, order in flight, statistics, quick picks |
| [student/menu.html](student/menu.html) | Full menu with search and category filters |
| [student/cart.html](student/cart.html) | The tray — change quantities, remove lines, see the total |
| [student/checkout.html](student/checkout.html) | Pickup day + window, hybrid payment, QR panel, receipt upload with preview |
| [student/orders.html](student/orders.html) | Order history with status tabs, and the student's own no-show record |
| [student/order-details.html](student/order-details.html) | One order with a status timeline and a cancel button |
| [student/notifications.html](student/notifications.html) | Confirmations, pickup alerts, no-show warnings |

### Canteen console

| Page | What it shows |
|---|---|
| [admin/dashboard.html](admin/dashboard.html) | Alerts, daily statistics, load per break, what to prepare, activity log |
| [admin/orders.html](admin/orders.html) | Live order board in four columns, following Figure 5.2 |
| [admin/payments.html](admin/payments.html) | Manual receipt verification with approve / reject |
| [admin/menu.html](admin/menu.html) | Add, edit, delete, and switch items sold out |
| [admin/noshow.html](admin/noshow.html) | Unclaimed orders, per-student record, active suspensions |
| [admin/reports.html](admin/reports.html) | Date-range sales summary with a print view |

---

## A demonstration that shows the whole loop

Worth rehearsing before your defence — it works in a single browser:

1. Log in as a **student**. Open **Menu**, add two or three items.
2. Go to **My tray**, then **Continue to checkout**.
3. Choose a pickup window, select **GCash**, type any reference number, and attach
   any image as the receipt. Press **Place pre-order**.
4. The order appears with status **Pending** — the canteen has not checked the
   receipt yet.
5. Log out, then log back in as **Canteen personnel**.
6. Open **Payments**. *The order you just placed is sitting in the queue.* Press
   **Approve payment**.
7. Open **Orders**. The order has moved from Pending to **Confirmed**. Walk it along:
   Preparing → Ready for Pickup → Collected.
8. Open **No-shows** and press **Record no-show** on one of the listed orders. Watch
   the student's counter rise and a 7-day suspension trigger on the third one.

To reset everything back to the seeded state, open the browser console (F12) and run:

```js
Object.keys(localStorage).filter(k => k.startsWith('savore.')).forEach(k => localStorage.removeItem(k));
```

---

## How the research design maps to the prototype

### Hybrid payment (Sec. 1.7, Limitation 1)

Checkout offers **Cash on Pickup**, **GCash**, and **Maya**. Choosing a digital wallet
reveals the canteen's QR panel, the exact amount to send, a reference-number field,
and a receipt upload with an image preview.

There is deliberately **no automatic confirmation** with the payment provider. On
[admin/payments.html](admin/payments.html) a staff member reads the receipt, compares
the reference number and amount, and approves or rejects it. The order board refuses
to advance an online order past **Pending** until that happens — mismatched amounts
are flagged in red.

### No-show management (Sec. 2.3 — the research gap)

Implemented in [assets/js/admin-noshow.js](assets/js/admin-noshow.js):

- Staff record an unclaimed order from the board or the no-show page.
- The student's counter for the rolling **30-day window** goes up.
- On the **3rd** no-show, pre-ordering is suspended for **7 days** automatically.
- The student can still buy at the counter, and the suspension lifts on its own —
  an administrator can also lift one early.

The thresholds live in the `POLICY` object in [assets/js/data.js](assets/js/data.js),
so you can justify or adjust them without touching the logic.

### Pickup scheduling

The three break sessions from Figure 5.1:

| Session | Window |
|---|---|
| Morning Snack | 8:50 – 9:10 AM |
| Lunch | 11:50 AM – 1:00 PM |
| Afternoon Snack | 2:00 – 2:20 PM |

A window greys out once you are within 20 minutes of it starting, and reopens when
you switch the pickup day to tomorrow.

---

## Project structure

```
liceo-savore/
├── index.html                 Login
├── register.html              Registration
│
├── student/                   dashboard · menu · cart · checkout
│                              orders · order-details · notifications
├── admin/                     dashboard · orders · payments
│                              menu · noshow · reports
│
├── assets/css/
│   ├── style.css              Design tokens, shell, components
│   └── admin.css              Canteen console overrides
│
├── assets/js/
│   ├── data.js                All sample data and the policy constants
│   ├── shell.js               Sidebar + topbar, toast, storage, cart, orders
│   ├── dashboard.js           Student home
│   ├── menu.js                Search and category filtering
│   ├── cart.js                The tray
│   ├── checkout.js            Pickup scheduling + hybrid payment
│   ├── orders.js              History with status tabs
│   ├── order-details.js       Timeline and cancellation
│   ├── notifications.js       Notification list
│   ├── admin-dashboard.js     Staff overview
│   ├── admin-orders.js        The order board
│   ├── admin-payments.js      Receipt verification
│   ├── admin-menu.js          Menu management
│   ├── admin-noshow.js        No-show policy
│   └── admin-reports.js       Sales summary
│
├── prototype/                 Your original single-page mockup
└── php-version/               A working PHP + MySQL build (see below)
```

### About the shared page shell

The sidebar and topbar are not copied into all fifteen HTML files. Each page
declares what it is:

```html
<body data-role="student" data-nav="menu" data-title="Canteen menu">
```

and [assets/js/shell.js](assets/js/shell.js) builds the navigation around whatever
content the page contains. Each page's own content is still written as real HTML in
its own file — only the repeated chrome is generated.

---

## `php-version/`

An earlier pass built this same system as a working PHP + MySQL application on
XAMPP, matching Table 2.0 of the paper: eleven database tables from the ERD in
Figure 4, prepared statements, hashed passwords, and server-enforced business rules.

It is kept in `php-version/` in case you need a database-backed build later. Nothing
in the front-end prototype depends on it, and you can delete the folder without
affecting anything.

---

## Limits of a front-end prototype

Worth stating plainly if it comes up during your defence:

- **Nothing is saved to a server.** Data lives in one browser. Clearing site data,
  or opening the prototype on a different computer, resets it to the seeded state.
- **There is no real authentication.** The login screen does not check credentials.
- **Receipt images are never stored** — the upload only produces a preview.
- **The evaluation instrument for Objective 4** (functionality, usability, reliability,
  efficiency, user satisfaction) is not built. That survey would be collected
  separately.
