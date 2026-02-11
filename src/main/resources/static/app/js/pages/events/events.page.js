// /static/app/js/pages/events/events.page.js
import { Auth } from "../../auth.js";
import { Router } from "../../router.js";

let __eventsScroller = null;
let __eventsOnScroll = null;

// Optionnel mais recommandé pour éviter spam loadEvents()
let __eventsLoadingMore = false;
let __eventsLastTrigger = 0;

let __beforeUnloadFn = null;
let __stopLiveRefreshFn = null;


export async function render(params) {

  // Charger CSS si nécessaire (ordre important)
  if (!document.querySelector('link[href="/css/events.css"]')) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "/css/events.css";
    document.head.appendChild(link);
  }

  // ✅ Overlay UX (doit être chargé APRÈS events.css)
  if (!document.querySelector('link[href="/css/events-ux.css"]')) {
    const linkUx = document.createElement("link");
    linkUx.rel = "stylesheet";
    linkUx.href = "/css/events-ux.css";
    document.head.appendChild(linkUx);
  }

    const isAuthenticated = Auth.accessToken !== null;
    const currentUser = Auth.currentUser;

    console.log("CURRENT USER =", currentUser);

    
    // Vérifier si l'utilisateur peut créer des événements
    const canCreate = currentUser && ['COACH', 'CLUB_ADMIN', 'ORGANIZER', 'SUPER_ADMIN'].includes(currentUser.highestRole);

    return `
    <div class="events-page">
        <!-- HEADER FIXE -->
        <header class="events-header">
            <button class="back-btn" id="backBtn">
                <i class="fas fa-arrow-left"></i>
            </button>
            <div class="header-logo">
                <i class="fas fa-calendar-star"></i>
                <span>EVENTS</span>
            </div>
            <div style="width: 40px;"></div>
        </header>

        <!-- TABS NAVIGATION -->
        <div class="tabs-container">
            <button class="tab active" data-tab="discover">
                <i class="fas fa-compass"></i> Découvrir
            </button>
            ${isAuthenticated ? `
            <button class="tab" data-tab="my-events">
                <i class="fas fa-calendar-check"></i> Mes Events
            </button>
            ` : ''}
            ${canCreate ? `
            <button class="tab" data-tab="create">
                <i class="fas fa-plus-circle"></i> Créer
            </button>
            ` : ''}

            <button class="tab" data-tab="history">
                <i class="fas fa-history"></i> Historique
            </button>
        </div>

        <!-- CONTENT SECTIONS -->
        <div class="content-sections">
            
            <!-- TAB 1: DÉCOUVRIR -->
     <!-- TAB 1: DÉCOUVRIR -->
<div class="tab-content active" id="discover-content">
    <div class="filters-section">
        <div class="filter-chip active" data-filter="all">
            <i class="fas fa-globe"></i> Tous
        </div>
        <div class="filter-chip" data-filter="OPEN_EVENT">
            <i class="fas fa-futbol"></i> Publics
        </div>
        <div class="filter-chip" data-filter="CLUB_EVENT">
            <i class="fas fa-shield-alt"></i> Clubs
        </div>
    </div>
    
    <div id="events-container"></div>
    <div id="loader" style="display: none;">
        <i class="fas fa-spinner fa-spin"></i>
        <p>Chargement des événements...</p>
    </div>
</div>

            <!-- TAB 2: MES EVENTS -->
            ${isAuthenticated ? `
            <div class="tab-content" id="my-events-content">
                <div id="my-events-container"></div>
                <div id="my-events-loader" style="display: none;">
                    <i class="fas fa-spinner fa-spin"></i>
                    <p>Chargement de vos événements...</p>
                </div>
            </div>
            ` : ''}


                        <!-- TAB: HISTORIQUE -->
<!-- TAB: HISTORIQUE -->
<div class="tab-content" id="history-content">
    
    <!-- 🆕 BARRE DE RECHERCHE -->
    <div class="search-bar" style="margin-bottom: 1rem;">
        <div style="position: relative;">
            <i class="fas fa-search" style="
                position: absolute;
                left: 1rem;
                top: 50%;
                transform: translateY(-50%);
                color: var(--text-secondary);
            "></i>
            <input 
                type="text" 
                id="history-search"
                placeholder="Rechercher un tournoi..."
                style="
                    width: 100%;
                    background: var(--bg-input);
                    border: 1px solid var(--border);
                    color: var(--text-primary);
                    padding: 0.85rem 1rem 0.85rem 3rem;
                    border-radius: 12px;
                    font-size: 0.9rem;
                    transition: border-color 0.2s ease;
                ">
            <button 
                id="clear-search" 
                style="
                    position: absolute;
                    right: 1rem;
                    top: 50%;
                    transform: translateY(-50%);
                    background: none;
                    border: none;
                    color: var(--text-secondary);
                    cursor: pointer;
                    display: none;
                    font-size: 1.2em;
                ">
                <i class="fas fa-times-circle"></i>
            </button>
        </div>
    </div>
    
<div class="filters-section" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
    <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
        <div class="filter-chip active" data-history-filter="all">
            <i class="fas fa-trophy"></i> Tous
        </div>
        <div class="filter-chip" data-history-filter="OPEN_EVENT">
            <i class="fas fa-futbol"></i> Publics
        </div>
        <div class="filter-chip" data-history-filter="CLUB_EVENT">
            <i class="fas fa-shield-alt"></i> Clubs
        </div>
    </div>
    
    <!-- 🆕 BOUTON EXPORT CSV ICI ✅ -->
    <button 
        id="export-csv-btn" 
        class="export-btn"
        style="
            background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
            color: white;
            border: none;
            padding: 0.6rem 1.2rem;
            border-radius: 12px;
            font-size: 0.85rem;
            font-weight: 700;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            transition: all 0.2s ease;
            white-space: nowrap;
        ">
        <i class="fas fa-download"></i> Export CSV
    </button>
</div>
    
    <div id="history-container"></div>
    <div id="history-loader" style="display: none;">
        <i class="fas fa-spinner fa-spin"></i>
        <p>Chargement de l'historique...</p>
    </div>
</div>

            <!-- TAB 3: CRÉER -->
            ${canCreate ? `
            <div class="tab-content" id="create-content">
                <div class="create-form-container">
                    <form id="event-form">
                        
                        <!-- Section: Informations de base -->
                        <div class="form-section">
                            <h3 class="form-section-title">
                                <i class="fas fa-info-circle"></i>
                                Informations de base
                            </h3>
                            
                            <div class="form-group">
                                <label for="event-name">Nom de l'événement <span class="required">*</span></label>
                                <input type="text" id="event-name" placeholder="Ex: Tournoi 5v5 d'été" required>
                            </div>

                            <div class="form-group">
                                <label for="event-description">Description</label>
                                <textarea id="event-description" placeholder="Décrivez votre événement..."></textarea>
                            </div>

                            <div class="form-row">
                                <div class="form-group">
                                    <label for="event-type">Type <span class="required">*</span></label>
                                  <select id="event-type" required>
    <option value="OPEN_EVENT">Public (match / tournoi)</option>
    <option value="CLUB_EVENT">Tournoi réservé aux clubs</option>
