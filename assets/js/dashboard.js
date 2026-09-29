/* =====================================================================
   LICEO SAVORE - Student home
   ===================================================================== */

document.addEventListener('shell:ready', () => {

    /* ------------------------------------------------- hero labels */

    const today = new Date();
    document.getElementById('today-label').textContent =
        today.toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric' })
        + ' · Canteen open';

    // Which break window is still open for ordering?
    const minutesNow = today.getHours() * 60 + today.getMinutes();
    const nextSession = PICKUP_SESSIONS.find(session => {
        const [h, m] = session.start.split(':').map(Number);
        return minutesNow <= (h * 60 + m) - POLICY.cutoffMinutes;
    });

    document.getElementById('next-window').innerHTML = nextSession
        ? `<b>${prettyTime(nextSession.start)}</b>next ${nextSession.name.toLowerCase()}`
        : '<b>Tomorrow</b>next ordering window';

    /* ------------------------------------------- the order in flight */

    const live = Orders.all().find(order =>
        ['Pending', 'Confirmed', 'Preparing', 'Ready for Pickup'].includes(order.status));

    if (live) {
        const panel = document.getElementById('active-order');
        panel.style.display = '';

        let banner = '';
        if (live.status === 'Ready for Pickup') {
            banner = `<div class="alert alert-success" style="margin:0 0 14px">
                Your food is ready. Collect it at the express counter before the window
                closes so it is not recorded as a no-show.</div>`;
        } else if (live.status === 'Pending') {
            banner = `<div class="alert alert-info" style="margin:0 0 14px">
                Waiting for a staff member to verify your ${esc(live.method)} receipt.</div>`;
        }

        panel.innerHTML = `
            <div class="section-head" style="margin-bottom:14px">
                <div>
                    <h3>Your order is ${esc(live.status.toLowerCase())}</h3>
                    <p class="panel-sub" style="margin:4px 0 0">
                        ${esc(live.code)} · ${esc(prettyDate(live.pickupDate))}, ${esc(live.session)}
                    </p>
                </div>
                <span class="pill ${statusClass(live.status)}">${esc(live.status)}</span>
            </div>
            ${banner}
            <a class="btn btn-ghost btn-sm" href="order-details.html?code=${encodeURIComponent(live.code)}">
                View order details</a>`;
    }

    /* -------------------------------------------------------- stats */

    const all = Orders.all();
    const completed = all.filter(o => o.status === 'Completed');
    const spent = completed.reduce((sum, o) => sum + o.total, 0);
    const noShows = SAMPLE_NOSHOWS.length;
    const remaining = POLICY.noShowLimit - noShows;

    document.getElementById('student-stats').innerHTML = `
        <div class="stat accent">
            <div class="label">Orders placed</div>
            <div class="value">${all.length}</div>
            <div class="sub">${completed.length} collected successfully</div>
        </div>
        <div class="stat">
            <div class="label">Total spent</div>
            <div class="value">${peso(spent)}</div>
            <div class="sub">On completed orders</div>
        </div>
        <div class="stat">
            <div class="label">No-shows (${POLICY.windowDays} days)</div>
            <div class="value">${noShows} / ${POLICY.noShowLimit}</div>
            <div class="sub">${remaining > 0
                ? remaining + ' more pauses pre-ordering'
                : 'Limit reached'}</div>
        </div>
        <div class="stat">
            <div class="label">In your tray</div>
            <div class="value">${Cart.count()}</div>
            <div class="sub">${peso(Cart.total())} ready to check out</div>
        </div>`;

    /* -------------------------------------------------- quick picks */

    const picks = MENU.filter(item => item.available).slice(0, 4);

    document.getElementById('quick-picks').innerHTML = picks.map(food => `
        <article class="food-card">
            <div class="food-thumb">${food.icon}</div>
            <div class="food-body">
                <div class="food-name">${esc(food.name)}</div>
                <div class="food-desc">${esc(food.desc)}</div>
                <div class="food-foot">
                    <span class="food-price">${peso(food.price)}</span>
                    <button class="btn btn-sm" data-add="${food.id}">Add</button>
                </div>
            </div>
        </article>`).join('');

    document.getElementById('quick-picks').addEventListener('click', event => {
        const button = event.target.closest('[data-add]');
        if (!button) return;

        const food = MENU.find(item => item.id === Number(button.dataset.add));
        Cart.add(food.id);
        showToast(food.name + ' added to your tray.');
        refreshBadges();
    });

    /** Update the sidebar and topbar counters without a page reload. */
    function refreshBadges() {
        const count = Cart.count();
        document.querySelectorAll('.nav a[href="cart.html"]').forEach(link => {
            let badge = link.querySelector('.nav-badge');
            if (!badge) {
                badge = document.createElement('b');
                badge.className = 'nav-badge';
                link.appendChild(badge);
            }
            badge.textContent = count;
            badge.style.display = count > 0 ? '' : 'none';
        });

        const stat = document.querySelector('#student-stats .stat:last-child');
        if (stat) {
            stat.querySelector('.value').textContent = count;
            stat.querySelector('.sub').textContent = peso(Cart.total()) + ' ready to check out';
        }
    }
});
