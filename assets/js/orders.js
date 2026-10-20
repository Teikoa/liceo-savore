// Orders placed from this browser: the orders list (orders.html), the
// order page (order-details.html), and Order status on the dashboard.
// No login yet: each order has a secret order code, and this browser
// remembers the codes of the orders it placed.
const ORDERS_KEY = 'savore-orders';

// Progress steps on the order page (from the research paper's flow)
const ORDER_STEPS = [
    { status: 'pending',   label: 'Pending',          note: 'Waiting for the canteen to check your payment' },
    { status: 'confirmed', label: 'Confirmed',        note: 'The canteen has received your order' },
    { status: 'preparing', label: 'Preparing',        note: 'Your food is being prepared' },
    { status: 'ready',     label: 'Ready for pickup', note: 'Collect it at the canteen during your pickup window' },
    { status: 'completed', label: 'Completed',        note: 'Order collected. Enjoy your meal!' }
];
const STATUS_LABELS = {
    pending: 'Pending', confirmed: 'Confirmed', preparing: 'Preparing', ready: 'Ready for pickup',
    completed: 'Completed', cancelled: 'Cancelled', no_show: 'No-show'
};
const ACTIVE_STATUSES = ['pending', 'confirmed', 'preparing', 'ready'];
const CANCELLABLE_STATUSES = ['pending', 'confirmed'];

// ------------------------------------------------------ saved codes
function getOrderCodes() {
    try {
        return JSON.parse(localStorage.getItem(ORDERS_KEY)) || [];
    } catch {
        return [];
    }
}

function saveOrderCode(code) {
    localStorage.setItem(ORDERS_KEY, JSON.stringify([code, ...getOrderCodes()]));
}

// This browser's orders, newest first, each with its items
async function fetchMyOrders(codes = getOrderCodes()) {
    if (codes.length === 0) return { orders: [], error: null };
    const { data, error } = await db.rpc('get_my_orders', { p_codes: codes });
    if (error) console.error(error);
    return { orders: data || [], error };
}

// ---------------------------------------------------------- helpers
function statusPill(status) {
    const css = status === 'no_show' ? 'noshow' : status;
    return `<span class="pill ${css}">${STATUS_LABELS[status] || status}</span>`;
}

function pickupText(order) {
    const day = new Date(order.pickup_date + 'T00:00')
        .toLocaleDateString('en-PH', { weekday: 'short', month: 'short', day: 'numeric' });
    return `${day} · ${escapeHtml(order.pickup_window)}`;
}

