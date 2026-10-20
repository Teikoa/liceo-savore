# LICEO SAVORE: Supabase Menu Setup

This file explains how the canteen menu is connected to a real database
using **Supabase**, what each new file does, and how to manage the menu.

Working so far: the **menu** (section 4–8), the **tray / cart**
(section 10), and the **"added to tray" pop-up and sidebar tray count**
(section 11), the **dashboard quick menu** (section 12), the
**checkout pickup schedule and demo QR payment** (section 13), and
**placing, tracking, and cancelling orders** (section 14). Login, checkout, and orders still show placeholder text and
will be connected later.

---

## 1. What we did

1. **Reviewed the project.** The frontend is plain HTML, CSS, and a little
   JavaScript, with no data of its own. The `backend/` folder was made
   separately by another student and does not match the frontend, so we are
   **not using it**.
2. **Chose Supabase for the data.** Supabase is a hosted PostgreSQL database
   that the web pages can read from directly. No PHP, XAMPP, or Node server
   is needed.
3. **Created a Supabase project** and copied two values from
   *Project Settings → API Keys*:
   - the **Project URL**
   - the **Publishable key** (`sb_publishable_...`)
4. **Created the `food_items` table** by running `database/schema.sql` in the
   Supabase SQL Editor. This also added 8 sample menu items.
5. **Connected the menu page.** `student/menu.html` now loads the items from
   Supabase and shows them as cards.
6. **Tested it.**
   - Reading the menu with the publishable key works and returns all 8 items.
   - Trying to *add* an item with the same key is rejected (HTTP 401), so
     nobody can change the menu from the website.

> **Note for the research paper:** Sections 3.3, 3.4, and 3.8 currently say
> *XAMPP + PHP + MySQL*. If we keep Supabase, those sections should be updated
> to say *Supabase (PostgreSQL)*.

---

## 2. Files added or changed

| File | Status | What it is |
|---|---|---|
| `database/schema.sql` | New | Creates the `food_items` table, its security rule, and the sample items |
| `assets/js/supabase.js` | New | Connects the website to our Supabase project |
| `assets/js/menu.js` | New | Loads the menu items and draws them on the menu page |
| `student/menu.html` | Changed | Has an empty grid for the items and loads the scripts |

No other page was changed.

---

## 3. How it works

```
 Student's browser                              Supabase (online)
┌───────────────────────────┐                  ┌────────────────────────┐
│ student/menu.html         │                  │ PostgreSQL database    │
│   │                       │   "give me the   │                        │
│   ├─ supabase.js ─────────┼── food_items" ──►│  food_items table      │
│   │   (connection)        │                  │  (RLS: read-only for   │
│   │                       │◄── list of ──────┤   the website)         │
│   └─ menu.js              │    items (JSON)  │                        │
│       draws the cards     │                  └────────────────────────┘
└───────────────────────────┘
```

1. The student opens `menu.html`.
2. `shell.js` builds the sidebar and page layout.
3. `menu.js` asks Supabase for every row in `food_items`.
4. Supabase checks its security rule (reading is allowed) and sends back
   the items.
5. `menu.js` turns each item into a card on the page.

---

## 4. The database: `database/schema.sql`

### The `food_items` table

| Column | Type | Meaning |
|---|---|---|
| `id` | number | Unique ID, assigned automatically |
| `name` | text, required | Item name, e.g. *Chicken Adobo with Rice* |
| `description` | text, optional | Short description shown under the name |
| `category` | text, required | Group, e.g. *Meals*, *Snacks*, *Drinks* |
| `price` | number, required | Price in pesos (2 decimals). Cannot be negative |
| `image_url` | text, optional | Link to a picture of the item |
| `is_available` | true/false | `false` shows the item as **Sold out** |
| `created_at` | date & time | When the item was added, filled in automatically |

### Security (Row Level Security, RLS)

```sql
alter table public.food_items enable row level security;

create policy "Anyone can view the menu" on public.food_items
    for select using (true);
```

- **RLS on** means Supabase blocks everything on this table unless a policy
  allows it.
- The one policy allows **reading** (`select`) only.
- Because there is no policy for adding, editing, or deleting, the website
  **cannot change the menu**. Changes are made only in the Supabase
  dashboard, by someone logged in to our Supabase account.

This matters because the publishable key is visible to anyone who views the
page source. RLS is what keeps that safe.

### Sample data