</select>

                                </div>

                                <div class="form-group">
                                    <label for="event-registration-type">Mode d'inscription <span class="required">*</span></label>
                                            <select id="event-registration-type" required>
                                            <option value="INDIVIDUAL">Individuelle (UTF)</option>
                                            <option value="CLUB_ONLY">Tournoi réservé aux clubs</option>
                                            </select>
                                    <p class="form-help-text">UTF : Les équipes seront formées après les inscriptions</p>

                                </div>
                            </div>
                        </div>

                        <!-- Section: Date et lieu -->
                        <div class="form-section">
                            <h3 class="form-section-title">
                                <i class="fas fa-map-marker-alt"></i>
                                Date et lieu
                            </h3>

                            <div class="form-group">
                                <label for="event-date">Date <span class="required">*</span></label>
                                <input type="date" id="event-date" required>
                            </div>

                            <div class="form-group">
                                <label for="event-location">Lieu <span class="required">*</span></label>
                                <input type="text" id="event-location" placeholder="Ex: Stade Municipal" required>
                            </div>
                        </div>

                        <!-- Section: Configuration -->
                        <div class="form-section">
                            <h3 class="form-section-title">
                                <i class="fas fa-cog"></i>
                                Configuration
                            </h3>

                            <div class="form-group">
                                <label for="event-visibility">Visibilité <span class="required">*</span></label>
                                <select id="event-visibility" required>
                                    <option value="PUBLIC">Public</option>
                                    <option value="CLUB">Club uniquement</option>
                                    <option value="PRIVATE">Privé (sur invitation)</option>
                                </select>
                            </div>

                            <div class="form-group">
                                <label for="event-max-participants">Nombre maximum de participants</label>
                                <input type="number" id="event-max-participants" min="2" max="500" placeholder="Ex: 20">
                            </div>
                        </div>

                        <!-- Section conditionnelle: UTF -->
                        <div class="form-section conditional-field" id="utf-section">
                            <h3 class="form-section-title">
                                <i class="fas fa-users"></i>
                                Configuration UTF (Formation d'équipes)
                            </h3>

                            <div class="form-row">
                                <div class="form-group">
                                    <label for="event-num-teams">Nombre d'équipes <span class="required">*</span></label>
                                    <input type="number" id="event-num-teams" min="2" max="32" placeholder="Ex: 4">
                                    <p class="form-help-text">Entre 2 et 32 équipes</p>
                                </div>

                                <div class="form-group">
                                    <label for="event-team-size">Taille des équipes <span class="required">*</span></label>
                                    <select id="event-team-size">
                                        <option value="">Sélectionner...</option>
                                        <option value="5">5v5</option>
                                        <option value="7">7v7</option>
                                        <option value="11">11v11</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <button type="submit" class="submit-btn">
                            <i class="fas fa-check-circle"></i>
                            Créer l'événement
                        </button>
                    </form>
                </div>
            </div>
            ` : ''}
        </div>

        <div id="toast" class="toast"></div>
    </div>
    `;
}

export function init(params) {

  
    document.body.classList.add("is-events-page");
    let currentPage = 0;
    let currentFilter = 'all';
    let currentCategory = 'all';
    let loading = false;
    let hasMore = true;

    const eventsContainer = document.getElementById('events-container');
    const loader = document.getElementById('loader');
    const toast = document.getElementById('toast');


    // ═══════════════════════════════════════════════════════════
// ✅ UFT-like scroll : le scroll est dans .content-sections
// ═══════════════════════════════════════════════════════════
__eventsScroller = document.querySelector(".content-sections");
console.log("SCROLLER FOUND ?", __eventsScroller); // test temporaire

__eventsOnScroll = async () => {
  if (!__eventsScroller) return;

  // only discover tab
  const activeTab = document.querySelector(".tab.active")?.dataset.tab;
  if (activeTab !== "discover") return;

  const nearBottom =
    __eventsScroller.scrollTop + __eventsScroller.clientHeight >=
    __eventsScroller.scrollHeight - 200;

  if (!nearBottom) return;

  // ✅ utilise TES variables (loading / hasMore) déjà existantes
  if (loading || !hasMore) return;

  await loadEvents(currentFilter, currentCategory);
};

if (__eventsScroller) {
  __eventsScroller.addEventListener("scroll", __eventsOnScroll, { passive: true });
}


    // ═══════════════════════════════════════════════════════════
    // BACK BUTTON
    // ═══════════════════════════════════════════════════════════
    const backBtn = document.getElementById('backBtn');
    if (backBtn) {
        backBtn.addEventListener('click', () => Router.go('/feed'));
    }
  // TABS NAVIGATION
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', function() {
        const targetTab = this.dataset.tab;
        
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        this.classList.add('active');
        
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(targetTab + '-content').classList.add('active');
        
        if (targetTab === 'my-events') {
            loadMyEvents();
        } else if (targetTab === 'history') {
            loadHistoryEvents();
        }
            else if (targetTab === 'discover') {
    currentPage = 0;
    hasMore = true;
    loading = false;
    eventsContainer.innerHTML = '';
    loadEvents(currentFilter, currentCategory);
}


    });
});

    // ═══════════════════════════════════════════════════════════
    // FILTRES
    // ═══════════════════════════════════════════════════════════
