// /static/app/js/pages/admin/events.page.js

export const AdminEventsPage = {
    async render() {

             if (!document.querySelector('link[href="/css/admin-tabs.css"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = '/css/admin-tabs.css';
        document.head.appendChild(link);
    }


        return `
            <div class="admin-main">

                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <h1 class="admin-title">Mes events</h1>
                    <a href="/admin/matches/deleted" data-link
                       class="admin-btn admin-btn-danger">
                        🗑️ Matchs supprimés
                    </a>
                </div>

                <div class="tabs-container" style="margin-bottom: 20px;">
                    <button class="tab-btn active" data-tab="actifs">
                        🟢 Actifs
                    </button>
                    <button class="tab-btn" data-tab="termines">
                        ✅ Terminés
                    </button>
                    <button class="tab-btn" data-tab="archives">
                        📦 Archivés
                    </button>
                </div>

                <div id="admin-events-content" class="admin-dashboard-grid">
                    <div class="admin-card">
                        <p>Chargement des tournois...</p>
                    </div>
                </div>

                <div style="margin-top:25px;">
                    <a href="/admin/events/create" data-link 
                       class="admin-btn admin-btn-primary admin-btn-full">
                        ➕ Créer un event
                    </a>
                </div>

            </div>
        `;
    },

    async init() {
        this.setupTabs();
        await this.loadActifs(); // Charge l'onglet actifs par défaut
    },

    setupTabs() {
        const tabBtns = document.querySelectorAll('.tab-btn');
        
        tabBtns.forEach(btn => {
            btn.addEventListener('click', async () => {
                // Retirer active de tous les boutons
                tabBtns.forEach(b => b.classList.remove('active'));
                // Ajouter active au bouton cliqué
                btn.classList.add('active');

                const tab = btn.getAttribute('data-tab');

                // Charger le bon contenu
                if (tab === 'actifs') {
                    await this.loadActifs();
                } else if (tab === 'termines') {
                    await this.loadTermines();
                } else if (tab === 'archives') {
                    await this.loadArchives();
                }
            });
        });
    },

    async loadActifs() {
        const container = document.getElementById("admin-events-content");
        const token = localStorage.getItem("accessToken");

        container.innerHTML = `<div class="admin-card"><p>Chargement...</p></div>`;

        try {
            const res = await fetch("/api/tournament/admin/events", {
                headers: { "Authorization": `Bearer ${token}` }
            });

            const json = await res.json();
            const allEvents = json.data || [];

            // Filtrer : DRAFT, PUBLISHED, ONGOING
            const events = allEvents.filter(e => 
                e.status === 'DRAFT' || e.status === 'PUBLISHED' || e.status === 'ONGOING'
            );

            if (events.length === 0) {
                container.innerHTML = `
                    <div class="admin-card">
                        <p style="text-align: center; color: #666;">
                            ✅ Aucun événement actif
                        </p>
                    </div>
                `;
                return;
            }

            this.renderEvents(events, container);

        } catch (e) {
            console.error(e);
            container.innerHTML = `<p>Erreur lors du chargement des tournois.</p>`;
        }
    },

    async loadTermines() {
        const container = document.getElementById("admin-events-content");
        const token = localStorage.getItem("accessToken");

        container.innerHTML = `<div class="admin-card"><p>Chargement...</p></div>`;

        try {
            const res = await fetch("/api/tournament/admin/events", {
                headers: { "Authorization": `Bearer ${token}` }
            });

            const json = await res.json();
            const allEvents = json.data || [];

            // Filtrer : COMPLETED
            const events = allEvents.filter(e => e.status === 'COMPLETED');

            if (events.length === 0) {
                container.innerHTML = `
                    <div class="admin-card">
                        <p style="text-align: center; color: #666;">
                            ✅ Aucun événement terminé
                        </p>
                    </div>
                `;
                return;
            }

            this.renderEvents(events, container);

        } catch (e) {
            console.error(e);
            container.innerHTML = `<p>Erreur lors du chargement des tournois.</p>`;
        }
    },

    async loadArchives() {
        const container = document.getElementById("admin-events-content");
        const token = localStorage.getItem("accessToken");

        container.innerHTML = `<div class="admin-card"><p>Chargement...</p></div>`;

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

            // Affichage spécial pour les archivés (avec bouton Restaurer)
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
                        <i class="fas fa-flag"></i>
                        <strong>Statut :</strong>
                        <span class="status-badge archived">
                            ${event.status}
                        </span>
                    </p>

                    <button 
                        onclick="AdminEventsPage.restoreEvent(${event.id})"
                        class="admin-btn admin-btn-success admin-btn-full mt-10">
                        🔄 Restaurer
                    </button>

                </div>
            `).join("");

        } catch (e) {
            console.error(e);
            container.innerHTML = `<p>Erreur lors du chargement des événements archivés.</p>`;
        }
    },

    renderEvents(events, container) {
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
                    Gérer l'event
                </a>

            </div>
        `).join("");
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
                this.loadArchives(); // Recharger l'onglet archivés
            } else {
                alert("❌ Erreur : " + json.message);
            }
        } catch (e) {
            console.error(e);
            alert("❌ Erreur lors de la restauration");
        }
    }
};

// Exposer globalement pour les onclick
window.AdminEventsPage = AdminEventsPage;

export default AdminEventsPage;