The file inserts 8 items (3 Meals, 3 Snacks, 2 Drinks) so the page has
something to show. They can be edited or deleted in the Table Editor.

---

## 5. The connection: `assets/js/supabase.js`

```js
const SUPABASE_URL = 'https://htablmpftjevgidkqssp.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_...';

const db = supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
```

- `SUPABASE_URL` is the address of our Supabase project.
- `SUPABASE_PUBLISHABLE_KEY` identifies our website to Supabase. It is safe
  to be public **because RLS is enabled**.
- `db` is the connection. Any script loaded after this file can use `db` to
  read data, e.g. `db.from('food_items').select('*')`.
- `supabase.createClient` comes from the Supabase library, which must be
  loaded **before** this file (see section 7).

> ⚠️ **Never put the Secret key (`sb_secret_...`) in any file in this
> project.** It skips every security rule. If it is ever exposed, regenerate
> it in Supabase right away.

---

## 6. Showing the menu: `assets/js/menu.js`

### Step by step

**1. Find the grid on the page**
```js
const grid = document.getElementById('menu-grid');
```

**2. Ask Supabase for the items, sorted by category, then name**
```js
const { data: items, error } = await db
    .from('food_items')
    .select('*')
    .order('category')
    .order('name');
```
`items` is the list of rows. `error` is filled in only if something went
wrong (no internet, wrong key, table missing, and so on).

**3. Handle problems**
- If there is an error, it is printed in the browser console (F12) and the
  page says *"The menu could not be loaded."*
- If the table is empty, the page says *"No menu items yet."*

**4. Build one card per item**

Each item becomes a card using the existing styles in `style.css`:

| Part of the card | Comes from |
|---|---|
| Picture | `image_url`, or a 🍽 placeholder if empty |
| Category tag | `category` |
| Name | `name` |
| Description | `description` |
| Price, e.g. ₱65.00 | `price`, formatted to 2 decimals |
| Faded card + **Sold out** tag | when `is_available` is `false` |

**5. Wait for the page layout first**
```js
document.addEventListener('DOMContentLoaded', loadMenu);
```

### Why `escapeHtml` is used

Every value from the database goes through `escapeHtml()` (defined in
`shell.js`) before it is placed on the page. If an item name ever contains
characters like `<` or `>`, they are shown as text instead of being treated
as HTML. This keeps a typo in the database from breaking the page.

---

## 7. The menu page: `student/menu.html`

The placeholder text was replaced with an empty grid:
```html
<div class="menu-grid" id="menu-grid">
    <p class="panel-sub">Loading menu…</p>
</div>
```

The scripts at the bottom of the page load in this order:
```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.2/dist/umd/supabase.js"></script>
<script src="../assets/js/supabase.js"></script>
<script src="../assets/js/shell.js"></script>
<script src="../assets/js/menu.js"></script>
```

| # | Script | Why it is in this position |
|---|---|---|
| 1 | Supabase library (from the internet) | Provides `supabase.createClient`. Must load first |
| 2 | `supabase.js` | Creates the `db` connection, using the library |
| 3 | `shell.js` | Builds the sidebar and layout. It **rebuilds the whole page body** |
| 4 | `menu.js` | Fills the grid. Must run **after** `shell.js`, otherwise it would fill a grid that `shell.js` then throws away |

The library version is pinned to `2.117.2` so an update can't suddenly
change how the page behaves.

---

## 8. Managing the menu (no code needed)

Everything is done in the Supabase dashboard → **Table Editor → `food_items`**.

| To… | Do this |
|---|---|
| Add an item | Click **Insert → Insert row**, fill in `name`, `category`, `price` (and optionally `description`, `image_url`), then **Save** |
| Change a price or name | Double-click the cell, edit, press Enter |
| Mark as sold out | Untick `is_available` |
| Bring it back | Tick `is_available` again |
| Remove an item | Select the row's checkbox → **Delete** |

Refresh the menu page to see the changes.

---

## 9. Running and testing

1. Open the project in VS Code.
2. Right-click `student/menu.html` → **Open with Live Server** (install the
   *Live Server* extension if it is missing). Avoid opening the file by
   double-clicking it.
3. You should see the menu cards.

**Quick test:** untick `is_available` on one item in the Table Editor, then
refresh the page. That item should appear faded with a **Sold out** tag.

### Troubleshooting

