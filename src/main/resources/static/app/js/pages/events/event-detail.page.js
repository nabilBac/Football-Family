// /static/app/js/pages/events/event-detail.page.js
// ✅ VERSION REFACTORÉE - CODE PROPRE ET OPTIMISÉ

import { Auth } from "../../auth.js";
import { Router } from "../../router.js";
import * as Components from "./event-detail-components.js";

/* ============================================================================ */
/* 📦 VARIABLES GLOBALES                                                        */
/* ============================================================================ */
let event = null;
let currentUser = null;
let currentEventId = null;

/* ============================================================================ */
/* 🔁 LIVE POLLING CONTROL                                                      */
/* ============================================================================ */
let __liveInterval = null;

let __feedInterval = null;

let __filtersBound = false;

let __liveFocusMatchId = null;


let __matchFilter = "all"; // all | upcoming | live | finished
let __feedFilter = "all";  // all | live | result | ranking | media

let __matchesCache = null; // cache simple pour éviter de refetch en boucle

function stopFeedPolling() {
  if (__feedInterval) clearInterval(__feedInterval);
  __feedInterval = null;
}

function startFeedPolling(eventId) {
  stopFeedPolling();
  __feedInterval = setInterval(() => {
    if (document.hidden) return;
    loadLiveFeed(eventId).catch(console.error);
  }, 15000);
}

/* ============================================================================
   🎨 INJECTION CSS
   ============================================================================ */
function injectCSS() {
    const cssFiles = [
  '/css/event-detail.css'
];

    
    cssFiles.forEach(href => {
        if (!document.querySelector(`link[href="${href}"]`)) {
            const link = document.createElement("link");
            link.rel = "stylesheet";
            link.href = href;
            document.head.appendChild(link);
        }
    });
}

/* ============================================================================
   📊 CACHE POUR OPTIMISATION
   ============================================================================ */
const DataCache = {
    lastLiveMatchesHash: null,
    lastRankingsHash: null,
    lastBracketHash: null,
    
    // Générer un hash simple pour détecter les changements
    hash(data) {
        return JSON.stringify(data);
    },
    
    // Vérifier si les données ont changé
    hasChanged(key, newData) {
        const newHash = this.hash(newData);
        const oldHash = this[key];
        
        if (newHash !== oldHash) {
            this[key] = newHash;
            return true;
        }
        return false;
    }
};

/* ============================================================================
   🎯 RENDER PAGE
   ============================================================================ */
export async function render(params) {
    const eventId = params.id;
    currentEventId = eventId;

    try {
        // Fetch event data
       const response = await fetch(`/api/events/public/${eventId}`);
        if (!response.ok) throw new Error('Événement introuvable');
const response_data = await response.json();

// ✅ L'event est dans response_data.data (ApiResponse format)
event = response_data.data;

window.__EVENT__ = event;  

// ✅ currentUser vient probablement d'Auth
currentUser = Auth.currentUser;

// ✅ Calculer isOrganizer localement
const isOrganizer = currentUser && event.organizerId === currentUser.id;
const isRegistered = false; // TODO: à implémenter si besoin
const registrationStatus = null;
        const isAuthenticated = currentUser !== null;
        const hasClub = currentUser?.clubId != null;
        const isSingleMatch = event?.format === "SINGLE_MATCH";

        // Add body class for styling
        document.body.classList.add('is-event-detail-page');

        // Render user-specific section
        function renderUserSpecificSection() {
            if (!isAuthenticated) {
                return Components.renderGuestSection();
            }
           if (isOrganizer) {
 return "";
}

            if (isRegistered) {
                return Components.renderPlayerSection(registrationStatus);
            }
            return Components.renderVisitorSection();
        }

        // 🎯 NOUVELLE STRUCTURE PRO
        return `
            <div class="event-detail-page event-pro">
                ${Components.renderHeader(isOrganizer)}
                
                <!-- 🎨 HERO SECTION MODERNE -->
                ${Components.renderHeroSectionPro(event)}

                      <!-- Section utilisateur -->
                    ${renderUserSpecificSection()}
                <!-- 🆕 INFORMATIONS PRATIQUES -->
                ${Components.renderPracticalInfoSection(event)}
                
                <!-- 📊 QUICK STATS SCROLL -->
                ${Components.renderQuickStatsScroll(event)}
                
                <!-- 🔒 ONGLETS STICKY -->
                ${Components.renderStickyTabsPro(event, isOrganizer, currentUser)}
                
                <!-- 📄 CONTENU -->
                <div class="event-content-pro">
                    <!-- Description si présente -->
                    ${event.description ? Components.renderDescription(event.description) : ''}
                    
                    <!-- Contenus des onglets -->
                    <div class="tab-contents-pro">
                        <div id="tab-live" class="tab-content-pro active">
                            <div id="liveMatchesContainer"></div>
                        </div>
                        
                        ${!isSingleMatch ? `
                        <div id="tab-rankings" class="tab-content-pro">
                            <div id="rankingsContainer"></div>
                        </div>
                        
                        <div id="tab-bracket" class="tab-content-pro">
                            <div id="bracketContainer"></div>
                        </div>
                        ` : ''}
                        
                        <div id="tab-feed" class="tab-content-pro">
                            <div id="feedFilters" class="feed-filters"></div>
                            <div id="liveFeedContainer"></div>
                        </div>
                        
                        <div id="tab-matches" class="tab-content-pro">
                            <div id="matchFilters" class="match-filters"></div>
                            <div id="allMatchesContainer"></div>
                        </div>
                    </div>
                    
                  
                </div>
                
                <!-- 🎯 CTA STICKY BOTTOM -->
                ${Components.renderStickyCTAPro(event, isAuthenticated, isOrganizer, isRegistered, hasClub)}
                
                <!-- Modales -->
                ${Components.renderRegistrationModal()}
                ${Components.renderClubRegistrationModal(event)}
                ${Components.renderToast()}
            </div>
        `;
    } catch (error) {
        console.error('Erreur lors du chargement:', error);
        return `
            <div class="event-detail-page">
                <div class="error-state">
                    <i class="fas fa-exclamation-circle"></i>
                    <h2>Erreur</h2>
                    <p>${error.message}</p>
                    <button onclick="history.back()" class="btn-primary">Retour</button>
                </div>
            </div>
        `;
    }
}

/* ============================================================================
   🎭 HELPER : SECTION RÔLE
   ============================================================================ */
function renderRoleSection(event, isOrganizer, isRegistered, registrationStatus, isAuthenticated) {
    if (isOrganizer) {
        return Components.renderOrganizerSection(event);
    }
    
    if (isRegistered) {
        return Components.renderPlayerSection(registrationStatus);
    }
    
    if (isAuthenticated) {
        return Components.renderVisitorSection();
    }
    
    return Components.renderGuestSection();
}

/* ============================================================================
   ❌ HELPER : ERREUR
   ============================================================================ */
function renderError(title, message) {
    return `
        <div class="event-detail-page">
            <div class="error-container">
                <i class="fas fa-exclamation-circle"></i>
                <h2>${Components.escapeHtml(title)}</h2>
                <p>${Components.escapeHtml(message)}</p>
                <button class="btn-primary" onclick="history.back()">Retour</button>
            </div>
        </div>
    `;
}

