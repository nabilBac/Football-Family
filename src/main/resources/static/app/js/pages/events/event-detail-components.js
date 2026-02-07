// /static/app/js/pages/events/event-detail-components.js
// ✅ COMPOSANTS RÉUTILISABLES - CODE PROPRE ET MAINTENABLE

/* ============================================================================
   🎨 HELPER : ÉCHAPPER HTML (SÉCURITÉ)
   ============================================================================ */
export function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/* ============================================================================
   🏆 COMPOSANT : HEADER
   ============================================================================ */
export function renderHeader(isOrganizer) {
    return `
        <header class="event-detail-header">
            <button class="back-btn" id="backBtn" aria-label="Retour">
                <i class="fas fa-arrow-left" aria-hidden="true"></i>
            </button>
            <h1>Détail</h1>
            ${isOrganizer ? `
                <button class="menu-btn" id="menuBtn" aria-label="Menu">
                    <i class="fas fa-ellipsis-v" aria-hidden="true"></i>
                </button>
            ` : '<div style="width: 40px;"></div>'}
        </header>
    `;
}

/* ============================================================================
   🎨 COMPOSANT : BANNIÈRE ÉVÉNEMENT
   ============================================================================ */
export function renderBanner(eventType) {
    const icons = {
          SINGLE_MATCH: "fa-futbol",
        MATCH: "fa-futbol",
        TOURNAMENT: "fa-trophy",
        TOURNOI: "fa-trophy",
        CLUB_EVENT: "fa-trophy",
        TRAINING: "fa-dumbbell",
        COMPETITION: "fa-medal",
    };

    return `
        <div class="event-banner">
            <div class="event-banner-icon">
                <i class="fas ${icons[eventType] || 'fa-calendar'}" aria-hidden="true"></i>
            </div>
            <div class="event-banner-gradient"></div>
        </div>
    `;
}

/* ============================================================================
   📝 COMPOSANT : TITRE ET BADGE
   ============================================================================ */
export function renderTitle(event) {
    const icons = {
        MATCH: "fa-futbol",
        TOURNAMENT: "fa-trophy",
        TOURNOI: "fa-trophy",
        CLUB_EVENT: "fa-trophy",
        TRAINING: "fa-dumbbell",
        COMPETITION: "fa-medal",
    };

    return `
        <div class="event-title-section">
            <h2 class="event-title">${escapeHtml(event.name)}</h2>
            
            ${renderEventStatusBadge(event)}
            
            <span class="event-type-badge badge-${event.type}">
                <i class="fas ${icons[event.type] || 'fa-calendar'}" aria-hidden="true"></i>
             ${escapeHtml(event.format === "SINGLE_MATCH" ? "MATCH" : event.type)}

            </span>
        </div>
    `;
}


/* ============================================================================
   🔴 COMPOSANT : BADGE STATUT TOURNOI (NOUVEAU)
   ============================================================================ */
export function renderEventStatusBadge(event) {
    const status = event?.status;
    const isSingleMatch = event?.format === "SINGLE_MATCH";

    
    if (!status) return '';

    // 🔴 TOURNOI EN DIRECT (ONGOING)
    if (status === 'ONGOING') {
        const startDate = event.actualStartDateTime 
            ? new Date(event.actualStartDateTime).toLocaleString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit'
              })
            : '';
        
        return `
            <div class="event-status-badge live" style="
                display: inline-flex;
                align-items: center;
                gap: 10px;
                background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
                color: white;
                padding: 12px 20px;
                border-radius: 25px;
                font-weight: 700;
                font-size: 15px;
                margin: 15px 0;
                animation: pulse-badge 2s infinite;
                box-shadow: 0 4px 15px rgba(239, 68, 68, 0.4);
            ">
                <span style="
                    width: 10px;
                    height: 10px;
                    background: white;
                    border-radius: 50%;
                    animation: blink-badge 1s infinite;
                "></span>
              <span>${isSingleMatch ? "🔴 MATCH EN DIRECT" : "🔴 TOURNOI EN DIRECT"}</span>

                ${startDate ? `<span style="font-size: 13px; opacity: 0.9;">depuis ${startDate}</span>` : ''}
            </div>

            <style>
                @keyframes pulse-badge {
                    0%, 100% { 
                        box-shadow: 0 4px 15px rgba(239, 68, 68, 0.4);
                        transform: scale(1);
                    }
                    50% { 
                        box-shadow: 0 6px 25px rgba(239, 68, 68, 0.6);
                        transform: scale(1.02);
                    }
                }
                @keyframes blink-badge {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.3; }
                }
            </style>
        `;
    }

    // 📅 TOURNOI À VENIR (PUBLISHED / REGISTRATION_CLOSED)
    if (status === 'PUBLISHED' || status === 'REGISTRATION_CLOSED') {
        return `
            <div class="event-status-badge upcoming" style="
                display: inline-flex;
                align-items: center;
                gap: 10px;
                background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
                color: white;
                padding: 12px 20px;
                border-radius: 25px;
                font-weight: 700;
                font-size: 15px;
                margin: 15px 0;
                box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
            ">
                <i class="fas fa-calendar-alt"></i>
               <span>${isSingleMatch ? "📅 MATCH À VENIR" : "📅 TOURNOI À VENIR"}</span>

            </div>
        `;
    }

    // ✅ TOURNOI TERMINÉ (COMPLETED)
    if (status === 'COMPLETED') {
        const endDate = event.actualEndDateTime 
            ? new Date(event.actualEndDateTime).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })
            : '';
        
        return `
            <div class="event-status-badge completed" style="
                display: inline-flex;
                align-items: center;
                gap: 10px;
                background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
                color: white;
                padding: 12px 20px;
                border-radius: 25px;
                font-weight: 700;
                font-size: 15px;
                margin: 15px 0;
                box-shadow: 0 4px 15px rgba(34, 197, 94, 0.3);
            ">
                <i class="fas fa-check-circle"></i>
              <span>${isSingleMatch ? "✅ MATCH TERMINÉ" : "✅ TOURNOI TERMINÉ"}</span>

                ${endDate ? `<span style="font-size: 13px; opacity: 0.9;">le ${endDate}</span>` : ''}
            </div>
        `;
    }

    return '';
}

