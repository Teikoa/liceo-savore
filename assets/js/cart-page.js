// Shows the student's tray on student/cart.html.
// Quantities come from cart.js; names and prices come from Supabase.
async function renderCart() {
    const body = document.getElementById('cart-body');
    const totalCell = document.getElementById('cart-total');
    const note = document.getElementById('cart-note');
    const checkoutBtn = document.getElementById('checkout-btn');

    // Look up the current name, price, and availability of each tray item
    const cart = getCart();
    const { data: items, error } = await db
        .from('food_items')
        .select('id, name, price, is_available')
        .in('id', cart.map(line => line.id));

    if (error) {
        console.error(error);
        body.innerHTML = '<tr><td colspan="5" class="empty-row">Your tray could not be loaded. Please try again later.</td></tr>';
        return;
    }

    let total = 0;
    let hasSoldOut = false;
    const rows = [];

    for (const line of cart) {
        const item = items.find(i => i.id === line.id);
        if (!item) {                 // deleted from the menu
            removeFromCart(line.id);
            continue;
        }

        const subtotal = item.price * line.quantity;
        if (item.is_available) total += subtotal;
        else hasSoldOut = true;

        rows.push(`
            <tr>
                <td>
                    ${escapeHtml(item.name)}
                    ${item.is_available ? '' : '<span class="tag muted">Sold out</span>'}
                </td>
                <td class="num">${formatPeso(item.price)}</td>
                <td>
                    <button type="button" class="btn btn-ghost btn-sm" data-qty="${item.id}" data-change="-1">−</button>
                    <span style="display:inline-block; min-width:28px; text-align:center">${line.quantity}</span>
                    <button type="button" class="btn btn-ghost btn-sm" data-qty="${item.id}" data-change="1">+</button>
                </td>
                <td class="num">${formatPeso(subtotal)}</td>
                <td><button type="button" class="btn btn-ghost btn-sm" data-remove="${item.id}">Remove</button></td>
            </tr>`);
    }

    body.innerHTML = rows.length
        ? rows.join('')
        : '<tr><td colspan="5" class="empty-row">Your tray is empty. <a href="menu.html"><b>Browse the menu</b></a></td></tr>';
    totalCell.textContent = formatPeso(total);
    note.textContent = 'Remove sold-out items before checking out.';
    note.hidden = !hasSoldOut;
    checkoutBtn.disabled = rows.length === 0 || hasSoldOut;
}

// −, +, Remove, and checkout buttons
document.addEventListener('click', event => {
    const qtyButton = event.target.closest('[data-qty]');
    const removeButton = event.target.closest('[data-remove]');

    if (qtyButton) {
        const id = Number(qtyButton.dataset.qty);
        const line = getCart().find(l => l.id === id);
        setQuantity(id, line.quantity + Number(qtyButton.dataset.change));
        renderCart();
    } else if (removeButton) {
        removeFromCart(Number(removeButton.dataset.remove));
        renderCart();
    } else if (event.target.closest('#checkout-btn')) {
        location.href = 'checkout.html';
    }
});

document.addEventListener('DOMContentLoaded', renderCart);