/* ============================================================================
   🚀 INIT PAGE
   ============================================================================ */
export function init(params) {
    injectCSS();
    
    // 🔍 DEBUG
    const cssLoaded = document.querySelector('link[href="/css/event-detail.css"]');
    console.log("CSS event-detail chargé ?", cssLoaded !== null);
    
    // Appliquer classe CSS au body
    document.body.classList.remove("is-events-page");
    document.body.classList.add("is-event-detail-page");
    
    const eventId = params.id;  // ✅ RÉCUPÉRER L'ID
    const event = window.__EVENT__;
    
    if (!event) {
        console.error("❌ Event non trouvé dans window.__EVENT__");
        return;
    }
    
    console.log("✅ Event chargé:", event.name);
    
    // ✅ Match unique : nettoyer l'onglet tournoi mémorisé
    if (event?.format === "SINGLE_MATCH") {
        localStorage.removeItem("tournamentActiveTab");
    }
    
    const currentUser = Auth.currentUser;
    const isOrganizer = currentUser && event.organizerId === currentUser.id;
    
    // Initialiser les handlers
    initBackButton();
    initToastSystem();
    initRegistrationButtons(eventId, event);
    
    const isSingleMatch = event?.format === "SINGLE_MATCH";
    const isTournament = !isSingleMatch;
    
    if (isTournament) {
        initTournamentButtons(eventId, currentUser);
        initTournamentTabs(event.status);
        loadLiveMatches(eventId);  // ✅ CHARGER LES DONNÉES AU DÉMARRAGE
    } else if (isSingleMatch) {
        initTournamentTabs(event.status);
        loadLiveMatches(eventId);  // ✅ AUSSI POUR MATCH UNIQUE
    }

   if (!__filtersBound) {
  __filtersBound = true;

// ✅ Delegation filtres "Matchs"
document.addEventListener("click", (e) => {
  if (!document.body.classList.contains("is-event-detail-page")) return;

  const btn = e.target.closest("[data-match-filter]");
  if (!btn) return;
  __matchFilter = btn.dataset.matchFilter;
  renderAllMatches();
});

// ✅ Delegation filtres "Actu"
document.addEventListener("click", (e) => {
  if (!document.body.classList.contains("is-event-detail-page")) return;

  const btn = e.target.closest("[data-feed-filter]");
  if (!btn) return;
  __feedFilter = btn.dataset.feedFilter;
  const id = window.__EVENT__?.id;
  if (id) loadLiveFeed(id);
});

// ✅ Delegation navigation (Tournoi terminé -> aller vers un onglet)
document.addEventListener("click", (e) => {
  if (!document.body.classList.contains("is-event-detail-page")) return;

  const btn = e.target.closest("[data-goto-tab]");
  if (!btn) return;
  const tab = btn.dataset.gotoTab;
  document.querySelector(`.tournament-tab[data-tab="${tab}"]`)?.click();
});

// ✅ Focus match live au clic (1 seule timeline)
document.addEventListener("click", (e) => {
  if (!document.body.classList.contains("is-event-detail-page")) return;

  const card = e.target.closest('[data-live-focus="1"]');
  if (!card) return;

  const id = Number(card.dataset.matchId);
  if (!id) return;

  __liveFocusMatchId = id;

  const eventId = window.__EVENT__?.id;
  if (eventId) loadLiveMatches(eventId); // rerender avec le nouveau focus
});



}

}

/* ============================================================================
   🔙 BOUTON RETOUR
   ============================================================================ */
function initBackButton() {
    const backBtn = document.getElementById("backBtn");
    if (backBtn) {
        backBtn.addEventListener("click", () => history.back());
    }
}

/* ============================================================================
   📢 SYSTÈME TOAST
   ============================================================================ */
let toastTimeout = null;

function showToast(message, type = "info") {
    const toast = document.getElementById("toast");
    if (!toast) return;
    
    // Annuler le timeout précédent
    if (toastTimeout) clearTimeout(toastTimeout);
    
    toast.textContent = message;
    toast.className = "toast show";

    const colors = {
        success: "#10B981",
        error: "#ef4444",
        warning: "#f59e0b",
        info: "#3b82f6"
    };
    
    toast.style.background = colors[type] || colors.info;
    
    toastTimeout = setTimeout(() => {
        toast.classList.remove("show");
    }, 3000);
}

function initToastSystem() {
    // Exposer globalement pour faciliter l'usage
    window.showToast = showToast;
}

/* ============================================================================
   🎮 BOUTONS INSCRIPTION
   ============================================================================ */
function initRegistrationButtons(eventId, event) {
    // Inscription individuelle
    initIndividualRegistration(eventId, event);
    
    // Inscription club
    initClubRegistration(eventId, event);
}

/* ============================================================================
   👤 INSCRIPTION INDIVIDUELLE
   ============================================================================ */
function initIndividualRegistration(eventId, event) {
    const registerBtn = document.getElementById("registerBtn");
    if (!registerBtn || event.registrationType !== "INDIVIDUAL") return;

    const modal = document.getElementById("registrationModal");
    const cancelBtn = modal.querySelector("#cancelModal");
    const submitBtn = modal.querySelector("#confirmRegistration");
    const overlay = modal.querySelector(".utf-modal-overlay");

    // Ouvrir
    registerBtn.addEventListener("click", () => {
        modal.classList.remove("hidden");
        
        // Focus sur premier champ
        setTimeout(() => {
            modal.querySelector('#reg-level').focus();
        }, 100);
    });

    // Fermer
    const closeModal = () => modal.classList.add("hidden");
    
    cancelBtn.addEventListener("click", closeModal);
    overlay.addEventListener("click", closeModal);
    
    // ESC pour fermer
    modal.addEventListener("keydown", (e) => {
        if (e.key === "Escape") closeModal();
    });

    // Soumettre
    submitBtn.addEventListener("click", async () => {
        const level = document.getElementById('reg-level').value;
        const position = document.getElementById('reg-position').value;
        const notes = document.getElementById('reg-notes').value;

        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Inscription...';

        try {
            const res = await Auth.secureFetch(
                `/api/events/registration/${eventId}/register`,
                {
                    method: "POST",
                    body: JSON.stringify({ level, preferredPosition: position, notes })
                }
            );

            const result = await res.json();

            if (res.ok && result.success) {
                showToast("✅ Inscription envoyée avec succès !", "success");
                closeModal();
                setTimeout(() => Router.go(`/events/${eventId}`), 1000);
            } else {
                throw new Error(result.message || "Erreur inscription");
            }
        } catch (err) {
            showToast("❌ " + err.message, "error");
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = "Valider";
        }
    });
}

/* ============================================================================
   🏟️ INSCRIPTION CLUB
   ============================================================================ */