/* ============================================================================
   ℹ️ COMPOSANT : CARTE INFORMATIONS
   ============================================================================ */
export function renderInfoCard(event) {
    const isClubEvent = event.registrationType === "CLUB_ONLY";
    
    return `
        <div class="event-info-card">
            <div class="info-item">
                <div class="info-icon">
                    <i class="fas ${isClubEvent ? 'fa-shield-alt' : 'fa-users'}" aria-hidden="true"></i>
                </div>
                <div class="info-content">
                    <span class="info-label ${isClubEvent ? 'club' : ''}">
                        ${isClubEvent ? "Équipes" : "Participants"}
                    </span>
                    <span class="info-value">
                        <strong>
                            ${isClubEvent 
                               ? (event.teamsRegisteredByMyClub ?? 0)

                                : (event.acceptedParticipants ?? 0)}
                        </strong>
                        /
                        ${isClubEvent 
                            ? (event.maxTeamsPerClub ?? "∞") 
                            : (event.maxParticipants ?? "∞")}
                    </span>
                </div>
            </div>

            <div class="info-item">
                <div class="info-icon">
                    <i class="fas fa-map-marker-alt" aria-hidden="true"></i>
                </div>
                <div class="info-content">
                    <span class="info-label">Lieu</span>
                    <span class="info-value">${escapeHtml(event.location)}</span>
                </div>
            </div>
        </div>
    `;
}

/* ============================================================================
   📄 COMPOSANT : DESCRIPTION
   ============================================================================ */
export function renderDescription(description) {
    if (!description) return '';
    
    return `
        <div class="event-section">
            <h3 class="section-title">
                <i class="fas fa-align-left" aria-hidden="true"></i>
                Description
            </h3>
            <p class="event-description">${escapeHtml(description)}</p>
        </div>
    `;
}

/* ============================================================================
   🏆 COMPOSANT : SECTION TOURNOI AVEC ONGLETS
   ============================================================================ */
export function renderTournamentSection(event, isOrganizer, currentUser) {
    const hasClubAccess = isOrganizer || currentUser?.clubId;
    
    return `
        <div class="event-section tournament-section">
            ${hasClubAccess ? `
                <h3 class="section-title">
                    <i class="fas fa-trophy" aria-hidden="true"></i>
                    Gestion du tournoi
                </h3>
              
                ${renderQuotaInfo(event)}
            ` : ''}
            
            <!-- Navigation par onglets -->
            <div class="tournament-tabs">
                <button class="tournament-tab active" data-tab="live">
                    <i class="fas fa-futbol"></i>
                    <span>En direct</span>
                </button>
                <button class="tournament-tab" data-tab="rankings">
                    <i class="fas fa-list-ol"></i>
                    <span>Classements</span>
                </button>
                <button class="tournament-tab" data-tab="bracket">
                    <i class="fas fa-trophy"></i>
                    <span>Phase finale</span>
                </button>
                <button class="tournament-tab" data-tab="feed">
                    <i class="fas fa-newspaper"></i>
                    <span>Actualités</span>
                </button>

                <button class="tournament-tab" data-tab="matches">
                     <i class="fas fa-calendar-day"></i>
                    <span>Tous les matchs</span>
                </button>

            </div>
            
            <!-- Contenus des onglets -->
            <div class="tournament-tab-contents">
                <div id="tab-live" class="tournament-tab-content active">
                    <div id="liveMatchesContainer" role="region" aria-live="polite"></div>
                </div>
                
                <div id="tab-rankings" class="tournament-tab-content">
                    <div id="rankingsContainer" role="region" aria-live="polite"></div>
                </div>
                
                <div id="tab-bracket" class="tournament-tab-content">
                    <div id="bracketContainer" role="region" aria-live="polite"></div>
                </div>
                
                <div id="tab-feed" class="tournament-tab-content">
  <div id="feedFilters" class="feed-filters"></div>
  <div id="liveFeedContainer" role="region" aria-live="polite"></div>
</div>

              <div id="tab-matches" class="tournament-tab-content">
  <div id="matchFilters" class="match-filters"></div>
  <div id="allMatchesContainer" role="region" aria-live="polite"></div>
</div>


            </div>
        </div>
    `;
}


