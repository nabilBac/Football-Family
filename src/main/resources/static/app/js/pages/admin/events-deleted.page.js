// /static/app/js/pages/admin/events-deleted.page.js

export const AdminEventsDeletedPage = {
    async render() {
        return `
            <div class="admin-main">

                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h1 class="admin-title">📦 Événements archivés</h1>
                    <a href="/admin/events" data-link class="admin-btn admin-btn-secondary">
                        ← Retour
                    </a>
                </div>

                <div id="deleted-events-content" class="admin-dashboard-grid">
                    <div class="admin-card">
                        <p>Chargement...</p>
                    </div>
                </div>

            </div>
        `;
    },

async init() {
    const container = document.getElementById("deleted-events-content");
    const token = localStorage.getItem("accessToken");
    const userRaw = localStorage.getItem("currentUser");
    const userRole = userRaw ? JSON.parse(userRaw).highestRole : "";
    const isSuperAdmin = (userRole === "SUPER_ADMIN");

    try {
        const res = await fetch("/api/events/admin/deleted", {
            headers: { "Authorization": `Bearer ${token}` }
        });

        const json = await res.json();
        const events = json.data || [];

        if (events.length === 0) {
            container.innerHTML = `
                <div class="admin-card">
                    <p style="text-align: center; color: #666;">
                        ✅ Aucun événement archivé
                    </p>
                </div>
            `;
            return;
        }

        container.innerHTML = events.map(event => `
            <div class="admin-card event-pro-card event-deleted">

                <div class="event-header">
                    <i class="fas fa-archive event-icon" style="color: #999;"></i>
                    <h3 style="color: #666;">${event.name}</h3>
                </div>

                <p class="event-info">
                    <i class="fas fa-calendar"></i>
                    <strong>Date :</strong> ${event.date || "NC"}
                </p>

                <p class="event-info">
                    <i class="fas fa-map-marker-alt"></i>
                    <strong>Lieu :</strong> ${event.city || "NC"}
                </p>

                <p class="event-info">
                    <i class="fas fa-flag"></i>
                    <strong>Statut :</strong>
                    <span class="status-badge archived">
                        ${event.status}
                    </span>
                </p>

                <div style="display: flex; gap: 10px; margin-top: 15px;">
                    <button 
                        onclick="AdminEventsDeletedPage.restoreEvent(${event.id})"
                        class="admin-btn admin-btn-success"
                        style="flex: 1;">
                        🔄 Restaurer
                    </button>
                    
                    ${isSuperAdmin ? `
                        <button 
                            onclick="AdminEventsDeletedPage.hardDeleteEvent(${event.id})"
                            class="admin-btn admin-btn-danger"
                            style="flex: 1;">
                            ❌ Supprimer définitivement
                        </button>
                    ` : ''}
                </div>

            </div>
        `).join("");

    } catch (e) {
        console.error(e);
        container.innerHTML = `
            <div class="admin-card">
                <p style="color: red;">Erreur lors du chargement des événements archivés.</p>
            </div>
        `;
    }
},

    async restoreEvent(eventId) {
        if (!confirm("Voulez-vous restaurer cet événement ?")) return;

        const token = localStorage.getItem("accessToken");

        try {
            const res = await fetch(`/api/events/admin/${eventId}/restore`, {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}` }
            });

            const json = await res.json();

            if (json.success) {
                alert("✅ Événement restauré avec succès !");
                this.init(); // Recharger la liste
            } else {
                alert("❌ Erreur : " + json.message);
            }
        } catch (e) {
            console.error(e);
            alert("❌ Erreur lors de la restauration");
        }
    },

    async hardDeleteEvent(eventId) {
        if (!confirm("⚠️ ATTENTION : Cette action est IRRÉVERSIBLE.\n\nVoulez-vous vraiment supprimer définitivement cet événement ?")) {
            return;
        }

        const token = localStorage.getItem("accessToken");

        try {
            const res = await fetch(`/api/events/admin/${eventId}/hard-delete?confirmation=DELETE_PERMANENT`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });

            const json = await res.json();

            if (json.success) {
                alert("✅ Événement supprimé définitivement");
                this.init(); // Recharger la liste
            } else {
                alert("❌ Erreur : " + json.message);
            }
        } catch (e) {
            console.error(e);
            alert("❌ Erreur lors de la suppression");
        }
    }
};

export default AdminEventsDeletedPage;
window.AdminEventsDeletedPage = AdminEventsDeletedPage;