document.querySelectorAll('.filter-chip').forEach(chip => {
    chip.addEventListener('click', function() {
        document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
        this.classList.add('active');

        // On récupère les informations depuis les attributs HTML
        currentFilter = this.dataset.filter;       // ex: OPEN_EVENT
        currentCategory = this.dataset.category;   // ex: MATCH

        currentPage = 0;
        hasMore = true;
        eventsContainer.innerHTML = '';

        // Chargement avec les bons paramètres
        loadEvents(currentFilter, currentCategory);
    });
});
// Filtres historique
document.querySelectorAll('[data-history-filter]').forEach(chip => {
    chip.addEventListener('click', function() {
        document.querySelectorAll('[data-history-filter]').forEach(c => c.classList.remove('active'));
        this.classList.add('active');
        
        const filter = this.dataset.historyFilter;
        loadHistoryEvents(filter);
    });
});

// ═══════════════════════════════════════════════════════════
// 🆕 RECHERCHE DANS L'HISTORIQUE
// ═══════════════════════════════════════════════════════════
const historySearch = document.getElementById('history-search');
const clearSearchBtn = document.getElementById('clear-search');

if (historySearch) {
    historySearch.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase().trim();
        
        // Afficher/masquer le bouton clear
        if (clearSearchBtn) {
            clearSearchBtn.style.display = term ? 'block' : 'none';
        }
        
        // Filtrer les events
        const historyContainer = document.getElementById('history-container');
        const allCards = historyContainer.querySelectorAll('.event-card');
        let visibleCount = 0;
        
        allCards.forEach(card => {
            const title = card.querySelector('h3')?.textContent.toLowerCase() || '';
            const location = card.textContent.toLowerCase();
            
            if (title.includes(term) || location.includes(term)) {
                card.style.display = 'block';
                visibleCount++;
            } else {
                card.style.display = 'none';
            }
        });
        
        // Afficher message si aucun résultat
        const existingMsg = historyContainer.querySelector('.no-results-message');
        if (existingMsg) existingMsg.remove();
        
        if (term && visibleCount === 0) {
            historyContainer.insertAdjacentHTML('beforeend', `
                <div class="no-results-message empty-state">
                    <i class="fas fa-search"></i>
                    <h3>Aucun résultat</h3>
                    <p>Aucun événement ne correspond à "${term}"</p>
                </div>
            `);
        }
        
        // Gérer l'affichage des sections de mois
        historyContainer.querySelectorAll('.month-section').forEach(section => {
            const visibleCardsInMonth = section.querySelectorAll('.event-card[style*="display: block"]').length;
            section.style.display = visibleCardsInMonth > 0 ? 'block' : 'none';
        });
    });
    
    // Focus style
    historySearch.addEventListener('focus', function() {
        this.style.borderColor = 'var(--primary)';
    });
    
    historySearch.addEventListener('blur', function() {
        this.style.borderColor = 'var(--border)';
    });
}

// Bouton clear
if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', () => {
        historySearch.value = '';
        historySearch.dispatchEvent(new Event('input'));
        clearSearchBtn.style.display = 'none';
        historySearch.focus();
    });
}

// ═══════════════════════════════════════════════════════════
// 🆕 EXPORT CSV DE L'HISTORIQUE
// ═══════════════════════════════════════════════════════════
const exportBtn = document.getElementById('export-csv-btn');

if (exportBtn) {
    exportBtn.addEventListener('click', async () => {
        const originalHTML = exportBtn.innerHTML;
        exportBtn.disabled = true;
        exportBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Export...';
        
        try {
            // Récupérer tous les events terminés (max 1000)
            const res = await Auth.secureFetch('/api/events/public/completed?page=0&size=1000');
            const data = await res.json();
            
            if (!res.ok) throw new Error(data.message || 'Erreur');
            
            const events = data.data.content || data.data || [];
            
            if (events.length === 0) {
                showToast('⚠️ Aucun événement à exporter', 'warning');
                return;
            }
            
            // Créer le CSV
            let csv = '\uFEFF'; // BOM UTF-8 pour Excel
            csv += 'Nom;Type;Date;Lieu;Participants;Statut\n';
            
            events.forEach(event => {
                const name = (event.name || '').replace(/"/g, '""');
                const type = event.type || '';
                const date = new Date(event.date).toLocaleDateString('fr-FR');
                const location = (event.location || '').replace(/"/g, '""');
                const participants = event.acceptedParticipants || 0;
                const status = 'TERMINÉ';
                
                csv += `"${name}";"${type}";"${date}";"${location}";"${participants}";"${status}"\n`;
            });
            
            // Créer le fichier et télécharger
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const filename = `historique_tournois_${new Date().toISOString().split('T')[0]}.csv`;
            
            link.href = URL.createObjectURL(blob);
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            showToast(`✅ ${events.length} événements exportés !`, 'success');
            
        } catch (err) {
            console.error('Erreur export:', err);
            showToast('❌ Erreur lors de l\'export', 'error');
        } finally {
            exportBtn.disabled = false;
            exportBtn.innerHTML = originalHTML;
        }
    });
    
    // Hover effect
    exportBtn.addEventListener('mouseenter', function() {
        this.style.transform = 'scale(1.05)';
        this.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.4)';
    });
    
    exportBtn.addEventListener('mouseleave', function() {
        this.style.transform = 'scale(1)';
        this.style.boxShadow = 'none';
    });
}
    // ═══════════════════════════════════════════════════════════
    // CHAMPS CONDITIONNELS (UTF vs SPOND)
    // ═══════════════════════════════════════════════════════════
    const registrationTypeSelect = document.getElementById('event-registration-type');
    const utfSection = document.getElementById('utf-section');

    if (registrationTypeSelect && utfSection) {
        registrationTypeSelect.addEventListener('change', function() {
            if (this.value === 'INDIVIDUAL') {
                utfSection.classList.add('active');
            } else {
                utfSection.classList.remove('active');
            }
        });
    }

    // ═══════════════════════════════════════════════════════════
    // FORMULAIRE CRÉATION
    // ═══════════════════════════════════════════════════════════
    const eventForm = document.getElementById('event-form');
    if (eventForm) {
        eventForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const submitBtn = eventForm.querySelector('.submit-btn');
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Création en cours...';
            
            const registrationType = document.getElementById('event-registration-type').value;
            
            const data = {
                name: document.getElementById('event-name').value,
                description: document.getElementById('event-description').value,
                type: document.getElementById('event-type').value,
                registrationType: registrationType,
                date: document.getElementById('event-date').value,
                location: document.getElementById('event-location').value,
                visibility: document.getElementById('event-visibility').value,
                maxParticipants: parseInt(document.getElementById('event-max-participants').value) || null
            };

            // Si l'utilisateur crée un événement de club, envoyer le clubId
            if (data.type === "CLUB_EVENT") {
                data.clubId = currentUser.clubId; // 🔥 IMPORTANT
            }

            
            if (registrationType === 'INDIVIDUAL') {
                data.numberOfTeams = parseInt(document.getElementById('event-num-teams').value);
                data.teamSize = parseInt(document.getElementById('event-team-size').value);
            }

            try {
                const res = await Auth.secureFetch('/api/events/manage', {
                    method: 'POST',
                    body: JSON.stringify(data)
                });

                const result = await res.json();

                if (res.ok && result.success) {
                    showToast('✅ Événement créé avec succès !', 'success');
                    eventForm.reset();
                    
                    document.querySelector('.tab[data-tab="discover"]').click();
                    currentPage = 0;
                    eventsContainer.innerHTML = '';
                    loadEvents();
                } else {
                    throw new Error(result.message || 'Erreur lors de la création');
                }
            } catch (err) {
                console.error('Erreur:', err);
                showToast('❌ ' + err.message, 'error');
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-check-circle"></i> Créer l\'événement';
            }
        });
    }
  function formatCityDept(location) {
  if (!location) return "";

  // ville = texte avant la première virgule
  let city = location.split(",")[0].trim();

  // essaie de récupérer un code postal 5 chiffres (ex: 83000)
  const m = location.match(/\b(\d{5})\b/);
  const dept = m ? m[1].slice(0, 2) : null;

  city = city.replace(/\s+/g, " ").trim();

  // si on a un CP -> dept
  if (city && dept) return `${city} (${dept})`;

  // sinon juste la ville (ex: "Toulon")
  return city || location;
}

