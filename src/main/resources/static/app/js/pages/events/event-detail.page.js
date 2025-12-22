// /static/app/js/pages/events/event-detail.page.js

import { Auth } from "../../auth.js";
import { Router } from "../../router.js";

/* ============================================================================
   RENDER PAGE
   ============================================================================ */
export async function render(params) {

    // Injecter CSS Live
    if (!document.querySelector('link[href="/css/event-live.css"]')) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "/css/event-live.css";
        document.head.appendChild(link);
    }
    
    // Injecter CSS si pas déjà là
    if (!document.querySelector('link[href="/css/event-detail.css"]')) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "/css/event-detail.css";
        document.head.appendChild(link);
    }

    const eventId = params.id;

    if (!eventId) {
        return `
            <div class="event-detail-page">
                <div class="error-container">
                    <i class="fas fa-exclamation-circle"></i>
                    <h2>Événement introuvable</h2>
                    <button class="btn-primary" onclick="history.back()">Retour</button>
                </div>
            </div>
        `;
    }

    // Charger l'événement
  // ========= VARIABLES ÉVÉNEMENT + TOURNOI =========
let event = null;
let isTournament = false;
let totalMatches = 0;
let totalGroups = 0;

// ========= CHARGER L'ÉVÉNEMENT =========
try {
    const res = await Auth.secureFetch(`/api/events/public/${eventId}`);
    const data = await res.json();

    if (!res.ok) throw new Error(data.message || "Événement introuvable");

    event = data.data;
    window.__EVENT__ = event;

    // ✅ FIX : Inclure CLUB_EVENT
    isTournament = event.type === "TOURNOI" || event.type === "TOURNAMENT" || event.type === "CLUB_EVENT";
    totalMatches = (event.matches && event.matches.length) || 0;
    totalGroups = event.groupsCount || 0;

} catch (err) {
        console.error("Erreur chargement événement:", err);
        return `
            <div class="event-detail-page">
                <div class="error-container">
                    <i class="fas fa-exclamation-circle"></i>
                    <h2>Erreur de chargement</h2>
                    <p>${err.message}</p>
                    <button class="btn-primary" onclick="history.back()">Retour</button>
                </div>
            </div>
        `;
    }

    // Déterminer le rôle utilisateur
    const currentUser = Auth.currentUser;
    const isOrganizer = currentUser && event.organizerId === currentUser.id;
    const isAuthenticated = Auth.accessToken !== null;

    // Icônes
    const icons = {
        MATCH: "fa-futbol",
        TOURNAMENT: "fa-trophy",
        TRAINING: "fa-dumbbell",
        COMPETITION: "fa-medal",
    };

    // Date
    const eventDate = new Date(event.date);
    const formattedDate = eventDate.toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
    });
    const formattedTime = eventDate.toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
    });

    const registrationStatus = event.currentRegistrationStatus;
    const isRegistered =
    event.registrationType === "INDIVIDUAL"
        ? registrationStatus != null
        : false;


    return `
    <div class="event-detail-page">
        <!-- HEADER -->
        <header class="event-detail-header">
            <button class="back-btn" id="backBtn">
                <i class="fas fa-arrow-left"></i>
            </button>
            <h1>Détail</h1>
            ${
                isOrganizer
                    ? `
            <button class="menu-btn" id="menuBtn">
                <i class="fas fa-ellipsis-v"></i>
            </button>`
                    : `<div style="width: 40px;"></div>`
            }
        </header>

        <div class="event-detail-content">
            
            <!-- BANNIÈRE -->
            <div class="event-banner">
                <div class="event-banner-icon">
                    <i class="fas ${icons[event.type]}"></i>
                </div>
                <div class="event-banner-gradient"></div>
            </div>

            <!-- TITRE -->
            <div class="event-title-section">
                <h2 class="event-title">${event.name}</h2>
                <span class="event-type-badge badge-${event.type}">
                    <i class="fas ${icons[event.type]}"></i>
                    ${event.type}
                </span>
            </div>

            <!-- INFOS -->
            <div class="event-info-card">
                <div class="info-item">
                    <div class="info-icon">
                        <i class="fas ${
                            event.registrationType === "CLUB_ONLY"
                                ? "fa-shield-alt"
                                : "fa-users"
                        }"></i>
                    </div>

                    <div class="info-content">
                        <span class="info-label ${
                            event.registrationType === "CLUB_ONLY" ? "club" : ""
                        }">
                            ${event.registrationType === "CLUB_ONLY"
                                ? "Équipes"
                                : "Participants"}
                        </span>
                        <span class="info-value">
                            <strong>
                                ${
                                    event.registrationType === "CLUB_ONLY"
                                        ? event.teamsRegisteredByMyClub
                                        : event.acceptedParticipants ?? 0
                                }
                            </strong>
                            /
                            ${
                                event.registrationType === "CLUB_ONLY"
                                    ? event.maxTeamsPerClub ?? "∞"
                                    : event.maxParticipants ?? "∞"
                            }
                        </span>
                    </div>
                </div>

                <div class="info-item">
                    <div class="info-icon">
                        <i class="fas fa-map-marker-alt"></i>
                    </div>
                    <div class="info-content">
                        <span class="info-label">Lieu</span>
                        <span class="info-value">${event.location}</span>
                    </div>
                </div>

                ${
                    event.registrationType === "INDIVIDUAL"
                        ? `
                <div class="info-item">
                    <div class="info-icon">
                        <i class="fas fa-flag"></i>
                    </div>
                    <div class="info-content">
                        <span class="info-label">
                            ${event.registrationType === "CLUB_ONLY" ? "Équipes" : "Participants"}
                        </span>
                    </div>
                </div>`
                        : ""
                }
            </div>

            <!-- DESCRIPTION -->
            ${
                event.description
                    ? `
            <div class="event-section">
                <h3 class="section-title">
                    <i class="fas fa-align-left"></i>
                    Description
                </h3>
                <p class="event-description">${event.description}</p>
            </div>`
                    : ""
            }

            ${isTournament ? `