| Problem | Likely cause |
|---|---|
| Stuck on "Loading menu…" | A script failed to load. Press F12 → Console and read the red error |
| `supabase is not defined` | The Supabase library line is missing or below `supabase.js` |
| `db is not defined` | `supabase.js` is missing or below `menu.js` |
| "The menu could not be loaded." | Supabase returned an error. The details are in the Console. Check the URL/key, internet, or that the Supabase project is not **paused** |
| Page shows no items but no error | The table is empty, or the read policy was removed |

> **Free Supabase projects pause after about 1 week without activity.**
> Before a demo or defense, log in to Supabase and make sure the project is
> active (click **Restore** if it is paused).

---

## 10. Tray (cart)

Students can add menu items to their **tray**, change quantities, remove
items, see the total, and continue to checkout.

### Where the tray is saved

The tray is saved **in the student's browser** using `localStorage`, not in
Supabase. There is no login yet, so the database has no way to know whose
tray is whose. The browser remembers it between page visits and refreshes.

Only the **item ID and quantity** are saved, for example:

```json
[{ "id": 1, "quantity": 2 }, { "id": 4, "quantity": 1 }]
```

Names and prices are **not** saved in the tray. They are loaded fresh from
Supabase every time the tray page opens, so if the canteen changes a price or
marks something sold out, the tray shows it right away.

Limits: the tray belongs to that one browser. It does not follow the student
to another phone or computer, and clearing browser data empties it. When login
is added, the tray can move into Supabase.

### Files

| File | Status | What it is |
|---|---|---|
| `assets/js/cart.js` | New | Saves and reads the tray (add, change quantity, remove, clear) |
| `assets/js/cart-page.js` | New | Draws the tray table on the tray page |
| `assets/js/menu.js` | Changed | Each available item now has an **Add** button |
| `student/menu.html` | Changed | Also loads `cart.js` |
| `student/cart.html` | Changed | Has the tray table, total, and checkout button, and loads the scripts |

### `assets/js/cart.js`: tray storage

Shared by every page that needs the tray (menu, tray, and later checkout).

| Function | What it does |
|---|---|
| `getCart()` | Returns the saved tray as a list. Returns an empty list if nothing is saved or the saved data is broken |
| `saveCart(cart)` | Saves the list to the browser |
| `addToCart(id)` | Adds 1 of the item, or adds 1 more if it is already in the tray. Returns `false` (and adds nothing) if the item is already at the maximum |
| `setQuantity(id, quantity)` | Sets the quantity. A quantity of 0 removes the item |
| `removeFromCart(id)` | Removes the item from the tray |
| `clearCart()` | Empties the tray (will be used after checkout succeeds) |
| `formatPeso(amount)` | Formats a number as pesos, e.g. `65` → `₱65.00` |
| `cartCount()` | Total number of items in the tray (see section 11) |
| `updateCartBadge()` | Updates the number next to **My tray** in the sidebar (see section 11) |

The most of one item a student can order is `MAX_QUANTITY` (10).

### Add button on the menu (`menu.js`)

- Every item that is available shows an **Add** button. Sold-out items show
  the **Sold out** tag instead, so they cannot be added.
- Clicking **Add** calls `addToCart()` and shows a pop-up message
  (see section 11).
- The click is handled by one listener on the whole page that checks for
  buttons with a `data-add` attribute. This works even though the cards are
  created after the page loads.

### Tray page (`cart.html` + `cart-page.js`)

When the page opens, `renderCart()`:

1. Reads the tray from the browser (`getCart()`).
2. Asks Supabase for the current `name`, `price`, and `is_available` of just
   those items (`.in('id', [...])`).
3. Draws one table row per item: name, price, **− quantity +**, subtotal, and
   a **Remove** button.
4. Adds up the total.

| Situation | What the student sees |
|---|---|
| Tray is empty | "Your tray is empty" with a link to the menu. Checkout button disabled |
| An item was deleted from the menu | It is removed from the tray automatically |
| An item is now sold out | It shows a **Sold out** tag, is left out of the total, and checkout is disabled with the message "Remove sold-out items before checking out" |
| Student presses **−** at quantity 1 | The item is removed |
| Student presses **+** at quantity 10 | Quantity stays at 10 |

After every **−**, **+**, or **Remove**, the table is drawn again so the
subtotals and total are always correct.

The **Proceed to checkout** button goes to `checkout.html`. It is a
`<button>` rather than a link so it can be disabled.

> The total shown here is only for the student to see. When checkout is
> built, the final total must be calculated again from Supabase prices, not
> taken from the browser.

