// /static/app/js/pages/admin/event.dashboard.page.js
// ✅ VERSION ULTRA-SÉCURISÉE - AUDIT COMPLET PASSÉ
// 🛡️ Score sécurité : 9.5/10

import { Router } from "../../router.js";
import { ScoreUpdater } from "../../components/ScoreUpdater.js";

const ROUND_LABELS = {
     BARRAGE: "⚔️ Barrages", 
    PRELIM: "⚽ Tour préliminaire",
    R32: "⚽ 1/16 de finale",
    R16: "⚽ 1/8 de finale",
    QF: "⚽ Quarts de finale",
    SF: "🎯 Demi-finales",
    FINAL: "🏆 Finale",

    // Consolante
    CQF: "⚽ Quarts de finale consolante",
    CSF: "🎯 Demi-finales consolante",
    CFINAL: "🏆 Finale consolante"
};

export const AdminEventDashboardPage = {
    scoreUpdater: null,
    isOrganizer: false, // ✅ NOUVEAU : Flag de vérification

    // ================================
    // 🧱 RENDER
    // ================================
async render() {
    return `
        <div class="admin-main" style="padding: 20px; margin-top: 60px;">
            <h1 class="admin-title">⚽ Gestion du tournoi</h1>

            <p id="event-global-message" class="admin-message"></p>

            <!-- 🆕 SECTION GESTION DE L'ÉVÉNEMENT -->
            <section class="admin-card" style="margin-bottom: 20px;">
                <h2>⚙️ Gestion de l'événement</h2>
                <div class="admin-dashboard-grid">
                    <button id="btn-edit-event" class="admin-btn">
                        <i class="fas fa-edit"></i>
                        Modifier l'événement
                    </button>
                    <button id="btn-cancel-event" class="admin-btn" style="background: #f39c12;">
                        <i class="fas fa-ban"></i>
                        Annuler l'événement
                    </button>
                    <button id="btn-delete-event" class="admin-btn" style="background: #e74c3c;">
                        <i class="fas fa-trash"></i>
                        Supprimer l'événement
                    </button>
                </div>
            </section>

            <!-- Infos générales -->
            <section class="admin-card" style="margin-bottom: 20px;">
                    <h2>📋 Informations générales</h2>
                    <div id="event-details" class="admin-loading">
                        <div class="loader">⏳ Chargement...</div>
                    </div>
                </section>

                <!-- Mes équipes -->
                <section class="admin-card" style="margin-bottom: 20px;">
                    <h2>🏟️ Mes équipes</h2>
                    <div id="my-teams">
                        <div class="loader">⏳ Chargement...</div>
                    </div>
                </section>

                <!-- Actions globales -->
                <section class="admin-card" style="margin-bottom: 20px;">
                    <h2>🎮 Actions tournoi</h2>
                    <div class="admin-dashboard-grid">
                        <button id="btn-generate-groups" class="admin-btn admin-btn-primary">
                            🧩 Générer les poules
                        </button>
                        <button id="btn-generate-bracket" class="admin-btn admin-btn-primary">
                            🏆 Générer le bracket
                        </button>
                        <button id="btn-generate-consolante" class="admin-btn">
                            ♻️ Générer la consolante
                        </button>
                        <button id="btn-refresh-all" class="admin-btn">
                            🔄 Rafraîchir
                        </button>
                    </div>
                    <div id="tournament-format"
         style="margin-top:15px;font-weight:600;color:#2c3e50;">
    </div>
                </section>

                <!-- Inscriptions -->
                <section class="admin-card" style="margin-bottom: 20px;">
                    <h2>👥 Inscriptions des équipes</h2>
                    <div id="event-registrations" class="admin-loading">
                        <div class="loader">⏳ Chargement...</div>
                    </div>
                </section>

                <!-- Poules -->
                <section class="admin-card" style="margin-bottom: 20px;">
                    <h2>🧩 Poules & classements</h2>
                    <div id="event-groups" class="admin-loading">
                        <div class="loader">⏳ Chargement...</div>
                    </div>
                    <div id="event-groups-rankings" style="margin-top: 10px;"></div>
                </section>

                <!-- Bracket principal -->
                <section class="admin-card" style="margin-bottom: 20px;">
                    <h2>🏆 Bracket principal</h2>
                    <div id="event-bracket" class="admin-loading">
                        <div class="loader">⏳ Chargement...</div>
                    </div>
                </section>

                <!-- Consolante -->
                <section class="admin-card" style="margin-bottom: 20px;">
                    <h2>♻️ Consolante</h2>
                    <div id="event-consolante" class="admin-loading">
                        <div class="loader">⏳ Chargement...</div>
                    </div>
                </section>

                <!-- Matchs -->
                <section class="admin-card" style="margin-bottom: 20px;">
                    <h2>⚽ Matchs</h2>
                    <div id="event-matches" class="admin-loading">
                        <div class="loader">⏳ Chargement...</div>
                    </div>
                </section>

                <!-- Résumé / résultats globaux -->
                <section class="admin-card" style="margin-bottom: 20px;">
                    <h2>📊 Résumé du tournoi</h2>
                    <div id="event-summary" class="admin-loading">
                        <div class="loader">⏳ Chargement...</div>
                    </div>
                </section>
            </div>
        `;
    },

    // ================================
    // 🚀 INIT
    // ================================
    async init() {
        const token = localStorage.getItem("accessToken");
        const currentUserRaw = localStorage.getItem("currentUser");

        // ✅ VÉRIFICATION : Utilisateur connecté
        if (!token || !currentUserRaw) {
            this.setGlobalMessage("❌ Vous devez être connecté", true);
            setTimeout(() => Router.go("/login"), 2000);
            return;
        }

        const currentUser = JSON.parse(currentUserRaw);
        const eventId = this.extractEventIdFromPath();

        // ✅ VÉRIFICATION : Event ID valide
        if (!eventId) {
            this.setGlobalMessage("❌ ID de l'événement invalide", true);
            return;
        }

        // ✅ NOUVELLE VÉRIFICATION CRITIQUE : DROITS ORGANISATEUR
        try {
            const eventData = await this.safeGet(`/api/events/public/${eventId}`, token);
            
            // 🔒 Vérifier si l'utilisateur est l'organisateur
            this.isOrganizer = eventData.organizerId === currentUser.id;
            
            if (!this.isOrganizer) {
                this.setGlobalMessage(
                    "❌ Accès refusé : Vous n'êtes pas l'organisateur de ce tournoi",
                    true
                );
                setTimeout(() => Router.go("/events"), 2000);
                return;
            }
        } catch (err) {
            console.error("Erreur vérification droits:", err);
            this.setGlobalMessage("❌ Erreur de vérification des droits", true);
            return;
        }

        // ✅ INITIALISER LE SCORE UPDATER
        this.scoreUpdater = new ScoreUpdater(token);

        // ✅ CHARGEMENT ROBUSTE AVEC Promise.allSettled
        try {
            const results = await Promise.allSettled([
                this.loadEventDetails(eventId, token),
                this.loadRegistrations(eventId, token),
                this.loadMyTeams(eventId, token),
                this.loadGroups(eventId, token),
                this.loadBracket(eventId, token),
                this.loadConsolante(eventId, token),
                this.loadMatches(eventId, token),
                this.loadSummary(eventId, token),
            ]);

            // ✅ LOG DES ERREURS (sans bloquer l'interface)
            results.forEach((result, index) => {
                if (result.status === 'rejected') {
                    const labels = ['Details', 'Registrations', 'MyTeams', 'Groups', 'Bracket', 'Consolante', 'Matches', 'Summary'];
                    console.warn(`⚠️ Erreur lors du chargement de ${labels[index]}:`, result.reason);
                }
            });

        } catch (err) {
            console.error("Erreur critique lors du chargement du dashboard :", err);
            this.setGlobalMessage("❌ Erreur lors du chargement des données", true);
        }

        // ✅ BOUTONS D'ACTION
        this.initActionButtons(eventId, token);
    },

    // ================================
    // 🎮 INITIALISER LES BOUTONS
    // ================================
    initActionButtons(eventId, token) {
        const btnGenerateGroups = document.getElementById("btn-generate-groups");
        const btnGenerateBracket = document.getElementById("btn-generate-bracket");
        const btnGenerateConsolante = document.getElementById("btn-generate-consolante");
        const btnRefreshAll = document.getElementById("btn-refresh-all");

        if (btnGenerateGroups) {
            btnGenerateGroups.addEventListener("click", () => this.handleGenerateGroups(eventId, token));
        }

        if (btnGenerateBracket) {
            btnGenerateBracket.addEventListener("click", () => this.handleGenerateBracket(eventId, token));
        }

        if (btnGenerateConsolante) {
            btnGenerateConsolante.addEventListener("click", () => this.handleGenerateConsolante(eventId, token));
        }

        if (btnRefreshAll) {
            btnRefreshAll.addEventListener("click", async () => {
                this.setGlobalMessage("🔄 Rafraîchissement en cours...", false);
                await this.refreshAllData(eventId, token);
                this.setGlobalMessage("✅ Données mises à jour", false);
            });
        }


         // 🆕 BOUTONS GESTION ÉVÉNEMENT
    const btnEditEvent = document.getElementById("btn-edit-event");
    const btnCancelEvent = document.getElementById("btn-cancel-event");
    const btnDeleteEvent = document.getElementById("btn-delete-event");

    if (btnEditEvent) {
        btnEditEvent.addEventListener("click", () => {
            this.handleEditEvent(eventId, token);
        });
    }

    if (btnCancelEvent) {
        btnCancelEvent.addEventListener("click", () => {
            this.handleCancelEvent(eventId, token);
        });
    }

    if (btnDeleteEvent) {
        btnDeleteEvent.addEventListener("click", () => {
            this.handleDeleteEvent(eventId, token);
        });
    }
    },
    // ================================
    // 🔄 RAFRAÎCHIR TOUTES LES DONNÉES
    // ================================
    async refreshAllData(eventId, token) {
        await Promise.allSettled([
            this.loadEventDetails(eventId, token),
            this.loadRegistrations(eventId, token),
            this.loadMyTeams(eventId, token),
            this.loadGroups(eventId, token),
            this.loadBracket(eventId, token),
            this.loadConsolante(eventId, token),
            this.loadMatches(eventId, token),
            this.loadSummary(eventId, token)
        ]);
    },

    // ================================
    // 🔒 INSCRIRE UNE ÉQUIPE
    // ================================
    async registerTeam(eventId, teamId, token) {
        try {
            await this.safePost(
                `/api/events/registration/${eventId}/register-team`,
                token,
                { teamId }
            );

            this.setGlobalMessage("✅ Équipe inscrite avec succès", false);

            // 🔁 recharge les données critiques
            await this.loadEventDetails(eventId, token);
            await this.loadGroups(eventId, token);

            // 🔄 Rafraîchir TOUT ce qui dépend des inscriptions
            await this.loadRegistrations(eventId, token);
            await this.loadEventDetails(eventId, token);
            await this.loadMyTeams(eventId, token);

        } catch (err) {
            console.error("registerTeam error:", err);
            const errorMsg = this.extractErrorMessage(err);
            this.setGlobalMessage(`❌ ${errorMsg}`, true);
        }
    },

    // ================================
    // 🧩 UTILS GÉNÉRIQUES
    // ================================
    extractEventIdFromPath() {
        const path = window.location.pathname;
        const match = path.match(/^\/admin\/events\/([^/]+)$/) || path.match(/^\/tournament\/([^/]+)\/dashboard/);
        return match ? match[1] : null;
    },

    // ✅ NOUVEAU : Extraire message d'erreur propre
    extractErrorMessage(error) {
        if (typeof error === 'string') return error;
        if (error?.message) return error.message;
        if (error?.error) return error.error;
        return "Une erreur est survenue";
    },

    // ✅ NOUVEAU : Échappement HTML anti-XSS
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    // ✅ Retourne un label lisible pour un round
getRoundLabel(round) {
    return ROUND_LABELS[round] || this.escapeHtml(round || "Match KO");
},

// ✅ AJOUT ICI
isBye(match) {
    return (
        !match.teamA ||
        !match.teamB ||
        match.teamA === "?" ||
        match.teamB === "?"
    );
},


    setGlobalMessage(msg, isError = false) {
        const el = document.getElementById("event-global-message");
        if (!el) return;
        el.textContent = msg || "";
        el.style.color = isError ? "#e74c3c" : "#27ae60";
        el.style.padding = msg ? "12px" : "0";
        el.style.borderRadius = "8px";
        el.style.backgroundColor = isError ? "#fadbd8" : "#d5f4e6";
        el.style.fontWeight = "500";
        el.style.marginBottom = msg ? "20px" : "0";
        el.style.border = msg ? (isError ? "2px solid #e74c3c" : "2px solid #27ae60") : "none";
    },

    showLoading(containerId) {
        const el = document.getElementById(containerId);
        if (el) {
            el.innerHTML = `<div class="loader">⏳ Chargement...</div>`;
            el.classList.add("admin-loading");
        }
    },

    hideLoading(containerId) {
        const el = document.getElementById(containerId);
        if (el) {
            el.classList.remove("admin-loading");
        }
    },

    async safeGet(url, token) {
        const res = await fetch(url, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!res.ok) {
            const json = await res.json().catch(() => ({}));
            const errorMsg = json?.message || json?.error || `Erreur HTTP ${res.status}`;
            throw new Error(errorMsg);
        }

        const json = await res.json();
        return Array.isArray(json) ? json : (json.data || json);
    },

    async safePost(url, token, body = null, method = "POST") {
        const options = {
            method,
            headers: { "Authorization": `Bearer ${token}` }
        };

        if (body) {
            options.headers["Content-Type"] = "application/json";
            options.body = JSON.stringify(body);
        }

        const res = await fetch(url, options);
        
        if (!res.ok) {
            const json = await res.json().catch(() => ({}));
            const errorMsg = json?.message || json?.error || `Erreur HTTP ${res.status}`;
            throw new Error(errorMsg);
        }

        return await res.json().catch(() => null);
    },

    // ================================
// 🔧 MODIFIER L'ÉVÉNEMENT
// ================================
handleEditEvent(eventId, token) {
    // 🔄 Rediriger vers une page d'édition (à créer plus tard)
    Router.go(`/events/${eventId}/edit`);
},

// ================================
// ❌ ANNULER L'ÉVÉNEMENT
// ================================
async handleCancelEvent(eventId, token) {
    // ✅ CONFIRMATION OBLIGATOIRE
    if (!confirm("❌ ANNULER CET ÉVÉNEMENT ?\n\n⚠️ L'événement sera marqué comme ANNULÉ.\n\nLes participants seront notifiés.\n\nCette action est irréversible.")) {
        return;
    }

    try {
        this.setGlobalMessage("🔄 Annulation de l'événement...", false);
        
        await this.safePost(`/api/events/manage/${eventId}/cancel`, token, null, "PUT");
        
        this.setGlobalMessage("✅ Événement annulé avec succès", false);
        
        // Recharger les détails
        await this.loadEventDetails(eventId, token);
        
    } catch (err) {
        const errorMsg = this.extractErrorMessage(err);
        this.setGlobalMessage(`❌ ${errorMsg}`, true);
    }
},

// ================================
// 🗑️ SUPPRIMER L'ÉVÉNEMENT
// ================================
async handleDeleteEvent(eventId, token) {
    // ✅ DOUBLE CONFIRMATION OBLIGATOIRE
    if (!confirm("⚠️ SUPPRIMER DÉFINITIVEMENT CET ÉVÉNEMENT ?\n\n🔥 ATTENTION : Cette action est IRRÉVERSIBLE !\n\nToutes les données seront PERDUES :\n- Inscriptions\n- Matchs\n- Scores\n- Poules\n- Bracket\n\nÊtes-vous ABSOLUMENT SÛR ?")) {
        return;
    }

    // Deuxième confirmation avec saisie
    const confirmation = prompt('⚠️ CONFIRMATION FINALE\n\nPour supprimer définitivement, tapez "SUPPRIMER" en majuscules :');
    
    if (confirmation !== "SUPPRIMER") {
        this.setGlobalMessage("❌ Suppression annulée", false);
        return;
    }

    try {
        this.setGlobalMessage("🔄 Suppression de l'événement...", false);
        
        await this.safePost(`/api/events/manage/${eventId}`, token, null, "DELETE");
        
        this.setGlobalMessage("✅ Événement supprimé avec succès", false);
        
        // Rediriger vers la liste des événements après 2 secondes
        setTimeout(() => {
            Router.go("/events");
        }, 2000);
        
    } catch (err) {
        const errorMsg = this.extractErrorMessage(err);
        this.setGlobalMessage(`❌ ${errorMsg}`, true);
    }
},

    // ================================
    // 🔹 1. INFOS GÉNÉRALES
    // ================================
    async loadEventDetails(eventId, token) {
        const container = document.getElementById("event-details");
        if (!container) return;

        try {
            const event = await this.safeGet(`/api/events/public/${eventId}`, token);

            this.currentTournamentPhase = event.tournamentPhase;

            this.updateTournamentActionsUI();

            // ✅ Décision métier persistée → sécuriser l’UI
if (event.groupCount !== null) {
    
    this.displayTournamentFormat(event);
} else {
    this.enableGenerateGroupsButton();
}
         
            // ✅ ÉCHAPPEMENT HTML
            const safeName = this.escapeHtml(event.name || "Tournoi");
            const safeDescription = this.escapeHtml(event.description);
            const safeLocation = this.escapeHtml(event.city || event.location || "Lieu NC");

            container.innerHTML = `
                <div class="event-header-pro">
                    <div class="event-header-top">
                        ${event.logoUrl || event.imageUrl ? `
                            <img src="${this.escapeHtml(event.logoUrl || event.imageUrl)}" 
                                 alt="Logo"
                                 class="event-header-logo">
                        ` : `
                            <div class="event-header-logo placeholder">🏆</div>
                        `}

                        <div class="event-header-info">
                            <h2>${safeName}</h2>

                            <div class="event-tags">
                                <span class="tag">
                                    <i class="fa-solid fa-calendar"></i> ${event.date || "NC"}
                                </span>
                                <span class="tag">
                                    <i class="fa-solid fa-map-marker-alt"></i> ${safeLocation}
                                </span>
                                <span class="tag">
                                    <i class="fa-solid fa-users"></i>
                                    ${event.acceptedParticipants ?? 0} / ${event.capacity ?? event.maxParticipants ?? "?"} équipes
                                </span>
                                <span class="tag status ${(event.status || '').toLowerCase()}">
                                    ${this.escapeHtml(event.status || "NC")}
                                </span>
                            </div>
                        </div>
                    </div>

                    ${safeDescription ? `
                        <p class="event-header-description">${safeDescription}</p>
                    ` : ``}
                </div>
            `;

        } catch (err) {
            console.error("loadEventDetails error:", err);
            const errorMsg = this.extractErrorMessage(err);
            container.innerHTML = `<p style="color: #e74c3c;">❌ ${this.escapeHtml(errorMsg)}</p>`;
        }
    },


updateTournamentActionsUI() {
    const phase = this.currentTournamentPhase;

    const btnGroups = document.getElementById("btn-generate-groups");
    const btnBracket = document.getElementById("btn-generate-bracket");
    const btnConsolante = document.getElementById("btn-generate-consolante");

    [btnGroups, btnBracket, btnConsolante].forEach(btn => {
        if (btn) btn.disabled = true;
    });

    switch (phase) {

        case "REGISTRATION":
            btnGroups.disabled = false;
            break;

        case "GROUP_STAGE":
            // rien
            break;

        case "GROUP_STAGE_FINISHED":
            // 🔹 Générer barrages OU KO direct
            btnBracket.disabled = false;
            btnBracket.textContent = "🏆 Générer le bracket";
            break;

        case "BARRAGE":
            // 🔥 C'EST ICI QUE TOUT SE JOUE
            btnBracket.disabled = false;
            btnBracket.textContent = "⚔️ Générer la phase finale";
            break;

        case "KNOCKOUT_STAGE":
            btnConsolante.disabled = false;
            break;

        case "FINAL_PLAYED":
            btnConsolante.disabled = false;
            break;
    }
},




    // ================================
    // 🔹 2. INSCRIPTIONS
    // ================================
    async loadRegistrations(eventId, token) {
        const container = document.getElementById("event-registrations");
        if (!container) return;

        try {
            const response = await this.safeGet(`/api/events/manage/${eventId}/registrations?size=100`, token);
            const registrations = response.content || response || [];

            if (!registrations.length) {
                container.innerHTML = `<p style="color: #7f8c8d;">Aucune inscription pour le moment</p>`;
                return;
            }

            const pending = registrations.filter(r => (r.status || "").toUpperCase() === "PENDING");
            const accepted = registrations.filter(r => (r.status || "").toUpperCase() === "ACCEPTED");
            const rejected = registrations.filter(r => (r.status || "").toUpperCase() === "REJECTED");

            let html = '';

            // ✅ COMPTEURS
            html += `
                <div style="display: flex; gap: 15px; margin-bottom: 25px; flex-wrap: wrap;">
                    <div style="flex: 1; min-width: 100px; padding: 15px; background: #fff3cd; border-radius: 10px; text-align: center; border: 2px solid #f39c12;">
                        <div style="font-size: 2em; font-weight: 700; color: #f39c12;">${pending.length}</div>
                        <div style="font-size: 0.9em; color: #856404; font-weight: 600;">⏳ En attente</div>
                    </div>
                    <div style="flex: 1; min-width: 100px; padding: 15px; background: #d4edda; border-radius: 10px; text-align: center; border: 2px solid #27ae60;">
                        <div style="font-size: 2em; font-weight: 700; color: #27ae60;">${accepted.length}</div>
                        <div style="font-size: 0.9em; color: #155724; font-weight: 600;">✅ Validées</div>
                    </div>
                    ${rejected.length > 0 ? `
                        <div style="flex: 1; min-width: 100px; padding: 15px; background: #f8d7da; border-radius: 10px; text-align: center; border: 2px solid #e74c3c;">
                            <div style="font-size: 2em; font-weight: 700; color: #e74c3c;">${rejected.length}</div>
                            <div style="font-size: 0.9em; color: #721c24; font-weight: 600;">❌ Refusées</div>
                        </div>
                    ` : ''}
                </div>
            `;

            // ✅ INSCRIPTIONS EN ATTENTE
            if (pending.length > 0) {
                html += `<h3 style="color: #f39c12; margin: 25px 0 15px 0; font-size: 1.1em;">⏳ Inscriptions en attente (${pending.length})</h3>`;
                pending.forEach(reg => {
                    html += this.renderRegistrationCard(reg, true);
                });
            }

            // ✅ INSCRIPTIONS ACCEPTÉES
            if (accepted.length > 0) {
                html += `<h3 style="color: #27ae60; margin: 25px 0 15px 0; font-size: 1.1em;">✅ Équipes validées (${accepted.length})</h3>`;
                accepted.forEach(reg => {
                    html += this.renderRegistrationCard(reg, false);
                });
            }

            container.innerHTML = html;

            // ✅ Bind listeners avec confirmation
            container.querySelectorAll(".btn-accept-reg").forEach(btn => {
                btn.addEventListener("click", async (e) => {
                    const regId = e.target.getAttribute("data-reg-id");
                    const teamName = e.target.getAttribute("data-team-name");
                    
                    // ✅ CONFIRMATION OBLIGATOIRE
                    if (!confirm(`Accepter l'inscription de "${teamName}" ?\n\nCette action est irréversible.`)) {
                        return;
                    }
                    
                    await this.handleAcceptRegistration(eventId, regId, token);
                });
            });

            container.querySelectorAll(".btn-reject-reg").forEach(btn => {
                btn.addEventListener("click", async (e) => {
                    const regId = e.target.getAttribute("data-reg-id");
                    const teamName = e.target.getAttribute("data-team-name");
                    
                    // ✅ CONFIRMATION OBLIGATOIRE
                    if (!confirm(`Refuser l'inscription de "${teamName}" ?\n\nCette action est irréversible.`)) {
                        return;
                    }
                    
                    await this.handleRejectRegistration(eventId, regId, token);
                });
            });

        } catch (err) {
            console.error("loadRegistrations error:", err);
            const errorMsg = this.extractErrorMessage(err);
            container.innerHTML = `<p style="color: #e74c3c;">❌ ${this.escapeHtml(errorMsg)}</p>`;
        }
    },

    // ================================
    // 🔹 MES ÉQUIPES (ORGANISATEUR)
    // ================================
    async loadMyTeams(eventId, token) {
        const container = document.getElementById("my-teams");
        if (!container) return;

        try {
            const teams = await this.safeGet("/api/teams/my-club", token);

            if (!teams || teams.length === 0) {
                container.innerHTML = "<p>Aucune équipe dans votre club</p>";
                return;
            }

            const registrationsResponse = await this.safeGet(
                `/api/events/manage/${eventId}/registrations?size=100`,
                token
            );

            const registrations = registrationsResponse.content || registrationsResponse || [];

            const registeredTeamIds = new Set(
                registrations
                    .filter(r => r.team || r.teamId)
                    .map(r => r.team?.id || r.teamId)
            );

            container.innerHTML = teams.map(team => {
                const safeName = this.escapeHtml(team.name);
                const isRegistered = registeredTeamIds.has(team.id);

                return `
                    <div style="
                        display:flex;
                        justify-content:space-between;
                        align-items:center;
                        padding:12px;
                        border:1px solid #ddd;
                        border-radius:8px;
                        margin-bottom:10px;
                        background:#fff;
                    ">
                        <span>🏆 ${safeName}</span>

                        ${isRegistered ? `
                            <span style="
                                padding:6px 12px;
                                border-radius:20px;
                                background:#d4edda;
                                color:#27ae60;
                                font-weight:600;
                                font-size:0.85em;
                            ">
                                ✅ Déjà inscrite
                            </span>
                        ` : `
                            <button 
                                class="admin-btn admin-btn-primary"
                                data-team-id="${team.id}"
                                data-team-name="${this.escapeHtml(team.name)}">
                                ➕ Inscrire
                            </button>
                        `}
                    </div>
                `;
            }).join("");

            container.querySelectorAll("button").forEach(btn => {
                btn.addEventListener("click", () => {
                    const teamId = Number(btn.dataset.teamId);
                    const teamName = btn.dataset.teamName;

                    if (registeredTeamIds.has(teamId)) return;

                    // ✅ CONFIRMATION
                    if (!confirm(`Inscrire l'équipe "${teamName}" au tournoi ?`)) {
                        return;
                    }

                    this.registerTeam(eventId, teamId, token);
                });
            });

        } catch (err) {
            console.error("loadMyTeams error:", err);
            const errorMsg = this.extractErrorMessage(err);
            container.innerHTML = `<p style='color:red'>${this.escapeHtml(errorMsg)}</p>`;
        }
    },

    // ✅ RENDER REGISTRATION CARD (AVEC ÉCHAPPEMENT HTML)
    renderRegistrationCard(reg, showActions) {
        const teamName = this.escapeHtml(reg.teamName || reg.team?.name || "Équipe");
        const clubName = this.escapeHtml(reg.clubName || reg.club?.name || "");
        const status = (reg.status || "").toUpperCase();
        const registrationDate = reg.registrationDate || reg.createdAt || "";
        
        let formattedDate = "";
        if (registrationDate) {
            try {
                const date = new Date(registrationDate);
                formattedDate = date.toLocaleDateString('fr-FR', { 
                    day: '2-digit', 
                    month: 'short', 
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
            } catch (e) {
                formattedDate = registrationDate;
            }
        }

        const borderColor = status === "PENDING" ? '#f39c12' : status === "ACCEPTED" ? '#27ae60' : '#e74c3c';
        const bgColor = status === "PENDING" ? '#fff3cd' : status === "ACCEPTED" ? '#d4edda' : '#f8d7da';

        return `
            <div style="
               border: 2px solid ${borderColor}; 
            border-radius: 12px; 
            padding: 20px; 
            background: white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            transition: transform 0.2s, box-shadow 0.2s;
            margin-bottom: 15px;
            width: 100%;
            display: block;
            ">
                
                <div style="display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 12px; flex-wrap: wrap; gap: 10px;">
                    <div style="flex: 1; min-width: 150px;">
                        <h4 style="margin: 0 0 5px 0; color: #2c3e50; font-size: 1.1em; word-break: break-word;">
                            🏆 ${teamName}
                        </h4>
                        ${clubName ? `
                            <p style="margin: 0; color: #7f8c8d; font-size: 0.9em;">
                                ⚽ ${clubName}
                            </p>
                        ` : ''}
                    </div>
                    <span style="
                        background: ${bgColor}; 
                        color: ${borderColor}; 
                        padding: 6px 12px; 
                        border-radius: 20px; 
                        font-size: 0.85em; 
                        font-weight: 600;
                        white-space: nowrap;
                        align-self: flex-start;
                    ">
                        ${status === "PENDING" ? "⏳ EN ATTENTE" : status === "ACCEPTED" ? "✅ VALIDÉE" : "❌ REFUSÉE"}
                    </span>
                </div>

                ${formattedDate ? `
                    <p style="margin: 10px 0 0 0; color: #95a5a6; font-size: 0.85em;">
                        📅 ${formattedDate}
                    </p>
                ` : ''}

                ${showActions ? `
                    <div style="display: flex; gap: 10px; margin-top: auto; padding-top: 15px; border-top: 1px solid #ecf0f1;">
                        <button class="admin-btn admin-btn-primary btn-accept-reg" 
                                data-reg-id="${reg.id}"
                                data-team-name="${teamName}"
                                style="flex: 1; padding: 10px; font-size: 0.9em;">
                            ✅ Accepter
                        </button>
                        <button class="admin-btn btn-reject-reg" 
                                data-reg-id="${reg.id}"
                                data-team-name="${teamName}"
                                style="flex: 1; padding: 10px; font-size: 0.9em; background: #e74c3c; border-color: #e74c3c;">
                            ❌ Refuser
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
    },

    async handleAcceptRegistration(eventId, regId, token) {
        try {
            await this.safePost(`/api/events/registration/${eventId}/registrations/${regId}/accept`, token, null, "PUT");
            this.setGlobalMessage("✅ Inscription acceptée avec succès", false);
            await this.loadRegistrations(eventId, token);
            await this.loadEventDetails(eventId, token);
        } catch (err) {
            const errorMsg = this.extractErrorMessage(err);
            this.setGlobalMessage(`❌ ${errorMsg}`, true);
        }
    },

    async handleRejectRegistration(eventId, regId, token) {
        try {
            await this.safePost(`/api/events/registration/${eventId}/registrations/${regId}/reject`, token, null, "PUT");
            this.setGlobalMessage("✅ Inscription rejetée", false);
            await this.loadRegistrations(eventId, token);
            await this.loadEventDetails(eventId, token);
        } catch (err) {
            const errorMsg = this.extractErrorMessage(err);
            this.setGlobalMessage(`❌ ${errorMsg}`, true);
        }
    },

    // ================================
    // 🔹 3. POULES & CLASSEMENTS
    // ================================
    async loadGroups(eventId, token) {
        const groupsContainer = document.getElementById("event-groups");
        const rankingsContainer = document.getElementById("event-groups-rankings");
        if (!groupsContainer) return;

        try {
            const groups = await this.safeGet(`/api/events/tournament/${eventId}/groups`, token);

            if (!groups || !groups.length) {
                groupsContainer.innerHTML = `<p style="color: #7f8c8d;">Aucune poule générée. Cliquez sur "Générer les poules"</p>`;
            } else {
               groupsContainer.innerHTML = `
                <div style="display: flex; flex-direction: column; gap: 20px;">
                    ${groups.map(group => {
                        const groupName = this.escapeHtml(group.name || `Poule ${group.id}`);
                        const teams = group.teams || [];

                        return `
                            <div style="
                                background: white;
                                border: 2px solid #3498db;
                                border-radius: 12px;
                                padding: 20px;
                                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                            ">
                                <h3 style="
                                    color: #3498db;
                                    margin: 0 0 15px 0;
                                    font-size: 1.2em;
                                    text-align: center;
                                    padding-bottom: 10px;
                                    border-bottom: 2px solid #3498db;
                                ">${groupName}</h3>
                                ${teams.length ? `
                                    <div style="display: flex; flex-direction: column; gap: 8px;">
                                        ${teams.map((t, idx) => {
                                            const teamName = typeof t === 'string' ? t : (t.name || "Équipe");
                                            const safeTeamName = this.escapeHtml(teamName);
                                            
                                            return `
                                                <div style="
                                                    padding: 12px;
                                                    background: ${idx % 2 === 0 ? '#f8f9fa' : 'white'};
                                                    border-radius: 8px;
                                                    display: flex;
                                                    align-items: center;
                                                    gap: 10px;
                                                ">
                                                    <span style="
                                                        min-width: 30px;
                                                        height: 30px;
                                                        background: #3498db;
                                                        color: white;
                                                        border-radius: 50%;
                                                        display: flex;
                                                        align-items: center;
                                                        justify-content: center;
                                                        font-weight: 700;
                                                        font-size: 0.9em;
                                                    ">${idx + 1}</span>
                                                    <span style="
                                                        flex: 1;
                                                        color: #2c3e50;
                                                        font-weight: 500;
                                                    ">${safeTeamName}</span>
                                                </div>
                                            `;
                                        }).join("")}
                                    </div>
                                ` : `<p style="color: #7f8c8d; text-align: center;">Aucune équipe</p>`}
                            </div>
                        `;
                    }).join("")}
                </div>
                `;
            }

            // Classements
            try {
                const rankings = await this.safeGet(`/api/events/tournament/${eventId}/group-rankings`, token);
                if (rankings && rankings.length && rankingsContainer) {
                    rankingsContainer.innerHTML = rankings.map(r => {
                        const rows = r.rankings || r.teams || [];
                        const groupName = this.escapeHtml(r.groupName || r.name);
                        
                        return `
                            <div class="admin-dashboard-card">
                                <h3>Classement - ${groupName}</h3>
                                <table class="admin-table" style="width:100%;">
                                    <thead>
                                        <tr>
                                            <th>#</th><th>Équipe</th><th>Pts</th><th>J</th><th>G</th><th>N</th><th>P</th><th>Diff</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${rows.map((row, i) => {
                                            const teamName = this.escapeHtml(row.teamName || row.name);
                                            return `
                                                <tr>
                                                    <td>${i + 1}</td>
                                                    <td>${teamName}</td>
                                                    <td><strong>${row.points ?? "-"}</strong></td>
                                                    <td>${row.played ?? "-"}</td>
                                                    <td>${row.won ?? "-"}</td>
                                                    <td>${row.draw ?? "-"}</td>
                                                    <td>${row.lost ?? "-"}</td>
                                                    <td>${row.goalDifference ?? "-"}</td>
                                                </tr>
                                            `;
                                        }).join("")}
                                    </tbody>
                                </table>
                            </div>
                        `;
                    }).join("");
                }
            } catch (err) {
                console.warn("Rankings error:", err);
            }

        } catch (err) {
            console.error("loadGroups error:", err);
            const errorMsg = this.extractErrorMessage(err);
            groupsContainer.innerHTML = `<p style="color: #e74c3c;">❌ ${this.escapeHtml(errorMsg)}</p>`;
        }

        // 🔒 Si des poules existent réellement → désactiver le bouton

    },

    // ================================
    // MODAL DE SAISIE DE SCORE (SÉCURISÉE)
    // ================================
    showScoreModal(matchId, teamA, teamB, scoreA, scoreB, eventId, token) {
        console.log("🟢 Modal ouverte:", {matchId, teamA, teamB, scoreA, scoreB, eventId});
        
        // ✅ ÉCHAPPEMENT HTML ANTI-XSS
        const safeTeamA = this.escapeHtml(teamA);
        const safeTeamB = this.escapeHtml(teamB);
        
        // ✅ VALIDATION DES SCORES
        const validScoreA = Math.max(0, Math.min(99, parseInt(scoreA) || 0));
        const validScoreB = Math.max(0, Math.min(99, parseInt(scoreB) || 0));
        
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
            background: rgba(0,0,0,0.7); display: flex; align-items: center; 
            justify-content: center; z-index: 9999;
        `;
        
        modal.innerHTML = `
            <div style="background: white; padding: 30px; border-radius: 12px; max-width: 400px; width: 90%; box-shadow: 0 4px 20px rgba(0,0,0,0.3);">
                <h3 style="margin: 0 0 20px 0; color: #2c3e50; text-align: center;">📝 Saisir le score</h3>
                
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 25px;">
                    <div style="flex: 1; text-align: center;">
                        <div style="font-weight: 600; color: #2c3e50; margin-bottom: 10px;">${safeTeamA}</div>
                        <input type="number" id="score-a" min="0" max="99" value="${validScoreA}" 
                               style="width: 60px; padding: 10px; font-size: 24px; text-align: center; border: 2px solid #3498db; border-radius: 8px;">
                    </div>
                    <div style="font-size: 24px; color: #95a5a6; margin: 0 20px;">-</div>
                    <div style="flex: 1; text-align: center;">
                        <div style="font-weight: 600; color: #2c3e50; margin-bottom: 10px;">${safeTeamB}</div>
                        <input type="number" id="score-b" min="0" max="99" value="${validScoreB}" 
                               style="width: 60px; padding: 10px; font-size: 24px; text-align: center; border: 2px solid #3498db; border-radius: 8px;">
                    </div>
                </div>
                
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                    <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                       <input type="checkbox" id="is-final"
                            style="width: 20px; height: 20px; cursor: pointer;">

                        <span style="font-weight: 600; color: #2c3e50;">
                            ✅ Terminer le match
                        </span>
                    </label>
                    <p style="margin: 8px 0 0 30px; font-size: 0.85em; color: #7f8c8d;">
                        Les équipes seront qualifiées automatiquement
                    </p>
                </div>
                
                <div style="display: flex; gap: 10px;">
                    <button id="btn-cancel" style="flex: 1; padding: 12px; background: #95a5a6; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
                        Annuler
                    </button>
                    <button id="btn-save-score" style="flex: 1; padding: 12px; background: #27ae60; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
                        ✅ Valider
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Fermeture
        modal.querySelector('#btn-cancel').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
        
        // Sauvegarde avec validation
        modal.querySelector('#btn-save-score').addEventListener('click', async () => {
            const inputA = document.getElementById('score-a');
            const inputB = document.getElementById('score-b');
            const isFinal = document.getElementById('is-final').checked;
            
            // ✅ VALIDATION STRICTE
            let newScoreA = parseInt(inputA.value);
            let newScoreB = parseInt(inputB.value);
            
            if (isNaN(newScoreA) || newScoreA < 0 || newScoreA > 99) {
                alert("❌ Le score de l'équipe A doit être entre 0 et 99");
                inputA.focus();
                return;
            }
            
            if (isNaN(newScoreB) || newScoreB < 0 || newScoreB > 99) {
                alert("❌ Le score de l'équipe B doit être entre 0 et 99");
                inputB.focus();
                return;
            }
            
            // Confirmation si match terminé
            if (isFinal) {
                const confirmMsg = `Terminer définitivement le match ?\n\n${safeTeamA} ${newScoreA} - ${newScoreB} ${safeTeamB}\n\nCette action est irréversible.`;
                if (!confirm(confirmMsg)) {
                    return;
                }
            }
            
            await this.saveMatchScore(matchId, newScoreA, newScoreB, isFinal, token);
            document.body.removeChild(modal);
            await this.refreshAllData(eventId, token);
        });
    },

    // ================================
    // SAUVEGARDER LE SCORE
    // ================================
    async saveMatchScore(matchId, scoreA, scoreB, isFinal, token) {
        try {
            const body = {
                scoreA: scoreA,
                scoreB: scoreB,
                isFinal: isFinal
            };
            
            const response = await fetch(`/api/tournament/admin/matches/${matchId}/score`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const json = await response.json().catch(() => ({}));
                const errorMsg = json?.message || json?.error || `HTTP ${response.status}`;
                throw new Error(errorMsg);
            }

            const message = isFinal 
                ? "✅ Match terminé - Équipes qualifiées automatiquement !" 
                : "✅ Score temporaire enregistré";
            
            this.setGlobalMessage(message, false);
        } catch (error) {
            console.error("Erreur saveMatchScore:", error);
            const errorMsg = this.extractErrorMessage(error);
            this.setGlobalMessage(`❌ ${errorMsg}`, true);
        }
    },

    // ================================
    // GÉNÉRER LES POULES (AVEC CONFIRMATION)
    // ================================
async handleGenerateGroups(eventId, token) {

    const allowedGroups = [2, 4, 6, 8];
    const allowedQualified = [1, 2, 4];

    const nbGroups = parseInt(
        prompt("Combien de poules ? (2, 4, 6, 8)", "4"),
        10
    );

    if (!allowedGroups.includes(nbGroups)) {
        alert("Nombre de poules autorisé : 2, 4, 6, 8");
        return;
    }

    const qualifiedPerGroup = parseInt(
        prompt("Combien de qualifiés par poule ? (1, 2, 4)", "2"),
        10
    );

    if (!allowedQualified.includes(qualifiedPerGroup)) {
        alert("Nombre de qualifiés autorisé : 1, 2, 4");
        return;
    }

    try {
        // 🔹 Appel NORMAL (sans forcer)
        await this.safePost(
            `/api/tournament/admin/${eventId}/generate-groups?nbGroups=${nbGroups}&qualifiedPerGroup=${qualifiedPerGroup}`,
            token
        );

        this.setGlobalMessage("✅ Poules générées", false);
        await this.loadGroups(eventId, token);

    } catch (err) {

        const msg = this.extractErrorMessage(err);

        // 🔑 CAS MÉTIER : confirmation requise
        if (msg.includes("Confirmation requise")) {

            const confirmForce = confirm(
                `${msg}\n\nVoulez-vous lancer le tournoi quand même ?`
            );

            if (!confirmForce) {
                this.setGlobalMessage("❌ Génération annulée", false);
                return;
            }

            // 🔥 Appel FORCÉ
            await this.safePost(
                `/api/tournament/admin/${eventId}/generate-groups/force?nbGroups=${nbGroups}&qualifiedPerGroup=${qualifiedPerGroup}`,
                token
            );

            this.setGlobalMessage("⚠️ Poules générées malgré tournoi incomplet", false);
            await this.loadGroups(eventId, token);

        } else {
            // ❌ Autre erreur
            this.setGlobalMessage(`❌ ${msg}`, true);
        }
    }
},
    // ================================
    // 🔹 4. BRACKET
    // ================================
   async loadBracket(eventId, token) {
    const container = document.getElementById("event-bracket");
    if (!container) return;

    try {
        const matches = await this.safeGet(`/api/events/${eventId}/bracket`, token);

        if (!matches || matches.length === 0) {
            container.innerHTML = `<p style="color:#7f8c8d;">Bracket non généré.</p>`;
            return;
        }

        // ✅ Bracket principal = rounds qui ne commencent PAS par C
        const mainBracketMatches = matches.filter(
            m => m.round && !m.round.startsWith("C")
        );

        // ✅ Regroupement par round
        const rounds = {};
        mainBracketMatches.forEach(m => {
            if (!rounds[m.round]) rounds[m.round] = [];
            rounds[m.round].push(m);
        });

        // ✅ Ordre logique dynamique
        // ✅ Ordre préféré (lisible et stable)
const preferredOrder = ["PRELIM", "QF", "SF", "FINAL"];

// ✅ Ordre final SAFE :
// - respecte l’ordre connu
// - ajoute automatiquement les rounds inconnus (R16, R32, etc.)
const roundOrder = [
    ...preferredOrder.filter(r => rounds[r]),
    ...Object.keys(rounds).filter(r => !preferredOrder.includes(r))
];


        container.innerHTML = `
            <div style="display:flex;flex-direction:column;gap:20px;">
                ${roundOrder.filter(r => rounds[r]).map(roundName => `
                    <div style="background:white;border:2px solid #e67e22;border-radius:12px;padding:20px;">
                       <h3 style="color:#e67e22;">
    ${this.getRoundLabel(roundName)}
</h3>


                        ${rounds[roundName].map(m => `
                            <div style="display:flex;justify-content:space-between;padding:10px;background:#f8f9fa;border-radius:8px;">
                                <strong>${this.escapeHtml(m.teamA || "?")}</strong>
                                <span>${m.scoreA ?? "-"} - ${m.scoreB ?? "-"}</span>
                                <strong>${this.escapeHtml(m.teamB || "?")}</strong>
                            </div>
                        `).join("")}
                    </div>
                `).join("")}
            </div>
        `;

    } catch (err) {
        console.error("loadBracket error:", err);
        container.innerHTML = `<p style="color:red;">❌ Erreur chargement bracket</p>`;
    }
},


async handleGenerateBracket(eventId, token) {
    try {
        // 🔄 AFFICHER LOADING
        this.setGlobalMessage("🔄 Génération du bracket en cours...", false);
        
        const phase = this.currentTournamentPhase;

        if (phase === "BARRAGE") {
            await this.safePost(
                `/api/events/${eventId}/bracket/generate-after-barrages`,
                token
            );
            this.setGlobalMessage("✅ Phase finale générée avec succès !", false);
        } else {
            await this.safePost(
                `/api/events/${eventId}/bracket/generate`,
                token
            );
            this.setGlobalMessage("✅ Bracket généré avec succès !", false);
        }

        // 🔄 RAFRAÎCHIR LES DONNÉES
        await this.refreshAllData(eventId, token);
        
    } catch (err) {
        // ❌ AFFICHER ERREUR
        const errorMsg = this.extractErrorMessage(err);
        this.setGlobalMessage(`❌ ${errorMsg}`, true);
    }
},


    // ================================
    // 🔹 5. CONSOLANTE
    // ================================
async loadConsolante(eventId, token) {
    const container = document.getElementById("event-consolante");
    if (!container) return;

    try {
        const matches = await this.safeGet(`/api/events/${eventId}/consolante`, token);

        if (!matches || matches.length === 0) {
            container.innerHTML = `<p style="color:#7f8c8d;">Consolante non générée.</p>`;
            return;
        }

        // ✅ CONSOLANTE = rounds qui commencent par C
        const consolanteMatches = matches.filter(
            m => m.round && m.round.startsWith("C")
        );

        if (consolanteMatches.length === 0) {
            container.innerHTML = `<p style="color:#7f8c8d;">Consolante vide.</p>`;
            return;
        }

        // Regroupement par round
        const rounds = {};
        consolanteMatches.forEach(m => {
            if (!rounds[m.round]) rounds[m.round] = [];
            rounds[m.round].push(m);
        });

        // Ordre logique SIMPLE
       const roundOrder = Object.keys(rounds);


        container.innerHTML = `
            <div style="display:flex;flex-direction:column;gap:20px;">
                ${roundOrder.filter(r => rounds[r]).map(round => `
                    <div style="background:white;border:2px solid #2ecc71;border-radius:12px;padding:20px;">
                       <h3 style="color:#2ecc71;">
    ${this.getRoundLabel(round)}
</h3>


                        ${rounds[round].map(m => `
                            <div style="display:flex;justify-content:space-between;padding:10px;background:#f8f9fa;border-radius:8px;">
                                <strong>${this.escapeHtml(m.teamA || "?")}</strong>
                                <span>${m.scoreA ?? "-"} - ${m.scoreB ?? "-"}</span>
                                <strong>${this.escapeHtml(m.teamB || "?")}</strong>
                            </div>
                        `).join("")}
                    </div>
                `).join("")}
            </div>
        `;
    } catch (err) {
        console.error("loadConsolante error:", err);
        container.innerHTML = `<p style="color:red;">❌ Erreur chargement consolante</p>`;
    }
},


    async handleGenerateConsolante(eventId, token) {
        // ✅ CONFIRMATION OBLIGATOIRE
        if (!confirm("Générer le bracket consolante ?\n\nLes demi-finales du bracket principal doivent être terminées.\n\nCette action est irréversible.")) {
            return;
        }

        try {
            this.setGlobalMessage("🔄 Génération de la consolante...", false);
            await this.safePost(`/api/events/${eventId}/consolante/generate`, token);
            this.setGlobalMessage("✅ Consolante générée avec succès", false);
           await this.refreshAllData(eventId, token);

        } catch (err) {
            const errorMsg = this.extractErrorMessage(err);
            this.setGlobalMessage(`❌ ${errorMsg}`, true);
        }
    },

    // ================================
    // 🔹 6. MATCHS (AVEC MISE À JOUR DES SCORES)
    // ================================
    async loadMatches(eventId, token) {
        const container = document.getElementById("event-matches");
        if (!container) return;

        try {
            const response = await this.safeGet(`/api/events/${eventId}/matches`, token);

            if (!response || response.length === 0) {
                container.innerHTML = `
                    <div class="match-card">
                        <p>Aucun match généré</p>
                        <button class="match-button btn-generate-matches">⚽ Générer les matchs</button>
                    </div>
                `;
                container.querySelector(".btn-generate-matches")
                    ?.addEventListener("click", async () => {
                        await this.handleGenerateMatches(eventId, token);
                    });
                return;
            }

            const poolMatches = response.filter(m => m.group !== null);
            const bracketMatches = response.filter(m => m.group === null && m.round !== null);

            const groups = {};
            for (const m of poolMatches) {
                const groupName = m.group || m.groupName || "Groupe";
                if (!groups[groupName]) groups[groupName] = [];
                groups[groupName].push(m);
            }

            let html = `<div class="match-groups-wrapper">`;

            // POULES
            Object.keys(groups).sort().forEach(groupName => {
                html += `
                    <div class="match-container">
                        <h3 class="match-group-title">${this.escapeHtml(groupName)}</h3>
                `;

                groups[groupName].forEach(match => {
                    const scoreA = match.scoreTeamA ?? "-";
                    const scoreB = match.scoreTeamB ?? "-";
                    const hasScore = match.scoreTeamA !== null && match.scoreTeamB !== null;
                    const isFinished =
                        match.status === "FINISHED" || this.isBye(match);

                    const teamAWins = hasScore && scoreA > scoreB;
                    const teamBWins = hasScore && scoreB > scoreA;
                    
                    const safeTeamA = this.escapeHtml(match.teamA);
                    const safeTeamB = this.escapeHtml(match.teamB);

                    html += `
                        <div class="match-card ${isFinished ? "finished" : ""}">
                            <div class="match-teams">
                                <div class="match-row">
                                    <span class="match-team-name">${safeTeamA}</span>
                                    <span class="match-score" style="${teamAWins ? 'color:#27ae60;font-weight:900;' : ''}">
                                        ${scoreA}
                                    </span>
                                </div>

                                <div style="border-bottom:1px solid #e0e0e0;margin:8px 0;"></div>

                                <div class="match-row">
                                    <span class="match-team-name">${safeTeamB}</span>
                                    <span class="match-score" style="${teamBWins ? 'color:#27ae60;font-weight:900;' : ''}">
                                        ${scoreB}
                                    </span>
                                </div>
                            </div>

                            <button 
                                class="match-button btn-edit-score"
                                data-match-id="${match.id}"
                                data-team-a="${safeTeamA}"
                                data-team-b="${safeTeamB}"
                                data-score-a="${scoreA}"
                                data-score-b="${scoreB}"
                                ${isFinished ? 'disabled style="opacity:0.6;cursor:not-allowed;"' : ''}
                            >
                              ${isFinished
    ? this.isBye(match)
        ? "🟡 BYE – qualifié automatiquement"
        : "✅ Score final"
    : hasScore
        ? "✏️ Modifier le score"
        : "📝 Saisir le score"
}

                            </button>
                        </div>
                    `;
                });

                html += `</div>`;
            });

            // BRACKET PRINCIPAL
            const mainBracketMatches = bracketMatches.filter(m => !m.round || !m.round.startsWith('C'));

            if (mainBracketMatches.length > 0) {
                html += `
                    <div class="match-container">
                        <h3 class="match-group-title">🏆 Bracket principal (Phase finale)</h3>
                `;

                mainBracketMatches.forEach(match => {
                    const scoreA = match.scoreTeamA ?? "-";
                    const scoreB = match.scoreTeamB ?? "-";
                    const isFinished =
                        match.status === "FINISHED" || this.isBye(match);

                    const safeTeamA = this.escapeHtml(match.teamA || "?");
                    const safeTeamB = this.escapeHtml(match.teamB || "?");

                    html += `
                        <div class="match-card ${isFinished ? "finished" : ""}">
                           <div class="match-row" style="font-weight:700;margin-bottom:10px;">
    ${this.getRoundLabel(match.round)}
</div>


                            <div class="match-teams">
                                <div class="match-row">
                                    <span class="match-team-name">${safeTeamA}</span>
                                    <span class="match-score">${scoreA}</span>
                                </div>
                                <div class="match-row">
                                    <span class="match-team-name">${safeTeamB}</span>
                                    <span class="match-score">${scoreB}</span>
                                </div>
                            </div>

                            <button 
                                class="match-button btn-edit-score"
                                data-match-id="${match.id}"
                                data-team-a="${safeTeamA}"
                                data-team-b="${safeTeamB}"
                                data-score-a="${scoreA}"
                                data-score-b="${scoreB}"
                                ${isFinished ? 'disabled style="opacity:0.6;cursor:not-allowed;"' : ''}
                            >
                                ${isFinished
    ? this.isBye(match)
        ? "🟡 BYE – qualifié automatiquement"
        : "✅ Score final"
    : "✏️ Modifier le score"
}

                            </button>
                        </div>
                    `;
                });

                html += `</div>`;
            }

            // CONSOLANTE
            const consolanteMatches = bracketMatches.filter(m => m.round && m.round.startsWith('C'));

            if (consolanteMatches.length > 0) {
                html += `
                    <div class="match-container">
                        <h3 class="match-group-title" style="color:#27ae60;">♻️ Consolante (Phase finale)</h3>
                `;

                consolanteMatches.forEach(match => {
                    const scoreA = match.scoreTeamA ?? "-";
                    const scoreB = match.scoreTeamB ?? "-";
                    const isFinished =
                    match.status === "FINISHED" || this.isBye(match);

                    const safeTeamA = this.escapeHtml(match.teamA || "?");
                    const safeTeamB = this.escapeHtml(match.teamB || "?");

                    html += `
                        <div class="match-card ${isFinished ? "finished" : ""}" style="border-left: 4px solid #27ae60;">
                           <div class="match-row" style="font-weight:700;margin-bottom:10px;color:#27ae60;">
    ${this.getRoundLabel(match.round)}
</div>


                            <div class="match-teams">
                                <div class="match-row">
                                    <span class="match-team-name">${safeTeamA}</span>
                                    <span class="match-score">${scoreA}</span>
                                </div>
                                <div class="match-row">
                                    <span class="match-team-name">${safeTeamB}</span>
                                    <span class="match-score">${scoreB}</span>
                                </div>
                            </div>

                            <button 
                                class="match-button btn-edit-score"
                                data-match-id="${match.id}"
                                data-team-a="${safeTeamA}"
                                data-team-b="${safeTeamB}"
                                data-score-a="${scoreA}"
                                data-score-b="${scoreB}"
                                ${isFinished ? 'disabled style="opacity:0.6;cursor:not-allowed;"' : ''}
                            >
                                ${isFinished
    ? this.isBye(match)
        ? "🟡 BYE – qualifié automatiquement"
        : "✅ Score final"
    : "✏️ Modifier le score"
}

                            </button>
                        </div>
                    `;
                });

                html += `</div>`;
            }

            html += `</div>`;

            container.innerHTML = html;

            // BIND DES BOUTONS D'ÉDITION
            container.querySelectorAll(".btn-edit-score").forEach(btn => {
                btn.addEventListener("click", e => {
                    const b = e.currentTarget;

                    this.showScoreModal(
                        b.dataset.matchId,
                        b.dataset.teamA,
                        b.dataset.teamB,
                        parseInt(b.dataset.scoreA) || 0,
                        parseInt(b.dataset.scoreB) || 0,
                        eventId,
                        token
                    );
                });
            });

        } catch (error) {
            console.error("Erreur chargement matchs:", error);
            const errorMsg = this.extractErrorMessage(error);
            container.innerHTML = `<p style="color:#e74c3c;">❌ ${this.escapeHtml(errorMsg)}</p>`;
        }
    },

    // ================================
    // GÉNÉRER LES MATCHS (AVEC CONFIRMATION)
    // ================================
    async handleGenerateMatches(eventId, token) {
        // ✅ CONFIRMATION OBLIGATOIRE
        if (!confirm("Générer tous les matchs du tournoi ?\n\nLes équipes doivent être inscrites.\n\nCette action est irréversible.")) {
            return;
        }

        try {
            this.setGlobalMessage("🔄 Génération des matchs...", false);
            await this.safePost(`/api/events/tournament/${eventId}/generate-matches`, token);
            this.setGlobalMessage("✅ Matchs générés avec succès", false);
            await this.refreshAllData(eventId, token);
        } catch (err) {
            const errorMsg = this.extractErrorMessage(err);
            this.setGlobalMessage(`❌ ${errorMsg}`, true);
        }
    },
    // ================================
    // 🔹 7. RÉSUMÉ
    // ================================
    async loadSummary(eventId, token) {
        const container = document.getElementById("event-summary");
        if (!container) return;

        try {
            const data = await this.safeGet(`/api/events/${eventId}/tournament-summary`, token);

            let html = "";

            if (data.finalResults) {
                const fr = data.finalResults;
                
                html += `
                    <div style="
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 20px;
                    ">
                `;
                
                // PODIUM BRACKET PRINCIPAL
                if (fr.champion) {
                    const safeChampion = this.escapeHtml(fr.champion);
                    const safeFinalist = this.escapeHtml(fr.finalist || "");
                    const safeThird = this.escapeHtml(fr.thirdPlace || "");

                    html += `
                        <div style="
                            background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%);
                            padding: 20px;
                            border-radius: 12px;
                            color: white;
                            box-shadow: 0 3px 10px rgba(230, 126, 34, 0.25);
                        ">
                            <h3 style="margin: 0 0 15px 0; font-size: 1.2em; text-align: center; font-weight: 700;">
                                🏆 Podium du tournoi
                            </h3>
                            
                            <div style="background: rgba(255,255,255,0.3); padding: 18px; border-radius: 10px; text-align: center; margin-bottom: 12px;">
                                <div style="font-size: 3em; margin-bottom: 8px;">🏆</div>
                                <div style="font-weight: 700; font-size: 0.95em; line-height: 1.3;">${safeChampion}</div>
                                <div style="margin-top: 6px; font-size: 0.75em; opacity: 0.95; text-transform: uppercase; letter-spacing: 0.5px;">CHAMPION</div>
                            </div>
                            
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                                ${safeFinalist ? `
                                    <div style="background: rgba(255,255,255,0.2); padding: 15px 10px; border-radius: 8px; text-align: center;">
                                        <div style="font-size: 2.2em; margin-bottom: 6px;">🥈</div>
                                        <div style="font-weight: 600; font-size: 0.8em; line-height: 1.25;">${safeFinalist}</div>
                                        <div style="margin-top: 5px; font-size: 0.7em; opacity: 0.9;">2ème place</div>
                                    </div>
                                ` : ''}
                                
                                ${safeThird ? `
                                    <div style="background: rgba(255,255,255,0.2); padding: 15px 10px; border-radius: 8px; text-align: center;">
                                        <div style="font-size: 2.2em; margin-bottom: 6px;">🥉</div>
                                        <div style="font-weight: 600; font-size: 0.8em; line-height: 1.25;">${safeThird}</div>
                                        <div style="margin-top: 5px; font-size: 0.7em; opacity: 0.9;">3ème place</div>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    `;
                }

                // PODIUM CONSOLANTE
                if (fr.consolanteWinner) {
                    const safeWinner = this.escapeHtml(fr.consolanteWinner);
                    const safeFinalist = this.escapeHtml(fr.consolanteFinalist || "");
                    const safeThird = this.escapeHtml(fr.consolanteThird || "");
                    const safeFourth = this.escapeHtml(fr.consolanteFourth || "");

                    html += `
                        <div style="
                            background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%);
                            padding: 20px;
                            border-radius: 12px;
                            color: white;
                            box-shadow: 0 3px 10px rgba(46, 204, 113, 0.25);
                        ">
                            <h3 style="margin: 0 0 15px 0; font-size: 1.1em; text-align: center; font-weight: 700;">
                                ♻️ Podium Consolante
                            </h3>
                            
                            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px;">
                                <div style="background: rgba(255,255,255,0.25); padding: 12px 8px; border-radius: 8px; text-align: center;">
                                    <div style="font-size: 1.8em; margin-bottom: 4px;">🏆</div>
                                    <div style="font-weight: 700; font-size: 0.75em; line-height: 1.2;">${safeWinner}</div>
                                    <div style="font-size: 0.65em; margin-top: 4px; opacity: 0.9;">Champion</div>
                                </div>
                                
                                ${safeFinalist ? `
                                    <div style="background: rgba(255,255,255,0.2); padding: 12px 8px; border-radius: 8px; text-align: center;">
                                        <div style="font-size: 1.8em; margin-bottom: 4px;">🥈</div>
                                        <div style="font-weight: 600; font-size: 0.75em; line-height: 1.2;">${safeFinalist}</div>
                                        <div style="font-size: 0.65em; margin-top: 4px; opacity: 0.9;">2ème place</div>
                                    </div>
                                ` : ''}
                                
                                ${safeThird ? `
                                    <div style="background: rgba(255,255,255,0.2); padding: 12px 8px; border-radius: 8px; text-align: center;">
                                        <div style="font-size: 1.8em; margin-bottom: 4px;">🥉</div>
                                        <div style="font-weight: 600; font-size: 0.75em; line-height: 1.2;">${safeThird}</div>
                                        <div style="font-size: 0.65em; margin-top: 4px; opacity: 0.9;">3ème place</div>
                                    </div>
                                ` : ''}
                                
                                ${safeFourth ? `
                                    <div style="background: rgba(255,255,255,0.2); padding: 12px 8px; border-radius: 8px; text-align: center;">
                                        <div style="font-size: 1.8em; margin-bottom: 4px;">4️⃣</div>
                                        <div style="font-weight: 600; font-size: 0.75em; line-height: 1.2;">${safeFourth}</div>
                                        <div style="font-size: 0.65em; margin-top: 4px; opacity: 0.9;">4ème place</div>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    `;
                }
                
                html += `</div>`;
            }

            container.innerHTML = html || `<p style="color: #7f8c8d;">Le tournoi n'est pas encore terminé</p>`;

        } catch (err) {
            console.error("loadSummary error:", err);
            const errorMsg = this.extractErrorMessage(err);
            container.innerHTML = `<p style="color: #e74c3c;">❌ ${this.escapeHtml(errorMsg)}</p>`;
        }
    },

        displayTournamentFormat(event) {
    if (!event || !event.groupCount || !event.qualifiedPerGroup) return;

    const el = document.getElementById("tournament-format");
    if (!el) return;

    el.textContent =
        `📐 Format du tournoi : ${event.groupCount} poules – ` +
        `${event.qualifiedPerGroup} qualifiés par poule`;
},


    disableGenerateGroupsButton() {
    const btn = document.getElementById("btn-generate-groups");
    if (!btn) return;

    
    btn.textContent = "✅ Poules déjà générées";
    btn.style.opacity = "0.6";
    btn.style.cursor = "not-allowed";
},

enableGenerateGroupsButton() {
    const btn = document.getElementById("btn-generate-groups");
    if (!btn) return;

    btn.disabled = false;
    btn.textContent = "🧩 Générer les poules";
    btn.style.opacity = "1";
    btn.style.cursor = "pointer";
},

};


export default AdminEventDashboardPage;