<!-- ========= TOURNOI – VUE SPECTATEUR LIVE ========= -->
<div class="event-section tournament-section">
    <h3 class="section-title">
        <i class="fas fa-trophy"></i>
        ${isOrganizer || currentUser?.clubId ? 'Gestion du tournoi' : 'Suivi du tournoi en direct'}
    </h3>

    <!-- ✅ UNIQUEMENT POUR CLUBS / ORGANISATEURS -->
    ${(isOrganizer || currentUser?.clubId) ? `
        <div class="tournament-actions" style="margin-bottom: 20px;">
            <button class="btn-secondary" id="viewGroupsBtn" data-event-id="${event.id}">
                <i class="fas fa-layer-group"></i>
                Voir les groupes
            </button>
            <button class="btn-secondary" id="viewAllMatchesBtn" data-event-id="${event.id}">
                <i class="fas fa-calendar-day"></i>
                Tous les matchs
            </button>
            ${isOrganizer ? `
                <button class="btn-primary" onclick="location.href='/tournament/${event.id}/dashboard'" style="background: #10b981;">
                    <i class="fas fa-cog"></i>
                    Tableau de bord
                </button>
            ` : ''}
        </div>

        ${event.maxTeamsPerClub !== null ? `
            <div class="club-quota-section" style="margin-bottom: 20px; padding: 15px; background: #f0f9ff; border-radius: 8px; border-left: 4px solid #3b82f6;">
                <h4 style="margin: 0 0 8px 0; color: #1f2937;">📊 Quota de mon club</h4>
                <p style="margin: 0; color: #4b5563;">
                    ${event.teamsRegisteredByMyClub} / ${event.maxTeamsPerClub} équipes inscrites
                    <br><strong>Restant :</strong> <span style="color: #10b981; font-weight: 700;">${event.remainingTeamsForMyClub}</span>
                </p>
            </div>
        ` : ''}
    ` : ''}

    <!-- 🔴 MATCHS EN DIRECT (POUR TOUS) -->
    <div class="live-matches-section">
        <h4>
            <span class="live-indicator">🔴 EN DIRECT</span>
        </h4>
        <div id="liveMatchesContainer">
            <div class="loader-small">
                <i class="fas fa-spinner fa-spin"></i>
                Chargement des matchs...
            </div>
        </div>
    </div>

    <!-- 📊 CLASSEMENTS -->
    <div class="rankings-section">
        <h4>📊 Classements des poules</h4>
        <div id="rankingsContainer">
            <div class="loader-small">
                <i class="fas fa-spinner fa-spin"></i>
                Chargement des classements...
            </div>
        </div>
    </div>

    <!-- 🏆 PHASE FINALE -->
    <div class="bracket-section">
        <h4>🏆 Phase finale</h4>
        <div id="bracketContainer">
            <div class="loader-small">
                <i class="fas fa-spinner fa-spin"></i>
                Chargement du bracket...
            </div>
        </div>
    </div>

    <!-- 📰 FIL D'ACTUALITÉ -->
    <div class="live-feed-section">
        <h4>📰 Dernières actualités</h4>
        <div id="liveFeedContainer">
            <div class="empty-state-live">
                <i class="fas fa-newspaper"></i>
                <p>Le fil d'actualité sera disponible prochainement</p>
            </div>
        </div>
    </div>
</div>
` : ""}

            <!-- SECTION RÔLES -->
            ${renderRoleSection(
                event,
                isOrganizer,
                isRegistered,
                registrationStatus,
                isAuthenticated
            )}

        </div>

      

        <!-- MODAL INSCRIPTION UTF -->
        <div id="registrationModal" class="utf-modal hidden">
            <div class="utf-modal-overlay"></div>
            <div class="utf-modal-box">
                <h2>Inscription à l'événement</h2>

                <div class="form-group">
                    <label>Niveau</label>
                    <select id="reg-level">
                        <option value="BEGINNER">Débutant</option>
                        <option value="INTERMEDIATE">Intermédiaire</option>
                        <option value="ADVANCED">Avancé</option>
                        <option value="EXPERT">Expert</option>
                    </select>
                </div>

                <div class="form-group">
                    <label>Poste préféré</label>
                    <select id="reg-position">
                        <option value="GOALKEEPER">Gardien</option>
                        <option value="DEFENDER">Défenseur</option>
                        <option value="MIDFIELDER">Milieu</option>
                        <option value="FORWARD">Attaquant</option>
                    </select>
                </div>

                <div class="form-group">
                    <label>Notes</label>
                    <textarea id="reg-notes" maxlength="500"></textarea>
                </div>

                <div class="modal-actions">
                    <button id="cancelModal" class="btn-secondary">Annuler</button>
                    <button id="confirmRegistration" class="btn-primary">Valider</button>
                </div>
            </div>
        </div>

        <!-- MODAL INSCRIPTION CLUB -->
        <div id="clubRegistrationModal" class="utf-modal hidden">
            <div class="utf-modal-overlay"></div>
            <div class="utf-modal-box">
                <h2>Inscrire mon club</h2>

                <!-- INFOS QUOTA -->
                ${event.maxTeamsPerClub !== null ? `
                <div class="club-quota-info">
                    <p>🏟️ Quota par club : <strong>${event.maxTeamsPerClub}</strong></p>
                    <p>✅ Déjà inscrites : <strong>${event.teamsRegisteredByMyClub}</strong></p>
                    <p>🟢 Restantes : <strong>${event.remainingTeamsForMyClub}</strong></p>
                </div>
                ` : `
                <div class="club-quota-info">
                    <p>♾️ Nombre d'équipes illimité</p>
                </div>
                `}

                <!-- LISTE DES ÉQUIPES -->
                <div class="form-group">
                    <label>Nombre d'équipes à inscrire</label>
                    <select id="teamCountSelect"></select>
                    <small class="help">Puis sélectionne les équipes ci-dessous</small>
                </div>

                <div class="form-group">
                    <label>Choisissez vos équipes *</label>
                    <div id="club-teams-checkboxes" class="teams-checkbox-list">
                        <p>Chargement des équipes…</p>
                    </div>
                </div>

                <div class="modal-actions">
                    <button id="cancelClubModal" class="btn-secondary">Annuler</button>
                    <button id="confirmClubRegistration" class="btn-primary">
                        Inscrire les équipes
                    </button>
                </div>
            </div>
        </div>

        <div id="toast" class="toast"></div>

          ${renderActionButton(
        event,
        isOrganizer,
        isRegistered,
        registrationStatus,
        isAuthenticated
    )}
    </div>
    `;
}

/* ============================================================================
   SECTION RÔLES
   ============================================================================ */
