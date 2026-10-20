// Checkout page: pickup schedule (today or tomorrow, windows close by
// themselves using this computer's clock) and the demo GCash/Maya QR code.

// Demo pickup windows in 24-hour time. Change these to the real break times.
const PICKUP_WINDOWS = [
    { label: 'Morning Snack',   start: '09:30', end: '10:00' },
    { label: 'Lunch',           start: '12:00', end: '13:00' },
    { label: 'Afternoon Snack', start: '14:00', end: '14:30' }
];
// Ordering for a window closes this many minutes before it starts
const CUTOFF_MINUTES = 30;

// ------------------------------------------------------ time helpers

// A date as "2026-10-21" (what the form sends)
function dateValue(date) {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${date.getFullYear()}-${month}-${day}`;
}

// "12:30" -> 750 (minutes since midnight)
function toMinutes(time) {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
}

// 750 -> "12:30 PM"
function timeLabel(minutes) {
    return new Date(2000, 0, 1, 0, minutes)
        .toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' });
}

// Only today's windows can close; tomorrow's are always open
function isClosed(slot, dayValue) {
    const now = new Date();
    if (dayValue !== dateValue(now)) return false;
    return now.getHours() * 60 + now.getMinutes() >= toMinutes(slot.start) - CUTOFF_MINUTES;
}

// --------------------------------------------------- pickup schedule
function renderSchedule() {
    const form = document.getElementById('checkout-form');
    const chosenDay = form.elements.pickup_date?.value;
    const chosenSlot = form.elements.pickup_session?.value;

    const now = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(now.getDate() + 1);

    const days = [
        { label: 'Today', date: now },
        { label: 'Tomorrow', date: tomorrow }
    ];
    // Today is unavailable once every one of its windows has closed
    days[0].disabled = PICKUP_WINDOWS.every(slot => isClosed(slot, dateValue(now)));

    // Keep the student's day if it is still allowed, otherwise use the first open day
    const openDays = days.filter(d => !d.disabled).map(d => dateValue(d.date));
    const day = openDays.includes(chosenDay) ? chosenDay : openDays[0];

    document.getElementById('pickup-days').innerHTML = days.map(d => `
        <label>
            <input type="radio" name="pickup_date" value="${dateValue(d.date)}" required
                   ${dateValue(d.date) === day ? 'checked' : ''} ${d.disabled ? 'disabled' : ''}>
            <span><b>${d.label}</b>
                <small>${d.disabled
                    ? 'All windows closed'
                    : d.date.toLocaleDateString('en-PH', { weekday: 'short', month: 'short', day: 'numeric' })}</small>
            </span>
        </label>`).join('');

    document.getElementById('pickup-windows').innerHTML = PICKUP_WINDOWS.map(slot => {
        const closed = isClosed(slot, day);
        return `
        <label>
            <input type="radio" name="pickup_session" value="${slot.label}" required
                   ${slot.label === chosenSlot && !closed ? 'checked' : ''} ${closed ? 'disabled' : ''}>
            <span><b>${slot.label}</b>
                <small>${timeLabel(toMinutes(slot.start))} – ${timeLabel(toMinutes(slot.end))}</small>
                <small>${closed ? 'Closed' : 'Order by ' + timeLabel(toMinutes(slot.start) - CUTOFF_MINUTES)}</small>
            </span>
        </label>`;
    }).join('');

    document.getElementById('pickup-clock').textContent =
        `Current time: ${now.toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' })} (this computer's clock)`;
}

// ------------------------------------------------------- demo QR code

// Draws a QR-looking SVG. It is NOT a real QR code and cannot be scanned.
// The same name always gives the same pattern (GCash and Maya differ).
function fakeQrSvg(name) {
    const size = 25;
    let seed = [...name].reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
    const random = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;

    // Leave room for the three big corner squares
    const inCorner = (x, y) =>
        (x < 8 || x >= size - 8) && (y < 8 || y >= size - 8) && !(x >= size - 8 && y >= size - 8);

    let dots = '';
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            if (!inCorner(x, y) && random() < 0.5) {
                dots += `<rect x="${x}" y="${y}" width="1" height="1"/>`;
            }
        }
    }

    const corner = (x, y) => `
        <rect x="${x}" y="${y}" width="7" height="7"/>
        <rect x="${x + 1}" y="${y + 1}" width="5" height="5" fill="#fff"/>
        <rect x="${x + 2}" y="${y + 2}" width="3" height="3"/>`;

    return `
        <svg viewBox="-2 -2 ${size + 4} ${size + 4}" width="170" height="170"
             shape-rendering="crispEdges" role="img" aria-label="Demo ${name} QR code">
            <rect x="-2" y="-2" width="${size + 4}" height="${size + 4}" fill="#fff"/>
            <g fill="#17231f">
                ${dots}
                ${corner(0, 0)}${corner(size - 7, 0)}${corner(0, size - 7)}
            </g>
        </svg>`;
}

// Show the QR code and receipt fields only for GCash and Maya
function updatePayment() {
    const method = document.querySelector('input[name="payment_method"]:checked')?.value;
    const online = method === 'GCash' || method === 'Maya';

    document.getElementById('online-payment').hidden = !online;
    document.getElementById('reference_number').required = online;
    document.getElementById('receipt').required = online;

    if (online) {
        document.getElementById('qr-name').textContent = method;
        document.getElementById('qr-code').innerHTML = fakeQrSvg(method);
    }
}

// ------------------------------------------------ order summary (tray)
async function renderSummary() {
    const box = document.getElementById('order-summary');
    const button = document.getElementById('place-order-btn');
    const cart = getCart();

    if (cart.length === 0) {
        box.innerHTML = '<p class="cart-empty">Your tray is empty.<br><a href="menu.html"><b>Browse the menu</b></a></p>';
        button.disabled = true;
        return;
    }

    const { data: items, error } = await db
        .from('food_items')
        .select('id, name, price, is_available')
        .in('id', cart.map(line => line.id));

    if (error) {
        console.error(error);
        box.innerHTML = '<p class="panel-sub">Your tray could not be loaded. Please try again later.</p>';
        return;
    }

    let total = 0;
    const rows = cart.map(line => {
        const item = items.find(i => i.id === line.id);
        if (!item) return '';
        total += item.price * line.quantity;
        return `
            <div class="cart-row">
                <span class="qty">${line.quantity}×</span>
                <span class="name">${escapeHtml(item.name)}
                    ${item.is_available ? '' : '<span class="tag muted">Sold out</span>'}</span>
                <span>${formatPeso(item.price * line.quantity)}</span>
            </div>`;
    }).join('');

    box.innerHTML = `
        <div class="cart-items">${rows}</div>
        <div class="summary">
            <div class="total"><span>Total</span><span>${formatPeso(total)}</span></div>
        </div>`;
    button.disabled = false;
}

// ------------------------------------------------------- place order
async function placeOrder(form) {
    const fields = new FormData(form);
    const button = document.getElementById('place-order-btn');
    button.disabled = true;

    const { data: code, error } = await db.rpc('place_order', {
        p_items: getCart(),
        p_pickup_date: fields.get('pickup_date'),
        p_pickup_window: fields.get('pickup_session'),
        p_payment_method: fields.get('payment_method'),
        p_reference_number: fields.get('reference_number'),
        p_notes: fields.get('notes')
    });

    if (error) {
        console.error(error);
        showToast(`<span>${escapeHtml(error.message)}</span>`);
        button.disabled = false;
        return;
    }

    saveOrderCode(code);
    clearCart();
    location.href = `order-details.html?code=${code}`;
}


// ------------------------------------------------------------- events
document.addEventListener('change', event => {
    if (event.target.name === 'pickup_date') renderSchedule();
    if (event.target.name === 'payment_method') updatePayment();
});

document.addEventListener('DOMContentLoaded', () => {
    renderSchedule();
    updatePayment();
    setInterval(renderSchedule, 30 * 1000);   // re-check the clock every 30 seconds
});

document.addEventListener('submit', event => {
    if (event.target.id !== 'checkout-form') return;
    event.preventDefault();          // don't do a normal form post; save through Supabase
    placeOrder(event.target);
});

document.addEventListener('DOMContentLoaded', () => {
    renderSchedule();
    updatePayment();
    renderSummary();
    setInterval(renderSchedule, 30 * 1000);   // re-check the clock every 30 seconds
});