// ═══════════════════════════════════════════════════════════
// CRÉATION CARTE ÉVÉNEMENT (VERSION AMÉLIORÉE - GÈRE COMPLETED)
// ═══════════════════════════════════════════════════════════
function createEventCard(event) {
    const user = Auth.currentUser;
    const isOrganizer = user && event.organizerId === user.id;
   const statusNorm = (event.status || "").trim().toUpperCase();
const isCompleted = statusNorm === "COMPLETED";
const isCanceled = statusNorm === "CANCELED" || statusNorm === "CANCELLED";

// ✅ Calcul temporaire : événement en cours si date passée mais moins de 24h
const now = Date.now();
const isOngoing = statusNorm === "ONGOING";


   const isClub = user && user.clubId && [
    "COACH",
    "CLUB_ADMIN",
    "ORGANIZER",
    "SUPER_ADMIN"
].includes(user.highestRole);
// ✅ Date/heure fiable : utiliser startTime ISO si dispo (sinon construire local)
const dateObj = event.startTime
  ? new Date(event.startTime)
  : (() => {
      if (!event.date) return null;
      const [y, m, d] = event.date.split("-").map(Number);
      return new Date(y, (m || 1) - 1, d || 1, 9, 0, 0); // fallback 09:00
    })();

const dateShort = dateObj
  ? dateObj.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
  : "--";

const timeShort = dateObj
  ? dateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  : "--:--";

const date = `${dateShort} • ${timeShort}`;


const where = formatCityDept(event.location);

    const icons = {
        'OPEN_EVENT': 'fa-calendar-star',
        'CLUB_EVENT': 'fa-users'
    };

    const typeLabel = (event.type === "OPEN_EVENT") ? "Public"
               : (event.type === "CLUB_EVENT") ? "Club"
               : event.type;


    // 🆕 BADGE LIVE SCORE
   let liveScoreBadgeHtml = '';

if (event.format === "SINGLE_MATCH" && isOngoing) {
  liveScoreBadgeHtml = `
    <div class="live-score-banner" data-event-id="${event.id}">
      <div class="live-score-left">
        <span class="live-dot"></span>
        <strong class="live-label">🔴 EN DIRECT</strong>
      </div>
      <div class="live-score-display">
        <span class="loading-score">...</span>
      </div>
    </div>
  `;
}else if (isOngoing && event.format !== "SINGLE_MATCH") {
  liveScoreBadgeHtml = `
    <div class="live-tournament-banner" data-event-id="${event.id}">
      <i class="fas fa-trophy"></i> TOURNOI EN COURS
      <span class="live-matches-count">...</span>
    </div>
  `;
}

   let statusBadgeHtml = '';

if (isCanceled) {
    statusBadgeHtml = `
        <div class="event-registration-status">
            <span class="registration-badge canceled" style="background: #ef4444; color: white;">
                <i class="fas fa-ban"></i>
                ÉVÉNEMENT ANNULÉ
            </span>
        </div>
    `;
} else if (isCompleted) {
    statusBadgeHtml = `
        <div class="event-registration-status">
            <span class="registration-badge completed">
                <i class="fas fa-flag-checkered"></i>
                TOURNOI TERMINÉ
            </span>
        </div>
    `;
} else {
    // ✅ SI CLUB_ONLY ET USER N'A PAS DE CLUB → PAS DE BADGE "OUVERT"
    const isClubOnly = event.registrationType === "CLUB_ONLY";
    const canSeeOpenBadge = !isClubOnly || isClub;
    
    statusBadgeHtml = `
        <div class="event-registration-status">
           ${(typeof event.pendingTeamsByMyClub === "number" && event.pendingTeamsByMyClub > 0) ? `
                <span class="registration-badge pending">
                    <i class="fas fa-clock"></i>
                    ${event.pendingTeamsByMyClub} équipe(s) en attente
                </span>
            ` : (event.registrationClosed || event.isFull || event.groupCount > 0) ? `
                <span class="registration-badge closed">
                    <i class="fas fa-lock"></i>
                    Inscriptions fermées
                </span>
            ` : canSeeOpenBadge ? `
                <span class="registration-badge open">
                    <i class="fas fa-check-circle"></i>
                    Inscriptions ouvertes
                </span>
            ` : ''}

            ${event.registrationDeadline ? `
                <span class="registration-deadline">
                    <i class="fas fa-clock"></i>
                    Limite: ${new Date(event.registrationDeadline).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short'
                    })}
                </span>
            ` : ''}
        </div>
    `;
}

  let buttonHtml = "";