function renderRoleSection(
    event,
    isOrganizer,
    isRegistered,
    registrationStatus,
    isAuthenticated
) {
    // Bloc équipes formées (UTF)
    const formedTeamsHTML = event.teamsFormed
        ? `
        <div class="formed-teams-section" id="formedTeamsSection">
            <h3 class="section-title">
                <i class="fas fa-users-line"></i>
                Équipes formées
            </h3>
            <div id="formedTeamsLoader" style="display:flex;justify-content:center;padding:2rem;">
                <i class="fas fa-spinner fa-spin" style="font-size:2rem;color:var(--primary);"></i>
            </div>
            <div id="formedTeamsContainer"></div>
        </div>`
        : "";

    // Bloc clubs inscrits (SPOND) – seulement pour organisateur + tournois
    const clubsSectionHTML = isOrganizer && event.type === "TOURNOI"
        ? `
        <div class="event-section organizer-section">
            <h3 class="section-title">
                <i class="fas fa-users"></i>
                Clubs inscrits
            </h3>

            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon pending"><i class="fas fa-clock"></i></div>
                    <div class="stat-info"><span id="clubsPendingCount">-</span><span>En attente</span></div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon validated"><i class="fas fa-check"></i></div>
                    <div class="stat-info"><span id="clubsValidatedCount">-</span><span>Validés</span></div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon total"><i class="fas fa-building"></i></div>
                    <div class="stat-info"><span id="clubsTotalCount">-</span><span>Total</span></div>
                </div>
            </div>

            <button class="action-btn primary" id="viewClubsBtn">
                <i class="fas fa-list"></i> Gérer les clubs
            </button>

            <div id="clubsLoader" style="display:none;text-align:center;padding:2rem;">
                <i class="fas fa-spinner fa-spin" style="font-size:2rem;color:var(--primary);"></i>
            </div>

            <div id="clubsList"></div>
        </div>`
        : "";

   // ───────── ORGANISATEUR ─────────
if (isOrganizer) {
    return `
    <div class="event-section organizer-section">
        <h3 class="section-title">
            <i class="fas fa-crown"></i>
            Actions organisateur
        </h3>
        
        <!-- Clôture inscriptions (action rapide) -->
        <div class="registration-management-section">

            ${event.isFull ? `
                <!-- 🔴 ÉVÉNEMENT COMPLET -->
                <div class="alert alert-danger">
                    <i class="fas fa-users-slash"></i>
                    Événement complet (quota atteint)
                </div>
                <p style="font-size: 0.9em; color: #6b7280;">
                    Les inscriptions sont bloquées automatiquement.
                </p>

            ` : event.registrationClosed ? `
                <!-- 🟠 FERMÉ MANUELLEMENT -->
                <div class="alert alert-warning">
                    <i class="fas fa-lock"></i>
                    Inscriptions fermées par l’organisateur
                </div>
                <button class="action-btn success" id="reopenRegistrationsBtn">
                    <i class="fas fa-lock-open"></i>
                    Rouvrir les inscriptions
                </button>

            ` : `
                <!-- 🟢 OUVERT -->
                <div class="alert alert-success">
                    <i class="fas fa-lock-open"></i>
                    Inscriptions ouvertes
                </div>
                <button class="action-btn danger" id="closeRegistrationsBtn">
                    <i class="fas fa-lock"></i>
                    Clôturer les inscriptions
                </button>
            `}
        </div>
        
        <!-- Stats rapides -->
        <div class="stats-grid" style="margin: 20px 0;">
            <div class="stat-card">
                <span id="pendingCount">-</span>
                <span>En attente</span>
            </div>
            <div class="stat-card">
                <span id="validatedCount">-</span>
                <span>Validés</span>
            </div>
        </div>
        
        <!-- BOUTON PRINCIPAL VERS DASHBOARD -->
        <button class="action-btn primary"
                onclick="location.href='/tournament/${event.id}/dashboard'"
                style="width: 100%; padding: 15px; font-size: 1.1em;">
            <i class="fas fa-cog"></i>
            Tableau de bord du tournoi
        </button>
    </div>`;
}


    // ───────── JOUEUR INSCRIT ─────────
    if (isRegistered) {
        const statusConfig = {
            EN_ATTENTE: { icon: "clock", color: "warning", text: "En attente de validation" },
            PENDING: { icon: "clock", color: "warning", text: "En attente de validation" },
            VALIDE: { icon: "check-circle", color: "success", text: "Inscription validée" },
            VALIDATED: { icon: "check-circle", color: "success", text: "Inscription validée" },
            ANNULE: { icon: "times-circle", color: "danger", text: "Inscription annulée" },
            CANCELLED: { icon: "times-circle", color: "danger", text: "Inscription annulée" }
        };

        const status = statusConfig[registrationStatus] || statusConfig["PENDING"];

        return `
        <div class="event-section player-section">
            <h3 class="section-title">
                <i class="fas fa-user-check"></i>
                Mon inscription
            </h3>

            <div class="status-card ${status.color}">
                <div class="status-icon">
                    <i class="fas fa-${status.icon}"></i>
                </div>
                <div class="status-content">
                    <span class="status-label">Statut</span>
                    <span class="status-text">${status.text}</span>
                </div>
            </div>

            ${formedTeamsHTML}
        </div>`;
    }

    // ───────── VISITEUR CONNECTÉ ─────────
    if (isAuthenticated) {
        return `
        <div class="event-section visitor-section">
            <div class="cta-card">
                <div class="cta-icon"><i class="fas fa-user-plus"></i></div>
                <h3>Rejoignez cet événement !</h3>
                <p>Inscrivez-vous pour participer.</p>
            </div>
            ${formedTeamsHTML}
        </div>`;
    }

    // ───────── NON CONNECTÉ ─────────
    return `
    <div class="event-section visitor-section">
        <div class="cta-card">
            <div class="cta-icon"><i class="fas fa-lock"></i></div>
            <h3>Connectez-vous pour participer</h3>
            <p>Créez un compte ou connectez-vous.</p>
            <button class="btn-primary" onclick="location.href='/login'">Se connecter</button>
        </div>
    </div>`;
}

/* ============================================================================
   BOUTON FLOTTANT
   ============================================================================ */
function renderActionButton(
    event,
    isOrganizer,
    isRegistered,
    registrationStatus,
    isAuthenticated
) {
    // ❌ Pas de bouton pour :
    if (!isAuthenticated || isOrganizer || isRegistered) return "";

    const currentUser = Auth.currentUser;
    const isClubEvent = event.registrationType === "CLUB_ONLY";
    const hasClub = !!currentUser?.clubId;

   // 🔒 ÉVÉNEMENT CLUB
if (isClubEvent) {

    // ⛔ PRIORITÉ ABSOLUE : inscriptions fermées ou event complet
    if (event.registrationClosed || event.isFull) {
        return ""; // RIEN, pas de bouton, pas de badge rouge
    }

    // ⏳ Équipes déjà en attente
    if (event.pendingTeamsByMyClub > 0) {
        return `
        <div class="floating-info-badge pending">
            <i class="fas fa-clock"></i>
            <span>
                ${event.pendingTeamsByMyClub} équipe${event.pendingTeamsByMyClub > 1 ? 's' : ''}
                en attente de validation
            </span>
        </div>`;
    }

    // 📛 Quota atteint pour CE club
    const quotaReached =
        event.maxTeamsPerClub !== null &&
        event.remainingTeamsForMyClub === 0;

    if (hasClub && !quotaReached) {
        return `
        <button class="floating-action-btn" id="registerMyTeamBtn">
            <i class="fas fa-shield"></i>
            <span>Inscrire mon équipe</span>
        </button>`;
    }

    return "";
}


    // 🌍 ÉVÉNEMENT OUVERT (INDIVIDUAL)
    if (event.registrationClosed || event.isFull) {
        return `
        <div class="floating-info-badge closed">
            <i class="fas fa-lock"></i>
            <span>
                ${event.registrationClosed 
                    ? "Inscriptions fermées" 
                    : "Événement complet"}
            </span>
        </div>`;
    }

    return `
    <button class="floating-action-btn" id="registerBtn">
        <i class="fas fa-user-plus"></i>
        <span>S'inscrire</span>
    </button>`;
}

/* ============================================================================
   INIT PAGE
   ============================================================================ */
