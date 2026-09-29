/* =====================================================================
   LICEO SAVORE - Student order history and no-show record
   ===================================================================== */

document.addEventListener('shell:ready', () => {

    const TABS = [
        { key: 'all',       label: 'All orders' },
        { key: 'active',    label: 'In progress' },
        { key: 'Completed', label: 'Completed' },
        { key: 'Cancelled', label: 'Cancelled' },
        { key: 'No-Show',   label: 'No-shows' }
    ];

    const ACTIVE = ['Pending', 'Confirmed', 'Preparing', 'Ready for Pickup'];

    const tabBar = document.getElementById('order-tabs');
    const tbody = document.getElementById('orders-body');

    let activeTab = 'all';

    tabBar.innerHTML = TABS.map((tab, i) => `
        <button class="category ${i === 0 ? 'active' : ''}" data-tab="${tab.key}">
            ${esc(tab.label)}
        </button>`).join('');

    /* ----------------------------------------------- order table */

    function render() {
        const orders = Orders.all().filter(order => {
            if (activeTab === 'all') return true;
            if (activeTab === 'active') return ACTIVE.includes(order.status);
            return order.status === activeTab;
        });

        if (!orders.length) {
            tbody.innerHTML =
                '<tr><td colspan="6" class="empty-row">No orders to show here yet.</td></tr>';
            return;
        }

        tbody.innerHTML = orders.map(order => `
            <tr>
                <td>
                    <b>${esc(order.code)}</b><br>
                    <span style="color:var(--muted);font-size:11px">${esc(order.placedAt)}</span>
                </td>
                <td>
                    ${esc(prettyDate(order.pickupDate))}<br>
                    <span style="color:var(--muted);font-size:11px">${esc(order.session)}</span>
                </td>
                <td>
                    ${esc(order.method)}<br>
                    <span style="color:var(--muted);font-size:11px">${esc(order.paymentStatus)}</span>
                </td>
                <td><span class="pill ${statusClass(order.status)}">${esc(order.status)}</span></td>
                <td class="num">${peso(order.total)}</td>
                <td>
                    <a class="btn btn-ghost btn-sm"
                       href="order-details.html?code=${encodeURIComponent(order.code)}">View</a>
                </td>
            </tr>`).join('');
    }

    tabBar.addEventListener('click', event => {
        const button = event.target.closest('.category');
        if (!button) return;
        tabBar.querySelectorAll('.category').forEach(b => b.classList.remove('active'));
        button.classList.add('active');
        activeTab = button.dataset.tab;
        render();
    });

    /* ------------------------------------------- no-show record */

    const noShowBody = document.getElementById('noshow-body');

    noShowBody.innerHTML = SAMPLE_NOSHOWS.length
        ? SAMPLE_NOSHOWS.map(record => `
            <tr>
                <td>${esc(record.date)}</td>
                <td><b>${esc(record.code)}</b></td>
                <td style="color:var(--muted)">${esc(record.remarks)}</td>
                <td class="num">${peso(record.value)}</td>
            </tr>`).join('')
        : `<tr><td colspan="4" class="empty-row">
               No unclaimed orders on record. Thank you for collecting on time.
           </td></tr>`;

    render();
});