if (isCanceled) {
    buttonHtml = ``; // ✅ aucun bouton si annulé
}

 else if (isCompleted) {
        buttonHtml = `
            <button class="event-action-btn results-btn" data-event-id="${event.id}">
                <i class="fas fa-trophy"></i> Voir les résultats
            </button>
        `;
    } else if (isOrganizer) {
        buttonHtml = `
            <button class="event-action-btn" disabled>
                <i class="fas fa-crown"></i> Organisateur
            </button>
        `;
    } else if (event.registrationType === "CLUB_ONLY") {
        if (isClub) {
            if (event.pendingTeamsByMyClub > 0) {
                buttonHtml = `
                    <button class="event-action-btn" disabled style="background: #f59e0b; cursor: not-allowed;">
                        <i class="fas fa-clock"></i>
                        ${event.pendingTeamsByMyClub} équipe(s) en attente
                    </button>
                `;
           } else if (typeof event.teamsRegisteredByMyClub === "number" && event.teamsRegisteredByMyClub > 0) {

                buttonHtml = `
                    
                `;
            } else if (
                event.registrationClosed ||
                event.isFull ||
                event.groupCount > 0 ||
                event.remainingTeamsForMyClub === 0
            ) {
                buttonHtml = `
                    <button class="event-action-btn" disabled>
                        <i class="fas fa-lock"></i> Inscriptions fermées
                    </button>
                `;
            } else {
                buttonHtml = `
                  <button class="event-action-btn" data-action="register" data-event-id="${event.id}">
  <i class="fas fa-shield"></i> Inscrire mon club
</button>

                `;
            }
        }else {
        // ✅ USER LAMBDA SANS CLUB -> AUCUN BOUTON
        buttonHtml = '';
    }
    } else {
        if (event.registrationClosed || event.isFull) {
            buttonHtml = `
                <button class="event-action-btn" disabled>
                    <i class="fas fa-lock"></i> Inscriptions fermées
                </button>
            `;
        } else {
            buttonHtml = `
                <button class="event-action-btn" data-action="register" data-event-id="${event.id}">
  <i class="fas fa-user-plus"></i> Voir / S'inscrire
</button>

            `;
        }
    }
// ✅ Compteurs globaux (ACCEPTÉS uniquement)
const isTeamMode = (event.registrationType === "CLUB_ONLY"); // tournoi clubs = équipes
const unit = isTeamMode ? "équipes" : "participants";

const registered = Number(event.acceptedParticipants ?? 0);
const capacity = Number(event.maxParticipants ?? event.capacity ?? 0);

// remainingPlaces si l’API le fournit, sinon calcul
const remaining = Number.isFinite(Number(event.remainingPlaces))
  ? Number(event.remainingPlaces)
  : (capacity ? Math.max(0, capacity - registered) : null);

const participantsText = capacity
  ? `${registered}/${capacity} ${unit}`
  : `${registered} ${unit}`;

const remainingText = (remaining !== null)
  ? `${remaining} place${remaining > 1 ? "s" : ""} restante${remaining > 1 ? "s" : ""}`
  : "";

// ✅ Statut inscriptions
const regText = (event.registrationClosed || event.isFull || event.groupCount > 0)
  ? "Inscriptions fermées"
  : "Inscriptions ouvertes";

// ✅ Tarif
const feeCents = Number(event.registrationFeeCents ?? 0);
const feeLabel = feeCents <= 0
  ? "Gratuit"
  : (() => {
      const euros = (feeCents / 100).toFixed(2).replace(".00", "");
      const unitPay = (event.registrationType === "INDIVIDUAL") ? "joueur" : "équipe";
      return `${euros}€ / ${unitPay}`;
    })();

// ✅ Ligne finale (sans pending)
const statusLine = [
  participantsText,
  remainingText || null,
  regText,
  (event.registrationType === "CLUB_ONLY") ? "CLUBS" : null,
  feeLabel
].filter(Boolean).join(" • ");


    return `
        <div class="event-card ${isCompleted ? 'history-card' : ''}" data-event-id="${event.id}">

   ${event.imageUrl ? `<div class="event-cover" style="background-image:url('${event.imageUrl}')"></div>` : ``}


            <div class="event-card-header">
              <div class="event-card-title">
  <div class="event-title-row">
    <h3>${event.name}</h3>
    <span class="event-type-badge badge-${event.type}">
      <i class="fas ${icons[event.type]}"></i>
     ${typeLabel}

    </span>
  </div>
</div>

              <div class="event-card-icon">
  <i class="fas ${icons[event.type]}"></i>
</div>

            </div>

            ${event.description ? `<p class="event-description">${event.description}</p>` : ''}

            ${liveScoreBadgeHtml}
                ${statusBadgeHtml}
            <div class="event-card-info">
                <div class="event-info-item">
                    <i class="fas fa-calendar-alt"></i>
                    <span>${date}</span>
                </div>

                <div class="event-info-item">
                    <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}"
                        target="_blank"
                        rel="noopener"
                        class="map-link"
                        data-map-link
                        title="Voir le lieu sur Google Maps">
                        <i class="fas fa-map-marker-alt"></i>
                    </a>
                   <span>${where}</span>

                </div>

              ${event.registrationType === 'INDIVIDUAL' && (event.numberOfTeams > 0 && event.teamSize > 0) ? `
    <div class="event-info-item">
        <i class="fas fa-users"></i>
        <span>Mode UTF • ${event.numberOfTeams}×${event.teamSize}</span>
    </div>
` : ''}

            </div>

       <div class="event-statusline">${statusLine}</div>

${buttonHtml ? `
  <div class="event-card-footer">
    ${buttonHtml}
  </div>
` : ``}

        </div>
    `;
}