export function renderSingleMatchSection(event) {
  return `
    <div class="event-section tournament-section">
      <h3 class="section-title">
        <i class="fas fa-futbol" aria-hidden="true"></i>
        Suivi du match
      </h3>

      <div class="tournament-tabs">
        <button class="tournament-tab active" data-tab="live">
          <i class="fas fa-futbol"></i>
          <span>Match</span>
        </button>

        <button class="tournament-tab" data-tab="feed">
          <i class="fas fa-newspaper"></i>
          <span>Actualités</span>
        </button>

        <button class="tournament-tab" data-tab="matches">
          <i class="fas fa-calendar-day"></i>
          <span>Détails</span>
        </button>
      </div>

      <div class="tournament-tab-contents">
        <div id="tab-live" class="tournament-tab-content active">
          <div id="liveMatchesContainer" role="region" aria-live="polite"></div>
        </div>

      <div id="tab-feed" class="tournament-tab-content">
  <div id="feedFilters" class="feed-filters"></div>
  <div id="liveFeedContainer" role="region" aria-live="polite"></div>
</div>


       <div id="tab-matches" class="tournament-tab-content">
  <div id="matchFilters" class="match-filters"></div>
  <div id="allMatchesContainer" role="region" aria-live="polite"></div>
</div>

      </div>
    </div>
  `;
}


/* ============================================================================
   🎮 SOUS-COMPOSANT : ACTIONS TOURNOI
   ============================================================================ */
/*function renderTournamentActions(event, isOrganizer) {
    return `
        <div class="tournament-actions" style="margin-bottom: 20px;">
            <button class="btn-secondary" id="viewGroupsBtn" data-event-id="${event.id}">
                <i class="fas fa-layer-group" aria-hidden="true"></i>
                Voir les groupes
            </button>
            <button class="btn-secondary" id="viewAllMatchesBtn" data-event-id="${event.id}">
                <i class="fas fa-calendar-day" aria-hidden="true"></i>
                Tous les matchs
            </button>
            ${isOrganizer ? `
                <button class="btn-primary" 
                        onclick="location.href='/tournament/${event.id}/dashboard'" 
                        style="background: #10b981;">
                    <i class="fas fa-cog" aria-hidden="true"></i>
                    Tableau de bord
                </button>
            ` : ''}
        </div>
    `;
}*/

/* ============================================================================
   📊 SOUS-COMPOSANT : QUOTA CLUB
   ============================================================================ */
function renderQuotaInfo(event) {
  const max = event.maxTeamsPerClub;
  if (max == null) return '';

  const registered = event.teamsRegisteredByMyClub ?? 0;
  const remaining = (event.remainingTeamsForMyClub ?? Math.max(0, max - registered));

  return `
    <div class="club-quota-section">
      <h4>📊 Quota de mon club</h4>
      <p>
        <b>${registered}</b> / ${max} équipes inscrites<br>
        <strong>Restant :</strong>
        <span class="quota-remaining">${remaining}</span>
      </p>
    </div>
  `;
}


/* ============================================================================
   🔴 LES CONTENEURS SONT MAINTENANT GÉRÉS DYNAMIQUEMENT
   Suppression des fonctions statiques - tout est conditionnel côté JS
   ============================================================================ */

/* ============================================================================
   👤 COMPOSANT : SECTION ORGANISATEUR
   ============================================================================ */
export function renderOrganizerSection(event) {
    // ✅ Match unique : pas de gestion d'inscriptions + bouton vers dashboard match
    if (event?.format === "SINGLE_MATCH") {
        return `
            <div class="event-section organizer-section">
                <h3 class="section-title">
                    <i class="fas fa-crown" aria-hidden="true"></i>
                    Actions organisateur
                </h3>

                <div class="registration-management-section">
                    <div class="alert alert-info" role="alert">
                        <i class="fas fa-futbol" aria-hidden="true"></i>
                        Match unique : pas d’inscriptions à gérer
                    </div>
                </div>

                <button class="action-btn primary"
                        onclick="location.href='/admin/events/${event.id}'"
                        style="width: 100%; padding: 15px; font-size: 1.1em;">
                    <i class="fas fa-cog" aria-hidden="true"></i>
                    Tableau de bord du match
                </button>
            </div>
        `;
    }

    // ✅ Tournoi : comportement actuel
    return `
        <div class="event-section organizer-section">
            <h3 class="section-title">
                <i class="fas fa-crown" aria-hidden="true"></i>
                Actions organisateur
            </h3>

            ${renderRegistrationManagement(event)}
            ${renderQuickStats()}

            <button class="action-btn primary"
                    onclick="location.href='/tournament/${event.id}/dashboard'"
                    style="width: 100%; padding: 15px; font-size: 1.1em;">
                <i class="fas fa-cog" aria-hidden="true"></i>
                Tableau de bord du tournoi
            </button>
        </div>
    `;
}


/* ============================================================================
   🔒 SOUS-COMPOSANT : GESTION INSCRIPTIONS
   ============================================================================ */
