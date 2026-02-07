// /static/app/js/pages/admin/matches-deleted.page.js

export const AdminMatchesDeletedPage = {
    async render() {
        return `
            <div class="admin-main" style="padding: 20px; margin-top: 60px;">

                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h1 class="admin-title">📦 Matchs supprimés</h1>
                    <a href="/admin/events" data-link class="admin-btn admin-btn-secondary">
                        ← Retour
                    </a>
                </div>

                <!-- Filtres -->
                <div style="background: white; padding: 20px; border-radius: 12px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <h3 style="margin: 0 0 15px 0; color: #2c3e50;">🔍 Filtres</h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                        <div>
                            <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #2c3e50;">Événement</label>
                            <select id="filter-event" style="width: 100%; padding: 10px; border: 2px solid #e0e0e0; border-radius: 8px;">
                                <option value="">Tous les événements</option>
                            </select>
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #2c3e50;">Round</label>
                            <select id="filter-round" style="width: 100%; padding: 10px; border: 2px solid #e0e0e0; border-radius: 8px;">
                                <option value="">Tous les rounds</option>
                                <option value="FINALE">Finale</option>
                                <option value="DEMI-FINALE">Demi-finale</option>
                                <option value="QUART DE FINALE">Quart de finale</option>
                                <option value="CFINALE">Finale consolante</option>
                                <option value="CDEMI-FINALE">Demi-finale consolante</option>
                                <option value="CQUART DE FINALE">Quart consolante</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div id="deleted-matches-content" class="admin-dashboard-grid">
                    <div class="admin-card">
                        <p>Chargement...</p>
                    </div>
                </div>

            </div>
        `;
    },

    async init() {
        const token = localStorage.getItem("accessToken");
        
        // Charger la liste des événements pour le filtre
        await this.loadEventFilter(token);
        
        // Charger les matchs supprimés
        await this.loadDeletedMatches(token);
        
        // Initialiser les filtres
        this.initFilters(token);
    },

    async loadEventFilter(token) {
        try {
            const response = await fetch("/api/tournament/admin/events", {
                headers: { "Authorization": `Bearer ${token}` }
            });
            
            const json = await response.json();
            const events = json.data || [];
            
            const select = document.getElementById("filter-event");
            if (select && events.length > 0) {
                events.forEach(event => {
                    const option = document.createElement("option");
                    option.value = event.id;
                    option.textContent = event.name;
                    select.appendChild(option);
                });
            }
        } catch (err) {
            console.error("Erreur chargement events:", err);
        }
    },

    initFilters(token) {
        const eventFilter = document.getElementById("filter-event");
        const roundFilter = document.getElementById("filter-round");
        
        if (eventFilter) {
            eventFilter.addEventListener("change", () => this.loadDeletedMatches(token));
        }
        
        if (roundFilter) {
            roundFilter.addEventListener("change", () => this.loadDeletedMatches(token));
        }
    },

    async loadDeletedMatches(token) {
        const container = document.getElementById("deleted-matches-content");
        if (!container) return;

        const eventId = document.getElementById("filter-event")?.value;
        const round = document.getElementById("filter-round")?.value;

        try {
            let url = "/api/tournament/admin/matches/deleted";
            const params = new URLSearchParams();
            
            if (eventId) params.append("eventId", eventId);
            if (round) params.append("round", round);
            
            if (params.toString()) {
                url += "?" + params.toString();
            }

           const response = await fetch(url, {
    headers: { "Authorization": `Bearer ${token}` }
});

if (!response.ok) {
    console.error("Erreur API matches deleted :", response.status);
    throw new Error(`Erreur serveur (${response.status})`);
}

const json = await response.json();
const matches = json.data || [];


            if (matches.length === 0) {
                container.innerHTML = `
                    <div class="admin-card">
                        <p style="text-align: center; color: #666;">
                            ✅ Aucun match supprimé
                        </p>
                    </div>
                `;
                return;
            }

            container.innerHTML = matches.map(match => this.renderMatchCard(match)).join("");

            // Ajouter les event listeners
            container.querySelectorAll(".btn-restore-match").forEach(btn => {
                btn.addEventListener("click", async (e) => {
                    const matchId = e.currentTarget.dataset.matchId;
                    await this.restoreMatch(matchId, token);
                });
            });

        }catch (err) {
    console.error("Chargement matchs supprimés échoué :", err);

    container.innerHTML = `
        <div class="admin-card admin-error">
            <h3>❌ Erreur serveur</h3>
            <p>
                Impossible de charger les matchs supprimés.<br>
                <small>${err.message}</small>
            </p>
        </div>
    `;
}

    },

    renderMatchCard(match) {
        const teamA = this.escapeHtml(match.teamA || "?");
        const teamB = this.escapeHtml(match.teamB || "?");
        const round = match.round ? this.escapeHtml(match.round) : "Poule";
        const group = match.group ? this.escapeHtml(match.group.name) : "";
        const deletedAt = match.deletedAt ? new Date(match.deletedAt).toLocaleString('fr-FR') : "-";

        return `
            <div class="admin-card" style="opacity: 0.85; border-left: 4px solid #999;">
                
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                    <div>
                        <div style="font-weight: 700; color: #666; margin-bottom: 8px;">
                            ${group ? `📊 ${group}` : `🏆 ${round}`}
                        </div>
                        <div style="color: #2c3e50; font-weight: 600; line-height: 1.5;">
                            ${teamA}
                            <div style="text-align: center; color: #95a5a6; margin: 5px 0;">VS</div>
                            ${teamB}
                        </div>
                    </div>
                    <span style="
                        padding: 6px 12px;
                        border-radius: 6px;
                        font-size: 0.8em;
                        font-weight: 600;
                        background: #999;
                        color: white;
                    ">
                        🗑️ SUPPRIMÉ
                    </span>
                </div>

                <div style="font-size: 0.85em; color: #7f8c8d; margin-bottom: 15px;">
                    📅 Supprimé le ${deletedAt}
                </div>

                <button 
                    class="admin-btn admin-btn-success btn-restore-match" 
                    data-match-id="${match.id}"
                    style="width: 100%;">
                    🔄 Restaurer ce match
                </button>
            </div>
        `;
    },

    async restoreMatch(matchId, token) {
        if (!confirm("Voulez-vous restaurer ce match ?")) return;

        try {
            const response = await fetch(`/api/tournament/admin/matches/${matchId}/restore`, {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}` }
            });

            const json = await response.json();

            if (json.success) {
                alert("✅ Match restauré avec succès !");
                this.loadDeletedMatches(token);
            } else {
                alert("❌ Erreur : " + json.message);
            }
        } catch (err) {
            console.error(err);
            alert("❌ Erreur lors de la restauration");
        }
    },

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

export default AdminMatchesDeletedPage;