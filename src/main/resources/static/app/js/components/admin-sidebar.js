export function AdminSidebar() {
    return `
        <div id="admin-sidebar" class="admin-sidebar">
            <button id="admin-close-btn" class="admin-close-btn">✖</button>

            <h2 class="admin-sidebar-title">⚽ Admin</h2>

            <nav class="admin-sidebar-nav">
                <a href="/admin/dashboard" data-link>🏠 Dashboard</a>
                <a href="/admin/events" data-link>📅 Événements</a>
                <a href="/admin/events/create" data-link>➕ Créer un événement</a>
                <a href="/admin/teams" data-link>👥 Mes équipes</a>
                <a href="/admin/registrations" data-link>📨 Inscriptions</a>
            </nav>
        </div>
    `;
}

export function initAdminSidebar() {
    const sidebar = document.getElementById("admin-sidebar");
    const closeBtn = document.getElementById("admin-close-btn");

    if (closeBtn && sidebar) {
        closeBtn.onclick = () => sidebar.classList.remove("open");
    }
}
