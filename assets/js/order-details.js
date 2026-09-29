/* =====================================================================
   LICEO SAVORE - One order, with its status timeline
   ===================================================================== */

document.addEventListener('shell:ready', () => {

    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const justPlaced = params.get('placed') === '1';

    const container = document.getElementById('order-detail');
    const order = Orders.find(code);

    /* ------------------------------------------------- not found */

    if (!order) {
        container.innerHTML = `
            <div class="panel" style="text-align:center;padding:52px 22px;margin-top:26px">
                <h3>That order could not be found</h3>
                <p class="panel-sub">It may have been placed in a different browser.</p>
                <a class="btn" href="orders.html">Back to my orders</a>
            </div>`;
        return;
    }

    /* ---------------------------------------------- the timeline */

    const SEQUENCE = ['Pending', 'Confirmed', 'Preparing', 'Ready for Pickup', 'Completed'];
    const STEP_TEXT = {
        'Pending':          'Order received, waiting for payment verification',
        'Confirmed':        'Confirmed by the canteen',
        'Preparing':        'Your food is being prepared',
        'Ready for Pickup': 'Ready at the express counter',
        'Completed':        'Collected — enjoy your meal'
    };

    const closed = ['Cancelled', 'No-Show'].includes(order.status);
    const currentIndex = SEQUENCE.indexOf(order.status);
    const canCancel = ['Pending', 'Confirmed'].includes(order.status);

    const timeline = closed ? '' : `
        <div class="timeline">
            ${SEQUENCE.map((step, i) => `
                <div class="step ${i <= currentIndex ? 'done' : ''}">
                    <div class="bullet"></div>
                    <div class="body">
                        <b>${esc(step)}</b>
                        <small>${esc(STEP_TEXT[step])}</small>
                    </div>
                </div>`).join('')}
        </div>`;

    /* ------------------------------------------------- banners */

    let banner = '';
    if (order.status === 'No-Show') {
        banner = `<div class="alert alert-danger" style="margin:0 0 18px">
            This order was not claimed within its pickup window and has been recorded
            as a no-show.</div>`;
    } else if (order.status === 'Cancelled') {
        banner = '<div class="alert alert-info" style="margin:0 0 18px">This order was cancelled.</div>';
    } else if (order.paymentStatus === 'Awaiting Verification') {
        banner = `<div class="alert alert-info" style="margin:0 0 18px">
            Your ${esc(order.method)} receipt is waiting to be checked by a staff member.
            Your food is prepared once it is verified.</div>`;
    }

    /* --------------------------------------------------- items */

    const itemRows = order.items
        .filter(item => item.qty > 0)
        .map(item => `
            <tr>
                <td><b>${esc(item.name)}</b></td>
                <td class="num">${peso(item.price)}</td>
                <td class="num">${item.qty}</td>
                <td class="num">${peso(item.price * item.qty)}</td>
            </tr>`).join('');

    /* --------------------------------------------------- render */

    container.innerHTML = `
        <div class="section-head" style="margin-top:26px">
            <div>
                <h2>Order ${esc(order.code)}</h2>
                <p>Placed ${esc(order.placedAt)}</p>
            </div>
            <a class="btn btn-ghost btn-sm" href="orders.html">Back to my orders</a>
        </div>

        <div class="content-grid">
            <div>
                <section class="panel">
                    <div class="section-head" style="margin-bottom:18px">
                        <h3>Status</h3>
                        <span class="pill ${statusClass(order.status)}">${esc(order.status)}</span>
                    </div>
                    ${banner}
                    ${timeline}
                </section>

                <section class="panel">
                    <h3>Items</h3>
                    <p class="panel-sub">What the canteen will prepare</p>

                    <div class="table-wrap">
                        <table class="data">
                            <thead>
                                <tr>
                                    <th>Item</th>
                                    <th class="num">Unit price</th>
                                    <th class="num">Qty</th>
                                    <th class="num">Subtotal</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${itemRows}
                                <tr>
                                    <td colspan="3" style="text-align:right;font-weight:700">Total</td>
                                    <td class="num" style="font-size:15px">${peso(order.total)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    ${order.notes ? `<div class="alert alert-info" style="margin:16px 0 0">
                        <b>Your note:</b> ${esc(order.notes)}</div>` : ''}
                </section>
            </div>

            <aside class="order-card">
                <div class="order-title"><h2>Details</h2></div>

                <div class="kv">
                    <div><span class="k">Pickup day</span>
                         <span class="v">${esc(prettyDate(order.pickupDate))}</span></div>
                    <div><span class="k">Window</span>
                         <span class="v">${esc(order.session)}</span></div>
                    <div><span class="k">Payment</span>
                         <span class="v">${esc(order.method)}</span></div>
                    <div><span class="k">Payment status</span>
                         <span class="v"><span class="pill ${statusClass(order.paymentStatus)}">
                             ${esc(order.paymentStatus)}</span></span></div>
                    ${order.reference ? `<div><span class="k">Reference</span>
                         <span class="v" style="font-size:11.5px">${esc(order.reference)}</span></div>` : ''}
                    <div><span class="k">Total</span><span class="v">${peso(order.total)}</span></div>
                </div>

                ${canCancel ? `
                    <button class="btn btn-ghost btn-block" id="cancel-order"
                            style="margin-top:18px"
                            data-confirm="Cancel this order? This cannot be undone.">
                        Cancel this order</button>
                    <small class="notice">
                        Free to cancel until the canteen starts preparing your food.
                    </small>` : ''}
            </aside>
        </div>`;

    /* ------------------------------------------------- behaviour */

    if (justPlaced) {
        showToast(order.paymentStatus === 'Awaiting Verification'
            ? 'Order placed. The canteen will verify your receipt shortly.'
            : 'Order confirmed. Please collect it during your chosen pickup window.');
    }

    const cancelButton = document.getElementById('cancel-order');
    if (cancelButton) {
        cancelButton.addEventListener('click', () => {
            // Only orders placed during this demo live in storage; the sample
            // history is read-only.
            if (!Orders.placed().some(o => o.code === order.code)) {
                showToast('Sample orders from the seeded history cannot be changed.');
                return;
            }
            Orders.update(order.code, { status: 'Cancelled' });
            Notifications.add(`Order ${order.code} was cancelled.`, 'info', order.code);
            window.location.href = 'orders.html';
        });
    }
});