export function init(params) {


      let lastLiveMatchesJSON = null;
    // ✅ APPLIQUER LA CLASSE CSS AU BODY (FIX LAYOUT)
    document.body.className = '';
    document.body.classList.add('is-event-detail-page');
    
    const event = window.__EVENT__;
    if (!event) return;

    const eventId = params.id;
    const toast = document.getElementById("toast");

    // ================================
    // 🔒 Helpers anti double-inscription (front)
    // ================================
    

    

    /* Toast helper */
    function showToast(message, type = "info") {
        toast.textContent = message;
        toast.className = "toast show";

        if (type === "success") toast.style.background = "#10B981";
        if (type === "error") toast.style.background = "#ef4444";
        if (type === "warning") toast.style.background = "#f59e0b";

        setTimeout(() => toast.classList.remove("show"), 3000);
    }

    /* Bouton retour */
    const backBtn = document.getElementById("backBtn");
    if (backBtn) {
        backBtn.addEventListener("click", () => history.back());
    }

    // ========================================
    // 🔴 CHARGEMENT AUTOMATIQUE POUR LES TOURNOIS
    // ========================================
 const isTournament = event.type === "TOURNOI" || event.type === "TOURNAMENT" || event.type === "CLUB_EVENT";
    
   if (isTournament) {

    // Charger immédiatement
    loadLiveData(eventId);

    // Auto-refresh toutes les 30 secondes
    const refreshInterval = setInterval(() => {

        // 💤 Si l'onglet n'est pas actif, on ne fait rien
        if (document.hidden) return;

        loadLiveData(eventId);

    }, 30000);

    // Nettoyage propre quand on quitte la page
    window.addEventListener("beforeunload", () => {
        clearInterval(refreshInterval);
    });
}


    /* BOUTON INSCRIPTION */
    const registerBtn = document.getElementById("registerBtn");

    if (registerBtn && event.registrationType === "INDIVIDUAL") {
        const modal = document.getElementById("registrationModal");
        const cancelBtn = modal.querySelector("#cancelModal");
        const submitBtn = modal.querySelector("#confirmRegistration");

        registerBtn.addEventListener("click", () => {
            modal.classList.remove("hidden");
        });

        cancelBtn.addEventListener("click", () => {
            modal.classList.add("hidden");
        });

        modal.addEventListener("click", (e) => {
            if (e.target === modal) modal.classList.add("hidden");
        });

        submitBtn.addEventListener("click", async () => {
            // logique inscription UTF
        });
    }

    /* BOUTON INSCRIPTION CLUB */
    const registerMyTeamBtn = document.getElementById("registerMyTeamBtn");

    if (registerMyTeamBtn) {
        const modal = document.getElementById("clubRegistrationModal");
        const cancelClubBtn = modal.querySelector("#cancelClubModal");
        const confirmClubBtn = modal.querySelector("#confirmClubRegistration");
        const teamsContainer = modal.querySelector("#club-teams-checkboxes");
        const teamCountSelect = modal.querySelector("#teamCountSelect");
        const overlay = modal.querySelector(".utf-modal-overlay");

        overlay.addEventListener("click", () => {
            modal.classList.add("hidden");
        });

        const maxSelectable =
            event.maxTeamsPerClub !== null
                ? event.remainingTeamsForMyClub
                : Infinity;

        async function loadClubTeams() {
            const clubId = Auth.currentUser?.clubId;
            teamsContainer.innerHTML = "";
            teamCountSelect.innerHTML = "";

            if (!clubId) {
                teamsContainer.innerHTML = "<p>Aucun club associé</p>";
                confirmClubBtn.disabled = true;
                return;
            }

            try {
                const res = await Auth.secureFetch(`/api/teams/club/${clubId}`);
                const result = await res.json();

                if (!res.ok || !result.success) throw new Error(result.message || "Erreur");

                const teams = result.data || [];
                if (teams.length === 0) {
                    teamsContainer.innerHTML = "<p>Aucune équipe disponible</p>";
                    confirmClubBtn.disabled = true;
                    return;
                }

                // quota
                const maxSelectable = event.maxTeamsPerClub !== null
                    ? event.remainingTeamsForMyClub
                    : teams.length;

                // remplir le select 1..maxSelectable
                const maxOptions = Math.max(1, Math.min(maxSelectable, teams.length));
                for (let i = 1; i <= maxOptions; i++) {
                    const opt = document.createElement("option");
                    opt.value = String(i);
                    opt.textContent = `${i} équipe${i > 1 ? "s" : ""}`;
                    teamCountSelect.appendChild(opt);
                }

                // default = max
                teamCountSelect.value = String(maxOptions);

                const registeredSet = new Set(); // TEMPORAIRE


                // render checkboxes
                teams.forEach(team => {
                    const alreadyRegistered = registeredSet.has(team.id);

                    teamsContainer.innerHTML += `
                        <label class="team-checkbox" style="display:flex;align-items:center;gap:10px;opacity:${alreadyRegistered ? "0.55" : "1"}">
                            <input
                                type="checkbox"
                                class="team-check"
                                value="${team.id}"
                                ${alreadyRegistered ? "disabled" : ""}
                            >
                            <span>
                                ${team.name} (${team.category})
                                ${alreadyRegistered ? `<small style="margin-left:8px;color:#ef4444;">(déjà inscrite)</small>` : ""}
                            </span>
                        </label>
                    `;
                });

                // un seul handler (écrase l'ancien)
                teamsContainer.onchange = (e) => {
                    const limit = parseInt(teamCountSelect.value, 10);
                    const checked = teamsContainer.querySelectorAll(".team-check:checked").length;

                    if (checked > limit) {
                        e.target.checked = false;
                        alert(`Tu ne peux sélectionner que ${limit} équipe(s).`);
                    }
                };

                // si l'utilisateur change le select, on désélectionne en trop
                teamCountSelect.onchange = () => {
                    const limit = parseInt(teamCountSelect.value, 10);
                    const checkedBoxes = [...teamsContainer.querySelectorAll(".team-check:checked")];
                    while (checkedBoxes.length > limit) {
                        const cb = checkedBoxes.pop();
                        cb.checked = false;
                    }
                };

                confirmClubBtn.disabled = false;

            } catch (err) {
                console.error("Erreur chargement équipes:", err);
                teamsContainer.innerHTML = "<p>Erreur de chargement</p>";
                confirmClubBtn.disabled = true;
            }
        }

        registerMyTeamBtn.addEventListener("click", () => {
            // 🔐 Micro-sécurité UX : quota atteint
            if (
                event.maxTeamsPerClub !== null &&
                event.remainingTeamsForMyClub === 0
            ) {
                showToast("Quota d'équipes atteint pour votre club", "warning");
                return;
            }

            modal.classList.remove("hidden");
            loadClubTeams();
        });

        cancelClubBtn.addEventListener("click", () => {
            modal.classList.add("hidden");
        });

        modal.addEventListener("click", (e) => {
            if (e.target === modal) modal.classList.add("hidden");
        });

        confirmClubBtn.addEventListener("click", async () => {
            const selectedTeams = [
                ...modal.querySelectorAll(".team-check:checked")
            ].map(cb => parseInt(cb.value));

            if (selectedTeams.length === 0) {
                showToast("⚠️ Sélectionnez au moins une équipe", "warning");
                return;
            }

            let registeredSet = new Set(); // backend = source de vérité


            const toRegister = selectedTeams;


            confirmClubBtn.disabled = true;
            confirmClubBtn.innerHTML =
                '<i class="fas fa-spinner fa-spin"></i> Inscription...';

            try {
                let successCount = 0;
                for (const teamId of toRegister) {
                    const res = await Auth.secureFetch(
                        `/api/events/registration/${eventId}/register-team`,
                        {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ teamId })
                        }
                    );

                    const result = await res.json();

                    // ✅ succès
                    if (res.ok) {
    successCount++;
    continue;
}


                    // ⚠️ déjà inscrit (sécurité backend)
                    if (res.status === 409) {
                        
                        showToast(
                            "⚠️ Une équipe était déjà inscrite",
                            "warning"
                        );
                        continue;
                    }

                    // ❌ autre erreur
                    throw new Error(result.message || "Erreur inscription");
                }

               if (successCount > 0) {
    showToast(
        `✅ ${successCount} équipe(s) inscrite(s) (en attente de validation)`,
        "success"
    );
    modal.classList.add("hidden");
    setTimeout(() => Router.go(`/events/${eventId}`), 800);
} else {
    showToast(
        "⛔ Aucune équipe n’a été inscrite (quota atteint ou déjà inscrite)",
        "error"
    );
}


                setTimeout(() => Router.go(`/events/${eventId}`), 800);

            } catch (err) {
                showToast("❌ " + err.message, "error");
            } finally {
                confirmClubBtn.disabled = false;
                confirmClubBtn.innerHTML = "Inscrire les équipes";
            }
        });
    }

    /* ORGANISATEUR : charger stats */
    const viewRegistrationsBtn = document.getElementById("viewRegistrationsBtn");
    if (viewRegistrationsBtn) {
        loadRegistrationsStats(eventId);

        viewRegistrationsBtn.addEventListener("click", () => {
            loadRegistrationsList(eventId);
        });
    }

    /* Bouton formation équipes */
    const formTeamsBtn = document.getElementById("formTeamsBtn");
    if (formTeamsBtn) {
        formTeamsBtn.addEventListener("click", () => {
            showTeamFormationModal(eventId);
        });
    }

    /* SI ÉQUIPES FORMÉES : CHARGER AUTOMATIQUEMENT */
    const formedTeamsSection = document.getElementById("formedTeamsSection");
    if (formedTeamsSection) {
        loadFormedTeams(eventId);
    }

    // ========= BOUTON "VOIR LES GROUPES" =========
    const viewGroupsBtn = document.getElementById("viewGroupsBtn");
    if (viewGroupsBtn) {
        viewGroupsBtn.addEventListener("click", () => {
            const eventId = viewGroupsBtn.dataset.eventId;
            const clubId = Auth.currentUser?.clubId || 1;
            Router.go(`/clubs/${clubId}/events/${eventId}/groups`);
        });
    }

    // ========= BOUTON "TOUS LES MATCHS" =========
    const viewAllMatchesBtn = document.getElementById("viewAllMatchesBtn");
    if (viewAllMatchesBtn) {
        viewAllMatchesBtn.addEventListener("click", () => {
            const eventId = viewAllMatchesBtn.dataset.eventId;
            console.log("Tous les matchs pour l'event", eventId);
        });
    }

    // ========================================
    // 🔴 FONCTION PRINCIPALE : CHARGER TOUTES LES DONNÉES LIVE
    // ========================================
    async function loadLiveData(eventId) {
    try {
        await Promise.allSettled([
            loadLiveMatches(eventId),
            loadRankings(eventId),
            loadBracket(eventId),
            loadLiveFeed(eventId) // 🆕 AJOUT
        ]);
    } catch (err) {
        console.error("Erreur chargement données live:", err);
    }
}

    // ========================================
    // 🔴 CHARGER LES MATCHS EN DIRECT
    // ========================================
  async function loadLiveMatches(eventId) {
    const container = document.getElementById("liveMatchesContainer");
    if (!container) return;

    try {
        const res = await Auth.secureFetch(`/api/events/${eventId}/matches`);
        const data = await res.json();
        if (!res.ok) throw new Error();

        const allMatches = data.data || [];
        const liveMatches = allMatches.filter(m =>
            m.status === "IN_PROGRESS" ||
            m.status === "LIVE" ||
            m.status === "ONGOING"
        );

        const newJSON = JSON.stringify(liveMatches);

        // ✅ RIEN N'A CHANGÉ → ON SORT
        if (newJSON === lastLiveMatchesJSON) return;

        lastLiveMatchesJSON = newJSON;

        if (liveMatches.length === 0) {
            container.innerHTML = `
                <div class="empty-state-live">
                    <i class="fas fa-futbol"></i>
                    <p>Aucun match en cours actuellement</p>
                </div>
            `;
            return;
        }

       container.innerHTML = liveMatches.map(match => `
    <div class="live-match-card">
        <div class="live-match-header">
            <span class="live-match-round">
                ${match.round || "Match"}
            </span>
            <span class="live-match-time">
                ${match.elapsedMinutes ?? 45}'
            </span>
        </div>
        <div class="live-match-score">
            ${match.scoreTeamA ?? 0} - ${match.scoreTeamB ?? 0}
        </div>
    </div>
`).join("");


    } catch (err) {
        console.error(err);
    }
}


    // ========================================
    // 📊 CHARGER LES CLASSEMENTS
    // ========================================
