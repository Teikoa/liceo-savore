// The student's tray, saved in this browser (localStorage).
// Only item IDs and quantities are saved. Names and prices are always
// loaded fresh from Supabase so they are never out of date.
const CART_KEY = 'savore-cart';
const MAX_QUANTITY = 10;

function getCart() {
    try {
        return JSON.parse(localStorage.getItem(CART_KEY)) || [];
    } catch {
        return [];
    }
}

function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartBadge();
}


// Returns false (and adds nothing) if the item is already at MAX_QUANTITY
function addToCart(itemId) {
    const cart = getCart();
    const line = cart.find(l => l.id === itemId);
    if (line && line.quantity >= MAX_QUANTITY) return false;

    if (line) line.quantity += 1;
    else cart.push({ id: itemId, quantity: 1 });
    saveCart(cart);
    return true;
}


// A quantity of 0 removes the item
function setQuantity(itemId, quantity) {
    const cart = getCart()
        .map(l => l.id === itemId ? { ...l, quantity: Math.min(quantity, MAX_QUANTITY) } : l)
        .filter(l => l.quantity > 0);
    saveCart(cart);
}

function removeFromCart(itemId) {
    saveCart(getCart().filter(l => l.id !== itemId));
}

function clearCart() {
    localStorage.removeItem(CART_KEY);
    updateCartBadge();
}


function formatPeso(amount) {
    return '₱' + Number(amount).toFixed(2);
}

// Total number of items in the tray (2 adobo + 1 iced tea = 3)
function cartCount() {
    return getCart().reduce((sum, line) => sum + line.quantity, 0);
}

// Updates the number next to "My tray" in the sidebar
function updateCartBadge() {
    const badge = document.getElementById('cart-count');
    if (!badge) return;

    const count = cartCount();
    badge.textContent = count;
    badge.hidden = count === 0;
}

document.addEventListener('DOMContentLoaded', updateCartBadge);
