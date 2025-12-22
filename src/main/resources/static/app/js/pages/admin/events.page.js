// /static/app/js/pages/admin/events.page.js

export const AdminEventsPage = {
   async render() {
    return `
        <div class="admin-main">

            <h1 class="admin-title">Mes tournois</h1>

            <div id="admin-events-content" class="admin-dashboard-grid">
                <div class="admin-card">
                    <p>Chargement des tournois...</p>
                </div>
            </div>

            <div style="margin-top:25px;">
                <a href="/admin/events/create" data-link 
                   class="admin-btn admin-btn-primary admin-btn-full">
                    ➕ Créer un tournoi
                </a>
            </div>

        </div>
    `;
},


    async init() {
        const container = document.getElementById("admin-events-content");
        const token = localStorage.getItem("accessToken");
        const userRaw = localStorage.getItem("currentUser");

        if (!userRaw) {
            container.innerHTML = `<p>Utilisateur non connecté.</p>`;
            return;
        }

        const clubId = JSON.parse(userRaw).clubId;

        try {
            const res = await fetch("/api/tournament/admin/events", {
                headers: { "Authorization": `Bearer ${token}` }
            });

            const json = await res.json();
            const events = json.data || [];

            if (events.length === 0) {
                container.innerHTML = `<p>Aucun tournoi pour ce club.</p>`;
                return;
            }

container.innerHTML = events.map(event => `
    <div class="admin-card event-pro-card">

        <div class="event-header">
            <i class="fas fa-trophy event-icon"></i>
            <h3>${event.name}</h3>
        </div>

        <p class="event-info">
            <i class="fas fa-calendar"></i>
            <strong>Date :</strong> ${event.date || "NC"}
        </p>

        <p class="event-info">
            <i class="fas fa-flag"></i>
            <strong>Statut :</strong>
            <span class="status-badge ${event.status?.toLowerCase()}">
                ${event.status}
            </span>
        </p>

        <a href="/admin/events/${event.id}" data-link 
           class="admin-btn admin-btn-primary admin-btn-full mt-10">
            Gérer le tournoi
        </a>

    </div>
`).join("");



        } catch (e) {
            console.error(e);
            container.innerHTML = `<p>Erreur lors du chargement des tournois.</p>`;
        }
    }
};

export default AdminEventsPage;