### Testing the tray

1. Open `menu.html` with Live Server and click **Add** on a few items, some
   more than once.
2. Click **My tray** in the sidebar. The items, quantities, and total should
   match.
3. Try **+**, **−**, and **Remove**, then refresh. The tray should stay the same.
4. In the Table Editor, untick `is_available` on an item in the tray, then
   refresh the tray page. It should show **Sold out** and checkout should be
   disabled.

To empty the tray while testing: F12 → **Application** → **Local Storage** →
delete the `savore-cart` entry.

---

## 11. "Added to tray" pop-up and sidebar tray count

Two small features that make the tray easier to use:

1. **Pop-up card (toast).** When a student clicks **Add** on the menu, a
   small card slides up in the bottom-right corner:
   *"✓ Chicken Adobo with Rice added to your tray — View tray"*.
   It disappears by itself after 2.5 seconds.
2. **Tray count in the sidebar.** The **My tray** link shows a small badge
   with the number of items in the tray, on every student page. It updates
   immediately when items are added, changed, or removed, and is hidden when
   the tray is empty.

### Files

| File | Status | What changed |
|---|---|---|
| `assets/js/shell.js` | Changed | Adds the badge to the **My tray** link, and a new `showToast()` function |
| `assets/js/cart.js` | Changed | New `cartCount()` and `updateCartBadge()`. `saveCart()` and `clearCart()` now update the badge. `addToCart()` now reports when the maximum is reached |
| `assets/js/menu.js` | Changed | The **Add** click now shows the pop-up |
| `assets/css/style.css` | Changed | Styles for the pop-up and the badge, plus a fix so `hidden` always hides |
| `student/dashboard.html`, `checkout.html`, `orders.html`, `order-details.html` | Changed | Now load `cart.js` so the badge shows on these pages too |

### How the pop-up works: `showToast(html)` in `shell.js`

- The first time it is called, it creates one `<div class="toast">` at the
  bottom of the page and reuses it after that.
- It puts the message in the card and adds the `show` class. The CSS then
  fades and slides it into view.
- After 2.5 seconds the `show` class is removed and it fades out. If the
  student clicks **Add** again before then, the timer restarts, so the card
  stays up instead of flickering.
- It is in `shell.js` because every student page loads that file, so any
  page can use pop-ups later (for example, "Order placed").
- `role="status"` lets screen readers announce the message.

**Messages on the menu page**

| Situation | Pop-up |
|---|---|
| Item added | ✓ **Item name** added to your tray — **View tray** link |
| Item already at 10 | You can order up to 10 of **Item name**. |

The item name is read from the card that was clicked and passed through
`escapeHtml()` before it is shown.

### How the tray count works

- The count is the **total quantity**: 2 Adobo + 1 Iced Tea = **3**.
- `shell.js` adds an empty `<span class="count" id="cart-count">` to the
  **My tray** link when it builds the sidebar.
- `updateCartBadge()` (in `cart.js`) fills that span with `cartCount()` and
  hides it when the count is 0. It runs:
  - when any student page finishes loading, and
  - every time the tray is saved or cleared (`saveCart()` / `clearCart()`).
    Because adding, changing quantity, and removing all go through
    `saveCart()`, the badge is always up to date.
- `cart.js` must be loaded **after** `shell.js` on each page, because the badge
  only exists after `shell.js` has built the sidebar.

### CSS notes

- `.nav a .count` overrides the general `.nav a span` style (fixed width,
  15px gold text) that would otherwise apply to the badge, and pushes the
  badge to the right side of the link.
- `[hidden] { display: none !important; }` makes the `hidden` attribute
  always win. Without it, styles like `.nav a span { display: inline-block }`
  would keep a "hidden" badge visible.

### Testing

1. Open the menu and click **Add**. The pop-up should appear bottom-right and
   the **My tray** badge should show **1**.
2. Click **Add** on the same item several times. The badge should count up,
   and at 10 the pop-up should say you can only order up to 10.
3. Click **View tray** in the pop-up. It should open the tray page.
4. On the tray page, use **+**, **−**, and **Remove**. The badge should change
   each time and disappear when the tray is empty.
5. Open **Home** and **My orders**. The badge should show there too.

---

## 12. Dashboard quick menu

The **Canteen menu** section of the student dashboard (`dashboard.html`)
shows **4 menu items** that are available right now, each with an **Add**
button, so students can start an order without opening the full menu.

