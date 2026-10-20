/**
 * Liceo Savore: prototype backend (plain JavaScript on Node.js)
 *
 * No packages to install: it only uses Node's built-in modules
 * (http, crypto, sqlite). Needs Node 22.5 or newer.
 *
 * Run:
 *   node server.js
 *     (on Node 22.5 to 22.12, use: node --experimental-sqlite server.js)
 * Then open http://localhost:3000/ to see the list of endpoints.
 *
 * Demo accounts (created automatically):
 *   student:  school_id = student1   password = 1234
 *   staff:    school_id = staff1     password = 1234
 *
 * PROTOTYPE SHORTCUTS (fix before real use):
 *   - Login tokens are kept in memory (restarting the server logs everyone out)
 *   - The receipt is only a reference number, no image upload
 *   - The 20-minute pickup cutoff is not enforced here
 */
const http = require('node:http');
const crypto = require('node:crypto');
const { DatabaseSync } = require('node:sqlite');

const PORT = process.env.PORT || 3000;
const DB_FILE = process.env.DB_FILE || 'savore.db';

// Same policy as the POLICY object in assets/js/data.js
const POLICY = { noshowLimit: 3, noshowWindowDays: 30, suspensionDays: 7 };
const WINDOWS = ['Morning Snack', 'Lunch', 'Afternoon Snack'];
const PAYMENT_METHODS = ['cash', 'gcash', 'maya'];
const STATUS_FLOW = ['pending', 'confirmed', 'preparing', 'ready', 'collected'];
const DAY_MS = 24 * 60 * 60 * 1000;

// ------------------------------------------------------------------ database
const db = new DatabaseSync(DB_FILE);
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    school_id TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'student',
    suspended_until TEXT
  );
  CREATE TABLE IF NOT EXISTS menu_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    price REAL NOT NULL,
    sold_out INTEGER NOT NULL DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL REFERENCES users(id),
    pickup_date TEXT NOT NULL,
    pickup_window TEXT NOT NULL,
    items TEXT NOT NULL,              -- JSON: [{name, price, quantity}] (price snapshot)
    total REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    payment_method TEXT NOT NULL,     -- cash | gcash | maya
    payment_status TEXT NOT NULL,     -- cash | pending | approved | rejected
    payment_reference TEXT,
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS no_shows (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER UNIQUE NOT NULL REFERENCES orders(id),
    student_id INTEGER NOT NULL REFERENCES users(id),
    recorded_at TEXT NOT NULL
  );
