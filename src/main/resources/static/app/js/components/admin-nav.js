// /static/app/js/components/admin-nav.js
// 🧭 Navigation Admin - Composant réutilisable

export const AdminNav = {
    render(currentPage = 'dashboard') {
        return `
            <div class="admin-nav-bar">
                <div class="admin-nav-container">
                    <a href="/admin/dashboard" data-link 
                       class="admin-nav-item ${currentPage === 'dashboard' ? 'active' : ''}">
                        <i class="fas fa-home"></i>
                        <span>Dashboard</span>
                    </a>

                    <a href="/admin/events" data-link 
                       class="admin-nav-item ${currentPage === 'events' ? 'active' : ''}">
                        <i class="fas fa-calendar-alt"></i>
                        <span>Mes événements</span>
                    </a>

                    <a href="/admin/teams" data-link 
                       class="admin-nav-item ${currentPage === 'teams' ? 'active' : ''}">
                        <i class="fas fa-users"></i>
                        <span>Mes équipes</span>
                    </a>

                    <a href="/admin/events/create" data-link 
                       class="admin-nav-item admin-nav-cta">
                        <i class="fas fa-plus-circle"></i>
                        <span>Créer</span>
                    </a>
                </div>
            </div>
        `;
    }
};

export default AdminNav;