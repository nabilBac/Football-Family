// /app/js/components/admin-header.js
export const AdminHeader = {
    render() {
        return `
            <header class="admin-header">
                <button class="admin-hamburger" id="adminMenuToggle">
                    <i class="fas fa-bars"></i>
                </button>
                
                <div class="admin-header-title">
                    <i class="fas fa-shield-alt"></i>
                    <span>GoalClips Admin</span>
                </div>
                
                <a href="/feed" data-link class="admin-public-btn" title="Voir le site public">
                    <i class="fas fa-eye"></i>
                    <span>Public</span>
                </a>
            </header>

            <div id="admin-sidebar" class="admin-sidebar">
                <div class="admin-sidebar-header">
                    <h2>⚽ Administration</h2>
                    <button id="admin-close-btn" class="admin-close-btn">
                        <i class="fas fa-times"></i>
                    </button>
                </div>

                <nav class="admin-sidebar-nav">
                    <a href="/admin/dashboard" data-link>
                        <i class="fas fa-home"></i>
                        Dashboard
                    </a>
                    <a href="/admin/events" data-link>
                        <i class="fas fa-calendar-alt"></i>
                        Événements
                    </a>
                    <a href="/admin/events/create" data-link>
                        <i class="fas fa-plus-circle"></i>
                        Créer un événement
                    </a>
                    <a href="/admin/teams" data-link>
                        <i class="fas fa-users"></i>
                        Mes équipes
                    </a>
                </nav>
            </div>

            <div id="admin-sidebar-overlay" class="admin-sidebar-overlay"></div>
        `;
    },

    init() {
        const menuToggle = document.getElementById('adminMenuToggle');
        const sidebar = document.getElementById('admin-sidebar');
        const closeBtn = document.getElementById('admin-close-btn');
        const overlay = document.getElementById('admin-sidebar-overlay');

        const openSidebar = () => {
            sidebar.classList.add('open');
            overlay.classList.add('visible');
            document.body.style.overflow = 'hidden';
        };

        const closeSidebar = () => {
            sidebar.classList.remove('open');
            overlay.classList.remove('visible');
            document.body.style.overflow = '';
        };

        if (menuToggle) menuToggle.addEventListener('click', openSidebar);
        if (closeBtn) closeBtn.addEventListener('click', closeSidebar);
        if (overlay) overlay.addEventListener('click', closeSidebar);
    }
};