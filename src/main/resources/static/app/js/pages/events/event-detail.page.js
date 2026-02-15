// event-detail.page.js
// 📄 STRUCTURE PRINCIPALE + BACKEND - VERSION CORRIGÉE
import * as components from '/app/js/pages/events/event-detail-components.js';
import { RegistrationModal } from '/app/js/components/registration-modal.js';

let currentEvent = null;
let currentUser = null;
let pollIntervals = [];

/* ============================================================================
   API CLIENT (fetch direct)
   ============================================================================ */
async function apiGet(url) {
    const token = localStorage.getItem('accessToken');
    const headers = {
        'Content-Type': 'application/json',
    };
    
    // ✅ Ajoute le token si présent
    if (token && token !== 'null' && token !== 'undefined') {
        headers['Authorization'] = `Bearer ${token.trim()}`;
    }
    
    const response = await fetch(url, {
        method: 'GET',
        headers: headers,
        credentials: 'include'
    });
    
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }
    
    const json = await response.json();
    return json.data !== undefined ? json.data : json;
}

/* ============================================================================
   RENDER PRINCIPAL
   ============================================================================ */
export function render() {
    loadCSS('/css/event-detail.css');
    loadCSS('/css/registration-modal.css');  // ✅ AJOUTE CETTE LIGNE
    document.body.classList.add('is-event-detail-page');
    
    return `
        <div class="event-detail-page event-pro" id="eventDetailPage">
            <div id="eventHeader"></div>
            <div class="event-content-pro">
                <div id="eventHero"></div>
                <div id="eventQuickInfo"></div>
                <div id="eventDescription"></div>
                <div id="eventStats"></div>
                <div id="eventTabs"></div>
                <div class="tab-contents-pro" id="eventTabContents"></div>
            </div>
            <div id="eventCTA"></div>
        </div>
    `;
}

/* ============================================================================
   LOAD CSS HELPER
   ============================================================================ */
function loadCSS(href) {
    const existing = document.querySelector(`link[href="${href}"]`);
    if (existing) return;
    
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.id = 'event-detail-css';
    document.head.appendChild(link);
}

/* ============================================================================
   INIT
   ============================================================================ */
export async function init() {
    try {
        const eventId = getEventIdFromUrl();
        
        console.log('Event ID récupéré:', eventId);
        console.log('URL actuelle:', window.location.href);
        
        if (!eventId) {
            showError('Event ID manquant dans l\'URL');
            return;
        }

        currentUser = await loadCurrentUser();
        console.log('Utilisateur chargé:', currentUser ? 'Connecté' : 'Non connecté');
        
        currentEvent = await loadEvent(eventId);
        if (!currentEvent) {
            showError('Événement introuvable');
            return;
        }
        
        if (!currentEvent.id) {
            console.error('❌ L\'événement n\'a pas de propriété id:', currentEvent);
            showError('Données événement invalides');
            return;
        }
        
        console.log('Événement chargé:', currentEvent.name || currentEvent.title || 'Sans nom');

      const isOrganizer = !!currentUser && Number(currentEvent.organizerId) === Number(currentUser.id);
                    console.log("isOrganizer?", isOrganizer, "organizerId", currentEvent.organizerId, "userId", currentUser?.id);

     const registrationInfo = currentUser ? await getRegistrationInfoForEvent(eventId) : null;
        const hasClub = currentUser && currentUser.clubId;
        const isSingleMatch = currentEvent.format === 'SINGLE_MATCH';

    renderComponents(currentEvent, isOrganizer, registrationInfo, hasClub, isSingleMatch);
        setupEventListeners(isOrganizer);
        setupTabs(isSingleMatch, isOrganizer);
        loadTabContent('live', isSingleMatch);

        if (currentEvent.status === 'ONGOING') {
            setupPolling(eventId, isSingleMatch);
        }

        setupCrossTabSync(eventId);

    } catch (error) {
        console.error('Erreur init event-detail:', error);
        showError(`Erreur de chargement: ${error.message}`);
    }
}

