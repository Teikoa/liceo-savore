const menu = [
    { id: 1, name: "Savore Chicken Bowl", description: "Grilled chicken, rice, egg, and house sauce", price: 79, category: "Meals", tag: "Student favorite", image: "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=700&q=80" },
    { id: 2, name: "Crispy Sisig Rice", description: "Savory pork sisig with rice and cucumber", price: 85, category: "Meals", tag: "Best seller", image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=700&q=80" },
    { id: 3, name: "Cheesy Pandesal", description: "Warm bread rolls with melted cheese center", price: 35, category: "Snacks", tag: "Quick bite", image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=700&q=80" },
    { id: 4, name: "Banana Turon", description: "Golden caramelized banana spring rolls", price: 25, category: "Snacks", tag: "Made today", image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=700&q=80" },
    { id: 5, name: "Calamansi Cooler", description: "Bright, cold, and freshly squeezed", price: 30, category: "Drinks", tag: "Refreshing", image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=700&q=80" },
    { id: 6, name: "Iced Coffee", description: "Cold brew with a gentle brown sugar finish", price: 45, category: "Drinks", tag: "New", image: "https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=700&q=80" }
];

let cart = [];
let activeCategory = "All";
const grid = document.querySelector('#menu-grid');
const cartItems = document.querySelector('#cart-items');
const toast = document.querySelector('#toast');

function renderMenu() {
    const term = document.querySelector('#search').value.toLowerCase();
    const items = menu.filter(item =>
        (activeCategory === 'All' || item.category === activeCategory) &&
        `${item.name} ${item.description}`.toLowerCase().includes(term)
    );

    grid.innerHTML = items.length
        ? items.map(item => `
            <article class="food-card">
                <div class="food-image" style="background-image:url('${item.image}')"><span>${item.tag}</span></div>
                <div class="food-info">
                    <h3>${item.name}</h3>
                    <p>${item.description}</p>
                    <div class="food-row"><span class="price">₱${item.price}</span><button class="add-btn" data-id="${item.id}">+ Add to order</button></div>
                </div>
            </article>
        `).join('')
        : '<div class="empty">No menu items match your search.</div>';

    document.querySelectorAll('.add-btn').forEach(button => {
        button.addEventListener('click', () => addToCart(Number(button.dataset.id)));
    });
}

function addToCart(id) {
    const item = menu.find(entry => entry.id === id);
    const existing = cart.find(entry => entry.id === id);
    existing ? existing.quantity++ : cart.push({ ...item, quantity: 1 });
    renderCart();
    showToast(`${item.name} added to your order`);
}

function removeFromCart(id) {
    cart = cart.filter(item => item.id !== id);
    renderCart();
}

function renderCart() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    document.querySelector('#count').textContent = totalItems;
    document.querySelector('#subtotal').textContent = `₱${total}`;
    document.querySelector('#total').textContent = `₱${total}`;

    cartItems.innerHTML = cart.length
        ? cart.map(item => `
            <div class="cart-item">
                <div><strong>${item.name} × ${item.quantity}</strong><small>₱${item.price} each</small><button class="remove" data-remove="${item.id}">Remove</button></div>
                <span class="cart-price">₱${item.price * item.quantity}</span>
            </div>
        `).join('')
        : '<div class="cart-empty">Your tray is empty.<br>Pick something delicious to start.</div>';

    document.querySelectorAll('[data-remove]').forEach(button => {
        button.addEventListener('click', () => removeFromCart(Number(button.dataset.remove)));
    });
}

function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(window.toastTimer);
    window.toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
}

document.querySelector('#categories').addEventListener('click', event => {
    if (!event.target.matches('.category')) return;
    activeCategory = event.target.dataset.category;
    document.querySelectorAll('.category').forEach(button => button.classList.toggle('active', button === event.target));
    renderMenu();
});

document.querySelector('#search').addEventListener('input', renderMenu);

document.querySelector('#pickup-options').addEventListener('click', event => {
    const button = event.target.closest('.pickup');
    if (!button) return;
    document.querySelectorAll('.pickup').forEach(option => option.classList.toggle('selected', option === button));
});

document.querySelector('#place-order').addEventListener('click', () => {
    if (!cart.length) return showToast('Add an item before placing your preorder');
    const pickup = document.querySelector('.pickup.selected').dataset.pickup;
    showToast(`Preorder placed for ${pickup}. See you at the counter!`);
    cart = [];
    renderCart();
});

renderMenu();