function placedText(order) {
    return new Date(order.created_at)
        .toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function orderLink(order, label) {
    return `<a class="btn btn-ghost btn-sm" href="order-details.html?code=${order.order_code}">${label}</a>`;
}

// ------------------------------------------- orders list (orders.html)
async function loadOrderList() {
    const body = document.getElementById('orders-body');
    if (!body) return;               // not on this page

    const { orders, error } = await fetchMyOrders();
    if (error) {
        body.innerHTML = '<tr><td colspan="6" class="empty-row">Your orders could not be loaded. Please try again later.</td></tr>';
        return;
    }
    if (orders.length === 0) {
        body.innerHTML = '<tr><td colspan="6" class="empty-row">You haven\'t placed any orders yet. <a href="menu.html"><b>Browse the menu</b></a></td></tr>';
        return;
    }

    body.innerHTML = orders.map(order => `
        <tr>
            <td><b>#${order.id}</b><br><small style="color:var(--muted)">${placedText(order)}</small></td>
            <td>${pickupText(order)}</td>
            <td>${escapeHtml(order.payment_method)}</td>
            <td>${statusPill(order.status)}</td>
            <td class="num">${formatPeso(order.total)}</td>
            <td>${orderLink(order, 'View')}</td>
        </tr>`).join('');
}

// --------------------------------------- order page (order-details.html)
function progressHtml(order) {
    if (order.status === 'cancelled') return '<p class="panel-sub">This order was cancelled.</p>';
    if (order.status === 'no_show') {
        return '<p class="panel-sub">This order was not collected and was recorded as a no-show.</p>';
    }

    // Cash orders have no payment to check, so they skip "Pending"
    const steps = order.payment_method === 'Cash on Pickup' ? ORDER_STEPS.slice(1) : ORDER_STEPS;
    const reached = steps.findIndex(step => step.status === order.status);

    return `
        <div class="timeline" style="margin-top:16px">
            ${steps.map((step, i) => `
                <div class="step ${i <= reached ? 'done' : ''}">
                    <span class="bullet"></span>
                    <div class="body"><b>${step.label}</b><small>${step.note}</small></div>
                </div>`).join('')}
        </div>`;
}

async function loadOrderDetails() {
    const box = document.getElementById('order-details');
    if (!box) return;                // not on this page

    const code = new URLSearchParams(location.search).get('code');
    const { orders } = code ? await fetchMyOrders([code]) : { orders: [] };
    const order = orders[0];

    if (!order) {
        box.innerHTML = `
            <section class="panel" style="margin-top:26px">
                <h2>Order not found</h2>
                <p class="panel-sub">This order could not be found.</p>
                <a class="btn btn-ghost btn-sm" href="orders.html">Back to my orders</a>
            </section>`;
        return;
    }

    const canCancel = CANCELLABLE_STATUSES.includes(order.status);

    box.innerHTML = `
        <div class="section-head" style="margin-top:26px">
            <div>
                <h2>Order #${order.id}</h2>
                <p>Placed ${placedText(order)}</p>
            </div>
            ${statusPill(order.status)}
        </div>

        <div class="content-grid">
            <section class="panel">
                <h3>Order progress</h3>
                ${progressHtml(order)}
                ${canCancel ? `
                    <button type="button" class="btn btn-danger btn-sm" data-cancel="${order.order_code}">Cancel order</button>
                    <p class="panel-sub" style="margin-top:8px">You can cancel until the canteen starts preparing your food.</p>` : ''}
            </section>

            <aside class="order-card">
                <div class="order-title"><h2>Items</h2></div>
                <div class="cart-items">
                    ${order.items.map(item => `
                        <div class="cart-row">
                            <span class="qty">${item.quantity}×</span>
                            <span class="name">${escapeHtml(item.name)}</span>
                            <span>${formatPeso(item.subtotal)}</span>
                        </div>`).join('')}
                </div>
                <div class="kv">
                    <div><span class="k">Pickup</span><span class="v">${pickupText(order)}</span></div>
                    <div><span class="k">Payment</span><span class="v">${escapeHtml(order.payment_method)}</span></div>
                    ${order.reference_number ? `<div><span class="k">Reference no.</span><span class="v">${escapeHtml(order.reference_number)}</span></div>` : ''}
                    ${order.notes ? `<div><span class="k">Notes</span><span class="v">${escapeHtml(order.notes)}</span></div>` : ''}
                </div>
                <div class="summary">
                    <div class="total"><span>Total</span><span>${formatPeso(order.total)}</span></div>
                </div>
                <a class="btn btn-ghost btn-sm btn-block" style="margin-top:16px" href="orders.html">Back to my orders</a>
            </aside>
        </div>`;
}

// ---------------------------------- Order status (dashboard.html)
async function loadActiveOrders() {
    const box = document.getElementById('active-orders');
    if (!box) return;                // not on this page

    const { orders, error } = await fetchMyOrders();
    const active = orders.filter(order => ACTIVE_STATUSES.includes(order.status));

    if (error) {
        box.innerHTML = '<p class="panel-sub">Your orders could not be loaded. Please try again later.</p>';
    } else if (active.length === 0) {
        box.innerHTML = '<p class="panel-sub">No active orders. <a href="menu.html"><b>Start an order</b></a></p>';
    } else {
        box.innerHTML = `
            <div class="table-wrap"><table class="data"><tbody>
                ${active.map(order => `
                    <tr>
                        <td><b>#${order.id}</b></td>
                        <td>${pickupText(order)}</td>
                        <td>${statusPill(order.status)}</td>
                        <td class="num">${orderLink(order, 'Track')}</td>
                    </tr>`).join('')}
            </tbody></table></div>`;
    }
}

// ------------------------------------------------------------ events
function refreshOrders() {
    loadOrderList();
    loadOrderDetails();
    loadActiveOrders();
}

// "Cancel order" button
document.addEventListener('click', async event => {
    const button = event.target.closest('[data-cancel]');
    if (!button || !confirm('Cancel this order?')) return;

    button.disabled = true;
    const { error } = await db.rpc('cancel_order', { p_code: button.dataset.cancel });
    showToast(`<span>${error ? escapeHtml(error.message) : 'Your order was cancelled.'}</span>`);
    loadOrderDetails();
});

document.addEventListener('DOMContentLoaded', () => {
    refreshOrders();
    setInterval(refreshOrders, 30 * 1000);   // pick up status changes from the canteen
});