/* ============================================================================
   RENDER COMPOSANTS
   ============================================================================ */
function renderComponents(event, isOrganizer, registrationInfo, hasClub, isSingleMatch) {
    document.getElementById('eventHeader').innerHTML = components.renderHeader(isOrganizer);
    document.getElementById('eventHero').innerHTML = components.renderHero(event);
    document.getElementById('eventQuickInfo').innerHTML = components.renderQuickInfo(event);
 document.getElementById('eventDescription').innerHTML = components.renderDescription(event.description, isSingleMatch);

   if (!isSingleMatch) {
    document.getElementById('eventStats').innerHTML = components.renderStats(event);
}

    document.getElementById('eventTabs').innerHTML = components.renderTabs(isSingleMatch, isOrganizer);
    document.getElementById('eventTabContents').innerHTML = components.renderTabContents(isSingleMatch, isOrganizer);

    if (!isOrganizer) {
      document.getElementById('eventCTA').innerHTML = components.renderFloatingCTA(
    event, 
    !!currentUser, 
    isOrganizer, 
    registrationInfo,  // ✅ Nouveau paramètre
    hasClub
);
    }
    if (!isOrganizer && hasClub) {
 injectMyClubRegistrationsSection(event.id);

}

}

/* ============================================================================
   SETUP EVENT LISTENERS
   ============================================================================ */
function setupEventListeners(isOrganizer) {
    const backBtn = document.getElementById('backBtn');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            window.history.back();
        });
    }

    if (isOrganizer) {
        const menuBtn = document.getElementById('menuBtn');
        if (menuBtn) {
            menuBtn.addEventListener('click', () => {
                console.log('Menu organisateur');
            });
        }
    }

    const registerBtn = document.getElementById('registerBtn');
    if (registerBtn) {
        registerBtn.addEventListener('click', () => handleRegistration());
    }

    const registerClubBtn = document.getElementById('registerClubBtn');
    if (registerClubBtn) {
        registerClubBtn.addEventListener('click', () => handleClubRegistration());
    }
}

/* ============================================================================
   SETUP TABS
   ============================================================================ */
function setupTabs(isSingleMatch, isOrganizer) {
    const tabs = document.querySelectorAll('.tab-pill, .tournament-tab');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            const tabId = tab.dataset.tab;
            
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            document.querySelectorAll('.tab-content-pro, .tournament-tab-content').forEach(content => {
                content.classList.remove('active');
            });
            const targetContent = document.getElementById(`tab-${tabId}`);
            if (targetContent) {
                targetContent.classList.add('active');
            }
            
            loadTabContent(tabId, isSingleMatch);
        });
    });
}

/* ============================================================================
   LOAD TAB CONTENT
   ============================================================================ */
async function loadTabContent(tabId, isSingleMatch) {
    const container = document.getElementById(`tab-${tabId}`);
    if (!container || container.dataset.loaded === 'true') return;

    try {
        switch (tabId) {
            case 'live':
                await loadLiveTab(container, isSingleMatch);
                break;
            case 'matches':
                await loadMatchesTab(container);
                break;
            case 'rankings':
                await loadRankingsTab(container);
                break;
            case 'bracket':
                await loadBracketTab(container);
                break;
            case 'feed':
                await loadFeedTab(container);
                break;
            case 'infos':
                await loadInfosTab(container);
                break;
            case 'admin':
                await loadAdminTab(container);
                break;
        }
        
        container.dataset.loaded = 'true';
    } catch (error) {
        console.error(`Erreur chargement onglet ${tabId}:`, error);
        container.innerHTML = components.renderEmptyState('fa-exclamation-triangle', 'Erreur de chargement', 'Veuillez réessayer');
    }
}

/* ============================================================================
   LOAD LIVE TAB
   ============================================================================ */
