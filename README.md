# LICEO SAVORE

**Web-Based School Canteen Pre-Ordering and Pickup System with Hybrid Payment and No-Show Management**

Liceo de Cagayan University — Senior High School Department
Technical-Vocational Livelihood — Information and Communications Technology

## Frontend status

The active pages in this repository are a static HTML/CSS interface. Their
browser-side demo behavior, seeded accounts and records, and `localStorage` state
have been removed. No backend, database, or API routes are included.

The separate `prototype(NOTUSED)` folder is an archived mockup and is not
referenced by the active pages.

The login, registration, and checkout forms submit with `POST`. Their `action`
attributes are intentionally unset, so a backend can serve the same paths or set
the appropriate routes when it is integrated. Validation, authentication, data
loading, authorization, payment handling, and persistence must be implemented by
the backend.

## Pages

| Page | Purpose |
|---|---|
| [index.html](index.html) | Entry point; forwards to login |
| [login.html](login.html) | Username and password form |
| [register.html](register.html) | Student registration form |
| [student/dashboard.html](student/dashboard.html) | Student landing page |
| [student/menu.html](student/menu.html) | Menu page |
| [student/cart.html](student/cart.html) | Tray page |
| [student/checkout.html](student/checkout.html) | Pickup, payment, and notes form |
| [student/orders.html](student/orders.html) | Order history and no-show records |
| [student/order-details.html](student/order-details.html) | Order details page |

The student pages currently use placeholders where data must come from the
backend. The canteen/admin pages are not present in this working tree.

## Running the interface

Open `index.html` to view the pages. Form submissions require a server that
handles the corresponding POST requests; opening the files directly does not
provide a backend.

The shared student navigation is built by [assets/js/shell.js](assets/js/shell.js).
No sample data, client-side authentication, order simulation, or browser storage
is used.

## Backend integration notes

- Serve the frontend and backend from compatible routes, or set each form's
  `action` to the backend route.
- Handle password confirmation and all validation on the server; HTML `required`
  attributes are only browser-side usability hints.
- Configure real payment instructions and receipt handling on the backend before
  enabling online payments.
- Protect student pages and derive the current student identity from the
  authenticated server session.

The registration form sends `first_name`, `last_name`, `student_number`, `strand`,
`section`, `contact`, `email`, `username`, `password`, and `confirm_password`.
Checkout sends `pickup_date`, `pickup_session`, `payment_method`,
`reference_number`, `receipt`, and `notes`.