### Files

| File | Status | What changed |
|---|---|---|
| `assets/js/menu.js` | Changed | The card design moved into a shared `foodCardHtml(item)` function. New `loadQuickPicks()` for the dashboard |
| `student/dashboard.html` | Changed | Placeholder replaced with a `#quick-picks` grid. Now loads the Supabase scripts and `menu.js` |

### How it works

**One card design for both pages.** `foodCardHtml(item)` builds the HTML for
one food card (picture, category, name, description, price, and **Add** or
**Sold out**). Both the full menu and the quick menu use it, so a change to
the card design shows up on both pages.

**Each page loads only its own section.** `menu.js` is loaded on both the
menu page and the dashboard. When the page finishes loading it runs both
functions, and each one stops right away if its grid is not on the page:

| Function | Looks for | Found on |
|---|---|---|
| `loadMenu()` | `#menu-grid` | `menu.html` |
| `loadQuickPicks()` | `#quick-picks` | `dashboard.html` |

**Choosing the 4 items.** `loadQuickPicks()` asks Supabase only for items
where `is_available` is true (`.eq('is_available', true)`), shuffles them,
and shows the first 4. Students see a different mix each visit, and sold-out
items never appear here.

Once orders are saved in the database, this can be changed to show the
**most-ordered** items instead.

**Add buttons and the pop-up** work the same as on the menu page (section 11),
because the click listener in `menu.js` handles any `data-add` button on
whichever page it is loaded.

| Situation | What the student sees |
|---|---|
| Items available | 4 random available items |
| Fewer than 4 available | All of them |
| Nothing available | "Nothing is available right now. Please check back later." |
| Supabase error | "The menu could not be loaded." (details in the Console) |

### Testing

1. Open `dashboard.html` with Live Server. Four item cards should appear.
2. Refresh a few times. The items should change.
3. Click **Add**. The pop-up should appear and the tray badge should go up.
4. In the Table Editor, untick `is_available` on some items. They should
   never appear on the dashboard.

---

## 13. Checkout: pickup schedule and demo QR payment

The checkout page (`checkout.html`) now has:

1. **Pickup day: Today or Tomorrow only** (for the demo).
2. **Pickup windows that close by themselves.** Using the computer's clock,
   any of today's windows whose ordering time has passed are **crossed out**
   and can't be picked.
3. **A demo QR code for GCash and Maya.** Choosing either one shows a fake
   QR code with payment steps, plus the reference number and receipt fields.
   Choosing **Cash on Pickup** hides all of that.

### Files

| File | Status | What changed |
|---|---|---|
| `assets/js/checkout.js` | New | Draws the pickup choices, closes passed windows, and shows or hides the QR code |
| `student/checkout.html` | Changed | New pickup schedule and payment sections. Loads `checkout.js` |
| `assets/css/style.css` | Changed | `.choices` (day and window cards, crossed-out style) and `.qr-box` |

### Pickup windows and the cutoff

The times are set at the top of `checkout.js`:

```js
const PICKUP_WINDOWS = [
    { label: 'Morning Snack',   start: '09:30', end: '10:00' },
    { label: 'Lunch',           start: '12:00', end: '13:00' },
    { label: 'Afternoon Snack', start: '15:00', end: '15:30' }
];
const CUTOFF_MINUTES = 30;
```

- These are **demo times**. Change them to the school's real break times.
  Use 24-hour format (`15:00` = 3:00 PM).
- **Cutoff:** ordering for a window closes **30 minutes before it starts**, so
  the canteen has time to prepare. Lunch at 12:00 closes at 11:30. Set
  `CUTOFF_MINUTES` to `0` to close windows exactly when they start.

### How the schedule works: `renderSchedule()`

1. Reads the time from the computer (`new Date()`).
2. **Day cards:** *Today* and *Tomorrow*, with their dates. If **all** of
   today's windows are closed, *Today* is crossed out with "All windows
   closed" and *Tomorrow* is picked automatically.
3. **Window cards:** each shows its time range and either
   **"Order by 11:30 AM"** or **"Closed"**. Closed windows are disabled,
   faded, and crossed out. Only *today's* windows can close, so all of
   tomorrow's windows are always open.
4. Shows the current time under the windows, so it is clear which clock is
   being used.

It runs when the page opens, whenever the student switches between Today and
Tomorrow, and **every 30 seconds**, so a window crosses itself out while the
page is open. The student's selected day and window are kept when it redraws,
unless their window has just closed.