async function loadLiveTab(container, isSingleMatch) {
    let html = '';

    if (currentEvent.status === 'ONGOING') {
        html += components.renderLiveVideo();
    }

    html += `<h3 style="font-size: 16px; font-weight: 700; margin: 20px 0 12px; padding: 0 16px;">
        <i class="fas fa-futbol"></i> ${isSingleMatch ? 'Match' : 'Matchs en cours'}
    </h3>`;

    try {
        const liveMatches = await loadLiveMatches();
        
        if (liveMatches.length > 0) {
            html += '<div style="padding: 0 16px;">';
            liveMatches.forEach(match => {
                html += components.renderMatchCard(match);
            });
            html += '</div>';
        } else {
            html += '<div style="padding: 0 16px;">';
            html += components.renderEmptyState(
                'fa-futbol', 
                'Aucun match en direct', 
                currentEvent.status === 'PUBLISHED' ? 'Le tournoi débutera bientôt' : ''
            );
            html += '</div>';
        }
    } catch (error) {
        console.error('Erreur chargement matchs live:', error);
        html += '<div style="padding: 0 16px;">';
        html += components.renderEmptyState(
            'fa-exclamation-triangle', 
            'Impossible de charger les matchs', 
            'Le planning sera disponible prochainement'
        );
        html += '</div>';
    }

    container.innerHTML = html;
}

/* ============================================================================
   LOAD MATCHES TAB
   ============================================================================ */
async function loadMatchesTab(container) {
    if (!currentEvent || !currentEvent.id) {
        container.innerHTML = '<div style="padding: 0 16px;">' + 
            components.renderEmptyState('fa-exclamation-triangle', 'Erreur', 'Événement non chargé') + 
            '</div>';
        return;
    }
    
    let html = '<div style="padding: 0 16px;">';
    html += '<h3 style="font-size: 16px; font-weight: 700; margin-bottom: 12px;">Tous les matchs</h3>';
    
    try {
        const matches = await apiGet(`/api/events/${currentEvent.id}/matches`);
        
        if (matches && matches.length > 0) {
            matches.forEach(match => {
                html += components.renderMatchCard(match);
            });
        } else {
            html += components.renderEmptyState('fa-calendar', 'Aucun match planifié', 'Le planning sera publié prochainement');
        }
    } catch (error) {
        console.error('Erreur chargement matchs:', error);
        html += components.renderEmptyState('fa-exclamation-triangle', 'Impossible de charger les matchs', 'Réessayez plus tard');
    }
    
    html += '</div>';
    container.innerHTML = html;
}

/* ============================================================================
   LOAD RANKINGS TAB
   ============================================================================ */
async function loadRankingsTab(container) {
    try {
        const rankings = await apiGet(`/api/events/tournament/${currentEvent.id}/group-rankings`);
        
        let html = '<div style="padding: 0 16px;">';
        
        if (rankings && Object.keys(rankings).length > 0) {
            Object.entries(rankings).forEach(([groupName, teams]) => {
                html += components.renderRankingTable(groupName, teams);
            });
        } else {
            html += components.renderEmptyState('fa-list-ol', 'Classements non disponibles', 'Les classements seront publiés après les premiers matchs');
        }
        
        html += '</div>';
        container.innerHTML = html;
    } catch (error) {
        console.error('Erreur chargement classements:', error);
        container.innerHTML = '<div style="padding: 0 16px;">' + 
            components.renderEmptyState('fa-exclamation-triangle', 'Erreur de chargement', 'Réessayez plus tard') + 
            '</div>';
    }
}

/* ============================================================================
   LOAD BRACKET TAB
   ============================================================================ */