function initClubRegistration(eventId, event) {
    const registerMyTeamBtn = document.getElementById("registerMyTeamBtn");
    if (!registerMyTeamBtn) return;

    const modal = document.getElementById("clubRegistrationModal");
    const cancelClubBtn = modal.querySelector("#cancelClubModal");
    const confirmClubBtn = modal.querySelector("#confirmClubRegistration");
    const teamsContainer = modal.querySelector("#club-teams-checkboxes");
    const teamCountSelect = modal.querySelector("#teamCountSelect");
    const overlay = modal.querySelector(".utf-modal-overlay");

    // Ouvrir
registerMyTeamBtn.addEventListener("click", () => {
    // Vérifier quota
    const quota = Number(event.maxTeamsPerClub ?? 0);
    const already = Number(event.teamsRegisteredByMyClub ?? 0);
    const remaining = quota > 0 ? Math.max(0, quota - already) : Infinity;

    if (quota > 0 && remaining === 0) {
        showToast("Quota d'équipes atteint pour votre club", "warning");
        return;
    }

    document.querySelector(".sticky-cta-pro")?.style.setProperty("display","none","important"); // ✅ AJOUT ICI

    modal.classList.remove("hidden");
    loadClubTeams();
});


    // Fermer
    const closeModal = () => modal.classList.add("hidden");
    
    cancelClubBtn.addEventListener("click", closeModal);
    overlay.addEventListener("click", closeModal);
    
    modal.addEventListener("keydown", (e) => {
        if (e.key === "Escape") closeModal();
    });

    // Charger équipes
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

            // Calculer max sélectionnable
          const quota = Number(event.maxTeamsPerClub ?? 0);
const already = Number(event.teamsRegisteredByMyClub ?? 0);
const remaining = quota > 0 ? Math.max(0, quota - already) : teams.length;

const maxOptions = Math.max(1, Math.min(remaining, teams.length));

            
            // Remplir select
            for (let i = 1; i <= maxOptions; i++) {
                const opt = document.createElement("option");
                opt.value = String(i);
                opt.textContent = `${i} équipe${i > 1 ? "s" : ""}`;
                teamCountSelect.appendChild(opt);
            }
          teamCountSelect.value = "1";


            // TODO: Charger équipes déjà inscrites
            const registeredSet = new Set();

            // Render checkboxes
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
                            ${Components.escapeHtml(team.name)} (${Components.escapeHtml(team.category)})
                            ${alreadyRegistered ? `<small style="margin-left:8px;color:#ef4444;">(déjà inscrite)</small>` : ""}
                        </span>
                    </label>
                `;
            });

            // Handler changement
            teamsContainer.onchange = (e) => {
                const limit = parseInt(teamCountSelect.value, 10);
                const checked = teamsContainer.querySelectorAll(".team-check:checked").length;

                if (checked > limit) {
                    e.target.checked = false;
                    showToast(`Tu ne peux sélectionner que ${limit} équipe(s).`, "warning");
                }
            };

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

    // Soumettre
    confirmClubBtn.addEventListener("click", async () => {
        const selectedTeams = [
            ...modal.querySelectorAll(".team-check:checked")
        ].map(cb => parseInt(cb.value));

        if (selectedTeams.length === 0) {
            showToast("⚠️ Sélectionnez au moins une équipe", "warning");
            return;
        }

        confirmClubBtn.disabled = true;
        confirmClubBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Inscription...';

        try {
            let successCount = 0;
            
            for (const teamId of selectedTeams) {
                const res = await Auth.secureFetch(
                    `/api/events/registration/${eventId}/register-team`,
                    {
                        method: "POST",
                        body: JSON.stringify({ teamId })
                    }
                );

                if (res.ok) {
                    successCount++;
                } else if (res.status === 409) {
                    // Déjà inscrit
                    continue;
                } else {
                    const result = await res.json();
                    throw new Error(result.message || "Erreur inscription");
                }
            }

            if (successCount > 0) {
                showToast(
                    `✅ ${successCount} équipe(s) inscrite(s) (en attente de validation)`,
                    "success"
                );
                closeModal();
                setTimeout(() => Router.go(`/events/${eventId}`), 1000);
            } else {
                showToast("⛔ Aucune équipe n'a été inscrite", "warning");
            }

        } catch (err) {
            showToast("❌ " + err.message, "error");
        } finally {
            confirmClubBtn.disabled = false;
            confirmClubBtn.innerHTML = "Inscrire les équipes";
        }
    });
}

/* ============================================================================
   📑 SYSTÈME D'ONGLETS TOURNOI (ADAPTÉ POUR COMPLETED)
   ============================================================================ */
function initTournamentTabs(eventStatus) {
   const tabs = document.querySelectorAll('.tournament-tab, .tab-pill');
    const contents = document.querySelectorAll('.tournament-tab-content, .tab-content-pro');
    
    if (tabs.length === 0) return;
    
    const event = window.__EVENT__;
    const eventId = event?.id;
    const isCompleted = eventStatus === 'COMPLETED';
    
    tabs.forEach(tab => {
        tab.addEventListener('click', async () => {
            const targetTab = tab.dataset.tab;
            
            // Désactiver tous les onglets
            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));
            
            // Activer l'onglet cliqué
            tab.classList.add('active');
            const targetContent = document.getElementById(`tab-${targetTab}`);
            if (targetContent) {
                targetContent.classList.add('active');
            }
            
            // 🔥 CHARGER LES DONNÉES SELON L'ONGLET
            if (eventId) {
                switch (targetTab) {
  case 'live':
    stopFeedPolling();             // ✅ nouveau
    if (isCompleted) {
      stopLivePolling();
      showTournamentFinishedMessage();
      return;
    }
    startLivePolling(eventId);
    await loadLiveMatches(eventId);
    break;

  case 'feed':
    stopLivePolling();             // ✅ on coupe le live
    startFeedPolling(eventId);     // ✅ nouveau : on active le polling feed
    await loadLiveFeed(eventId);
    break;

  case 'matches':
    stopLivePolling();
    stopFeedPolling();             // ✅ nouveau
    await loadAllMatches(eventId);
    break;

  case 'rankings':
    stopLivePolling();
    stopFeedPolling();             // ✅ nouveau
    await loadRankings(eventId);
    break;

  case 'bracket':
    stopLivePolling();
    stopFeedPolling();             // ✅ nouveau
    await loadBracket(eventId);
    break;
}

            }
            
            // Sauvegarder l'onglet actif
            localStorage.setItem('tournamentActiveTab', targetTab);
        });
    });
    
    // 🆕 ONGLET PAR DÉFAUT SELON STATUT
    let defaultTab = 'live';
    
    if (isCompleted) {
        // Pour tournoi terminé : afficher classements ou bracket
        defaultTab = 'rankings';
    }
    
    const savedTab = localStorage.getItem('tournamentActiveTab');
    const tabToActivate = savedTab || defaultTab;
    
    const tabBtn = document.querySelector(`.tournament-tab[data-tab="${tabToActivate}"]`);
    if (tabBtn) {
        tabBtn.click();
    }
}

/* ============================================================================
   🏆 BOUTONS TOURNOI
   ============================================================================ */
function initTournamentButtons(eventId, currentUser) {
    // Bouton "Voir les groupes"
    const viewGroupsBtn = document.getElementById("viewGroupsBtn");
    if (viewGroupsBtn) {
        viewGroupsBtn.addEventListener("click", () => {
            const clubId = currentUser?.clubId || 1;
            Router.go(`/clubs/${clubId}/events/${eventId}/groups`);
        });
    }

    // Bouton "Tous les matchs"
    const viewAllMatchesBtn = document.getElementById("viewAllMatchesBtn");
    if (viewAllMatchesBtn) {
        viewAllMatchesBtn.addEventListener("click", () => {
            console.log("Tous les matchs pour l'event", eventId);
            // TODO: Implémenter navigation
        });
    }
}

/* ============================================================================
   🔴 LIVE AUTO-REFRESH (OPTIMISÉ)
   ============================================================================ */
function initTournamentLive(eventId) {
    // Charger immédiatement
    loadLiveData(eventId);

    // 🔥 AUTO-REFRESH TOUTES LES 10 SECONDES (au lieu de 30)
    const refreshInterval = setInterval(() => {
        if (document.hidden) return;
        loadLiveData(eventId);
    }, 10000); // 10 secondes pour le live

    window.addEventListener("beforeunload", () => {
        clearInterval(refreshInterval);
    });
    
    document.addEventListener("visibilitychange", () => {
        if (!document.hidden) {
            loadLiveData(eventId);
        }
    });
}


function startLivePolling(eventId) {
    // 🛑 sécurité : un seul polling à la fois
    if (__liveInterval) return;

    console.log("[LIVE] polling démarré pour event", eventId);

    __liveInterval = setInterval(() => {
        if (document.hidden) return;

        loadLiveMatches(eventId).catch(err => {
            console.error("[LIVE] erreur polling", err);
        });
    }, 10000); // 10 secondes
}

function stopLivePolling() {
    if (__liveInterval) {
        clearInterval(__liveInterval);
        __liveInterval = null;
        console.log("[LIVE] polling stoppé");
    }
}


/* ============================================================================
   📡 CHARGER DONNÉES LIVE
   ============================================================================ */
async function loadLiveData(eventId) {
    await Promise.allSettled([
        refreshEventStatus(eventId),  // ✅ NOUVEAU
        loadLiveMatches(eventId),
        loadRankings(eventId),
        loadBracket(eventId),
        loadLiveFeed(eventId)
    ]);
}


/* ============================================================================
   🔄 RAFRAÎCHIR LE STATUT DE L'ÉVÉNEMENT
   ============================================================================ */
async function refreshEventStatus(eventId) {
    try {
        const res = await Auth.secureFetch(`/api/events/public/${eventId}`);
        const data = await res.json();
        
        if (!res.ok) return;
        
        const event = data.data;
        
        // Mettre à jour le badge de statut
        const titleSection = document.querySelector('.event-title-section');
        if (titleSection) {
            const oldBadge = titleSection.querySelector('.event-status-badge');
            const newBadgeHTML = Components.renderEventStatusBadge(event);
            
            if (oldBadge && newBadgeHTML) {
                const temp = document.createElement('div');
                temp.innerHTML = newBadgeHTML;
                oldBadge.replaceWith(temp.firstElementChild);
            } else if (!oldBadge && newBadgeHTML) {
                // Insérer le badge après le titre
                const title = titleSection.querySelector('.event-title');
                if (title) {
                    const temp = document.createElement('div');
                    temp.innerHTML = newBadgeHTML;
                    title.after(temp.firstElementChild);
                }
            }
        }
        
    } catch (err) {
        console.error('Erreur rafraîchissement statut:', err);
    }
}

/* ============================================================================
   🔴 MATCHS EN DIRECT (OPTIMISÉ + AVEC MESSAGE SI VIDE)
   ============================================================================ */
async function loadLiveMatches(eventId) {


const event = window.__EVENT__;
if (!event) return;


    const container = document.getElementById("liveMatchesContainer");
    if (!container) return;

    try {
        const res = await Auth.secureFetch(`/api/events/public/${eventId}/matches`);
        const data = await res.json();
        if (!res.ok) throw new Error();

        const allMatches = data.data || [];
        
        // Matchs EN DIRECT
       const liveMatches = allMatches.filter(m =>
    ["IN_PROGRESS", "ONGOING"].includes(m.status)
);

            // ✅ Focus par défaut : le 1er match live
if (!__liveFocusMatchId && liveMatches.length > 0) {
  __liveFocusMatchId = liveMatches[0].id;
}

        
        // PROCHAINS MATCHS (statut SCHEDULED avec date/heure)
        const upcomingMatches = allMatches
            .filter(m => m.status === "SCHEDULED" && m.time)
            .sort((a, b) => {
                const dateA = new Date(`${a.date}T${a.time}`);
                const dateB = new Date(`${b.date}T${b.time}`);
                return dateA - dateB;
            })
            .slice(0, 10);


            // 🟡 MATCHS TERMINÉS (résultats récents)
const finishedMatches = allMatches
    .filter(m => m.status === "COMPLETED")
    .sort((a, b) =>
        new Date(b.updatedAt || `${b.date}T${b.time || "00:00"}`) -
        new Date(a.updatedAt || `${a.date}T${a.time || "00:00"}`)
    )
    .slice(0, 5);



                // ✅ Mini-cache : ne pas rerender si rien n'a changé
const normalize = (m) => ([
  m.id,
  m.status,
  m.scoreTeamA ?? 0,
  m.scoreTeamB ?? 0,
  m.elapsedMinutes ?? null,
  m.updatedAt ?? null,
  m.date ?? null,
  m.time ?? null
]);

const snapshot = {
  live: [...liveMatches].sort((a,b)=>a.id-b.id).map(normalize),
  upcoming: [...upcomingMatches].sort((a,b)=>a.id-b.id).map(normalize),
  finished: [...finishedMatches].sort((a,b)=>a.id-b.id).map(normalize),
};

const hash = JSON.stringify(snapshot);

if (DataCache.lastLiveMatchesHash === hash) {
  console.log("[LIVE] aucun changement -> pas de rerender");
  return;
}
DataCache.lastLiveMatchesHash = hash;



        // ✅ SI AUCUN MATCH
        if (liveMatches.length === 0 && upcomingMatches.length === 0) {
            container.innerHTML = `
                <div class="empty-state-live">
                    <i class="fas fa-futbol"></i>
                    <p>Aucun match prévu actuellement</p>
                    <small style="opacity: 0.7; font-size: 0.85rem;">Le planning sera affiché dès sa création</small>
                </div>
            `;
            return;
        }

        let html = '';

        // ✅ MATCHS EN DIRECT
        if (liveMatches.length > 0) {

            html += `
                <div style="margin-bottom: 30px;">
                    <h3 style="
                        color: #e74c3c; 
                        font-size: 1.1em; 
                        margin: 0 0 15px 0; 
                        display: flex; 
                        align-items: center; 
                        gap: 8px;
                        font-weight: 700;
                    ">
                        <span style="
                            display: inline-block; 
                            width: 10px; 
                            height: 10px; 
                            background: #e74c3c; 
                            border-radius: 50%; 
                            animation: pulse 1.5s infinite;
                        "></span>
                        EN DIRECT MAINTENANT
                    </h3>
            `;
            
                        // ✅ Étape 3 : limiter la timeline à 2 matchs live max (perf)
// ✅ 2 matchs avec timeline : le focus + 1 autre
const focusId = __liveFocusMatchId ?? liveMatches[0]?.id;

const focusMatch = liveMatches.find(m => m.id === focusId) || liveMatches[0];
const secondMatch = liveMatches.find(m => m.id !== focusMatch?.id) || null;

const liveToDecorate = [focusMatch, secondMatch].filter(Boolean);


// ✅ Fetch events en parallèle
const eventsPairs = await Promise.all(
  liveToDecorate.map(async (m) => {
    try {
      const eventsRes = await fetch(`/api/public/live/match/${m.id}/events`);
      if (!eventsRes.ok) return [m.id, []];
      const eventsData = await eventsRes.json();
      return [m.id, eventsData.data || []];
    } catch (e) {
      return [m.id, []];
    }
  })
);

const eventsByMatchId = new Map(eventsPairs);



            for (const match of liveMatches) {
                // 🔥 CHARGER LES ÉVÉNEMENTS DU MATCH
              const matchEvents = eventsByMatchId.get(match.id) || [];

                
                html += `
                    <div data-live-focus="1" data-match-id="${match.id}" style="
  background: white;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(231, 76, 60, 0.2);
  border-left: 4px solid #e74c3c;
">

                        <!-- EN-TÊTE MATCH -->
                        <div style="
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                            margin-bottom: 12px;
                            font-size: 0.85em;
                            color: #7f8c8d;
                        ">
                            <span style="font-weight: 600;">
                                ${Components.escapeHtml(match.round || "Match")}
                            </span>
                            <span style="color: #e74c3c; font-weight: 700;">
                                🔴 ${match.elapsedMinutes ?? 0}'
                            </span>
                        </div>
                        
                        <!-- SCORE -->
                        <div style="
                            display: flex;
                            align-items: center;
                            justify-content: space-between;
                            gap: 12px;
                            margin-bottom: 15px;
                            padding-bottom: 15px;
                            border-bottom: 2px solid #ecf0f1;
                        ">
                            <div style="flex: 1; text-align: left; font-weight: 600; color: #2c3e50;">
                                ${Components.escapeHtml(match.teamA || "?")}
                            </div>
                            <div style="
                                font-size: 1.5em;
                                font-weight: 700;
                                color: #2c3e50;
                                padding: 8px 16px;
                                background: #f8f9fa;
                                border-radius: 8px;
                            ">
                                ${match.scoreTeamA ?? 0} - ${match.scoreTeamB ?? 0}
                            </div>
                            <div style="flex: 1; text-align: right; font-weight: 600; color: #2c3e50;">
                                ${Components.escapeHtml(match.teamB || "?")}
                            </div>
                        </div>
                        
                        ${matchEvents.length > 0 ? `
                            <!-- TIMELINE DES ÉVÉNEMENTS -->
                            <div style="background: #f8f9fa; padding: 12px; border-radius: 8px;">
                                <h4 style="margin: 0 0 10px 0; font-size: 0.9em; color: #2c3e50; font-weight: 700;">
                                    📊 Timeline du match
                                </h4>
                                <div style="display: flex; flex-direction: column; gap: 8px; max-height: 200px; overflow-y: auto;">
                                    ${matchEvents.slice(0, 10).map(event => {
                                        const eventIcons = {
                                            'GOAL': '⚽',
                                            'YELLOW_CARD': '🟨',
                                            'RED_CARD': '🟥',
                                            'SUBSTITUTION': '🔄',
                                            'HALF_TIME': '⏱️',
                                            'FULL_TIME': '🏁',
                                            'PENALTY_SHOOTOUT': '🎯',
                                            'MATCH_STARTED': '🟢'
                                        };
                                        
                                        const icon = eventIcons[event.type] || '📌';
                                        const minute = event.minute !== null ? `${event.minute}'` : '';
                                        const player = event.playerName ? ` - ${Components.escapeHtml(event.playerName)}` : '';
                                        const team = event.teamName ? ` (${Components.escapeHtml(event.teamName)})` : '';
                                        
                                        return `
                                            <div style="
                                                background: white;
                                                padding: 8px 12px;
                                                border-radius: 6px;
                                                font-size: 0.85em;
                                                display: flex;
                                                align-items: center;
                                                gap: 8px;
                                            ">
                                                <span style="font-weight: 700; color: #3498db; min-width: 35px;">
                                                    ${minute}
                                                </span>
                                                <span style="font-size: 1.2em;">
                                                    ${icon}
                                                </span>
                                                <span style="flex: 1; color: #2c3e50;">
                                                    <strong>${event.type.replace('_', ' ')}</strong>${player}${team}
                                                </span>
                                            </div>
                                        `;
                                    }).join('')}
                                </div>
                            </div>
                        ` : ''}
                    </div>
                `;
            }
            
            html += `</div>`;
        }


        // 🟡 RÉSULTATS RÉCENTS (MATCHS TERMINÉS)
