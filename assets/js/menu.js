/* =====================================================================
   LICEO SAVORE - Student menu: search, category filter, add to tray
   ===================================================================== */

document.addEventListener('shell:ready', () => {

    const grid = document.getElementById('menu-grid');
    const categoryBar = document.getElementById('categories');
    const searchInput = document.getElementById('search');
    const emptyState = document.getElementById('menu-empty');

    let activeCategory = 'All';

    /* ------------------------------------------------ category bar */

    categoryBar.innerHTML = CATEGORIES.map((category, index) => `
        <button class="category ${index === 0 ? 'active' : ''}" data-category="${esc(category)}">
            ${category === 'All' ? 'All items' : esc(category)}
        </button>`).join('');

    /* ------------------------------------------------- the cards */

    function render() {
        const term = searchInput.value.trim().toLowerCase();

        const visible = MENU.filter(food => {
            const matchesTerm = !term
                || food.name.toLowerCase().includes(term)
                || food.desc.toLowerCase().includes(term);
            const matchesCategory = activeCategory === 'All' || food.category === activeCategory;
            return matchesTerm && matchesCategory;
        });

        // Sold-out items sink to the bottom of the list.
        visible.sort((a, b) => Number(b.available) - Number(a.available));

        grid.innerHTML = visible.map(food => `
            <article class="food-card ${food.available ? '' : 'out'}">
                <div class="food-thumb">${food.icon}</div>
                <div class="food-body">
                    <div class="food-name">${esc(food.name)}</div>
                    <div class="food-desc">${esc(food.desc)}</div>
                    <div class="food-foot">
                        <span class="food-price">${peso(food.price)}</span>
                        ${food.available
                            ? `<button class="btn btn-sm" data-add="${food.id}">Add</button>`
                            : '<span class="tag muted">Sold out</span>'}
                    </div>
                </div>
            </article>`).join('');

        emptyState.style.display = visible.length === 0 ? '' : 'none';
    }

    /* ------------------------------------------------------ events */

    searchInput.addEventListener('input', render);

    categoryBar.addEventListener('click', event => {
        const button = event.target.closest('.category');
        if (!button) return;
        categoryBar.querySelectorAll('.category').forEach(b => b.classList.remove('active'));
        button.classList.add('active');
        activeCategory = button.dataset.category;
        render();
    });

    grid.addEventListener('click', event => {
        const button = event.target.closest('[data-add]');
        if (!button) return;

        const food = MENU.find(item => item.id === Number(button.dataset.add));
        if (Cart.add(food.id)) {
            showToast(food.name + ' added to your tray.');
            updateCartBadge();
        } else {
            showToast('That item is no longer available.');
        }
    });

    /** Keep the sidebar and topbar counters in step with the tray. */
    function updateCartBadge() {
        const count = Cart.count();

        document.querySelectorAll('.nav a[href="cart.html"]').forEach(link => {
            let badge = link.querySelector('.nav-badge');
            if (!badge) {
                badge = document.createElement('b');
                badge.className = 'nav-badge';
                link.appendChild(badge);
            }
            badge.textContent = count;
        });

        const trayButton = document.querySelector('.icon-btn[href="cart.html"]');
        if (trayButton && count > 0 && !trayButton.querySelector('.dot')) {
            const dot = document.createElement('i');
            dot.className = 'dot';
            trayButton.appendChild(dot);
        }
    }

    render();
});