async function loadBracketTab(container) {
    try {
        const bracket = await apiGet(`/api/events/${currentEvent.id}/bracket`);
        
        let html = '<div style="padding: 0 16px;">';
        
        if (bracket && bracket.rounds && bracket.rounds.length > 0) {
            html += components.renderBracket(bracket.rounds);
        } else {
            html += components.renderEmptyState('fa-trophy', 'Phase finale non démarrée', 'Le tableau sera généré après la phase de poules');
        }
        
        html += '</div>';
        container.innerHTML = html;
    } catch (error) {
        console.error('Erreur chargement bracket:', error);
        container.innerHTML = '<div style="padding: 0 16px;">' + 
            components.renderEmptyState('fa-exclamation-triangle', 'Erreur de chargement', 'Réessayez plus tard') + 
            '</div>';
    }
}

/* ============================================================================
   LOAD FEED TAB
   ============================================================================ */
async function loadFeedTab(container) {
    try {
        const feed = await apiGet(`/api/public/live/feed/event/${currentEvent.id}`);
        
        let html = '<div style="padding: 0 16px;">';
        
        if (feed && feed.length > 0) {
            feed.forEach(item => {
                html += components.renderFeedItem(item);
            });
        } else {
            html += components.renderEmptyState('fa-newspaper', 'Aucune actualité', 'Les événements en direct apparaîtront ici');
        }
        
        html += '</div>';
        container.innerHTML = html;
    } catch (error) {
        console.error('Erreur chargement feed:', error);
        container.innerHTML = '<div style="padding: 0 16px;">' + 
            components.renderEmptyState('fa-exclamation-triangle', 'Erreur de chargement', 'Réessayez plus tard') + 
            '</div>';
    }
}

/* ============================================================================
   LOAD INFOS TAB
   ============================================================================ */
async function loadInfosTab(container) {
    let html = '<div style="padding: 0 16px;">';
    html += components.renderPracticalInfo(currentEvent);
    html += '</div>';
    
    container.innerHTML = html;
}

/* ============================================================================
   LOAD ADMIN TAB
   ============================================================================ */
async function loadAdminTab(container) {
    let html = '<div style="padding: 0 16px;">';
    html += components.renderAdminSection(currentEvent);
    html += '</div>';
    
    container.innerHTML = html;
}

/* ============================================================================
   POLLINGS
   ============================================================================ */
function setupPolling(eventId, isSingleMatch) {
    const liveInterval = setInterval(async () => {
        if (document.hidden) return;
        const activeTab = document.querySelector('.tab-pill.active, .tournament-tab.active')?.dataset.tab;
        if (activeTab === 'live') {
            // TODO: Update UI
        }
    }, 10000);
    
    pollIntervals.push(liveInterval);
}

/* ============================================================================
   CROSS-TAB SYNC
   ============================================================================ */
function setupCrossTabSync(eventId) {
    window.addEventListener('storage', (e) => {
        if (e.key === 'events_invalidated_at') {
            init();
        }
    });
}

/* ============================================================================
   DATA LOADERS
   ============================================================================ */
async function loadCurrentUser() {
    try {
        const storedUser = localStorage.getItem('currentUser');
        if (storedUser) {
            return JSON.parse(storedUser);
        }
        return await apiGet('/api/users/me');
    } catch (error) {
        console.warn('Utilisateur non connecté ou API non disponible:', error);
        return null;
    }
}

async function loadEvent(eventId) {
    console.log('🔍 Chargement événement ID:', eventId);
    const event = await apiGet(`/api/events/public/${eventId}`);
    console.log('📦 Événement chargé:', {
        id: event?.id,
        name: event?.name,
        status: event?.status,
        format: event?.format
    });
    return event;
}

async function loadMyRegistrationsSafe() {
    if (!currentUser) return [];
    try {
        const regs = await apiGet('/api/events/registration/me');
        return Array.isArray(regs) ? regs : [];
    } catch {
        return [];
    }
}

async function computeIsRegisteredForEvent(eventId) {
    const regs = await loadMyRegistrationsSafe();
    const id = Number(eventId);
    return regs.some(r => Number(r.eventId) === id && (r.teamId || r.playerId || r.assignedTeamId));
}