if (finishedMatches.length > 0) {
    html += `
        <div class="finished-matches-section">
            <h3 class="section-title">
                ✅ Résultats récents
            </h3>

            ${finishedMatches.map(match => `
                <div class="match-card finished">
                    <div class="match-row match-row-grid">

                       <span class="finished-team-name">
                            ${Components.escapeHtml(match.teamA)}
                        </span>

                        <strong class="match-score">
                            ${match.scoreTeamA ?? 0} - ${match.scoreTeamB ?? 0}
                        </strong>

                       <span class="finished-team-name">
                            ${Components.escapeHtml(match.teamB)}
                        </span>
                    </div>

                    <div class="match-status">
                        Match terminé
                    </div>
                </div>
            `).join("")}
        </div>
    `;
}


        // ✅ PROCHAINS MATCHS AVEC HORAIRES
        if (upcomingMatches.length > 0) {
            html += `
                <div>
                    <h3 style="
                        color: #3498db; 
                        font-size: 1.1em; 
                        margin: 0 0 15px 0; 
                        font-weight: 700;
                    ">
                        📅 Prochains matchs
                    </h3>
                    ${upcomingMatches.map(match => {
                        const time = match.time ? match.time.substring(0, 5) : "-";
                        const field = match.field || "";
                        const date = match.date ? new Date(match.date + 'T00:00:00').toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short'
                        }) : "";
                        
                        return `
                            <div style="
                                background: white;
                                border-radius: 12px;
                                padding: 16px;
                                margin-bottom: 12px;
                                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                                border-left: 4px solid #3498db;
                            ">
                                <!-- EN-TÊTE : DATE + HEURE + TERRAIN -->
                                <div style="
                                    display: flex;
                                    justify-content: space-between;
                                    align-items: center;
                                    margin-bottom: 12px;
                                    padding-bottom: 10px;
                                    border-bottom: 1px solid #ecf0f1;
                                    font-size: 0.85em;
                                    color: #7f8c8d;
                                    font-weight: 600;
                                ">
                                    <span>${date}</span>
                                    <span style="color: #3498db; font-size: 1.1em; font-weight: 700;">
                                        🕐 ${time}
                                    </span>
                                    ${field ? `
                                        <span style="
                                            padding: 4px 10px;
                                            background: #f8f9fa;
                                            border-radius: 12px;
                                            font-size: 0.9em;
                                        ">
                                            📍 ${Components.escapeHtml(field)}
                                        </span>
                                    ` : ''}
                                </div>
                                
                                <!-- MATCH -->
                                <div style="display: flex; flex-direction: column; gap: 6px;">
                                    <div style="font-weight: 600; color: #2c3e50; font-size: 0.95em;">
                                        ${Components.escapeHtml(match.teamA || "?")}
                                    </div>
                                    <div style="text-align: center; color: #95a5a6; font-weight: 700; font-size: 0.85em;">
                                        VS
                                    </div>
                                    <div style="font-weight: 600; color: #2c3e50; font-size: 0.95em;">
                                        ${Components.escapeHtml(match.teamB || "?")}
                                    </div>
                                </div>
                                
                                ${match.round ? `
                                    <div style="
                                        margin-top: 10px;
                                        padding-top: 10px;
                                        border-top: 1px solid #ecf0f1;
                                        font-size: 0.8em;
                                        color: #95a5a6;
                                        text-align: center;
                                    ">
                                        ${Components.escapeHtml(match.round)}
                                    </div>
                                ` : ''}
                            </div>
                        `;
                    }).join("")}
                </div>
            `;
        }

        container.innerHTML = html;

    } catch (err) {
        console.error("Erreur loadLiveMatches:", err);
        container.innerHTML = `
            <div class="empty-state-live">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Erreur de chargement des matchs</p>
            </div>
        `;
    }
}