function renderRegistrationManagement(event) {
    if (event.isFull) {
        return `
            <div class="registration-management-section">
                <div class="alert alert-danger" role="alert">
                    <i class="fas fa-users-slash" aria-hidden="true"></i>
                    Événement complet (quota atteint)
                </div>
                <p style="font-size: 0.9em; color: #6b7280;">
                    Les inscriptions sont bloquées automatiquement.
                </p>
            </div>
        `;
    }
    
    if (event.registrationClosed) {
        return `
            <div class="registration-management-section">
                <div class="alert alert-warning" role="alert">
                    <i class="fas fa-lock" aria-hidden="true"></i>
                    Inscriptions fermées par l'organisateur
                </div>
                <button class="action-btn success" id="reopenRegistrationsBtn">
                    <i class="fas fa-lock-open" aria-hidden="true"></i>
                    Rouvrir les inscriptions
                </button>
            </div>
        `;
    }
    
    return `
        <div class="registration-management-section">
            <div class="alert alert-success" role="alert">
                <i class="fas fa-lock-open" aria-hidden="true"></i>
                Inscriptions ouvertes
            </div>
            <button class="action-btn danger" id="closeRegistrationsBtn">
                <i class="fas fa-lock" aria-hidden="true"></i>
                Clôturer les inscriptions
            </button>
        </div>
    `;
}

/* ============================================================================
   📊 SOUS-COMPOSANT : STATS RAPIDES
   ============================================================================ */
function renderQuickStats() {
    return `
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
    `;
}

/* ============================================================================
   ✅ COMPOSANT : JOUEUR INSCRIT
   ============================================================================ */