// 🔴 SYSTÈME DE LIVE REFRESH DES SCORES
let liveRefreshInterval = null;

async function refreshLiveScores() {
    const liveScoreBanners = document.querySelectorAll('.live-score-banner');
    const liveTournamentBanners = document.querySelectorAll('.live-tournament-banner');
    
    for (const banner of liveScoreBanners) {
        const eventId = banner.dataset.eventId;
        try {
            const res = await Auth.secureFetch(`/api/events/${eventId}/matches`);
            const data = await res.json();
            const matches = data.data || [];
            
            if (matches.length > 0) {
                const match = matches[0];
                const scoreDisplay = banner.querySelector('.live-score-display');
                if (scoreDisplay) {
                    scoreDisplay.innerHTML = `${match.scoreTeamA ?? 0} - ${match.scoreTeamB ?? 0}`;
                }
            }
        } catch (err) {
            console.error(`Erreur refresh score event ${eventId}:`, err);
        }
    }
    
    for (const banner of liveTournamentBanners) {
        const eventId = banner.dataset.eventId;
        try {
            const res = await Auth.secureFetch(`/api/events/${eventId}/matches`);
            const data = await res.json();
            const matches = data.data || [];
            
            const liveMatches = matches.filter(m => 
                m.status === 'IN_PROGRESS' || m.status === 'ONGOING'
            );
            
            const countDisplay = banner.querySelector('.live-matches-count');
            if (countDisplay) {
                if (liveMatches.length > 0) {
                    countDisplay.innerHTML = `${liveMatches.length} match${liveMatches.length > 1 ? 's' : ''}`;
                } else {
                    countDisplay.innerHTML = 'En pause';
                }
            }
        } catch (err) {
            console.error(`Erreur refresh tournoi ${eventId}:`, err);
        }
    }
}

function startLiveRefresh() {
    refreshLiveScores();
    if (liveRefreshInterval) clearInterval(liveRefreshInterval);
    liveRefreshInterval = setInterval(refreshLiveScores, 15000);
}

function stopLiveRefresh() {
    if (liveRefreshInterval) {
        clearInterval(liveRefreshInterval);
        liveRefreshInterval = null;
    }
}
    // ═══════════════════════════════════════════════════════════
    // MES ÉVÉNEMENTS
    // ═══════════════════════════════════════════════════════════