function renderMatchFilters() {
  const box = document.getElementById("matchFilters");
  if (!box) return;

  box.innerHTML = `
    <button class="chip ${__matchFilter==="all"?"active":""}" data-match-filter="all">Tous</button>
    <button class="chip ${__matchFilter==="upcoming"?"active":""}" data-match-filter="upcoming">À venir</button>
    <button class="chip ${__matchFilter==="live"?"active":""}" data-match-filter="live">En cours</button>
    <button class="chip ${__matchFilter==="finished"?"active":""}" data-match-filter="finished">Terminés</button>
  `;
}

function renderAllMatches() {
  const container = document.getElementById("allMatchesContainer");
  if (!container || !__matchesCache) return;

  renderMatchFilters();

  const filtered = __matchesCache.filter(m => {
    if (__matchFilter === "live") return ["IN_PROGRESS","ONGOING"].includes(m.status);
    if (__matchFilter === "upcoming") return m.status === "SCHEDULED";
    if (__matchFilter === "finished") return ["COMPLETED","FINISHED"].includes(m.status);
    return true;
  });

  container.innerHTML = filtered.map(m => `
    <div class="match-card ${["COMPLETED","FINISHED"].includes(m.status) ? "finished" : ""}" data-match-id="${m.id}">
      <div class="match-row match-row-grid">
        <div class="finished-team-name">${Components.escapeHtml(m.teamA || "?")}</div>
        <strong class="match-score">${m.scoreTeamA ?? "-"} - ${m.scoreTeamB ?? "-"}</strong>
        <div class="finished-team-name" style="text-align:right;">${Components.escapeHtml(m.teamB || "?")}</div>
      </div>

      <div class="match-status">
        ${formatMatchStatus(m)}
        ${m.time ? ` • ${m.time.slice(0,5)}` : ""}
        ${m.round ? ` • ${Components.escapeHtml(m.round)}` : ""}
        ${m.groupName ? ` • Groupe ${Components.escapeHtml(m.groupName)}` : ""}
      </div>

      ${(m.competitionLevel || m.fieldType) ? `
        <div class="match-details">
          ${m.competitionLevel ? `
            <span class="match-detail">
              <i class="fas fa-trophy"></i>
              ${formatCompetitionLevel(m.competitionLevel)}
            </span>
          ` : ""}
          ${m.fieldType ? `
            <span class="match-detail">
              <i class="fas fa-map-marked-alt"></i>
              ${formatFieldType(m.fieldType)}
            </span>
          ` : ""}
        </div>
      ` : ""}
    </div>
  `).join("") || `<div class="ed-empty">Aucun match</div>`;
}