async function getRegistrationInfoForEvent(eventId) {
    const regs = await loadMyRegistrationsSafe();
    const id = Number(eventId);
    return regs.find(r => Number(r.eventId) === id && (r.teamId || r.playerId || r.assignedTeamId)) || null;
}

async function loadMyClubRegistrationsForEvent(eventId) {
  if (!currentUser?.clubId) return [];
  try {
    const regs = await apiGet(`/api/events/registration/${eventId}/registrations/club/${currentUser.clubId}`);
    return Array.isArray(regs) ? regs : [];
  } catch (e) {
    console.warn("loadMyClubRegistrationsForEvent error", e);
    return [];
  }
}


async function loadLiveMatches() {
    try {
        if (!currentEvent || !currentEvent.id) {
            console.error('❌ currentEvent ou currentEvent.id manquant');
            return [];
        }
        const matches = await apiGet(`/api/events/${currentEvent.id}/matches`);
        return matches.filter(m => m.status === 'IN_PROGRESS' || m.status === 'ONGOING');
    } catch (error) {
        console.error('Erreur chargement live matches:', error);
        return [];
    }
}

/* ============================================================================
   ACTIONS
   ============================================================================ */
function handleRegistration() {
    console.log('Inscription individuelle');
}

async function handleClubRegistration() {
    if (!currentUser || !currentUser.clubId) {
        alert('Vous devez être membre d\'un club');
        return;
    }

    const modal = new RegistrationModal();
    await modal.show(currentEvent.id, currentUser.clubId);
}