export function renderPlayerSection(registrationStatus) {
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
                <i class="fas fa-user-check" aria-hidden="true"></i>
                Mon inscription
            </h3>

            <div class="status-card ${status.color}" role="status">
                <div class="status-icon">
                    <i class="fas fa-${status.icon}" aria-hidden="true"></i>
                </div>
                <div class="status-content">
                    <span class="status-label">Statut</span>
                    <span class="status-text">${status.text}</span>
                </div>
            </div>
        </div>
    `;
}

/* ============================================================================
   👥 COMPOSANT : VISITEUR CONNECTÉ
   ============================================================================ */
export function renderVisitorSection() {
    return `
        <div class="event-section visitor-section">
            <div class="cta-card">
                <div class="cta-icon"><i class="fas fa-user-plus" aria-hidden="true"></i></div>
                <h3>Rejoignez cet événement !</h3>
                <p>Inscrivez-vous pour participer.</p>
            </div>
        </div>
    `;
}

/* ============================================================================
   🔓 COMPOSANT : NON CONNECTÉ
   ============================================================================ */
export function renderGuestSection() {
    return `
        <div class="event-section visitor-section">
            <div class="cta-card">
                <div class="cta-icon"><i class="fas fa-lock" aria-hidden="true"></i></div>
                <h3>Connectez-vous pour participer</h3>
                <p>Créez un compte ou connectez-vous.</p>
                <button class="btn-primary" onclick="location.href='/login'">
                    Se connecter
                </button>
            </div>
        </div>
    `;
}

/* ============================================================================
   🎈 COMPOSANT : BOUTON FLOTTANT
   ============================================================================ */
export function renderFloatingButton(event, isAuthenticated, isOrganizer, isRegistered, hasClub) {
    // Pas de bouton si non connecté, organisateur, ou déjà inscrit
    if (!isAuthenticated || isOrganizer || isRegistered) return '';
    
    const isClubEvent = event.registrationType === "CLUB_ONLY";
    
    // Événement club
    if (isClubEvent) {
        // Fermé ou complet
        if (event.registrationClosed || event.isFull) return '';
        
        // Équipes en attente
        if (event.pendingTeamsByMyClub > 0) {
            return `
                <div class="floating-info-badge pending" role="status">
                    <i class="fas fa-clock" aria-hidden="true"></i>
                    <span>
                        ${event.pendingTeamsByMyClub} équipe${event.pendingTeamsByMyClub > 1 ? 's' : ''}
                        en attente de validation
                    </span>
                </div>
            `;
        }
        
        // Quota atteint
        const quotaReached = event.maxTeamsPerClub !== null && event.remainingTeamsForMyClub === 0;
        
        if (hasClub && !quotaReached) {
            return `
                <button class="floating-action-btn" id="registerMyTeamBtn" aria-label="Inscrire mon équipe">
                    <i class="fas fa-shield" aria-hidden="true"></i>
                    <span>Inscrire mon équipe</span>
                </button>
            `;
        }
        
        return '';
    }
    
    // Événement individuel
    if (event.registrationClosed || event.isFull) {
        return `
            <div class="floating-info-badge closed" role="status">
                <i class="fas fa-lock" aria-hidden="true"></i>
                <span>
                    ${event.registrationClosed 
                        ? "Inscriptions fermées" 
                        : "Événement complet"}
                </span>
            </div>
        `;
    }
    
    return `
        <button class="floating-action-btn" id="registerBtn" aria-label="S'inscrire à l'événement">
            <i class="fas fa-user-plus" aria-hidden="true"></i>
            <span>S'inscrire</span>
        </button>
    `;
}

/* ============================================================================
   📦 COMPOSANT : ÉTATS VIDES
   ============================================================================ */
export function renderEmptyState(type, message) {
    const icons = {
      
        matches: 'fa-futbol',
        rankings: 'fa-list-ol',
        bracket: 'fa-trophy',
        feed: 'fa-newspaper',
        error: 'fa-exclamation-triangle'
    };
    
    return `
        <div class="empty-state-live">
            <i class="fas ${icons[type] || 'fa-info-circle'}" aria-hidden="true"></i>
            <p>${escapeHtml(message)}</p>
        </div>
    `;
}

/* ============================================================================
   🎭 COMPOSANT : MODALES
   ============================================================================ */
export function renderRegistrationModal() {
    return `
        <div id="registrationModal" class="utf-modal hidden" role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <div class="utf-modal-overlay"></div>
            <div class="utf-modal-box">
                <h2 id="modal-title">Inscription à l'événement</h2>

                <div class="form-group">
                    <label for="reg-level">Niveau</label>
                    <select id="reg-level">
                        <option value="BEGINNER">Débutant</option>
                        <option value="INTERMEDIATE">Intermédiaire</option>
                        <option value="ADVANCED">Avancé</option>
                        <option value="EXPERT">Expert</option>
                    </select>
                </div>

                <div class="form-group">
                    <label for="reg-position">Poste préféré</label>
                    <select id="reg-position">
                        <option value="GOALKEEPER">Gardien</option>
                        <option value="DEFENDER">Défenseur</option>
                        <option value="MIDFIELDER">Milieu</option>
                        <option value="FORWARD">Attaquant</option>
                    </select>
                </div>

                <div class="form-group">
                    <label for="reg-notes">Notes</label>
                    <textarea id="reg-notes" maxlength="500"></textarea>
                </div>

                <div class="modal-actions">
                    <button id="cancelModal" class="btn-secondary">Annuler</button>
                    <button id="confirmRegistration" class="btn-primary">Valider</button>
                </div>
            </div>
        </div>
    `;
}

export function renderClubRegistrationModal(event) {
  const quota = Number(event.maxTeamsPerClub ?? 0);           // ex: 4
  const already = Number(event.teamsRegisteredByMyClub ?? 0); // au lieu de null
  const remaining = quota > 0 ? Math.max(0, quota - already) : null;

  const options =
    remaining === null
      ? `<option value="1">1 équipe</option>`
      : Array.from({ length: Math.max(1, remaining) }, (_, i) => {
          const n = i + 1;
          return `<option value="${n}">${n} équipe${n > 1 ? "s" : ""}</option>`;
        }).join("");

  return `
    <div id="clubRegistrationModal" class="utf-modal hidden" role="dialog" aria-modal="true" aria-labelledby="club-modal-title">
      <div class="utf-modal-overlay"></div>
      <div class="utf-modal-box">
        <h2 id="club-modal-title">Inscrire mon club</h2>

        ${quota ? `
          <div class="club-quota-info">
            <p>🏟️ Quota par club : <strong>${quota}</strong></p>
            <p>✅ Déjà inscrites : <strong>${already}</strong></p>
            <p>🟢 Restantes : <strong>${remaining}</strong></p>
          </div>
        ` : `
          <div class="club-quota-info">
            <p>♾️ Nombre d'équipes illimité</p>
          </div>
        `}

        <div class="form-group">
          <label for="teamCountSelect">Nombre d'équipes à inscrire</label>
          <select id="teamCountSelect">${options}</select>
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
  `;
}


export function renderToast() {
    return `<div id="toast" class="toast" role="alert" aria-live="assertive"></div>`;
}



/* ============================================================================
   🎨 HERO SECTION MODERNE (Grid 2 colonnes) - VERSION ENRICHIE
   ============================================================================ */
export function renderHeroSectionPro(event) {
    const statusBadge = event.status === 'ONGOING' 
        ? '<div class="hero-status-badge live"><span class="pulse-dot"></span>🔴 EN DIRECT</div>'
        : event.status === 'COMPLETED'
        ? '<div class="hero-status-badge completed">✅ TERMINÉ</div>'
        : '<div class="hero-status-badge upcoming">📅 À VENIR</div>';

    // 🆕 DATE + HEURE
    const eventDate = event.date || event.startDateTime;
    const startDate = eventDate
        ? new Date(eventDate).toLocaleDateString('fr-FR', { 
            day: 'numeric', 
            month: 'short' 
          })
        : '';

    // 🆕 HEURE DE DÉBUT ET FIN
    const startTime = event.startTime 
        ? new Date(event.startTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
        : null;
    const endTime = event.endTime 
        ? new Date(event.endTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
        : null;
    const timeRange = startTime && endTime ? `${startTime} - ${endTime}` : startTime || '';

    // 🆕 CATÉGORIE + NIVEAU
    const category = event.category || null;
    const level = event.level || null;

    const isClubEvent = event.registrationType === "CLUB_ONLY";
    const registered = isClubEvent ? (event.teamsRegisteredByMyClub ?? 0) : (event.acceptedParticipants ?? 0);
    const max = isClubEvent ? (event.maxTeamsPerClub ?? event.maxParticipants) : (event.maxParticipants ?? "∞");

    // 🆕 PRIX (converti de cents en euros si nécessaire)
    const price = event.registrationFeeCents 
        ? (event.registrationFeeCents / 100).toFixed(2) + '€'
        : event.price > 0 
        ? event.price + '€' 
        : 'Gratuit';

    return `
        <div class="hero-section-pro">
            <div class="hero-background">
                <div class="hero-gradient"></div>
            </div>
            
            <div class="hero-content-grid">
                <!-- Colonne gauche : Infos principales -->
                <div class="hero-left">
                    ${statusBadge}
                    
                    <!-- 🆕 BADGES CATÉGORIE + NIVEAU -->
                    ${category || level ? `
                    <div class="hero-badges-row">
                        ${category ? `
                        <span class="hero-badge category">
                            <i class="fas fa-users"></i>
                            ${escapeHtml(category)}
                        </span>
                        ` : ''}
                        ${level ? `
                        <span class="hero-badge level level-${level.toLowerCase()}">
                            <i class="fas fa-star"></i>
                            ${escapeHtml(level)}
                        </span>
                        ` : ''}
                    </div>
                    ` : ''}
                    
                    <h1 class="hero-title">${escapeHtml(event.name)}</h1>
                    
                    <div class="hero-meta-grid">
                        ${startDate ? `
                        <div class="hero-meta-item">
                            <i class="fas fa-calendar-alt"></i>
                            <span>${startDate}${timeRange ? ' • ' + timeRange : ''}</span>
                        </div>` : ''}
                        
                        <div class="hero-meta-item">
                            <i class="fas fa-map-marker-alt"></i>
                            <span>${escapeHtml(event.city || event.location.split(',')[0])}</span>
                        </div>
                        
                        <div class="hero-meta-item">
                            <i class="fas fa-euro-sign"></i>
                            <span>${price}</span>
                        </div>
                        
                        <div class="hero-meta-item">
                            <i class="fas ${isClubEvent ? 'fa-shield-alt' : 'fa-users'}"></i>
                            <span>${max} places</span>
                        </div>
                    </div>
                </div>
                
                <!-- Colonne droite : Stats rapides -->
                <div class="hero-right">
                    <div class="hero-stat-mini">
                        <div class="stat-mini-value">${registered}</div>
                        <div class="stat-mini-label">${isClubEvent ? 'Équipes' : 'Inscrits'}</div>
                    </div>
                    
                    <div class="hero-stat-mini accent">
                        <div class="stat-mini-value">${max === '∞' ? '∞' : (max - registered)}</div>
                        <div class="stat-mini-label">Restant</div>
                    </div>
                    
                    <div class="hero-stat-mini secondary">
                        <div class="stat-mini-icon">
                            <i class="fas ${event.format === 'SINGLE_MATCH' ? 'fa-futbol' : 'fa-trophy'}"></i>
                        </div>
                        <div class="stat-mini-label">${event.format === 'SINGLE_MATCH' ? 'Match' : 'Tournoi'}</div>
                    </div>
                </div>
            </div>
        </div>
    `;
}



/* ============================================================================
   🏟️ SECTION INFORMATIONS PRATIQUES (NOUVEAU)
   ============================================================================ */
export function renderPracticalInfoSection(event) {
    // Vérifier s'il y a au moins une info à afficher
    const hasInfrastructure = event.numFields || event.surface;
    const hasServices = event.hasParking || event.hasVestiaires || event.hasDouches || 
                       event.hasBuvette || event.hasWifi || event.hasFirstAid;
    const hasRules = event.rules;
    const hasDeadline = event.registrationDeadline;
    const hasContact = event.contactEmail || event.contactPhone;

    // Si aucune info, ne rien afficher
    if (!hasInfrastructure && !hasServices && !hasRules && !hasDeadline && !hasContact) {
        return '';
    }

    return `
        <div class="practical-info-section">
            <h3 class="section-title-modern">
                <i class="fas fa-info-circle"></i>
                Informations pratiques
            </h3>

            <div class="practical-info-grid">
                <!-- 🏟️ INFRASTRUCTURES -->
                ${hasInfrastructure ? `
                <div class="info-card-modern">
                    <div class="info-card-header">
                        <i class="fas fa-building"></i>
                        <h4>Infrastructures</h4>
                    </div>
                    <div class="info-card-content">
                        ${event.numFields ? `
                        <div class="info-item-modern">
                            <i class="fas fa-map-marked-alt"></i>
                            <span><strong>${event.numFields} terrain${event.numFields > 1 ? 's' : ''}</span>
                        </div>
                        ` : ''}
                        ${event.surface ? `
                        <div class="info-item-modern">
                            <i class="fas fa-layer-group"></i>
                            <span>${formatSurface(event.surface)}</span>
                        </div>
                        ` : ''}
                    </div>
                </div>
                ` : ''}

                <!-- 🚗 SERVICES DISPONIBLES -->
                ${hasServices ? `
                <div class="info-card-modern">
                    <div class="info-card-header">
                        <i class="fas fa-concierge-bell"></i>
                        <h4>Services disponibles</h4>
                    </div>
                    <div class="info-card-content services-grid">
                        ${event.hasParking ? '<div class="service-badge"><i class="fas fa-parking"></i> Parking</div>' : ''}
                        ${event.hasVestiaires ? '<div class="service-badge"><i class="fas fa-door-open"></i> Vestiaires</div>' : ''}
                        ${event.hasDouches ? '<div class="service-badge"><i class="fas fa-shower"></i> Douches</div>' : ''}
                        ${event.hasBuvette ? '<div class="service-badge"><i class="fas fa-coffee"></i> Buvette</div>' : ''}
                        ${event.hasWifi ? '<div class="service-badge"><i class="fas fa-wifi"></i> WiFi</div>' : ''}
                        ${event.hasFirstAid ? '<div class="service-badge"><i class="fas fa-first-aid"></i> Secourisme</div>' : ''}
                    </div>
                </div>
                ` : ''}

                <!-- 📜 RÈGLEMENT -->
                ${hasRules ? `
                <div class="info-card-modern full-width">
                    <div class="info-card-header">
                        <i class="fas fa-file-contract"></i>
                        <h4>Règlement</h4>
                    </div>
                    <div class="info-card-content">
                        <p class="rules-text">${escapeHtml(event.rules)}</p>
                    </div>
                </div>
                ` : ''}

                <!-- ⏰ DATE LIMITE INSCRIPTION -->
                ${hasDeadline ? `
                <div class="info-card-modern">
                    <div class="info-card-header">
                        <i class="fas fa-clock"></i>
                        <h4>Date limite d'inscription</h4>
                    </div>
                    <div class="info-card-content">
                        <div class="info-item-modern highlight">
                            <i class="fas fa-calendar-times"></i>
                            <span>${formatDeadline(event.registrationDeadline)}</span>
                        </div>
                    </div>
                </div>
                ` : ''}

                <!-- 📞 CONTACT -->
                ${hasContact ? `
                <div class="info-card-modern">
                    <div class="info-card-header">
                        <i class="fas fa-phone"></i>
                        <h4>Contact</h4>
                    </div>
                    <div class="info-card-content">
                        ${event.contactEmail ? `
                        <div class="info-item-modern">
                            <i class="fas fa-envelope"></i>
                            <a href="mailto:${escapeHtml(event.contactEmail)}">${escapeHtml(event.contactEmail)}</a>
                        </div>
                        ` : ''}
                        ${event.contactPhone ? `
                        <div class="info-item-modern">
                            <i class="fas fa-phone-alt"></i>
                            <a href="tel:${escapeHtml(event.contactPhone)}">${escapeHtml(event.contactPhone)}</a>
                        </div>
                        ` : ''}
                    </div>
                </div>
                ` : ''}
            </div>
        </div>
    `;
}

/* ============================================================================
   🛠️ HELPERS POUR LES NOUVELLES INFOS
   ============================================================================ */
function formatSurface(surface) {
    const surfaces = {
        'SYNTHETIC': 'Synthétique',
        'NATURAL': 'Gazon naturel',
        'INDOOR': 'Salle couverte',
        'BEACH': 'Beach soccer'
    };
    return surfaces[surface] || surface;
}

function formatDeadline(deadline) {
    if (!deadline) return '';
    const date = new Date(deadline);
    return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/* ============================================================================
   📊 QUICK STATS HORIZONTAL SCROLL
   ============================================================================ */
export function renderQuickStatsScroll(event) {
    const isClubEvent = event.registrationType === "CLUB_ONLY";
    const registered = isClubEvent ? (event.teamsRegisteredByMyClub ?? 0) : (event.acceptedParticipants ?? 0);
    const max = isClubEvent ? (event.maxTeamsPerClub ?? event.maxParticipants) : (event.maxParticipants ?? "∞");
    const remaining = max === '∞' ? '∞' : (max - registered);

    return `
        <div class="quick-stats-scroll">
            <div class="stat-card-scroll">
                <div class="stat-icon-scroll">
                    <i class="fas ${isClubEvent ? 'fa-shield-alt' : 'fa-users'}"></i>
                </div>
                <div class="stat-info-scroll">
                    <div class="stat-value-scroll">${registered}/${max}</div>
                    <div class="stat-label-scroll">${isClubEvent ? 'Équipes' : 'Participants'}</div>
                </div>
            </div>
            
            <div class="stat-card-scroll accent">
                <div class="stat-icon-scroll">
                    <i class="fas fa-star"></i>
                </div>
                <div class="stat-info-scroll">
                    <div class="stat-value-scroll">${remaining}</div>
                    <div class="stat-label-scroll">Places restantes</div>
                </div>
            </div>
            
            <div class="stat-card-scroll">
                <div class="stat-icon-scroll">
                    <i class="fas fa-trophy"></i>
                </div>
                <div class="stat-info-scroll">
                    <div class="stat-value-scroll">${event.type}</div>
                    <div class="stat-label-scroll">Type</div>
                </div>
            </div>
            
            ${event.registrationClosed ? `
            <div class="stat-card-scroll danger">
                <div class="stat-icon-scroll">
                    <i class="fas fa-lock"></i>
                </div>
                <div class="stat-info-scroll">
                    <div class="stat-value-scroll">FERMÉ</div>
                    <div class="stat-label-scroll">Inscriptions</div>
                </div>
            </div>
            ` : event.isFull ? `
            <div class="stat-card-scroll warning">
                <div class="stat-icon-scroll">
                    <i class="fas fa-users-slash"></i>
                </div>
                <div class="stat-info-scroll">
                    <div class="stat-value-scroll">COMPLET</div>
                    <div class="stat-label-scroll">Événement</div>
                </div>
            </div>
            ` : `
            <div class="stat-card-scroll success">
                <div class="stat-icon-scroll">
                    <i class="fas fa-check-circle"></i>
                </div>
                <div class="stat-info-scroll">
                    <div class="stat-value-scroll">OUVERT</div>
                    <div class="stat-label-scroll">Inscriptions</div>
                </div>
            </div>
            `}
        </div>
    `;
}

/* ============================================================================
   🔒 ONGLETS STICKY MODERNES
   ============================================================================ */
export function renderStickyTabsPro(event, isOrganizer, currentUser) {
    const isSingleMatch = event?.format === "SINGLE_MATCH";
    const hasClubAccess = isOrganizer || currentUser?.clubId;

    if (isSingleMatch) {
        return `
            <div class="tabs-sticky-container">
                <div class="tabs-sticky-pro">
                    <button class="tab-pill active" data-tab="live">
                        <i class="fas fa-futbol"></i>
                        <span>Match</span>
                    </button>
                    <button class="tab-pill" data-tab="feed">
                        <i class="fas fa-newspaper"></i>
                        <span>Actualités</span>
                    </button>
                    <button class="tab-pill" data-tab="matches">
                        <i class="fas fa-info-circle"></i>
                        <span>Détails</span>
                    </button>
                </div>
            </div>
        `;
    }

    return `
        <div class="tabs-sticky-container">
            ${hasClubAccess ? `
            <div class="quota-info-compact">
                <i class="fas fa-shield-alt"></i>
                <span><strong>${event.teamsRegisteredByMyClub ?? 0}</strong> / ${event.maxTeamsPerClub ?? '∞'} équipes inscrites</span>
                ${event.remainingTeamsForMyClub !== null && event.remainingTeamsForMyClub > 0 ? 
                    `<span class="quota-remaining-chip">${event.remainingTeamsForMyClub} restant</span>` 
                    : ''}
            </div>
            ` : ''}
            
            <div class="tabs-sticky-pro">
                <button class="tab-pill active" data-tab="live">
                    <i class="fas fa-futbol"></i>
                    <span>En direct</span>
                </button>
                <button class="tab-pill" data-tab="rankings">
                    <i class="fas fa-list-ol"></i>
                    <span>Classements</span>
                </button>
                <button class="tab-pill" data-tab="bracket">
                    <i class="fas fa-trophy"></i>
                    <span>Phase finale</span>
                </button>
                <button class="tab-pill" data-tab="feed">
                    <i class="fas fa-newspaper"></i>
                    <span>Actualités</span>
                </button>
                <button class="tab-pill" data-tab="matches">
                    <i class="fas fa-calendar-day"></i>
                    <span>Matchs</span>
                </button>
            </div>
        </div>
    `;
}

/* ============================================================================
   🎯 CTA STICKY BOTTOM MODERNE
   ============================================================================ */
export function renderStickyCTAPro(event, isAuthenticated, isOrganizer, isRegistered, hasClub) {
    // Pas de CTA si organisateur ou déjà inscrit
    if (!isAuthenticated || isOrganizer || isRegistered) return '';

    const isClubEvent = event.registrationType === "CLUB_ONLY";
    
    // Événement fermé ou complet
    if (event.registrationClosed || event.isFull) {
        return `
            <div class="sticky-cta-pro disabled">
                <div class="cta-icon-pro">
                    <i class="fas fa-lock"></i>
                </div>
                <div class="cta-text-pro">
                    <div class="cta-title-pro">${event.registrationClosed ? 'Inscriptions fermées' : 'Événement complet'}</div>
                    <div class="cta-subtitle-pro">Plus de places disponibles</div>
                </div>
            </div>
        `;
    }

    // Événement club - quota atteint
    if (isClubEvent) {
        const quotaReached = event.maxTeamsPerClub !== null && event.remainingTeamsForMyClub === 0;
        
        if (quotaReached) {
            return `
                <div class="sticky-cta-pro disabled">
                    <div class="cta-icon-pro">
                        <i class="fas fa-shield-alt"></i>
                    </div>
                    <div class="cta-text-pro">
                        <div class="cta-title-pro">Quota atteint</div>
                        <div class="cta-subtitle-pro">Votre club a inscrit toutes ses équipes</div>
                    </div>
                </div>
            `;
        }

        // Équipes en attente
        if (event.pendingTeamsByMyClub > 0) {
            return `
                <div class="sticky-cta-pro pending">
                    <div class="cta-icon-pro">
                        <i class="fas fa-clock"></i>
                    </div>
                    <div class="cta-text-pro">
                        <div class="cta-title-pro">${event.pendingTeamsByMyClub} équipe${event.pendingTeamsByMyClub > 1 ? 's' : ''} en attente</div>
                        <div class="cta-subtitle-pro">Validation en cours</div>
                    </div>
                </div>
            `;
        }

        // CTA inscription club
        if (hasClub) {
            const registered = event.teamsRegisteredByMyClub ?? 0;
            const max = event.maxTeamsPerClub ?? '∞';
            
            return `
                <button class="sticky-cta-pro active" id="registerMyTeamBtn">
                    <div class="cta-icon-pro">
                        <i class="fas fa-shield-alt"></i>
                    </div>
                    <div class="cta-text-pro">
                        <div class="cta-title-pro">Inscrire mon équipe</div>
                        <div class="cta-subtitle-pro">${registered} / ${max} équipes inscrites</div>
                    </div>
                    <div class="cta-arrow-pro">
                        <i class="fas fa-arrow-right"></i>
                    </div>
                </button>
            `;
        }
    }

    // CTA inscription individuelle
    const registered = event.acceptedParticipants ?? 0;
    const max = event.maxParticipants ?? '∞';
    
    return `
        <button class="sticky-cta-pro active" id="registerBtn">
            <div class="cta-icon-pro">
                <i class="fas fa-user-plus"></i>
            </div>
            <div class="cta-text-pro">
                <div class="cta-title-pro">S'inscrire à l'événement</div>
                <div class="cta-subtitle-pro">${registered} / ${max} places prises</div>
            </div>
            <div class="cta-arrow-pro">
                <i class="fas fa-arrow-right"></i>
            </div>
        </button>
    `;
}