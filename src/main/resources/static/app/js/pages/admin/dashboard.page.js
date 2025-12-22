// /app/js/pages/admin/dashboard.page.js

export const AdminDashboardPage = {

    async render() {
        return `
            <div class="admin-main" style="padding: 20px; margin-top: 40px;">
                <h1 class="admin-title">Tableau de bord du club</h1>

                <div id="admin-dashboard-content" class="admin-dashboard-loading">
                    <p>Chargement du tableau de bord...</p>
                </div>
            </div>
        `;
    },

    async init() {
        const container = document.getElementById("admin-dashboard-content");

        const token = localStorage.getItem("accessToken");
        const currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");

        if (!currentUser) {
            container.innerHTML = `<p>Utilisateur non connecté.</p>`;
            return;
        }

        if (!currentUser.clubId) {
            container.innerHTML = `<p>❌ Aucun club n'est associé à ce compte.</p>`;
            return;
        }

        const clubId = currentUser.clubId;

        try {

            // =============================
            // 1️⃣ Charger les événements (club admin)
            // =============================
            const events = await this.safeFetch("/api/tournament/admin/events", token);

            // =============================
            // 2️⃣ Charger les équipes du club
            // =============================
            const teams = await this.safeFetch(`/api/teams/club/${clubId}`, token);

            // =============================
            // 3️⃣ Charger les INSCRIPTIONS en attente
            // =============================
     

            // =============================
            // ▶️ Calculs
            // =============================
            const today = new Date().toISOString().split("T")[0];

            const upcomingEvents = events.filter(e => e.date >= today);
            const pastEvents = events.filter(e => e.date < today);

            // =============================
            // ▶️ RENDU HTML
            // =============================
container.innerHTML = `
    <div class="admin-dashboard-grid">

        <a href="/admin/events" data-link class="dashboard-card-pro">
            <div class="dashboard-card-icon">📅</div>
            <div class="dashboard-card-title">Événements à venir</div>
            <div class="dashboard-card-value">${upcomingEvents.length}</div>
        </a>

        <a href="/admin/events" data-link class="dashboard-card-pro">
            <div class="dashboard-card-icon">🕓</div>
            <div class="dashboard-card-title">Événements passés</div>
            <div class="dashboard-card-value">${pastEvents.length}</div>
        </a>

        <a href="/admin/teams" data-link class="dashboard-card-pro">
            <div class="dashboard-card-icon">👥</div>
            <div class="dashboard-card-title">Mes équipes</div>
            <div class="dashboard-card-value">${teams.length}</div>
        </a>

        <a href="/admin/events/create" data-link class="dashboard-card-pro">
            <div class="dashboard-card-icon">➕</div>
            <div class="dashboard-card-title">Créer un événement</div>
            <div class="dashboard-card-value">Nouveau tournoi</div>
        </a>

    </div>
`;

        }

        catch (err) {
            console.error("Dashboard Admin Error:", err);
            container.innerHTML = `<p>❌ Erreur lors du chargement du tableau de bord.</p>`;
        }
    },

    // =====================================================
    // 🔐 Utilitaire fetch sécurisé (gestion erreurs + JSON)
    // =====================================================
    async safeFetch(url, token) {
        const res = await fetch(url, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!res.ok) {
            console.warn("Fetch error:", url);
            return [];
        }

        const json = await res.json();

        // Certaines routes renvoient directement un tableau
        if (Array.isArray(json)) return json;

        // D'autres renvoient { data: [...] }
        if (Array.isArray(json.data)) return json.data;

        return [];
    }
};

export default AdminDashboardPage;