/* ============================================================================
   📊 TOUS LES MATCHS (HISTORIQUE COMPLET)
   ============================================================================ */
async function loadAllMatches(eventId) {
  const container = document.getElementById("allMatchesContainer");
  if (!container) return;

  try {
    const res = await fetch(`/api/events/public/${eventId}/matches`);

    if (!res.ok) {
      const txt = await res.text();
      console.error("API /matches error", res.status, txt);
      throw new Error(`HTTP ${res.status}`);
    }

    const data = await res.json();
    const allMatches = data.data || [];

    if (allMatches.length === 0) {
      __matchesCache = [];
      container.innerHTML = `
        <div class="empty-state-live">
          <i class="fas fa-futbol"></i>
          <p>Aucun match</p>
        </div>
      `;
      return;
    }

    allMatches.sort((a, b) => {
      const dateA = new Date(`${a.date || "1970-01-01"}T${(a.time || "00:00").slice(0,5)}`);
      const dateB = new Date(`${b.date || "1970-01-01"}T${(b.time || "00:00").slice(0,5)}`);
      return dateA - dateB;
    });

    __matchesCache = allMatches;   // ✅ cache
    renderAllMatches();            // ✅ render filtré (chips)

  } catch (err) {
    console.error("Erreur loadAllMatches:", err);
    container.innerHTML = `
      <div class="empty-state-live">
        <i class="fas fa-exclamation-triangle"></i>
        <p>Erreur de chargement des matchs</p>
      </div>
    `;
  }
}



function formatMatchStatus(m) {
    if (["IN_PROGRESS", "ONGOING"].includes(m.status)) return "🔴 En cours";
    if (m.status === "COMPLETED") return "✅ Terminé";
    if (m.status === "SCHEDULED") return "📅 À venir";
    return m.status || "—";
}

// 🆕 NOUVELLES FONCTIONS POUR AFFICHER LES DÉTAILS
function formatCompetitionLevel(level) {
    const labels = {
        'NATIONAL_1': 'National 1',
        'NATIONAL_2': 'National 2',
        'NATIONAL_3': 'National 3',
        'REGIONAL_1': 'Régional 1',
        'REGIONAL_2': 'Régional 2',
        'REGIONAL_3': 'Régional 3',
        'DEPARTEMENTAL_1': 'Départemental 1',
        'DEPARTEMENTAL_2': 'Départemental 2',
        'DEPARTEMENTAL_3': 'Départemental 3',
        'DISTRICT_1': 'District 1',
        'DISTRICT_2': 'District 2',
        'AMICAL': 'Match amical',
        'COUPE_DE_FRANCE': 'Coupe de France',
        'COUPE_REGIONALE': 'Coupe Régionale',
        'COUPE_DEPARTEMENTALE': 'Coupe Départementale',
        'FUTSAL': 'Futsal',
        'VETERANS': 'Vétérans',
        'LOISIR': 'Loisir'
    };
    return labels[level] || level;
}

function formatFieldType(type) {
    const labels = {
        'NATURAL_GRASS': 'Herbe naturelle',
        'SYNTHETIC_GRASS': 'Synthétique',
        'HYBRID': 'Hybride',
        'INDOOR': 'Salle',
        'DIRT': 'Terre battue',
        'STABILIZED': 'Stabilisé',
        'BEACH': 'Beach soccer'
    };
    return labels[type] || type;
}


/* ============================================================================
   📊 CLASSEMENTS (OPTIMISÉ + AVEC MESSAGE SI VIDE)
   ============================================================================ */