async function loadEvents(filter = currentFilter, category = currentCategory) {
    if (loading || !hasMore) return;

    loading = true;

    // ✅ Important : si on recharge la page 0 (ou après changement filtre),
// on vide le container pour éviter l’empilement de vieilles cards
if (currentPage === 0) {
  eventsContainer.innerHTML = "";
}

    // Afficher 3 skeletons pendant le chargement
for (let i = 0; i < 3; i++) {
    eventsContainer.insertAdjacentHTML('beforeend', `
        <div class="event-card skeleton"></div>
    `);
}

    // 👉 1) Base : tous les événements visibles
    let url = `/api/events/public/visible?page=${currentPage}&size=20`;

    // 👉 2) Si filtre actif → on passe par /filter
    if (filter !== "all" || (category && category !== "all")) {
        url = `/api/events/public/filter?page=${currentPage}&size=100`;
        
        if (filter !== "all") {
            url += `&type=${filter}`;
        }
        
        if (category && category !== "all") {
            url += `&category=${category}`;
        }
    }

    try {
        const res = await Auth.secureFetch(url);
        const data = await res.json();

        if (!res.ok) throw new Error(data.message || 'Erreur de chargement');

        const events = data.data.content;

const now = Date.now();

const activeEvents = (events || []).filter(event => {
  const s = (event.status || "").trim().toUpperCase();

  // 1) Exclure les états "hors Découvrir"
  if (s === "COMPLETED") return false;
  if (s === "CANCELLED" || s === "CANCELED") return false;
  if (s === "ARCHIVED") return false;

  // 2) Garder les events en cours
  if (s === "ONGOING") return true;

  // 3) Garder seulement les events à venir (UPCOMING)
  // priorité à startTime (ISO) pour éviter le bug UTC
  if (event.startTime) {
    const startMs = new Date(event.startTime).getTime();
    return !Number.isNaN(startMs) && startMs >= now;
  }

  // fallback : date-only => construire local (pas new Date("YYYY-MM-DD"))
  if (event.date) {
    const [y, m, d] = event.date.split("-").map(Number);
    const startLocalMs = new Date(y, (m || 1) - 1, d || 1, 0, 0, 0).getTime();
    return !Number.isNaN(startLocalMs) && startLocalMs >= now;
  }

  // si aucune date valide, on préfère cacher (évite pollution)
  return false;
});



        if (activeEvents.length === 0) {
            if (currentPage === 0) {
                eventsContainer.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-calendar-times"></i>
                        <h3>Aucun événement</h3>
                        <p>Soyez le premier à en créer un !</p>
                    </div>
                `;
            }
            hasMore = false;
        } else {
            const html = activeEvents.map(createEventCard).join("");

if (currentPage === 0) {
  // ✅ on reconstruit complètement (plus de cards fantômes)
  eventsContainer.innerHTML = html;
} else {
  // ✅ infinite scroll : on ajoute
  eventsContainer.insertAdjacentHTML("beforeend", html);
}

currentPage++;

        }

    } catch (err) {
        console.error('Erreur:', err);
        showToast('❌ Erreur de chargement', 'error');
   } finally {
    loading = false;
    // Supprimer les skeletons
    document.querySelectorAll('.event-card.skeleton').forEach(s => s.remove());
    const loaderEl = document.getElementById('loader');
if (loaderEl) loaderEl.style.display = 'none';

}
}

// ═══════════════════════════════════════════════════════════
// MES ÉVÉNEMENTS (TAB "my-events")
// ═══════════════════════════════════════════════════════════
async function loadMyEvents() {
    const container = document.getElementById("my-events-container");
    const loader = document.getElementById("my-events-loader");

    container.innerHTML = "";
    loader.style.display = "block";

    try {
        // Récupère les inscriptions de l'utilisateur
        const res = await Auth.secureFetch("/api/events/registration/me");
        const result = await res.json();

        if (!res.ok) throw new Error(result.message || "Erreur lors du chargement");

        const registrations = result.data;

        if (!registrations || registrations.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-calendar-xmark"></i>
                    <h3>Aucun événement</h3>
                    <p>Vous n'êtes inscrit à aucun événement.</p>
                </div>
            `;
            return;
        }

        // Pour chaque inscription, récupérer les détails complets de l'événement
        for (const reg of registrations) {
            const r2 = await Auth.secureFetch(`/api/events/public/${reg.eventId}`);
            const eData = await r2.json();

            if (r2.ok && eData.data) {
                container.insertAdjacentHTML("beforeend", createEventCard(eData.data));
            }
        }

    } catch (err) {
        console.error(err);
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Erreur</h3>
                <p>${err.message}</p>
            </div>
        `;
    } finally {
        loader.style.display = "none";
    }
}
    // ═══════════════════════════════════════════════════════════
    // TOAST NOTIFICATIONS
    // ═══════════════════════════════════════════════════════════
    function showToast(message, type = 'info') {
        toast.textContent = message;
        toast.className = 'toast show';
        
        if (type === 'success') toast.style.background = '#10B981';
        if (type === 'error') toast.style.background = '#ef4444';
        if (type === 'warning') toast.style.background = '#f59e0b';
        
        setTimeout(() => toast.classList.remove('show'), 3000);
    }

    // ═══════════════════════════════════════════════════════════
    // SCROLL INFINI
    // ═══════════════════════════════════════════════════════════
// window.addEventListener('scroll', () => {
//   if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 200) {
//     const activeTab = document.querySelector('.tab.active')?.dataset.tab;
//     if (activeTab === 'discover') {
//       loadEvents();
//     }
//   }
// });


    // ═══════════════════════════════════════════════════════════
    // INIT - CHARGER LES ÉVÉNEMENTS
    // ═══════════════════════════════════════════════════════════
loadEvents();

// 🔴 DÉMARRER LE LIVE REFRESH
startLiveRefresh();
__stopLiveRefreshFn = stopLiveRefresh;
__beforeUnloadFn = stopLiveRefresh;
window.addEventListener('beforeunload', __beforeUnloadFn);

        // ✅ ÉCOUTER LES CHANGEMENTS ADMIN → PUBLIC
const onEventsChanged = (e) => {
    console.log('🔄 Events changed:', e.detail);
    currentPage = 0;
    hasMore = true;
    eventsContainer.innerHTML = '';
    loadEvents(currentFilter, currentCategory);
};
window.addEventListener("events:changed", onEventsChanged);

        // ✅ SYNC MULTI-ONGLETS via localStorage
window.addEventListener("storage", (e) => {
    if (e.key === "events_invalidated_at") {
        console.log("🔄 Storage event détecté ! Rafraîchissement automatique...");
        currentPage = 0;
        hasMore = true;
        eventsContainer.innerHTML = '';
        loadEvents(currentFilter, currentCategory);
    }
});



// === CLICK SUR CARTE (ouvrir détail événement) ===
eventsContainer.addEventListener("click", (e) => {
    // 👉 SI on clique sur l'icône Google Maps → on laisse faire
    if (e.target.closest("[data-map-link]")) {
        return;
    }

    const btn = e.target.closest(".event-action-btn");

    if (btn && btn.disabled) {
        showToast("⛔ Action non disponible", "warning");
        return;
    }

    if (btn) {
        const eventId = btn.dataset.eventId;
        
        // 🆕 TOUS LES BOUTONS VONT SUR LA MÊME PAGE
        // La page s'adaptera automatiquement selon le statut
        console.log('🔥 Redirection vers event:', eventId);
        Router.go(`/events/${eventId}`);  // ✅ Route normale, pas /public
        return;
    }

    const card = e.target.closest(".event-card");
    if (!card) return;

    Router.go(`/events/${card.dataset.eventId}`);
});

    // 👇 AJOUTEZ CES LIGNES ICI
   // Masquer le bouton POST YOUR GOAL sur cette page
setTimeout(() => {
    const postBtn = document.querySelector('.gc-post-btn');
    if (postBtn) {
        postBtn.style.display = 'none';
    }
}, 100);
// ═══════════════════════════════════════════════════════════
// HISTORIQUE DES ÉVÉNEMENTS TERMINÉS
// ═══════════════════════════════════════════════════════════
async function loadHistoryEvents(filter = 'all') {
    const container = document.getElementById('history-container');
    const loader = document.getElementById('history-loader');
    
    container.innerHTML = '';
    loader.style.display = 'block';
    
    try {
       const now = Date.now();

// 1) Completed (source actuelle)
let completedUrl = `/api/events/public/completed?page=0&size=50`;
if (filter !== 'all') completedUrl += `&type=${filter}`;

const r1 = await Auth.secureFetch(completedUrl);
const j1 = await r1.json();
if (!r1.ok) throw new Error(j1.message || "Erreur de chargement (completed)");
const completed = (j1.data?.content || j1.data || []);

// 2) Visible (pour récupérer CANCELLED + PAST non clôturés)
let visibleUrl = `/api/events/public/visible?page=0&size=200`;
if (filter !== 'all') visibleUrl += `&type=${filter}`;

const r2 = await Auth.secureFetch(visibleUrl);
const j2 = await r2.json();
if (!r2.ok) throw new Error(j2.message || "Erreur de chargement (visible)");
const visible = (j2.data?.content || j2.data || []);

// 3) Extra = annulés + passés (date dépassée)
const extra = visible.filter(e => {
  const s = (e.status || "").trim().toUpperCase();

  // ✅ 1) Ne jamais mettre ONGOING dans l’historique
  if (s === "ONGOING") return false;

  // ✅ 2) Annulés + archivés doivent être en historique
  const isCanceled = (s === "CANCELLED" || s === "CANCELED");
  const isArchived = (s === "ARCHIVED");

  // ✅ 3) “Passé” = startTime < now (sinon fallback date locale)
  let isPast = false;

  if (e.startTime) {
    const startMs = new Date(e.startTime).getTime();
    isPast = !Number.isNaN(startMs) && startMs < now;
  } else if (e.date) {
    const [y, m, d] = e.date.split("-").map(Number);
    const localMs = new Date(y, (m || 1) - 1, d || 1, 0, 0, 0).getTime();
    isPast = !Number.isNaN(localMs) && localMs < now;
  }

  return isCanceled || isArchived || isPast;
});


// 4) Merge unique (évite doublons)
const map = new Map();
[...completed, ...extra].forEach(e => map.set(e.id, e));
const events = Array.from(map.values());

function startMs(e){
  if (e.startTime) {
    const t = new Date(e.startTime).getTime();
    if (!Number.isNaN(t)) return t;
  }
  if (e.date) {
    const [y,m,d] = e.date.split("-").map(Number);
    const t = new Date(y,(m||1)-1,d||1,0,0,0).getTime();
    if (!Number.isNaN(t)) return t;
  }
  return 0;
}

events.sort((a, b) => startMs(b) - startMs(a));


        
        if (events.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-trophy"></i>
                    <h3>Aucun tournoi terminé</h3>
                    <p>L'historique des tournois apparaîtra ici</p>
                </div>
            `;
            return;
        }
        
        // Grouper par mois
        const byMonth = {};
        events.forEach(event => {
         const date = event.startTime
  ? new Date(event.startTime)
  : (() => {
      const [y,m,d] = (event.date || "1970-01-01").split("-").map(Number);
      return new Date(y,(m||1)-1,d||1,0,0,0);
    })();

            const monthKey = date.toLocaleDateString('fr-FR', {
                year: 'numeric',
                month: 'long'
            });
            
            if (!byMonth[monthKey]) byMonth[monthKey] = [];
            byMonth[monthKey].push(event);
        });
        
        // 🆕 HTML AVEC ACCORDÉON
        Object.keys(byMonth).forEach((month, index) => {
            const eventsInMonth = byMonth[month];
            const monthId = `month-${index}`;
            const isFirst = index === 0;
            
            // 🔥 STRUCTURE ACCORDÉON COMPLÈTE
            const monthSection = `
                <div class="month-section">
                    <!-- 👇 TITRE CLIQUABLE (toggle accordéon) -->
                    <h3 class="month-title accordion-toggle ${isFirst ? 'active' : ''}" 
                        data-target="${monthId}"
                        style="cursor: pointer; user-select: none;">
                        
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <i class="fas fa-calendar"></i>
                            <span>${month}</span>
                            <span style="
                                background: var(--primary);
                                color: #000;
                                padding: 4px 12px;
                                border-radius: 20px;
                                font-size: 0.85em;
                                font-weight: 700;">
                                ${eventsInMonth.length}
                            </span>
                        </div>
                        
                        <!-- 👇 ICÔNE CHEVRON (🔽/🔼) -->
                        <i class="fas fa-chevron-down" 
                           style="
                               transition: transform 0.3s ease;
                               color: var(--primary);
                               font-size: 1.2em;
                               ${isFirst ? 'transform: rotate(180deg);' : ''}
                           "></i>
                    </h3>
                    
                    <!-- 👇 CONTENU (les events) -->
                    <div class="month-events accordion-content ${isFirst ? 'active' : ''}" 
                         id="${monthId}"
                         style="
                             max-height: ${isFirst ? '10000px' : '0'};
                             overflow: hidden;
                             transition: max-height 0.5s ease;
                             opacity: ${isFirst ? '1' : '0'};
                         ">
                        ${eventsInMonth.map(event => createEventCard(event)).join('')}
                    </div>
                </div>
            `;
            
            container.insertAdjacentHTML('beforeend', monthSection);
        });
        
        // 🆕 ÉVÉNEMENT CLIC SUR LES TITRES
        container.querySelectorAll('.accordion-toggle').forEach(toggle => {
            toggle.addEventListener('click', function(e) {
                e.stopPropagation(); // Ne pas déclencher le clic sur la card
                
                const targetId = this.dataset.target;
                const content = document.getElementById(targetId);
                const icon = this.querySelector('.fa-chevron-down');
                
                // Toggle classes
                const isActive = content.style.maxHeight !== '0px' && content.style.maxHeight !== '';
                
                if (isActive) {
                    // FERMER
                    content.style.maxHeight = '0';
                    content.style.opacity = '0';
                    icon.style.transform = 'rotate(0deg)';
                    this.classList.remove('active');
                } else {
                    // OUVRIR
                    content.style.maxHeight = '10000px';
                    content.style.opacity = '1';
                    icon.style.transform = 'rotate(180deg)';
                    this.classList.add('active');
                }
            });
        });
        
        // 🆕 CLICS SUR LES CARDS
       container.onclick = (e) => {
  if (e.target.closest("[data-map-link]")) return;
  if (e.target.closest('.accordion-toggle')) return;

  const btn = e.target.closest(".event-action-btn");
  if (btn && btn.disabled) {
    showToast("⛔ Action non disponible", "warning");
    return;
  }

  if (btn) {
    Router.go(`/events/${btn.dataset.eventId}`);
    return;
  }

  const card = e.target.closest(".event-card");
  if (card) Router.go(`/events/${card.dataset.eventId}`);
};

        
    } catch (err) {
        console.error('Erreur:', err);
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Erreur</h3>
                <p>${err.message}</p>
            </div>
        `;
    } finally {
        loader.style.display = 'none';
    }
}
}
export function cleanup() {
  document.body.classList.remove("is-events-page");

  // ✅ enlever le listener scroll sur .content-sections
  if (__eventsScroller && __eventsOnScroll) {
    __eventsScroller.removeEventListener("scroll", __eventsOnScroll);
  }
  __eventsScroller = null;
  __eventsOnScroll = null;

  // stop live refresh
  if (__stopLiveRefreshFn) {
    try { __stopLiveRefreshFn(); } catch(e) {}
  }
  __stopLiveRefreshFn = null;

  // remove beforeunload
  if (__beforeUnloadFn) {
    window.removeEventListener("beforeunload", __beforeUnloadFn);
  }
  __beforeUnloadFn = null;

  // (optionnel) reset anti-spam
  __eventsLoadingMore = false;
  __eventsLastTrigger = 0;


  // ✅ Retirer l'écoute
if (typeof onEventsChanged !== 'undefined') {
    window.removeEventListener("events:changed", onEventsChanged);
}
}