async function handlePaymentForRegistration(registration) {
  if (!currentEvent || !currentUser) {
    alert('Erreur : données manquantes');
    return;
  }
  if (!registration?.id) {
    alert("Erreur : inscription invalide");
    return;
  }

  // ✅ garde-fous
  if ((registration.paymentStatus || "").toUpperCase() === "PAID") {
    alert("✅ Déjà payé");
    return;
  }
  if ((registration.status || "").toUpperCase() !== "ACCEPTED") {
    alert("⛔ L'inscription doit être ACCEPTED");
    return;
  }

  // 🆕 PRIX FIXE : 5€ PAR ÉQUIPE pour FootballFamily
  const platformFee = "5.00";
  const teamLabel = registration.teamName || 'Votre équipe';

  const confirmPay = confirm(
    `💳 FRAIS DE PLATEFORME FOOTBALLFAMILY\n\n` +
    `Équipe : ${teamLabel}\n` +
    `Événement : ${currentEvent.name}\n\n` +
    `Montant : ${platformFee}€ par équipe\n\n` +
    `ℹ️ Ces frais permettent d'utiliser FootballFamily.\n` +
    `Les frais du tournoi (si applicable) se règlent\n` +
    `directement avec l'organisateur.\n\n` +
    `Confirmer le paiement ?\n` +
    `(Simulation - Stripe Connect prochainement)`
  );

  if (!confirmPay) return;

  try {
    const token = localStorage.getItem('accessToken');

    const res = await fetch(
      `/api/events/registration/${currentEvent.id}/registrations/${registration.id}/pay`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const body = await res.json();
    if (!res.ok) throw new Error(body.message || 'Erreur lors du paiement');

    alert(`✅ PAIEMENT VALIDÉ !\n\nÉquipe : ${teamLabel}\nFrais de plateforme : 5€ payés`);
    location.reload();

  } catch (error) {
    console.error('Erreur paiement:', error);
    alert('❌ Erreur\n\n' + error.message);
  }
}


/* ============================================================================
   UTILITIES
   ============================================================================ */
function getEventIdFromUrl() {
    const path = window.location.pathname;
    
    let matches = path.match(/\/events\/(\d+)/);
    if (matches) return matches[1];
    
    matches = path.match(/\/events\/public\/(\d+)/);
    if (matches) return matches[1];
    
    if (window.location.hash) {
        matches = window.location.hash.match(/\/events\/(\d+)/);
        if (matches) return matches[1];
    }
    
    const params = new URLSearchParams(window.location.search);
    const eventId = params.get('eventId') || params.get('id');
    if (eventId) return eventId;
    
    console.error('Event ID non trouvé dans URL:', path);
    return null;
}

function showError(message) {
    const container = document.getElementById('eventDetailPage');
    if (container) {
        container.innerHTML = components.renderEmptyState('fa-exclamation-triangle', message, '');
    }
}

async function injectMyClubRegistrationsSection(eventId) {
  const host = document.getElementById('eventDescription') || document.getElementById('eventQuickInfo');
  if (!host) return;


  // évite doublons
host.querySelector('.my-registrations')?.remove();


  const regs = await loadMyClubRegistrationsForEvent(eventId);
  if (!regs.length) return;

  const html = `
    <div class="my-registrations" style="margin:12px 16px; padding:12px; border-radius:12px; border:1px solid rgba(255,255,255,.08);">
      <div style="font-weight:800; margin-bottom:8px;">🏟️ Mes équipes inscrites</div>
      ${regs.map(r => {
        const canPay = r.status === "ACCEPTED" && r.paymentStatus === "UNPAID";
        const paid = r.paymentStatus === "PAID";
        return `
          <div class="reg-row" data-reg-id="${r.id}" style="display:flex; align-items:center; justify-content:space-between; gap:10px; padding:8px 0; border-top:1px solid rgba(255,255,255,.06);">
            <div style="display:flex; flex-direction:column;">
              <div style="font-weight:700;">${r.teamName || 'Équipe'}</div>
              <div style="opacity:.85; font-size:12px;">
                Statut: <b>${r.status}</b> • Paiement: <b>${r.paymentStatus || 'UNPAID'}</b>
              </div>
            </div>
            <div>
              ${paid ? `<span style="font-weight:800;">✅ PAYÉ</span>` : ""}
             ${canPay ? `<button class="btn-pay-reg" data-reg-id="${r.id}" style="padding:8px 10px; border-radius:10px; font-weight:800;">Payer 5€</button>` : ""}
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;

host.insertAdjacentHTML('beforeend', html);

// bind pay buttons (anti double-clic + UX pro)
host.querySelectorAll('.btn-pay-reg').forEach(btn => {
  btn.addEventListener('click', async () => {
    const regId = Number(btn.dataset.regId);

    // ✅ anti double clic
    if (btn.disabled) return;
    btn.disabled = true;
    const originalText = btn.textContent;
    btn.textContent = "Paiement...";

    try {
      const regs2 = await loadMyClubRegistrationsForEvent(eventId); // reload safe
      const reg = regs2.find(x => Number(x.id) === regId);

      if (!reg) {
        alert("Inscription introuvable");
        return;
      }

      await handlePaymentForRegistration(reg);

      // handlePaymentForRegistration fait location.reload()
      // donc normalement tu ne reviens pas ici.
    } catch (e) {
      console.error("pay click error", e);
      alert("❌ Erreur paiement");
    } finally {
      // ✅ si jamais pas de reload (erreur / annulation confirm)
      btn.disabled = false;
      btn.textContent = originalText;
    }
  });
});

}


/* ============================================================================
   CLEANUP
   ============================================================================ */
export function cleanup() {
    pollIntervals.forEach(interval => clearInterval(interval));
    pollIntervals = [];
    
    const cssLink = document.getElementById('event-detail-css');
    if (cssLink) {
        cssLink.remove();
    }
    
    document.body.classList.remove('is-event-detail-page');
    
    currentEvent = null;
    currentUser = null;
}

/* ============================================================================
   EXPORTS
   ============================================================================ */
export const EventDetailPage = { render, init, cleanup };
export default EventDetailPage;