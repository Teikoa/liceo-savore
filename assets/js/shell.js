const STUDENT_NAV = [
    { key: 'dashboard', icon: '⌂', label: 'Home', href: 'dashboard.html' },
    { key: 'menu', icon: '▤', label: 'Menu', href: 'menu.html' },
    { key: 'cart', icon: '▣', label: 'My tray', href: 'cart.html' },
    { key: 'orders', icon: '◷', label: 'My orders', href: 'orders.html' }
];

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function buildShell() {
    const body = document.body;
    if (body.dataset.role !== 'student') return;

    const activeNav = body.dataset.nav || '';
    const title = escapeHtml(body.dataset.title || '');
    const navHtml = STUDENT_NAV.map(item => `
        <a class="${activeNav === item.key ? 'active' : ''}" href="${item.href}">
            <span>${item.icon}</span>${item.label}
        </a>`).join('');
    const pageContent = body.innerHTML;

    body.innerHTML = `
        <div class="shell">
            <aside class="sidebar">
                <div class="brand">
                    <img class="brand-logo" src="../assets/img/liceo-logo.png"
                         alt="Liceo de Cagayan University logo">
                    <div class="brand-name">LICEO SAVORE<small>Campus canteen</small></div>
                </div>
                <nav class="nav" aria-label="Main navigation">${navHtml}</nav>
            </aside>
            <main>
                <header class="topbar">
                    <div class="crumb">Student portal &nbsp;/&nbsp; ${title}</div>
                </header>
                <div id="page-body">${pageContent}</div>
                <footer class="page-footer">
                    LICEO SAVORE · Campus Canteen Pre-Order System —
                    Liceo de Cagayan University, Senior High School Department
                </footer>
            </main>
        </div>`;
}

document.addEventListener('DOMContentLoaded', buildShell);