async function loadRankings(eventId) {
    const container = document.getElementById("rankingsContainer");
    if (!container) return;

    try {
        const res = await Auth.secureFetch(`/api/events/tournament/${eventId}/group-rankings`);
        
        // ✅ Si 500, affiche un message clair
        if (res.status === 500) {
            console.error("Erreur serveur 500 sur group-rankings");
            container.innerHTML = `
                <div class="empty-state-live">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Les classements ne sont pas encore disponibles</p>
                    <small style="opacity: 0.6;">Erreur serveur - contactez l'administrateur</small>
                </div>
            `;
            return;
        }
        
        const data = await res.json();
        
        if (!res.ok) throw new Error("Erreur chargement classements");

        const rankingsObj = data.data || {};
        const groupIds = Object.keys(rankingsObj);

        if (groupIds.length === 0) {
            container.innerHTML = `
                <div class="empty-state-live">
                    <i class="fas fa-list-ol"></i>
                    <p>Les classements seront disponibles après les premiers matchs</p>
                </div>
            `;
            return;
        }

        container.innerHTML = groupIds.map(groupId => {
            const teams = rankingsObj[groupId];
            
            return `
                <div class="ranking-group">
                    <div class="ranking-group-header">
                        Groupe ${groupId}
                    </div>
                    <table class="ranking-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Équipe</th>
                                <th>Pts</th>
                                <th>J</th>
                                <th>G</th>
                                <th>N</th>
                                <th>P</th>
                                <th>+/-</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${teams.map((team, index) => `
                                <tr>
                                    <td class="ranking-position ${index < 2 ? 'qualified' : ''}">${index + 1}</td>
                                    <td class="ranking-team-name">${team.teamName || team.name}</td>
                                    <td class="ranking-points">${team.points ?? 0}</td>
                                    <td>${team.played ?? 0}</td>
                                    <td>${team.won ?? 0}</td>
                                    <td>${team.draw ?? 0}</td>
                                    <td>${team.lost ?? 0}</td>
                                    <td>${team.goalDifference ?? 0}</td>
                                </tr>
                            `).join("")}
                        </tbody>
                    </table>
                </div>
            `;
        }).join("");

    } catch (err) {
        console.error("Erreur loadRankings:", err);
        container.innerHTML = `
            <div class="empty-state-live">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Erreur de chargement des classements</p>
            </div>
        `;
    }
}

    // ========================================
    // 🏆 CHARGER LE BRACKET
    // ========================================
    async function loadBracket(eventId) {
        const container = document.getElementById("bracketContainer");
        if (!container) return;

        try {
            // Charger bracket principal + consolante
            const [bracketRes, consolanteRes] = await Promise.allSettled([
                Auth.secureFetch(`/api/events/${eventId}/bracket`),
                Auth.secureFetch(`/api/events/${eventId}/consolante`)
            ]);

            let allMatches = [];

            if (bracketRes.status === "fulfilled" && bracketRes.value.ok) {
                const bracketData = await bracketRes.value.json();
                const bracket = bracketData.data || bracketData || [];
                allMatches.push(...bracket.map(m => ({...m, type: 'principal'})));
            }

            if (consolanteRes.status === "fulfilled" && consolanteRes.value.ok) {
                const consolanteData = await consolanteRes.value.json();
                const consolante = consolanteData.data || consolanteData || [];
                allMatches.push(...consolante.map(m => ({...m, type: 'consolante'})));
            }

            if (allMatches.length === 0) {
                container.innerHTML = `
                    <div class="empty-state-live">
                        <i class="fas fa-trophy"></i>
                        <p>La phase finale débutera après les poules</p>
                    </div>
                `;
                return;
            }

            // Regrouper par round
            const rounds = {};
            allMatches.forEach(m => {
                const roundName = m.round || "Phase";
                if (!rounds[roundName]) rounds[roundName] = [];
                rounds[roundName].push(m);
            });

            // Ordre d'affichage
            const roundOrder = ['QF1', 'QF2', 'QF3', 'QF4', 'SF1', 'SF2', '3RD_PLACE', 'FINAL', 
                               'CQF1', 'CQF2', 'CQF3', 'CQF4', 'CSF1', 'CSF2', 'C3RD_PLACE', 'CFINAL'];
// ✅ Dédupliquer les matchs par ID
const uniqueRounds = {};
roundOrder.filter(r => rounds[r]).forEach(roundName => {
    const seen = new Set();
    uniqueRounds[roundName] = rounds[roundName].filter(match => {
        if (seen.has(match.id)) return false;
        seen.add(match.id);
        return true;
    });
});

container.innerHTML = Object.keys(uniqueRounds).map(roundName => {
    const roundLabel = getRoundLabel(roundName);
    const isConsolante = roundName.startsWith('C');

    return `
        <div class="bracket-round">
            <div class="bracket-round-header">
                ${isConsolante ? '♻️' : '🏆'} ${roundLabel}
            </div>
            ${uniqueRounds[roundName].map(match => `
                <div class="bracket-match">
                    <div class="bracket-match-teams">
                        <div class="bracket-team ${(match.scoreA || 0) > (match.scoreB || 0) ? 'winner' : ''}">
                            <span class="bracket-team-name">${match.teamA || "?"}</span>
                            <span class="bracket-team-score">${match.scoreA ?? "-"}</span>
                        </div>
                        <div class="bracket-team ${(match.scoreB || 0) > (match.scoreA || 0) ? 'winner' : ''}">
                            <span class="bracket-team-name">${match.teamB || "?"}</span>
                            <span class="bracket-team-score">${match.scoreB ?? "-"}</span>
                        </div>
                    </div>
                </div>
            `).join("")}
        </div>
    `;
}).join("");

        } catch (err) {
            console.error("Erreur loadBracket:", err);
            container.innerHTML = `
                <div class="empty-state-live">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Erreur de chargement du bracket</p>
                </div>
            `;
        }
    }



    // ========================================
