/* =====================================================================
   LICEO SAVORE - My tray
   ===================================================================== */

document.addEventListener('shell:ready', () => {

    const body = document.getElementById('tray-body');
    const countLabel = document.getElementById('tray-count');
    const clearButton = document.getElementById('clear-tray');

    function render() {
        const lines = Cart.all();
        const total = Cart.total();

        countLabel.textContent = lines.length + ' item' + (lines.length === 1 ? '' : 's') + ' selected';
        clearButton.style.display = lines.length ? '' : 'none';

        /* ------------------------------------------- empty state */

        if (!lines.length) {
            body.innerHTML = `
                <div class="panel" style="text-align:center;padding:52px 22px">
                    <div style="font-size:42px;margin-bottom:12px">🍽️</div>
                    <h3>Your tray is empty</h3>
                    <p class="panel-sub">Pick something from the menu to start your pre-order.</p>
                    <a class="btn" href="menu.html">Browse the menu</a>
                </div>`;
            updateBadge();
            return;
        }

        /* --------------------------------------- table + summary */

        const rows = lines.map(line => `
            <tr>
                <td>
                    <b>${esc(line.name)}</b><br>
                    <span class="tag">${esc(line.category)}</span>
                </td>
                <td>${peso(line.price)}</td>
                <td>
                    <select data-qty="${line.id}"
                            style="padding:7px 9px;border:1px solid var(--line);border-radius:8px">
                        ${Array.from({ length: 10 }, (_, i) => i + 1).map(q =>
                            `<option value="${q}" ${line.qty === q ? 'selected' : ''}>${q}</option>`).join('')}
                    </select>
                </td>
                <td class="num">${peso(line.price * line.qty)}</td>
                <td>
                    <button class="btn btn-ghost btn-sm" data-remove="${line.id}"
                            aria-label="Remove ${esc(line.name)}">✕</button>
                </td>
            </tr>`).join('');

        body.innerHTML = `
            <div class="content-grid">
                <section class="panel" style="margin:0">
                    <div class="table-wrap">
                        <table class="data">
                            <thead>
                                <tr>
                                    <th>Item</th>
                                    <th>Unit price</th>
                                    <th style="width:120px">Quantity</th>
                                    <th class="num">Subtotal</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>${rows}</tbody>
                        </table>
                    </div>
                </section>

                <aside class="order-card">
                    <div class="order-title">
                        <h2>Summary</h2>
                        <span class="count">${Cart.count()}</span>
                    </div>

                    <div class="summary" style="border-top:0;margin-top:0;padding-top:0">
                        <div><span>Subtotal</span><span>${peso(total)}</span></div>
                        <div><span>Pickup fee</span><span>₱0.00</span></div>
                        <div class="total"><span>Total</span><span>${peso(total)}</span></div>
                    </div>

                    <a class="btn btn-block" style="margin-top:18px" href="checkout.html">
                        Continue to checkout</a>

                    <small class="notice">
                        You choose your pickup window and payment method on the next step.
                    </small>
                </aside>
            </div>`;

        updateBadge();
    }

    /* ------------------------------------------------------ events */

    body.addEventListener('change', event => {
        const select = event.target.closest('[data-qty]');
        if (!select) return;
        Cart.setQty(Number(select.dataset.qty), Number(select.value));
        showToast('Tray updated.');
        render();
    });

    body.addEventListener('click', event => {
        const button = event.target.closest('[data-remove]');
        if (!button) return;
        Cart.remove(Number(button.dataset.remove));
        showToast('Item removed from your tray.');
        render();
    });

    clearButton.addEventListener('click', () => {
        Cart.clear();
        showToast('Your tray is now empty.');
        render();
    });

    /** Keep the sidebar badge honest after every change. */
    function updateBadge() {
        const count = Cart.count();
        document.querySelectorAll('.nav a[href="cart.html"] .nav-badge').forEach(badge => {
            badge.textContent = count;
            badge.style.display = count > 0 ? '' : 'none';
        });
    }

    document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href="cart.html"]');
    if (!link) return;

    const currentPage = document.body.dataset.nav;
    if (currentPage === 'cart') {
        event.preventDefault();
        showToast('You are already here!');
    }
    });
    
    render();
});
