/* =====================================================================
   LICEO SAVORE - Checkout: pickup scheduling and hybrid payment
   ===================================================================== */

document.addEventListener('shell:ready', () => {

    const lines = Cart.all();

    // Nothing to check out — send the student back to the menu.
    if (!lines.length) {
        document.getElementById('page-body').innerHTML = `
            <div class="panel" style="text-align:center;padding:52px 22px;margin-top:26px">
                <div style="font-size:42px;margin-bottom:12px">🍽️</div>
                <h3>Your tray is empty</h3>
                <p class="panel-sub">Add something from the menu before checking out.</p>
                <a class="btn" href="menu.html">Browse the menu</a>
            </div>`;
        return;
    }

    const total = Cart.total();
    let selectedSession = null;

    /* ------------------------------------------------- pickup days */

    const today = new Date();
    const tomorrow = new Date(today.getTime() + 86400000);
    const iso = date => date.toISOString().slice(0, 10);
    const days = [today, tomorrow];

    document.getElementById('pickup-days').innerHTML = days.map((date, index) => `
        <label>
            <input type="radio" name="pickup_date" value="${iso(date)}" ${index === 0 ? 'checked' : ''}>
            <span>${index === 0 ? 'Today' : 'Tomorrow'}
                <small>${date.toLocaleDateString('en-PH',
                    { weekday: 'long', month: 'short', day: 'numeric' })}</small>
            </span>
        </label>`).join('');

    /* --------------------------------------------- pickup windows */

    const optionsWrap = document.getElementById('pickup-options');

    /** A window is closed once we are inside its cut-off, but only for today. */
    function isOpen(session, dateValue) {
        if (dateValue !== iso(today)) return true;
        const [h, m] = session.start.split(':').map(Number);
        const minutesNow = new Date().getHours() * 60 + new Date().getMinutes();
        return minutesNow <= (h * 60 + m) - POLICY.cutoffMinutes;
    }

    function renderWindows() {
        const dateValue = document.querySelector('input[name="pickup_date"]:checked').value;

        // Keep the current choice if it is still valid, otherwise take the first open one.
        const stillValid = selectedSession && isOpen(
            PICKUP_SESSIONS.find(s => s.id === selectedSession), dateValue);
        if (!stillValid) {
            const firstOpen = PICKUP_SESSIONS.find(s => isOpen(s, dateValue));
            selectedSession = firstOpen ? firstOpen.id : null;
        }

        optionsWrap.innerHTML = PICKUP_SESSIONS.map(session => {
            const open = isOpen(session, dateValue);
            return `
                <button type="button"
                        class="pickup ${selectedSession === session.id ? 'selected' : ''}"
                        data-session="${session.id}" ${open ? '' : 'disabled'}>
                    <b>${prettyTime(session.start)}–${prettyTime(session.end)}</b>
                    ${esc(session.name)}
                    ${open ? '' : '<br><span style="color:var(--red)">closed today</span>'}
                </button>`;
        }).join('');
    }

    document.getElementById('pickup-days').addEventListener('change', renderWindows);

    optionsWrap.addEventListener('click', event => {
        const button = event.target.closest('.pickup');
        if (!button || button.disabled) return;
        selectedSession = Number(button.dataset.session);
        renderWindows();
    });

    renderWindows();

    /* ------------------------------------------------ payment panel */

    const onlinePanel = document.getElementById('online-payment-panel');
    const referenceInput = document.getElementById('reference_number');
    const receiptInput = document.getElementById('receipt');

    function syncPaymentPanel() {
        const method = document.querySelector('input[name="payment_method"]:checked').value;
        const isOnline = method !== 'Cash on Pickup';

        onlinePanel.style.display = isOnline ? '' : 'none';
        referenceInput.required = isOnline;
        receiptInput.required = isOnline;

        document.querySelectorAll('[data-wallet]').forEach(box => {
            box.style.display = box.dataset.wallet === method ? '' : 'none';
        });
    }

    document.querySelectorAll('input[name="payment_method"]')
        .forEach(input => input.addEventListener('change', syncPaymentPanel));
    syncPaymentPanel();

    /* --------------------------------------------- receipt preview */

    const preview = document.getElementById('receipt-preview');

    receiptInput.addEventListener('change', () => {
        const file = receiptInput.files && receiptInput.files[0];
        if (!file) {
            preview.innerHTML = '';
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            showToast('That image is larger than 2 MB. Please choose a smaller file.');
            receiptInput.value = '';
            preview.innerHTML = '';
            return;
        }
        const reader = new FileReader();
        reader.onload = e => {
            preview.innerHTML =
                `<img src="${e.target.result}" alt="Receipt preview" class="receipt-thumb">`;
        };
        reader.readAsDataURL(file);
    });

    /* ------------------------------------------------- order recap */

    document.getElementById('recap-count').textContent = Cart.count();
    document.getElementById('recap-subtotal').textContent = peso(total);
    document.getElementById('recap-total').textContent = peso(total);
    document.getElementById('qr-amount').textContent = peso(total);

    document.getElementById('recap-items').innerHTML = lines.map(line => `
        <div class="cart-row">
            <span class="qty">${line.qty}×</span>
            <span class="name">${esc(line.name)}</span>
            <span>${peso(line.price * line.qty)}</span>
        </div>`).join('');

    /* -------------------------------------------- place the order */

    document.getElementById('checkout-form').addEventListener('submit', event => {
        event.preventDefault();

        if (!selectedSession) {
            showToast('Please choose a pickup window.');
            return;
        }

        const method = document.querySelector('input[name="payment_method"]:checked').value;
        const isOnline = method !== 'Cash on Pickup';
        const pickupDate = document.querySelector('input[name="pickup_date"]:checked').value;

        if (isOnline && !referenceInput.value.trim()) {
            showToast('Please enter the reference number of your payment.');
            referenceInput.focus();
            return;
        }
        if (isOnline && !receiptInput.files.length) {
            showToast('Please upload a screenshot of your payment receipt.');
            return;
        }

        const session = PICKUP_SESSIONS.find(s => s.id === selectedSession);
        const code = Orders.newCode();

        Orders.add({
            code,
            placedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
            pickupDate,
            session: session.name,
            method,
            // Cash orders are confirmed straight away; online orders wait for
            // a staff member to check the receipt.
            paymentStatus: isOnline ? 'Awaiting Verification' : 'Unpaid',
            status: isOnline ? 'Pending' : 'Confirmed',
            reference: isOnline ? referenceInput.value.trim() : null,
            notes: document.getElementById('notes').value.trim() || null,
            total,
            items: lines.map(line => ({ name: line.name, qty: line.qty, price: line.price }))
        });

        Notifications.add(
            isOnline
                ? `Order ${code} received. Your receipt is waiting for verification by canteen staff.`
                : `Order ${code} confirmed for ${session.name} on ${prettyDate(pickupDate)}.`,
            'success',
            code
        );

        Cart.clear();
        window.location.href = 'order-details.html?code=' + encodeURIComponent(code) + '&placed=1';
    });
});