`);

const all = (sql, ...args) => db.prepare(sql).all(...args);
const get = (sql, ...args) => db.prepare(sql).get(...args);
const run = (sql, ...args) => Number(db.prepare(sql).run(...args).lastInsertRowid);

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  return salt + ':' + crypto.scryptSync(password, salt, 32).toString('hex');
}
function checkPassword(password, stored) {
  const [salt, hash] = stored.split(':');
  const attempt = crypto.scryptSync(password, salt, 32);
  return crypto.timingSafeEqual(attempt, Buffer.from(hash, 'hex'));
}

// Seed demo data on first run
if (!get('SELECT 1 AS x FROM users LIMIT 1')) {
  run('INSERT INTO users (school_id, full_name, password_hash, role) VALUES (?,?,?,?)',
      'student1', 'Demo Student', hashPassword('1234'), 'student');
  run('INSERT INTO users (school_id, full_name, password_hash, role) VALUES (?,?,?,?)',
      'staff1', 'Canteen Staff', hashPassword('1234'), 'staff');
  const seed = [
    ['Chicken Adobo Rice', 'Meals', 55], ['Pancit Canton', 'Meals', 40],
    ['Banana Cue', 'Snacks', 15], ['Siomai (4 pcs)', 'Snacks', 25], ['Iced Tea', 'Drinks', 20],
  ];
  for (const [name, category, price] of seed) {
    run('INSERT INTO menu_items (name, category, price) VALUES (?,?,?)', name, category, price);
  }
}

// ------------------------------------------------------------------ tiny router
class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

const routes = [];
// access: 'public' | 'user' (any logged-in user) | 'staff'
function route(method, path, access, handler) {
  const keys = [];
  const re = new RegExp('^' + path.replace(/:(\w+)/g, (_, k) => (keys.push(k), '([^/]+)')) + '$');
  routes.push({ method, path, access, re, keys, handler });
}

const tokens = new Map(); // token -> user id

function userFromRequest(req) {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  const userId = tokens.get(token);
  if (!userId) {
    throw new HttpError(401, "Not logged in. Call POST /login and send 'Authorization: Bearer <token>'.");
  }
  return get('SELECT * FROM users WHERE id = ?', userId);
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      const text = Buffer.concat(chunks).toString();
      if (!text) return resolve({});
      try { resolve(JSON.parse(text)); }
      catch { reject(new HttpError(400, 'Request body is not valid JSON.')); }
    });
    req.on('error', reject);
  });
}

function send(res, status, data) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
  });
  res.end(JSON.stringify(data));
}

// ------------------------------------------------------------------ helpers
const orderOut = (row) => ({ ...row, items: JSON.parse(row.items) });

function getOrder(id) {
  const order = Number.isInteger(Number(id)) ? get('SELECT * FROM orders WHERE id = ?', Number(id)) : null;
  if (!order) throw new HttpError(404, 'Order not found.');
  return order;
}

function noShowCount(studentId) {
  const since = new Date(Date.now() - POLICY.noshowWindowDays * DAY_MS).toISOString();
  return get('SELECT COUNT(*) AS c FROM no_shows WHERE student_id = ? AND recorded_at >= ?',
             studentId, since).c;
}

const need = (cond, msg) => { if (!cond) throw new HttpError(400, msg); };
const isText = (v) => typeof v === 'string' && v.trim() !== '';

// ------------------------------------------------------------------ accounts
route('POST', '/register', 'public', ({ body }) => {
  need(isText(body.school_id) && isText(body.full_name) && isText(body.password),
       'school_id, full_name and password are required.');
  if (get('SELECT 1 AS x FROM users WHERE school_id = ?', body.school_id)) {
    throw new HttpError(400, 'That school ID is already registered.');
  }
  run('INSERT INTO users (school_id, full_name, password_hash) VALUES (?,?,?)',
      body.school_id.trim(), body.full_name.trim(), hashPassword(body.password));
  return { message: 'Registered. You can log in now.' };
});

route('POST', '/login', 'public', ({ body }) => {
  const user = isText(body.school_id) ? get('SELECT * FROM users WHERE school_id = ?', body.school_id) : null;
  if (!user || !isText(body.password) || !checkPassword(body.password, user.password_hash)) {
    throw new HttpError(401, 'Wrong school ID or password.');
  }
  const token = crypto.randomBytes(16).toString('hex');
  tokens.set(token, user.id);
  return { token, role: user.role, full_name: user.full_name };
});

// ------------------------------------------------------------------ menu
route('GET', '/menu', 'public', () => all('SELECT * FROM menu_items ORDER BY category, name'));

route('POST', '/menu', 'staff', ({ body }) => {
  need(isText(body.name) && isText(body.category), 'name and category are required.');
  need(typeof body.price === 'number' && body.price >= 0, 'price must be a number, 0 or more.');
  return { id: run('INSERT INTO menu_items (name, category, price) VALUES (?,?,?)',
                   body.name.trim(), body.category.trim(), body.price) };
});

route('PATCH', '/menu/:id/sold-out', 'staff', ({ params }) => {
  run('UPDATE menu_items SET sold_out = 1 - sold_out WHERE id = ?', Number(params.id));
  const item = get('SELECT * FROM menu_items WHERE id = ?', Number(params.id));
  if (!item) throw new HttpError(404, 'Menu item not found.');
  return item;
});

// ------------------------------------------------------------------ student: orders
route('POST', '/orders', 'user', ({ user, body }) => {
  if (user.suspended_until && user.suspended_until > new Date().toISOString()) {
    throw new HttpError(403, `Pre-ordering suspended until ${user.suspended_until.slice(0, 10)}. ` +
                             'You can still buy at the counter.');
  }
  need(/^\d{4}-\d{2}-\d{2}$/.test(body.pickup_date || ''), 'pickup_date must look like 2026-10-12.');
  need(WINDOWS.includes(body.pickup_window), `pickup_window must be one of: ${WINDOWS.join(', ')}.`);
  need(PAYMENT_METHODS.includes(body.payment_method), 'payment_method must be cash, gcash or maya.');
  need(Array.isArray(body.items) && body.items.length > 0, 'Your tray is empty.');
  if (body.payment_method !== 'cash') {
    need(isText(body.payment_reference), 'GCash/Maya orders need a reference number.');
  }

  let total = 0;
  const lines = body.items.map((line) => {
    need(Number.isInteger(line.quantity) && line.quantity >= 1, 'Quantity must be a whole number, at least 1.');
    const item = get('SELECT * FROM menu_items WHERE id = ?', Number(line.menu_item_id));
    if (!item) throw new HttpError(404, `Menu item ${line.menu_item_id} does not exist.`);
    if (item.sold_out) throw new HttpError(400, `${item.name} is sold out.`);
    total += item.price * line.quantity;
    return { name: item.name, price: item.price, quantity: line.quantity };
  });

  const paymentStatus = body.payment_method === 'cash' ? 'cash' : 'pending';
  const id = run(
    `INSERT INTO orders (student_id, pickup_date, pickup_window, items, total, payment_method,
                         payment_status, payment_reference, created_at)
     VALUES (?,?,?,?,?,?,?,?,?)`,
    user.id, body.pickup_date, body.pickup_window, JSON.stringify(lines), total,
    body.payment_method, paymentStatus, body.payment_reference || null, new Date().toISOString());
  return [201, orderOut(getOrder(id))];
});

route('GET', '/orders/me', 'user', ({ user }) =>
  all('SELECT * FROM orders WHERE student_id = ? ORDER BY id DESC', user.id).map(orderOut));

route('POST', '/orders/:id/cancel', 'user', ({ user, params }) => {
  const order = getOrder(params.id);
  if (order.student_id !== user.id) throw new HttpError(403, 'Not your order.');
  if (!['pending', 'confirmed'].includes(order.status)) {
    throw new HttpError(400, "It's too late to cancel this order.");
  }
  run("UPDATE orders SET status = 'cancelled' WHERE id = ?", order.id);
  return orderOut(getOrder(order.id));
});

route('GET', '/me/noshows', 'user', ({ user }) => ({
  noshows_last_30_days: noShowCount(user.id),
  limit: POLICY.noshowLimit,
  suspended_until: user.suspended_until,
}));

// ------------------------------------------------------------------ staff: orders
route('GET', '/orders', 'staff', ({ query }) => {
  const status = query.get('status');
  const rows = status
    ? all('SELECT * FROM orders WHERE status = ? ORDER BY id DESC', status)
    : all('SELECT * FROM orders ORDER BY id DESC');
  return rows.map(orderOut);
});

// Staff reads the GCash/Maya receipt, then approves or rejects it
route('PATCH', '/orders/:id/payment', 'staff', ({ params, body }) => {
  const order = getOrder(params.id);
  need(typeof body.approve === 'boolean', 'Send { "approve": true } or { "approve": false }.');
  if (order.payment_method === 'cash') throw new HttpError(400, 'Cash orders have no receipt to verify.');
  if (body.approve) {
    run("UPDATE orders SET payment_status = 'approved', status = 'confirmed' WHERE id = ?", order.id);
  } else {
    run("UPDATE orders SET payment_status = 'rejected', status = 'rejected' WHERE id = ?", order.id);
  }
  return orderOut(getOrder(order.id));
});

route('PATCH', '/orders/:id/status', 'staff', ({ params, body }) => {
  const order = getOrder(params.id);
  need(['confirmed', 'preparing', 'ready', 'collected'].includes(body.status),
       'status must be confirmed, preparing, ready or collected.');
  // Rule from the paper: online orders can't move past Pending until payment is approved
  if (order.payment_method !== 'cash' && order.payment_status !== 'approved') {
    throw new HttpError(400, "Payment hasn't been approved yet.");
  }
  if (!STATUS_FLOW.includes(order.status)) {
    throw new HttpError(400, `Order is already ${order.status}.`);
  }
  if (STATUS_FLOW.indexOf(body.status) !== STATUS_FLOW.indexOf(order.status) + 1) {
    throw new HttpError(400, 'Order status must move to the next step.');
  }
  run('UPDATE orders SET status = ? WHERE id = ?', body.status, order.id);
  return orderOut(getOrder(order.id));
});

route('POST', '/orders/:id/no-show', 'staff', ({ params }) => {
  const order = getOrder(params.id);
  if (['collected', 'cancelled', 'rejected', 'no_show'].includes(order.status)) {
    throw new HttpError(400, `Can't record a no-show on a ${order.status} order.`);
  }
  run("UPDATE orders SET status = 'no_show' WHERE id = ?", order.id);
  run('INSERT INTO no_shows (order_id, student_id, recorded_at) VALUES (?,?,?)',
      order.id, order.student_id, new Date().toISOString());

  const count = noShowCount(order.student_id);
  let suspended = false;
  if (count >= POLICY.noshowLimit) {
    const until = new Date(Date.now() + POLICY.suspensionDays * DAY_MS).toISOString();
    run('UPDATE users SET suspended_until = ? WHERE id = ?', until, order.student_id);
    suspended = true;
  }
  return { noshows_last_30_days: count, student_suspended: suspended };
});