**What is sent with the form**

| Field | Example |
|---|---|
| `pickup_date` | `2026-10-21` (the actual date, not the word "Tomorrow") |
| `pickup_session` | `Lunch` |

### Demo QR payment: `updatePayment()` and `fakeQrSvg()`

When the payment choice changes, `updatePayment()`:

| Choice | What happens |
|---|---|
| Cash on Pickup | QR box, reference number, and receipt are hidden and not required |
| GCash / Maya | Shows the QR box titled "Pay with GCash/Maya", the 4 payment steps, and the reference number and receipt fields, which become **required** |

`fakeQrSvg(name)` draws a QR-looking picture as an SVG:

- A 25 × 25 grid of black and white squares, plus the three big corner
  squares that real QR codes have.
- The pattern comes from the wallet name, so GCash and Maya always get the
  **same** pattern every time, and the two are different from each other.
- It is **not a real QR code** and can't be scanned. The box is labeled
  "Demo only".

For real payments, replace it with the canteen's actual GCash/Maya QR image
(for example, `<img src="../assets/img/gcash-qr.png">`).

### Testing

1. Open `checkout.html`. *Today* should be selected, and windows whose time
   has passed should be crossed out.
2. Pick *Tomorrow*. All three windows should be open.
3. To watch a window close: set a window's `start` to about 31 minutes from
   now, reload, and wait. Within a minute it should cross itself out.
4. Choose **GCash**. The QR box and the reference/receipt fields should
   appear. Switch to **Maya**. The pattern and title should change. Choose
   **Cash on Pickup**. Everything should hide again.

The **Your order** box and the **Place pre-order** button are explained in
section 14.

---

## 14. Orders: place, track, and cancel

Students can now:

1. **Place a pre-order** at checkout. It is saved in Supabase and the tray
   is emptied.
2. **Track it** on the order page, with a progress timeline that follows the
   research paper's flow:
   **Pending → Confirmed → Preparing → Ready for pickup → Completed**.
3. **Cancel it**, but only while it is **Pending** or **Confirmed**, before
   the canteen starts preparing the food (as stated in the paper).
4. **See all their orders** on **My orders**, and their **active orders** on
   the dashboard's **Order status** section.

> This is a **demo setup without login**. See "How orders work without
> login" below for what that means.

### Files

| File | Status | What it is |
|---|---|---|
| `database/orders.sql` | New | Creates the `orders` and `order_items` tables and three database functions |
| `assets/js/orders.js` | New | Remembers this browser's orders and draws the orders list, order page, and dashboard status |
| `assets/js/checkout.js` | Changed | Shows the tray in **Your order** and saves the order when **Place pre-order** is clicked |
| `student/checkout.html` | Changed | **Your order** box filled from the tray. Loads the Supabase scripts and `orders.js` |
| `student/orders.html` | Changed | Order table filled from Supabase |
| `student/order-details.html` | Changed | Progress timeline, order details, and **Cancel order** button |
| `student/dashboard.html` | Changed | **Order status** shows active orders |

### How orders work without login

There is no login yet, so the database can't know which student placed which
order. To keep orders private anyway:

- Every order gets a long random **order code** (for example
  `3f9a2c71-…-e21a`). Nobody can guess it.
- The browser saves the codes of the orders it placed, in `localStorage`
  under `savore-orders`, the same way it saves the tray.
- The website **cannot read the orders tables directly**. RLS is on and there
  are no read policies. It can only call the three functions below, and
  they only return or cancel orders whose code you give them.

**Limits:** orders belong to **that browser**. Opening the site on another
device, or clearing browser data, loses access to them. When login is
added, orders can be linked to the student's account instead.

### The database: `database/orders.sql`

**`orders`** has one row per order.

| Column | Meaning |
|---|---|
| `id` | Order number shown to students, e.g. **#12** |
| `order_code` | The secret code (see above) |
| `pickup_date`, `pickup_window` | When the student will collect it |
| `payment_method` | `Cash on Pickup`, `GCash`, or `Maya` |
| `reference_number` | GCash/Maya reference number (empty for cash) |
| `notes` | Notes for the canteen (max 255 characters) |
| `total` | Calculated by the database from real menu prices |
| `status` | `pending`, `confirmed`, `preparing`, `ready`, `completed`, `cancelled`, or `no_show` |
| `created_at` | When the order was placed |