async function loadRankings(eventId) {
    const container = document.getElementById("rankingsContainer");
    if (!container) return;

    try {
        const res = await Auth.secureFetch(`/api/events/tournament/${eventId}/group-rankings`);
        
        if (res.status === 500) {
            container.innerHTML = `
                <div class="empty-state-live">
                    <i class="fas fa-list-ol"></i>
                    <p>Les classements ne sont pas encore disponibles</p>
                    <small style="opacity: 0.7; font-size: 0.85rem;">Ils s'afficheront après les premiers matchs</small>
                </div>
            `;
            return;
        }
        
        const data = await res.json();
        if (!res.ok) throw new Error();

        const rankingsObj = data.data || {};
        
        // ✅ OPTIMISATION : Ne re-render que si changement
        if (!DataCache.hasChanged('lastRankingsHash', rankingsObj)) {
            return;
        }

        const groupIds = Object.keys(rankingsObj);

        // ✅ SI AUCUN CLASSEMENT → AFFICHER MESSAGE
        if (groupIds.length === 0) {
            container.innerHTML = `
                <div class="empty-state-live">
                    <i class="fas fa-list-ol"></i>
                    <p>Les classements seront disponibles après les premiers matchs</p>
                </div>
            `;
            return;
        }

        // ✅ AFFICHER LES CLASSEMENTS
        container.innerHTML = groupIds.map(groupId => {
            const teams = rankingsObj[groupId];
            
            return `
                <div class="ranking-group">
                    <div class="ranking-group-header">
                        Groupe ${Components.escapeHtml(groupId)}
                    </div>
                    <table class="ranking-table">
                        <thead>
                            <tr>
                                <th scope="col">#</th>
                                <th scope="col">Équipe</th>
                                <th scope="col">Pts</th>
                                <th scope="col">J</th>
                                <th scope="col">G</th>
                                <th scope="col">N</th>
                                <th scope="col">P</th>
                                <th scope="col">+/-</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${teams.map((team, index) => `
                                <tr>
                                    <td class="ranking-position ${index < 2 ? 'qualified' : ''}">${index + 1}</td>
                                    <td class="ranking-team-name">${Components.escapeHtml(team.teamName || team.name)}</td>
                                    <td class="ranking-points">${team.points ?? 0}</td>
                                    <td>${team.played ?? 0}</td>
                                <td>${team.wins ?? team.won ?? 0}</td>
                                <td>${team.draws ?? team.draw ?? team.drawn ?? 0}</td>
                                <td>${team.losses ?? team.lost ?? 0}</td>


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

/* ============================================================================
   🏆 BRACKET (OPTIMISÉ + AVEC MESSAGE SI VIDE)
   ============================================================================ */
async function loadBracket(eventId) {
    const container = document.getElementById("bracketContainer");
    if (!container) return;

    try {
        const [bracketRes, consolanteRes] = await Promise.allSettled([
            Auth.secureFetch(`/api/events/${eventId}/bracket`),
            Auth.secureFetch(`/api/events/${eventId}/consolante`)
        ]);

        let mainBracket = [];
        let consolante = [];

        if (bracketRes.status === "fulfilled" && bracketRes.value.ok) {
            const bracketData = await bracketRes.value.json();
            mainBracket = bracketData.data || bracketData || [];
        }

        if (consolanteRes.status === "fulfilled" && consolanteRes.value.ok) {
            const consolanteData = await consolanteRes.value.json();
            consolante = consolanteData.data || consolanteData || [];
        }

        const allBracketData = { mainBracket, consolante };
        
        // ✅ OPTIMISATION : Ne re-render que si changement
        if (!DataCache.hasChanged('lastBracketHash', allBracketData)) {
            return;
        }

        // ✅ SI AUCUN BRACKET → AFFICHER MESSAGE
        if (mainBracket.length === 0 && consolante.length === 0) {
            container.innerHTML = `
                <div class="empty-state-live">
                    <i class="fas fa-trophy"></i>
                    <p>La phase finale débutera après les poules</p>
                    <small style="opacity: 0.7; font-size: 0.85rem;">Les matchs à élimination directe apparaîtront ici</small>
                </div>
            `;
            return;
        }

        // ✅ AFFICHER LE BRACKET
        let html = '';

        if (mainBracket.length > 0) {
            html += renderBracketTree(mainBracket, 'principal');
        }

        if (consolante.length > 0) {
            html += `<div style="margin-top: 40px;"></div>`;
            html += renderBracketTree(consolante, 'consolante');
        }

        container.innerHTML = html;

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

/* ============================================================================
   🌳 HELPER : RENDER BRACKET TREE
   ============================================================================ */
function renderBracketTree(matches, type) {
    const isPrincipal = type === 'principal';
    const titleIcon = isPrincipal ? '🏆' : '♻️';
    const title = isPrincipal ? 'Bracket principal' : 'Tableau de consolante';
    
    const rounds = {};
    matches.forEach(m => {
        if (!rounds[m.round]) rounds[m.round] = [];
        rounds[m.round].push(m);
    });

    const roundOrder = isPrincipal 
        ? ['R16', 'QF', 'SF', 'FINAL'].filter(r => rounds[r])
        : ['CQF', 'CSF', 'CFINAL'].filter(r => rounds[r]);

    if (roundOrder.length === 0) return '';

    return `
        <div class="bracket-section-header">
            <h4>${titleIcon} ${title}</h4>
        </div>
        <div class="bracket-tree">
            ${roundOrder.map(roundName => {
                const roundMatches = rounds[roundName];
                const roundConfig = getRoundConfig(roundName);
                
                return `
                    <div class="bracket-column">
                        <h5 class="bracket-round-title" style="color: ${roundConfig.color};">
                            ${roundConfig.label}
                        </h5>
                        <div class="bracket-matches">
                            ${roundMatches.map(m => renderBracketMatch(m, roundConfig)).join("")}
                        </div>
                    </div>
                `;
            }).join("")}
        </div>
    `;
}

function renderBracketMatch(match, roundConfig) {
    const teamAWins = (match.scoreTeamA ?? 0) > (match.scoreTeamB ?? 0);
const teamBWins = (match.scoreTeamB ?? 0) > (match.scoreTeamA ?? 0);

    const isLive = match.status === 'ONGOING' || match.status === 'IN_PROGRESS';
const isFinished = match.status === 'COMPLETED';

    return `
        <div class="bracket-match ${isFinished ? 'finished' : ''} ${isLive ? 'live' : ''}" 
             style="border-left: 4px solid ${roundConfig.color};"
             data-match-id="${match.id}">
            
            ${isLive ? '<div class="live-badge">🔴 EN DIRECT</div>' : ''}
            
            <div class="bracket-team ${teamAWins ? 'winner' : ''}">
                <span class="bracket-team-name">
                    ${Components.escapeHtml(match.teamA || "?")}
                </span>
                <span class="bracket-score">
                     ${match.scoreTeamA ?? "-"}
                </span>
            </div>

            <div class="bracket-divider"></div>

            <div class="bracket-team ${teamBWins ? 'winner' : ''}">
                <span class="bracket-team-name">
                    ${Components.escapeHtml(match.teamB || "?")}
                </span>
                <span class="bracket-score">
                       ${match.scoreTeamB ?? "-"}

                </span>
            </div>
        </div>
    `;
}

function getRoundConfig(round) {
    const configs = {
        "R16": { label: "⚽ 1/8 de finale", color: "#3498db" },
        "QF": { label: "⚽ Quarts", color: "#27ae60" },
        "SF": { label: "🎯 Demi-finales", color: "#e67e22" },
        "FINAL": { label: "🏆 Finale", color: "#c0392b" },
        "CQF": { label: "⚽ Quarts consolante", color: "#16a34a" },
        "CSF": { label: "🎯 Demi consolante", color: "#f97316" },
        "CFINAL": { label: "🏆 Finale consolante", color: "#dc2626" }
    };
    
    return configs[round] || { label: round, color: "#95a5a6" };
}

function feedBucket(type) {
  const t = String(type || "").toUpperCase();
  if (t.includes("GOAL") || t.includes("RESULT") || t.includes("MATCH_ENDED") || t.includes("MATCH_FINISHED")) return "result";
  if (t.includes("MATCH_STARTED") || t.includes("LIVE")) return "live";
  if (t.includes("RANK") || t.includes("STAND")) return "ranking";
  if (t.includes("VIDEO") || t.includes("MEDIA") || t.includes("PHOTO")) return "media";
  return "other";
}


/* ============================================================================
   📰 FIL D'ACTUALITÉ (AVEC MESSAGE SI VIDE)
   ============================================================================ */
async function loadLiveFeed(eventId) {
  const container = document.getElementById("liveFeedContainer");
  if (!container) return;

  // ✅ Chips filtres (si le container existe)
  const filters = document.getElementById("feedFilters");
  if (filters) {
    filters.innerHTML = `
      <button class="chip ${__feedFilter==="all"?"active":""}" data-feed-filter="all">Tout</button>
      <button class="chip ${__feedFilter==="live"?"active":""}" data-feed-filter="live">Live</button>
      <button class="chip ${__feedFilter==="result"?"active":""}" data-feed-filter="result">Résultats</button>
      <button class="chip ${__feedFilter==="ranking"?"active":""}" data-feed-filter="ranking">Classement</button>
      <button class="chip ${__feedFilter==="media"?"active":""}" data-feed-filter="media">Média</button>
    `;
  }

  try {
    const res = await Auth.secureFetch(`/api/public/live/feed/event/${eventId}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || "Erreur feed");

    const allEvents = data.data || [];
    const events = (__feedFilter === "all")
      ? allEvents
      : allEvents.filter(ev => feedBucket(ev.type) === __feedFilter);

    if (events.length === 0) {
      container.innerHTML = `
        <div class="empty-state-live">
          <i class="fas fa-newspaper"></i>
          <p>Aucune actualité pour le moment</p>
          <small style="opacity: 0.7; font-size: 0.85rem;">Les événements du tournoi apparaîtront ici</small>
        </div>
      `;
      return;
    }

    container.innerHTML = events.slice(0, 10).map(ev => {
      const timeAgo = getTimeAgo(ev.createdAt);
      const eventIcon = getEventIcon(ev.type);
      const eventText = formatEventForFeed(ev);

      return `
        <div class="feed-item feed-${String(ev.type || "").toLowerCase()}">
          <div class="feed-icon">${eventIcon}</div>
          <div class="feed-content">
            <div class="feed-text">${eventText}</div>
            <div class="feed-meta">
              <span class="feed-time">${timeAgo}</span>
              <span class="feed-match">${Components.escapeHtml(ev.teamAName || "")} vs ${Components.escapeHtml(ev.teamBName || "")}</span>
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
            return `<strong>But de ${Components.escapeHtml(playerName)}</strong> (${Components.escapeHtml(teamName)})`;
        case 'YELLOW_CARD':
            return `Carton jaune pour <strong>${Components.escapeHtml(playerName)}</strong> (${Components.escapeHtml(teamName)})`;
        case 'RED_CARD':
            return `Carton rouge pour <strong>${Components.escapeHtml(playerName)}</strong> (${Components.escapeHtml(teamName)})`;
        case 'HALF_TIME':
            return `Mi-temps • ${Components.escapeHtml(event.teamAName)} ${event.scoreA}-${event.scoreB} ${Components.escapeHtml(event.teamBName)}`;
        case 'FULL_TIME':
            return `Fin du match • ${Components.escapeHtml(event.teamAName)} ${event.scoreA}-${event.scoreB} ${Components.escapeHtml(event.teamBName)}`;
        case 'MATCH_STARTED':
            return `Match commencé • ${Components.escapeHtml(event.teamAName)} vs ${Components.escapeHtml(event.teamBName)}`;
        default:
            return Components.escapeHtml(event.details || 'Événement');
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

/* ============================================================================
   👑 ACTIONS ORGANISATEUR
   ============================================================================ */
function initOrganizerActions(eventId) {
    // Clôture inscriptions
    const closeBtn = document.getElementById("closeRegistrationsBtn");
    if (closeBtn) {
        closeBtn.addEventListener("click", () => toggleRegistrations(eventId, 'close'));
    }

    const reopenBtn = document.getElementById("reopenRegistrationsBtn");
    if (reopenBtn) {
        reopenBtn.addEventListener("click", () => toggleRegistrations(eventId, 'reopen'));
    }
}

async function toggleRegistrations(eventId, action) {
    const isClosing = action === 'close';
    const confirmMsg = isClosing 
        ? "⚠️ Clôturer les inscriptions ?\n\nLes utilisateurs ne pourront plus s'inscrire."
        : "Rouvrir les inscriptions ?\n\nLes utilisateurs pourront à nouveau s'inscrire.";
    
    if (!confirm(confirmMsg)) return;
    
    const btn = document.getElementById(isClosing ? "closeRegistrationsBtn" : "reopenRegistrationsBtn");
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Traitement...';
    
    try {
        const endpoint = isClosing ? 'close-registrations' : 'reopen-registrations';
        const res = await Auth.secureFetch(
            `/api/events/manage/${eventId}/${endpoint}`,
            { method: "POST" }
        );
        
        const result = await res.json();
        
        if (res.ok) {
            showToast(
                isClosing ? "✅ Inscriptions clôturées" : "✅ Inscriptions rouvertes",
                "success"
            );
            setTimeout(() => location.reload(), 1500);
        } else {
            throw new Error(result.message || "Erreur");
        }
    } catch (err) {
        showToast("❌ " + err.message, "error");
        btn.disabled = false;
        btn.innerHTML = isClosing 
            ? '<i class="fas fa-lock"></i> Clôturer'
            : '<i class="fas fa-lock-open"></i> Rouvrir';
    }
}
function showTournamentFinishedMessage() {
  const container = document.getElementById("liveMatchesContainer");
  if (!container) return;

  container.innerHTML = `
    <div class="ed-finish">
      <div class="ed-finish__icon"><i class="fas fa-flag-checkered"></i></div>
      <h3 class="ed-finish__title">🏆 Tournoi terminé</h3>
      <p class="ed-finish__text">Consulte les résultats finaux dans les onglets ci-dessus</p>

      <div class="ed-finish__actions">
        <button class="btn ghost" data-goto-tab="rankings">📊 Voir le classement</button>
        <button class="btn ghost" data-goto-tab="bracket">🏆 Voir le bracket</button>
        <button class="btn ghost" data-goto-tab="matches">⚽ Tous les matchs</button>
      </div>
    </div>
  `;
}

export function cleanup() {
  stopLivePolling?.();
  stopFeedPolling?.();
  document.body.classList.remove("is-event-detail-page");
}