// 📰 CHARGER LE FIL D'ACTUALITÉ
// ========================================
async function loadLiveFeed(eventId) {
    const container = document.getElementById("liveFeedContainer");
    if (!container) return;

    try {
        const res = await Auth.secureFetch(`/api/public/live/feed/event/${eventId}`);
        const data = await res.json();
        
        if (!res.ok) throw new Error("Erreur chargement fil d'actualité");

        const events = data.data || [];

        if (events.length === 0) {
            container.innerHTML = `
                <div class="empty-state-live">
                    <i class="fas fa-newspaper"></i>
                    <p>Aucune actualité pour le moment</p>
                </div>
            `;
            return;
        }

        container.innerHTML = events.slice(0, 10).map(event => {
            const timeAgo = getTimeAgo(event.createdAt);
            const eventIcon = getEventIcon(event.type);
            const eventText = formatEventForFeed(event);

            return `
                <div class="feed-item feed-${event.type.toLowerCase()}">
                    <div class="feed-icon">${eventIcon}</div>
                    <div class="feed-content">
                        <div class="feed-text">${eventText}</div>
                        <div class="feed-meta">
                            <span class="feed-time">${timeAgo}</span>
                            <span class="feed-match">${event.teamAName} vs ${event.teamBName}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join("");

    } catch (err) {
        console.error("Erreur loadLiveFeed:", err);
        container.innerHTML = `
            <div class="empty-state-live">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Erreur de chargement du fil d'actualité</p>
            </div>
        `;
    }
}

// ========================================
// 🏷️ HELPERS POUR LE FIL D'ACTUALITÉ
// ========================================
function getEventIcon(type) {
    const icons = {
        'GOAL': '⚽',
        'YELLOW_CARD': '🟨',
        'RED_CARD': '🟥',
        'HALF_TIME': '⏰',
        'FULL_TIME': '🏆',
        'MATCH_STARTED': '🔴',
        'MATCH_ENDED': '✅',
        'SUBSTITUTION': '🔄'
    };
    return icons[type] || '📊';
}

function formatEventForFeed(event) {
    const teamName = event.teamName || '';
    const playerName = event.playerName || 'Joueur';
    
    switch (event.type) {
        case 'GOAL':
            return `<strong>But de ${playerName}</strong> (${teamName})`;
        case 'YELLOW_CARD':
            return `Carton jaune pour <strong>${playerName}</strong> (${teamName})`;
        case 'RED_CARD':
            return `Carton rouge pour <strong>${playerName}</strong> (${teamName})`;
        case 'HALF_TIME':
            return `Mi-temps • ${event.teamAName} ${event.scoreA}-${event.scoreB} ${event.teamBName}`;
        case 'FULL_TIME':
            return `Fin du match • ${event.teamAName} ${event.scoreA}-${event.scoreB} ${event.teamBName}`;
        case 'MATCH_STARTED':
            return `Match commencé • ${event.teamAName} vs ${event.teamBName}`;
        case 'MATCH_ENDED':
            return `Match terminé • Score final ${event.scoreA}-${event.scoreB}`;
        default:
            return event.details || 'Événement';
    }
}

function getTimeAgo(timestamp) {
    const now = new Date();
    const eventTime = new Date(timestamp);
    const diffMs = now - eventTime;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `Il y a ${diffDays}j`;
}

    // ========================================
    // 🏷️ HELPER : NOM DES ROUNDS
    // ========================================
    function getRoundLabel(round) {
        const labels = {
            'FINAL': 'FINALE',
            '3RD_PLACE': 'PETITE FINALE',
            'SF1': 'DEMI-FINALE 1',
            'SF2': 'DEMI-FINALE 2',
            'QF1': 'QUART DE FINALE 1',
            'QF2': 'QUART DE FINALE 2',
            'QF3': 'QUART DE FINALE 3',
            'QF4': 'QUART DE FINALE 4',
            'CFINAL': 'FINALE CONSOLANTE',
            'C3RD_PLACE': '3ÈME PLACE CONSOLANTE',
            'CSF1': 'DEMI-FINALE CONSOLANTE 1',
            'CSF2': 'DEMI-FINALE CONSOLANTE 2',
            'CQF1': 'QUART CONSOLANTE 1',
            'CQF2': 'QUART CONSOLANTE 2',
            'CQF3': 'QUART CONSOLANTE 3',
            'CQF4': 'QUART CONSOLANTE 4'
        };
        return labels[round] || round;
    }

    /* ============================================================================
       CHARGER LES STATS INSCRIPTIONS
       ============================================================================ */
    async function loadRegistrationsStats(eventId) {
        try {
            const res = await Auth.secureFetch(
                `/api/events/manage/${eventId}/registrations?page=0&size=1000`
            );
            const data = await res.json();

            if (res.ok && data.success) {
                const registrations = data.data.content;

                const pending = registrations.filter(
                    (r) => r.status === "EN_ATTENTE" || r.status === "PENDING"
                ).length;
                const validated = registrations.filter(
                    (r) => r.status === "VALIDE" || r.status === "VALIDATED"
                ).length;

                document.getElementById("pendingCount").textContent = pending;
                document.getElementById("validatedCount").textContent = validated;
                document.getElementById("totalCount").textContent =
                    registrations.length;

                if (validated >= 10) {
                    const btn = document.getElementById("formTeamsBtn");
                    if (btn) btn.disabled = false;
                }
            }
        } catch (err) {
            console.error("Erreur chargement stats:", err);
        }
    }

    /* ============================================================================
       CHARGER LA LISTE DES INSCRIPTIONS
       ============================================================================ */
    async function loadRegistrationsList(eventId) {
        const loader = document.getElementById("registrationsLoader");
        const list = document.getElementById("registrationsList");

        loader.style.display = "block";
        list.innerHTML = "";

        try {
            const res = await Auth.secureFetch(
                `/api/events/manage/${eventId}/registrations?page=0&size=1000`
            );
            const data = await res.json();

            if (res.ok && data.success) {
                const registrations = data.data.content;

                if (registrations.length === 0) {
                    list.innerHTML = `
                        <div class="empty-state">
                            <i class="fas fa-user-slash"></i>
                            <p>Aucune inscription</p>
                        </div>`;
                } else {
                    const pending = registrations.filter(
                        (r) => r.status === "EN_ATTENTE" || r.status === "PENDING"
                    );
                    const validated = registrations.filter(
                        (r) => r.status === "VALIDE" || r.status === "VALIDATED"
                    );
                    const cancelled = registrations.filter(
                        (r) => r.status === "ANNULE" || r.status === "CANCELLED"
                    );

                    let html = `<div class="registrations-list">
                        <h4 class="list-title">
                            <i class="fas fa-list"></i>
                            Inscriptions (${registrations.length})
                        </h4>`;

                    if (pending.length > 0) {
                        html += `<div class="reg-section">
                            <h5><i class="fas fa-clock"></i> En attente (${pending.length})</h5>`;
                        pending.forEach((r) => (html += createRegistrationCard(r, "pending")));
                        html += `</div>`;
                    }

                    if (validated.length > 0) {
                        html += `<div class="reg-section">
                            <h5><i class="fas fa-check-circle"></i> Validés (${validated.length})</h5>`;
                        validated.forEach(
                            (r) => (html += createRegistrationCard(r, "validated"))
                        );
                        html += `</div>`;
                    }

                    if (cancelled.length > 0) {
                        html += `<div class="reg-section">
                            <h5><i class="fas fa-times-circle"></i> Refusés (${cancelled.length})</h5>`;
                        cancelled.forEach(
                            (r) => (html += createRegistrationCard(r, "cancelled"))
                        );
                        html += `</div>`;
                    }

                    html += `</div>`;
                    list.innerHTML = html;

                    attachValidationButtons(eventId);
                }
            }
        } catch (err) {
            console.error("Erreur chargement inscriptions:", err);
            showToast("❌ Erreur de chargement", "error");
        } finally {
            loader.style.display = "none";
        }
    }

    /* ============================================================================
       MODAL FORMATION DES ÉQUIPES
       ============================================================================ */
    function showTeamFormationModal(eventId) {
        const modalHtml = `
        <div class="modal-overlay" id="teamFormationModal">
            <div class="modal-container">
                <div class="modal-header">
                    <h3><i class="fas fa-users-line"></i> Former les équipes</h3>
                    <button class="modal-close" id="closeModal">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="modal-body">
                    <p class="modal-description">
                        Choisissez la méthode de formation des équipes
                    </p>
                    
                    <div class="formation-modes">
                        <div class="mode-card" data-mode="AUTO">
                            <div class="mode-icon"><i class="fas fa-wand-magic-sparkles"></i></div>
                            <h4>Formation automatique</h4>
                            <p>L'algorithme répartit les joueurs automatiquement</p>
                        </div>

                        <div class="mode-card disabled">
                            <div class="mode-icon"><i class="fas fa-hand-pointer"></i></div>
                            <h4>Formation manuelle</h4>
                            <p>Bientôt disponible</p>
                        </div>
                    </div>
                </div>
                
                <div class="modal-footer">
                    <button class="btn-secondary" id="cancelFormation">Annuler</button>
                    <button class="btn-primary" id="confirmFormation" disabled>
                        <i class="fas fa-check"></i> Confirmer
                    </button>
                </div>
            </div>
        </div>
        `;

        document.body.insertAdjacentHTML("beforeend", modalHtml);

        const modal = document.getElementById("teamFormationModal");
        const closeBtn = document.getElementById("closeModal");
        const cancelBtn = document.getElementById("cancelFormation");
        const confirmBtn = document.getElementById("confirmFormation");

        let selectedMode = null;

        document.querySelectorAll(".mode-card").forEach((card) => {
            card.addEventListener("click", () => {
                if (card.classList.contains("disabled")) return;

                document
                    .querySelectorAll(".mode-card")
                    .forEach((c) => c.classList.remove("selected"));
                card.classList.add("selected");
                selectedMode = card.dataset.mode;
                confirmBtn.disabled = false;
            });
        });

        const closeModal = () => modal.remove();
        closeBtn.addEventListener("click", closeModal);
        cancelBtn.addEventListener("click", closeModal);
        modal.addEventListener("click", (e) => {
            if (e.target === modal) closeModal();
        });

        confirmBtn.addEventListener("click", async () => {
            confirmBtn.disabled = true;
            confirmBtn.innerHTML =
                '<i class="fas fa-spinner fa-spin"></i> Formation...';

            try {
                await formTeams(eventId, selectedMode);
                closeModal();
            } catch {
                confirmBtn.disabled = false;
                confirmBtn.innerHTML =
                    '<i class="fas fa-check"></i> Confirmer';
            }
        });
    }

    /* ============================================================================
       APPEL API : FORMER LES ÉQUIPES
       ============================================================================ */
    async function formTeams(eventId, mode) {
        try {
            const res = await Auth.secureFetch("/api/team-formation/form-teams", {
                method: "POST",
                body: JSON.stringify({
                    eventId: parseInt(eventId),
                    mode: mode,
                }),
            });

            const result = await res.json();

            if (res.ok && result.success) {
                showToast(
                    `✅ ${result.data.totalTeams} équipes formées avec succès !`,
                    "success"
                );

                setTimeout(() => location.reload(), 1500);
            } else {
                throw new Error(result.message || "Erreur formation");
            }
        } catch (err) {
            console.error("Erreur:", err);
            showToast("❌ " + err.message, "error");
            throw err;
        }
    }

    /* ============================================================================
       CHARGER LES ÉQUIPES FORMÉES
       ============================================================================ */
    async function loadFormedTeams(eventId) {
        const loader = document.getElementById("formedTeamsLoader");
        const container = document.getElementById("formedTeamsContainer");

        if (!loader || !container) return;

        loader.style.display = "flex";
        container.innerHTML = "";

        try {
            const res = await Auth.secureFetch(
                `/api/team-formation/event/${eventId}/teams`
            );
            const data = await res.json();

            if (res.ok && data.success) {
                const teams = data.data;

                if (!teams || teams.length === 0) {
                    container.innerHTML = `
                        <div class="empty-state">
                            <i class="fas fa-users-slash"></i>
                            <p>Aucune équipe formée</p>
                        </div>`;
                } else {
                    container.innerHTML = teams
                        .map((team) => createTeamCard(team))
                        .join("");
                }
            } else {
                throw new Error(data.message || "Erreur chargement");
            }
        } catch (err) {
            console.error("Erreur chargement équipes:", err);
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Erreur de chargement des équipes</p>
                </div>`;
        } finally {
            loader.style.display = "none";
        }
    }

    /* ============================================================================
       CRÉER UNE CARTE ÉQUIPE
       ============================================================================ */
    function createTeamCard(team) {
        const currentUser = Auth.currentUser;
        const isMyTeam =
            team.players &&
            team.players.some((p) => p.id === currentUser?.id);

        return `
        <div class="team-card ${
            isMyTeam ? "my-team" : ""
        }" style="border-left:4px solid ${team.color || "#3b82f6"}">
            
            <div class="team-card-header">
                <div class="team-info">
                    <h4 class="team-name">
                        <i class="fas fa-shield-alt" style="color:${
                            team.color || "#3b82f6"
                        }"></i>
                        ${team.name}
                    </h4>
                    ${
                        isMyTeam
                            ? '<span class="my-team-badge"><i class="fas fa-star"></i> Mon équipe</span>'
                            : ""
                    }
                </div>

                <div class="team-stats">
                    <span class="team-player-count">
                        <i class="fas fa-users"></i>
                        ${team.playerCount || 0} joueurs
                    </span>
                </div>
            </div>

            <div class="team-players-list">
                ${
                    team.players && team.players.length > 0
                        ? team.players
                              .map(
                                  (player, index) => `
                    <div class="team-player-item ${
                        player.id === currentUser?.id ? "is-me" : ""
                    }">
                        <div class="player-avatar">
                            ${
                                player.avatarUrl
                                    ? `<img src="${player.avatarUrl}" alt="${player.username}">`
                                    : player.username.charAt(0).toUpperCase()
                            }
                        </div>
                        <div class="player-info">
                            <span class="player-name">
                                ${player.username}
                                ${
                                    player.id === currentUser?.id
                                        ? '<span class="me-badge">Vous</span>'
                                        : ""
                                }
                            </span>
                            <span class="player-meta">
                                ${
                                    player.level
                                        ? `<span class="level-badge level-${player.level.toLowerCase()}">${player.level}</span>`
                                        : ""
                                }
                                ${
                                    player.preferredPosition
                                        ? `<span class="position-badge">${player.preferredPosition}</span>`
                                        : ""
                                }
                            </span>
                        </div>
                        <span class="player-number">#${index + 1}</span>
                    </div>`
                              )
                              .join("")
                        : `<p style="opacity:0.6;text-align:center;">Aucun joueur</p>`
                }
            </div>
        </div>`;
    }

    /* ============================================================================
       CARTE INSCRIPTION
       ============================================================================ */
    function createRegistrationCard(reg, statusType) {
        const date = new Date(reg.registrationDate).toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });

        return `
        <div class="registration-item" data-reg-id="${reg.id}">
            <div class="reg-player-info">
                <div class="player-avatar">
                    ${reg.playerUsername
                        ? reg.playerUsername.charAt(0).toUpperCase()
                        : "?"}
                </div>
                <div class="player-details">
                    <span class="player-name">${
                        reg.playerUsername || "Joueur inconnu"
                    }</span>
                    <span class="player-meta">Inscrit le ${date}</span>
                </div>
            </div>
            
            <div class="reg-actions">
                ${
                    statusType === "pending"
                        ? `
                    <button class="reg-action-btn validate" data-action="validate" data-reg-id="${reg.id}">
                        <i class="fas fa-check"></i>
                    </button>
                    <button class="reg-action-btn refuse" data-action="refuse" data-reg-id="${reg.id}">
                        <i class="fas fa-times"></i>
                    </button>`
                        : `
                    <span class="status-badge ${statusType}">
                        ${
                            statusType === "validated"
                                ? "Validé"
                                : "Refusé"
                        }
                    </span>`
                }
            </div>
        </div>`;
    }

    /* ============================================================================
       BOUTONS VALIDER / REFUSER INSCRIPTION
       ============================================================================ */
    function attachValidationButtons(eventId) {
        document.querySelectorAll(".reg-action-btn").forEach((btn) => {
            btn.addEventListener("click", async (e) => {
                e.stopPropagation();

                const action = btn.dataset.action;
                const regId = btn.dataset.regId;
                const regItem = btn.closest(".registration-item");

                const confirmMsg =
                    action === "validate"
                        ? "Valider cette inscription ?"
                        : "Refuser cette inscription ?";
                if (!confirm(confirmMsg)) return;

                regItem
                    .querySelectorAll(".reg-action-btn")
                    .forEach((b) => (b.disabled = true));
                btn.innerHTML =
                    '<i class="fas fa-spinner fa-spin"></i>';

                try {
                    if (action === "validate") {
                        const res = await Auth.secureFetch(
                            `/api/events/manage/${eventId}/registrations/${regId}/validate`,
                            { method: "POST" }
                        );

                        const result = await res.json();

                        if (res.ok && result.success) {
                            showToast("✅ Inscription validée !", "success");

                            await loadRegistrationsList(eventId);
                            await loadRegistrationsStats(eventId);
                        } else {
                            throw new Error(
                                result.message ||
                                    "Erreur lors de la validation"
                            );
                        }
                    } else {
                        showToast(
                            "⚠️ Fonction 'Refuser' à implémenter côté backend",
                            "warning"
                        );
                    }
                } catch (err) {
                    console.error("Erreur:", err);
                    showToast("❌ " + err.message, "error");
                }
            });
        });
    }


    // ========================================
