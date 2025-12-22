// /static/app/js/pages/events/events.page.js

import { Auth } from "../../auth.js";
import { Router } from "../../router.js";

export async function render(params) {
    // Charger CSS si nécessaire
    if (!document.querySelector('link[href="/css/events.css"]')) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "/css/events.css";
        document.head.appendChild(link);
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
        </div>

        <!-- CONTENT SECTIONS -->
        <div class="content-sections">
            
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
    let currentPage = 0;
    let currentFilter = 'all';
    let currentCategory = 'all';
    let loading = false;
    let hasMore = true;

    const eventsContainer = document.getElementById('events-container');
    const loader = document.getElementById('loader');
    const toast = document.getElementById('toast');

    // ═══════════════════════════════════════════════════════════
    // BACK BUTTON
    // ═══════════════════════════════════════════════════════════
    const backBtn = document.getElementById('backBtn');
    if (backBtn) {
        backBtn.addEventListener('click', () => Router.go('/feed'));
    }

    // ═══════════════════════════════════════════════════════════
    // TABS NAVIGATION
    // ═══════════════════════════════════════════════════════════
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
    // ═══════════════════════════════════════════════════════════
    // CRÉATION CARTE ÉVÉNEMENT
    // ═══════════════════════════════════════════════════════════
function createEventCard(event) {
    const user = Auth.currentUser;
    const isOrganizer = user && event.organizerId === user.id;

    const isClub = user && [
  "COACH",
  "CLUB_ADMIN",
  "ORGANIZER",
  "SUPER_ADMIN"
].includes(user.highestRole);


    const date = new Date(event.date).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    const icons = {
        'OPEN_EVENT': 'fa-calendar-star',
        'CLUB_EVENT': 'fa-users'
    };

    let buttonHtml = "";

    if (isOrganizer) {
        buttonHtml = `
            <button class="event-action-btn" disabled>
                <i class="fas fa-crown"></i> Organisateur
            </button>
        `;
    } else if (event.registrationType === "CLUB_ONLY") {
      if (isClub) {
    // ✅ Vérifier si le club a des équipes PENDING ou ACCEPTED
    if (event.pendingTeamsByMyClub > 0) {
        buttonHtml = `
            <button class="event-action-btn" disabled style="background: #f59e0b; cursor: not-allowed;">
                <i class="fas fa-clock"></i> 
                ${event.pendingTeamsByMyClub} équipe(s) en attente
            </button>
        `;
    } else if (event.teamsRegisteredByMyClub > 0) {
        buttonHtml = `
            <button class="event-action-btn" disabled style="background: #10b981; cursor: not-allowed;">
                <i class="fas fa-check-circle"></i> 
                ${event.teamsRegisteredByMyClub} équipe(s) inscrites
            </button>
        `;
  }else if (
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
}


     else {
        buttonHtml = `
            <button class="event-action-btn" data-event-id="${event.id}">
                <i class="fas fa-shield"></i> Inscrire mon club
            </button>
        `;
    }
}else {
            buttonHtml = `
                <button class="event-action-btn" disabled>
                    <i class="fas fa-lock"></i> Réservé aux clubs
                </button>
            `;
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
            <button class="event-action-btn" data-event-id="${event.id}">
                <i class="fas fa-user-plus"></i> Voir / S'inscrire
            </button>
        `;
    }
}

    return `
        <div class="event-card" data-event-id="${event.id}">
            
            <div class="event-card-header">
                <div class="event-card-title">
                    <h3>${event.name}</h3>
                    <span class="event-type-badge badge-${event.type}">
                        <i class="fas ${icons[event.type]}"></i>
                        ${event.type}
                    </span>
                </div>
                <div class="event-card-icon">
                    ${event.imageUrl 
                        ? `<img src="${event.imageUrl}" class="event-logo-small" alt="Logo">`
                        : `<i class="fas ${icons[event.type]}"></i>`
                    }
                </div>
            </div>

            ${event.description ? `<p class="event-description">${event.description}</p>` : ''}

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
    <span>${event.location}</span>
</div>

                ${event.registrationType === 'INDIVIDUAL' ? `
                    <div class="event-info-item">
                        <i class="fas fa-users"></i>
                        <span>Mode UTF - ${event.numberOfTeams || 0} équipes de ${event.teamSize || 0}</span>
                    </div>
                ` : event.registrationType === 'CLUB_ONLY' ? `
                    <div class="event-info-item">
                        <i class="fas fa-shield"></i>
                        <span>Réservé aux clubs</span>
                    </div>
                ` : ''}
            </div>
<!-- 🆕 BADGE STATUT INSCRIPTIONS -->
<div class="event-registration-status">
    ${event.pendingTeamsByMyClub > 0 ? `
        <span class="registration-badge pending">
            <i class="fas fa-clock"></i>
            ${event.pendingTeamsByMyClub} équipe(s) en attente
        </span>
    ` : (event.registrationClosed || event.isFull || event.groupCount > 0)
 ? `
        <span class="registration-badge closed">
            <i class="fas fa-lock"></i>
            Inscriptions fermées
        </span>
    ` : `
        <span class="registration-badge open">
            <i class="fas fa-check-circle"></i>
            Inscriptions ouvertes
        </span>
    `}

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


            <div class="event-card-footer">
                <div class="event-participants badge">
                    <i class="fas fa-shield-alt"></i>
                    <span>
                        ${event.registrationType === "CLUB_ONLY"
                            ? `${event.acceptedParticipants ?? 0} / ${event.maxParticipants ?? "∞"} équipes`
                            : `${event.acceptedParticipants ?? 0} / ${event.maxParticipants ?? "∞"} participants`
                        }
                    </span>
                </div>

                ${buttonHtml}
            </div>
        </div>
    `;
}



    // ═══════════════════════════════════════════════════════════
    // MES ÉVÉNEMENTS
    // ═══════════════════════════════════════════════════════════
async function loadEvents(filter = currentFilter, category = currentCategory) {

    if (loading || !hasMore) return;

    loading = true;
    loader.style.display = 'block';

    // 👉 1) Base : tous les événements visibles
   let url = `/api/events/public/visible?page=${currentPage}&size=20`;

    // 👉 2) Si filtre actif → on passe par /filter
    if (filter !== "all" || (category && category !== "all")) {
       url = `/api/events/public/filter?page=${currentPage}&size=20`;

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

        if (events.length === 0) {
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
            events.forEach(event => {
                const card = createEventCard(event);
                eventsContainer.insertAdjacentHTML('beforeend', card);
            });
            currentPage++;
        }

    } catch (err) {
        console.error('Erreur:', err);
        showToast('❌ Erreur de chargement', 'error');
    } finally {
        loading = false;
        loader.style.display = 'none';
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
window.addEventListener('scroll', () => {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 200) {
        const activeTab = document.querySelector('.tab.active')?.dataset.tab;
        if (activeTab === 'discover') {
            loadEvents();
        }
    }
});

    // ═══════════════════════════════════════════════════════════
    // INIT - CHARGER LES ÉVÉNEMENTS
    // ═══════════════════════════════════════════════════════════
    loadEvents();
// === CLICK SUR CARTE (ouvrir détail événement) ===
  eventsContainer.addEventListener("click", (e) => {

    // 👉 SI on clique sur l’icône Google Maps → on laisse faire
    if (e.target.closest("[data-map-link]")) {
        return;
    }

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
    if (!card) return;

    Router.go(`/events/${card.dataset.eventId}`);
});






    // 👇 AJOUTEZ CES LIGNES ICI
    // Masquer le bouton POST YOUR GOAL sur cette page
   // Masquer le bouton POST YOUR GOAL sur cette page
setTimeout(() => {
    const postBtn = document.querySelector('.gc-post-btn');
    if (postBtn) {
        postBtn.style.display = 'none';
    }
}, 100);
}