**`order_items`** has one row per item in an order. The item's **name and
price are copied in** when the order is placed, so old orders keep the price
the student actually paid even if the menu price changes later.

**The three functions**

| Function | What it does |
|---|---|
| `place_order(items, pickup date, window, payment method, reference number, notes)` | Checks the tray isn't empty, the day is today or tomorrow (Philippine time), every item still exists and isn't sold out, and GCash/Maya orders have a reference number. Then it saves the order and its items, **calculates the total from Supabase prices**, and returns the order code. If any check fails, nothing is saved and the student sees the reason |
| `get_my_orders(codes)` | Returns the orders matching the given codes, newest first, each with its items |
| `cancel_order(code)` | Sets the order to `cancelled`, **only if it is `pending` or `confirmed`**. Otherwise it returns "This order can no longer be cancelled." |

**Starting status** (from the paper's flowchart):

| Payment | Starts as | Why |
|---|---|---|
| Cash on Pickup | **Confirmed** | No payment to check. The student pays at pickup |
| GCash / Maya | **Pending** | Waits for the canteen to verify the payment |

The total is **never taken from the browser**. Anything in the browser can
be edited, so the database works out the price itself.

### Checkout (`checkout.js`)

- **Your order** lists the tray items (quantity, name, subtotal) and the
  total, using current Supabase prices. If the tray is empty,
  **Place pre-order** is disabled.
- **Place pre-order** stops the normal form submit and calls `place_order`.
  - **Success:** the order code is saved (`saveOrderCode`), the tray is
    emptied (`clearCart`), and the student goes to the order's page.
  - **Problem** (for example, an item just sold out): a pop-up shows the
    reason and nothing is saved.
- The browser's own form checks still run first: a pickup day, an open
  window, and a payment method are required, plus the reference number and
  receipt for GCash/Maya.

### Orders pages (`orders.js`)

`orders.js` works like `menu.js`: it is loaded on several pages, and each
function only runs if its section is on the page.

| Function | Section | Page | Shows |
|---|---|---|---|
| `loadOrderList()` | `#orders-body` | `orders.html` | Every order: number and date, pickup, payment, status, total, **View** |
| `loadOrderDetails()` | `#order-details` | `order-details.html` | Status, progress timeline, **Cancel order**, items, and details |
| `loadActiveOrders()` | `#active-orders` | `dashboard.html` | Orders still in progress (Pending to Ready), each with **Track** |

- The order page finds its order from the link, e.g.
  `order-details.html?code=3f9a…`.
- **Cash orders skip the Pending step** in the timeline.
- **Cancelled** and **No-show** orders show a short message instead of the
  timeline.
- **Cancel order** only appears while cancelling is allowed. It asks
  *"Cancel this order?"* first.
- All three sections **refresh every 30 seconds**, so status changes made by
  the canteen appear without reloading.

### Changing an order's status (demo)

There is no staff page yet. To act as the canteen:

1. Supabase → **Table Editor** → `orders`.
2. Find the order (the `id` is the number the student sees).
3. Change `status`, e.g. `confirmed` → `preparing` → `ready` → `completed`.
4. Within 30 seconds the student's page updates.

### Testing

1. Add items to the tray and check out with **Cash on Pickup**. You should
   land on the order page showing **Confirmed**, and the tray badge should
   disappear.
2. Click **Cancel order** and confirm. The status should change to
   **Cancelled**.
3. Place a **GCash** order. It should start as **Pending**.
4. In the Table Editor, set it to `preparing`. Within 30 seconds the
   timeline should move forward and **Cancel order** should disappear.
5. Open **My orders** and the dashboard. Both orders should be listed
   (the dashboard only shows ones still in progress).
6. Untick `is_available` on an item in your tray, then try to place the
   order. The pop-up should say it is sold out, and nothing is saved.

**Not included yet:** the receipt image is not uploaded (only the reference
number is saved), and the pickup cutoff is only checked in the browser.

---

## 15. Not done yet

- Login and registration (Supabase Auth). Orders would then belong to an
  account instead of a browser
- Uploading the GCash/Maya receipt image (Supabase Storage)
- Staff page: verify payments, update order status, record no-shows
- Dashboard **Account summary** and the **no-show record** on My orders
  (need login and a staff page)
- Admin features: daily sales summary, managing menu items from the website
- Category filter buttons on the menu page
- Uploading food pictures (Supabase Storage) instead of pasting image links