// 🔒 BOUTONS CLÔTURE DES INSCRIPTIONS
// ========================================

const closeBtn = document.getElementById("closeRegistrationsBtn");
if (closeBtn) {
    closeBtn.addEventListener("click", async () => {
        if (!confirm("⚠️ Clôturer les inscriptions ?\n\nLes utilisateurs ne pourront plus s'inscrire à cet événement.")) {
            return;
        }
        
        closeBtn.disabled = true;
        closeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Fermeture...';
        
        try {
            const res = await Auth.secureFetch(
                `/api/events/manage/${eventId}/close-registrations`,
                { method: "POST" }
            );
            
            const result = await res.json();
            
            if (res.ok) {
                showToast("✅ Inscriptions clôturées avec succès", "success");
                setTimeout(() => location.reload(), 1500);
            } else {
                throw new Error(result.message || "Erreur lors de la clôture");
            }
        } catch (err) {
            console.error("Erreur:", err);
            showToast("❌ " + err.message, "error");
            closeBtn.disabled = false;
            closeBtn.innerHTML = '<i class="fas fa-lock"></i> Clôturer les inscriptions';
        }
    });
}

const reopenBtn = document.getElementById("reopenRegistrationsBtn");
if (reopenBtn) {
    reopenBtn.addEventListener("click", async () => {
        if (!confirm("Rouvrir les inscriptions ?\n\nLes utilisateurs pourront à nouveau s'inscrire.")) {
            return;
        }
        
        reopenBtn.disabled = true;
        reopenBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Réouverture...';
        
        try {
            const res = await Auth.secureFetch(
                `/api/events/manage/${eventId}/reopen-registrations`,
                { method: "POST" }
            );
            
            const result = await res.json();
            
            if (res.ok) {
                showToast("✅ Inscriptions rouvertes avec succès", "success");
                setTimeout(() => location.reload(), 1500);
            } else {
                throw new Error(result.message || "Erreur lors de la réouverture");
            }
        } catch (err) {
            console.error("Erreur:", err);
            showToast("❌ " + err.message, "error");
            reopenBtn.disabled = false;
            reopenBtn.innerHTML = '<i class="fas fa-lock-open"></i> Rouvrir les inscriptions';
        }
    });
}
}


