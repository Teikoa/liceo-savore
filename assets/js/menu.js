// // Menu cards for student/menu.html (full menu) and
// student/dashboard.html (4 quick picks).
// Runs after shell.js has built the page layout.

// HTML for one food card, shared by both pages
function foodCardHtml(item) {
    return `
        <article class="food-card ${item.is_available ? '' : 'out'}">
            <div class="food-thumb">
                ${item.image_url ? `<img src="${escapeHtml(item.image_url)}" alt="">` : '🍽'}
            </div>
            <div class="food-body">
                <span class="tag" style="align-self:start">${escapeHtml(item.category)}</span>
                <div class="food-name">${escapeHtml(item.name)}</div>
                <div class="food-desc">${escapeHtml(item.description || '')}</div>
                <div class="food-foot">
                    <span class="food-price">${formatPeso(item.price)}</span>
                    ${item.is_available
                        ? `<button type="button" class="btn btn-sm" data-add="${item.id}">Add</button>`
                        : '<span class="tag muted">Sold out</span>'}
                </div>
            </div>
        </article>`;
}

// Full menu (menu.html)
async function loadMenu() {
    const grid = document.getElementById('menu-grid');
    if (!grid) return;               // not on this page

    const { data: items, error } = await db
        .from('food_items')
        .select('*')
        .order('category')
        .order('name');

    if (error) {
        console.error(error);
        grid.innerHTML = '<p class="panel-sub">The menu could not be loaded. Please try again later.</p>';
        return;
    }
    if (items.length === 0) {
        grid.innerHTML = '<p class="panel-sub">No menu items yet.</p>';
        return;
    }
    grid.innerHTML = items.map(foodCardHtml).join('');
}

// 4 random available items (dashboard.html)
async function loadQuickPicks() {
    const grid = document.getElementById('quick-picks');
    if (!grid) return;               // not on this page

    const { data: items, error } = await db
        .from('food_items')
        .select('*')
        .eq('is_available', true);

    if (error) {
        console.error(error);
        grid.innerHTML = '<p class="panel-sub">The menu could not be loaded. Please try again later.</p>';
        return;
    }
    if (items.length === 0) {
        grid.innerHTML = '<p class="panel-sub">Nothing is available right now. Please check back later.</p>';
        return;
    }

    const picks = items.sort(() => Math.random() - 0.5).slice(0, 4);
    grid.innerHTML = picks.map(foodCardHtml).join('');
}

document.addEventListener('DOMContentLoaded', () => {
    loadMenu();
    loadQuickPicks();
});

// "Add" buttons: put the item in the tray and show a pop-up
document.addEventListener('click', event => {
    const button = event.target.closest('[data-add]');
    if (!button) return;

    const name = escapeHtml(button.closest('.food-card').querySelector('.food-name').textContent);

    if (addToCart(Number(button.dataset.add))) {
        showToast(`<span>✓ <b>${name}</b> added to your tray</span><a href="cart.html">View tray</a>`);
    } else {
        showToast(`<span>You can order up to ${MAX_QUANTITY} of <b>${name}</b>.</span>`);
    }
});
