/* =====================================================================
   LICEO SAVORE - Shared page shell and helpers

   Builds the sidebar and topbar for every inner page so the navigation
   is written once instead of being copied into fifteen HTML files.

   A page opts in with:
     <body data-role="student" data-nav="menu" data-title="Menu">
   ===================================================================== */

/* ------------------------------------------------------------ helpers */

/** Format a number as Philippine peso. */
function peso(amount) {
    return '₱' + Number(amount).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/** Escape text before putting it into innerHTML. */
function esc(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/** CSS modifier for a status pill. */
function statusClass(status) {
    return ({
        'Pending': 'pending',
        'Confirmed': 'confirmed',
        'Preparing': 'preparing',
        'Ready for Pickup': 'ready',
        'Completed': 'completed',
        'Cancelled': 'cancelled',
        'No-Show': 'noshow',
        'Unpaid': 'pending',
        'Awaiting Verification': 'preparing',
        'Verified': 'completed',
        'Rejected': 'cancelled'
    })[status] || 'pending';
}

/** "2026-09-22" -> "Today" / "Tomorrow" / "Sep 22, 2026". */
function prettyDate(value) {
    const today = new Date();
    const date = new Date(value + 'T00:00:00');
    const days = Math.round((date - new Date(today.toDateString())) / 86400000);
    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    if (days === -1) return 'Yesterday';
    return date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
}

/** "08:50" -> "8:50 AM". */
function prettyTime(value) {
    const [h, m] = value.split(':').map(Number);
    const suffix = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 === 0 ? 12 : h % 12;
    return hour + ':' + String(m).padStart(2, '0') + ' ' + suffix;
}

/* ------------------------------------------------------------- toast */

let toastTimer = null;

function showToast(message) {
    let toast = document.getElementById('toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        toast.className = 'toast';
        toast.setAttribute('role', 'status');
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
}

/* --------------------------------------------------- simple storage */

/* localStorage can throw in a private window or when a browser blocks
   site data for file:// pages, so every access falls back to memory. */
const memoryStore = {};

const Store = {
    get(key, fallback) {
        try {
            const raw = localStorage.getItem('savore.' + key);
            return raw === null ? fallback : JSON.parse(raw);
        } catch (e) {
            return key in memoryStore ? memoryStore[key] : fallback;
        }
    },
    set(key, value) {
        memoryStore[key] = value;
        try {
            localStorage.setItem('savore.' + key, JSON.stringify(value));
        } catch (e) { /* demo still works from memory */ }
    },
    remove(key) {
        delete memoryStore[key];
        try { localStorage.removeItem('savore.' + key); } catch (e) {}
    }
};

/* ---------------------------------------------------------- the cart */

const Cart = {
    all() {
        return Store.get('cart', []);
    },
    count() {
        return this.all().reduce((sum, line) => sum + line.qty, 0);
    },
    total() {
        return this.all().reduce((sum, line) => sum + line.qty * line.price, 0);
    },
    add(foodId, qty = 1) {
        const food = MENU.find(item => item.id === foodId);
        if (!food || !food.available) return false;

        const cart = this.all();
        const line = cart.find(entry => entry.id === foodId);

        if (line) {
            line.qty = Math.min(10, line.qty + qty);
        } else {
            cart.push({ id: food.id, name: food.name, price: food.price,
                        category: food.category, icon: food.icon, qty });
        }

        Store.set('cart', cart);
        return true;
    },
    setQty(foodId, qty) {
        let cart = this.all();
        if (qty <= 0) {
            cart = cart.filter(line => line.id !== foodId);
        } else {
            const line = cart.find(entry => entry.id === foodId);
            if (line) line.qty = Math.min(10, qty);
        }
        Store.set('cart', cart);
    },
    remove(foodId) {
        Store.set('cart', this.all().filter(line => line.id !== foodId));
    },
    clear() {
        Store.set('cart', []);
    }
};

/* ------------------------------------------------- orders the demo made */

const Orders = {
    /** Orders placed during this demo, newest first, plus the sample history. */
    all() {
        return Store.get('orders', []).concat(SAMPLE_ORDERS);
    },
    placed() {
        return Store.get('orders', []);
    },
    find(code) {
        return this.all().find(order => order.code === code) || null;
    },
    add(order) {
        const placed = Store.get('orders', []);
        placed.unshift(order);
        Store.set('orders', placed);
    },
    update(code, changes) {
        const placed = Store.get('orders', []);
        const order = placed.find(entry => entry.code === code);
        if (order) {
            Object.assign(order, changes);
            Store.set('orders', placed);
        }
    },
    newCode() {
        const now = new Date();
        const stamp = String(now.getFullYear()).slice(2)
            + String(now.getMonth() + 1).padStart(2, '0')
            + String(now.getDate()).padStart(2, '0');
        return 'LS-' + stamp + '-' + String(Math.floor(Math.random() * 10000)).padStart(4, '0');
    }
};

/* ------------------------------------------------------ notifications */

const Notifications = {
    all() {
        return Store.get('notifications', []).concat(SAMPLE_NOTIFICATIONS);
    },
    unread() {
        return Store.get('notifications', []).filter(n => !n.read).length;
    },
    add(message, type, code) {
        const list = Store.get('notifications', []);
        list.unshift({
            message, type, code,
            date: new Date().toISOString().slice(0, 16).replace('T', ' '),
            read: false
        });
        Store.set('notifications', list);
    },
    markAllRead() {
        const list = Store.get('notifications', []);
        list.forEach(n => { n.read = true; });
        Store.set('notifications', list);
    }
};

/* --------------------------------------------------- the page shell */

const STUDENT_NAV = [
    { key: 'dashboard',     icon: '⌂', label: 'Home',          href: 'dashboard.html' },
    { key: 'menu',          icon: '▤', label: 'Menu',          href: 'menu.html' },
    { key: 'cart',          icon: '▣', label: 'My tray',       href: 'cart.html' },
    { key: 'orders',        icon: '◷', label: 'My orders',     href: 'orders.html' },
];

const STAFF_NAV = [
    { key: 'dashboard', icon: '⌂', label: 'Dashboard', href: 'dashboard.html' },
    { key: 'orders',    icon: '▣', label: 'Orders',    href: 'orders.html' },
    { key: 'payments',  icon: '₱', label: 'Payments',  href: 'payments.html' },
    { key: 'menu',      icon: '▤', label: 'Menu',      href: 'menu.html' },
    { key: 'noshow',    icon: '⚠', label: 'No-shows',  href: 'noshow.html' },
    { key: 'reports',   icon: '◫', label: 'Reports',   href: 'reports.html' }
];// why is this here.. Admins are not implemented yet, but the nav is ready for them.

function buildShell() {
    const body = document.body;
    const role = body.dataset.role;
    if (!role) return;

    const isStaff = role === 'staff';
    const nav = isStaff ? STAFF_NAV : STUDENT_NAV;
    const activeNav = body.dataset.nav || '';
    const title = body.dataset.title || '';
    const user = isStaff ? CURRENT_STAFF : CURRENT_STUDENT;

    const cartBadge = isStaff ? 0 : Cart.count();
    const notifBadge = isStaff ? 0 : Notifications.unread();

    const navHtml = nav.map(item => {
        let badge = '';
        if (!isStaff && item.key === 'cart' && cartBadge > 0) {
            badge = `<b class="nav-badge">${cartBadge}</b>`;
        }
        return `<a class="${activeNav === item.key ? 'active' : ''}" href="${item.href}">
                    <span>${item.icon}</span>${item.label}${badge}
                </a>`;
    }).join('');

    const sidebar = `
        <aside class="sidebar">
            <div class="brand">
                <img class="brand-logo" src="../assets/img/liceo-logo.png" alt="Liceo de Cagayan University logo">
                <div class="brand-name">LICEO SAVORE
                    <small>${isStaff ? 'Canteen console' : 'Campus canteen'}</small>
                </div>
            </div>
            <div class="nav-label">${isStaff ? 'Canteen personnel' : 'Student space'}</div>
            <nav class="nav" aria-label="Main navigation">${navHtml}</nav>
            <div class="sidebar-bottom">
                ${isStaff
                    ? '<strong>Manual verification</strong>Online payments are confirmed by reviewing the uploaded receipt.'
                    : '<strong>Pickup promise</strong>Order before your break and collect at the express counter.'}
            </div>
        </aside>`;

    const topbar = `
        <header class="topbar">
            <div class="crumb">${isStaff ? 'Canteen console' : 'Student portal'}
                &nbsp;/&nbsp; ${esc(title)}</div>
            <div class="top-actions">
                ${isStaff ? '' : `
                    <a class="icon-btn" href="cart.html" aria-label="My tray">📥${
                        cartBadge > 0 ? '<i class="dot"></i>' : ''}</a>`}
                <div class="profile">
                    <img class="avatar" src="../assets/img/mita.png" alt="User avatar">
                    <span>${esc(user.name)}</span>
                </div>
                <a class="logout-btn" href="${isStaff ? '../index.html' : '../index.html'}">Log out</a>
            </div>
        </header>`;

    // Wrap whatever the page already contains inside the shell.
    const pageContent = body.innerHTML;

    body.innerHTML = `
        <div class="shell">
            ${sidebar}
            <main>
                ${topbar}
                <div id="page-body">${pageContent}</div>
                <footer class="page-footer">
                    LICEO SAVORE · Campus Canteen Pre-Order System —
                    Liceo de Cagayan University, Senior High School Department
                </footer>
            </main>
        </div>
        <div class="toast" id="toast" role="status" aria-live="polite"></div>`;
}

/* ------------------------------------------------ global behaviours */

function wireGlobalBehaviour() {
    // Anything marked data-confirm asks before acting.
    document.addEventListener('click', event => {
        const el = event.target.closest('[data-confirm]');
        if (el && !window.confirm(el.dataset.confirm)) {
            event.preventDefault();
            event.stopImmediatePropagation();
        }
    }, true);

    // Live clock on the staff console.
    const clock = document.getElementById('live-clock');
    if (clock) {
        const tick = () => {
            clock.textContent = new Date().toLocaleTimeString('en-PH', {
                hour: 'numeric', minute: '2-digit', second: '2-digit'
            });
        };
        tick();
        setInterval(tick, 1000);
    }
}

/* The shell must exist before page scripts look for their containers,
   so this runs first and pages listen for "shell:ready". */
document.addEventListener('DOMContentLoaded', () => {
    buildShell();
    wireGlobalBehaviour();
    document.dispatchEvent(new CustomEvent('shell:ready'));
});