route('POST', '/students/:id/lift-suspension', 'staff', ({ params }) => {
  run('UPDATE users SET suspended_until = NULL WHERE id = ?', Number(params.id));
  return { message: 'Suspension lifted.' };
});

// Home page: a readable list of every endpoint (a poor man's /docs)
route('GET', '/', 'public', () => ({
  name: 'Liceo Savore prototype backend',
  note: "Log in with POST /login, then send 'Authorization: Bearer <token>' on protected routes.",
  endpoints: routes.map((r) => `${r.method} ${r.path}  [${r.access}]`),
}));

// ------------------------------------------------------------------ server
const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') return send(res, 204, {});
  try {
    const url = new URL(req.url, 'http://localhost');
    for (const r of routes) {
      if (r.method !== req.method) continue;
      const match = r.re.exec(url.pathname);
      if (!match) continue;

      const params = Object.fromEntries(r.keys.map((k, i) => [k, decodeURIComponent(match[i + 1])]));
      let user = null;
      if (r.access !== 'public') {
        user = userFromRequest(req);
        if (r.access === 'staff' && user.role !== 'staff') throw new HttpError(403, 'Canteen staff only.');
      }
      const body = req.method === 'GET' ? {} : await readJson(req);
      const result = await r.handler({ user, params, body, query: url.searchParams });
      return Array.isArray(result) && typeof result[0] === 'number'
        ? send(res, result[0], result[1])
        : send(res, 200, result);
    }
    throw new HttpError(404, 'No such endpoint. Open / to see the list.');
  } catch (err) {
    if (err instanceof HttpError) return send(res, err.status, { error: err.message });
    console.error(err);
    send(res, 500, { error: 'Something went wrong on the server.' });
  }
});

server.listen(PORT, () => console.log(`Liceo Savore backend running at http://localhost:${PORT}`));
