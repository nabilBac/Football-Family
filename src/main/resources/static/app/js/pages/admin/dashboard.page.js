// /app/js/pages/admin/dashboard.page.js
// ✅ VERSION AMÉLIORÉE - Dashboard professionnel avec personnalisation
import { AdminNav } from '../../components/admin-nav.js';

export const AdminDashboardPage = {

async render() {
    return `
        ${AdminNav.render('dashboard')}
        <div class="admin-main" style="padding: 20px; margin-top: 40px;">
            <div id="admin-dashboard-content"></div>
        </div>
    `;
},


  async init() {
    // ⏳ Attendre que le DOM soit mis à jour
    await new Promise(resolve => requestAnimationFrame(resolve));
    
    const container = document.getElementById("admin-dashboard-content");
    if (!container) {
        console.error("❌ Container #admin-dashboard-content introuvable");
        return;
    }


                    // ✅ Anti-flash loader (affiché seulement si > 200ms)
let t = setTimeout(() => {
  if (container) {
    container.innerHTML = `
      <div class="admin-card">
        <p>⏳ Chargement du tableau de bord...</p>
      </div>
    `;
  }
}, 200);


        const token = localStorage.getItem("accessToken");
        const currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");

       if (!currentUser) {
  clearTimeout(t);
  container.innerHTML = `<p>Utilisateur non connecté.</p>`;
  return;
}


     const userRole = currentUser.highestRole || "";
   const isAllowed = userRole === "CLUB_ADMIN" || userRole === "SUPER_ADMIN";

   if (!isAllowed) {
  clearTimeout(t);
  container.innerHTML = `<p>❌ Accès refusé. Vous devez être CLUB_ADMIN ou SUPER_ADMIN.</p>`;
  return;
}

    // ⬆️ FIN DU GUARD

 if (!currentUser.clubId) {
  clearTimeout(t);
  container.innerHTML = `<p>❌ Aucun club n'est associé à ce compte.</p>`;
  return;
}



        const clubId = currentUser.clubId;

        try {
            // =============================
            // 📊 CHARGER LES DONNÉES
            // =============================
            
           // ⚡ FETCHES PARALLÈLES (3x plus rapide)
const [clubInfo, events, teams] = await Promise.all([
    this.safeFetchSingle(`/api/clubs/${clubId}`, token).catch(() => null),
    this.safeFetch("/api/tournament/admin/events", token).catch(() => []),
    this.safeFetch(`/api/teams/club/${clubId}`, token).catch(() => [])
]);

            // =============================
            // 📈 CALCULS
            // =============================
const today = new Date().setHours(0, 0, 0, 0);

// 🔥 Événements à venir = DATE future ET STATUS actif
const upcomingEvents = events.filter(e => {
    const eventDate = new Date(e.date).setHours(0, 0, 0, 0);
    const isFuture = eventDate >= today;
    const isActive = ['DRAFT', 'PUBLISHED', 'ONGOING'].includes(e.status);
    return isFuture && isActive;
});

// 🔥 Événements passés = DATE passée OU STATUS terminé
const pastEvents = events.filter(e => {
    const eventDate = new Date(e.date).setHours(0, 0, 0, 0);
    const isPast = eventDate < today;
    const isCompleted = e.status === 'COMPLETED';
    return isPast || isCompleted;
});

            // Prochain événement
            const nextEvent = upcomingEvents.length > 0 
                ? upcomingEvents.sort((a, b) => new Date(a.date) - new Date(b.date))[0]
                : null;
                        clearTimeout(t);
            // =============================
            // 🎨 RENDU HTML
            // =============================
            container.innerHTML = `
                <!-- ✅ HEADER PERSONNALISÉ -->
                <div class="welcome-header">
                    <div class="welcome-content">
                        <h1 class="welcome-title">
                            👋 Bienvenue, ${this.escapeHtml(currentUser.firstName || currentUser.username || 'Admin')} !
                        </h1>
                        <p class="welcome-subtitle">
                            🏆 ${clubInfo?.name ? this.escapeHtml(clubInfo.name) : 'Votre club'}
                        </p>
                    </div>
                    ${clubInfo?.logoUrl ? `
                        <img src="${this.escapeHtml(clubInfo.logoUrl)}" 
                             alt="Logo" 
                             class="welcome-logo">
                    ` : `
                        <div class="welcome-logo-placeholder">⚽</div>
                    `}
                </div>

                <!-- ✅ METRICS CARDS -->
                <div class="admin-dashboard-grid">

                    <a href="/admin/events" data-link class="dashboard-card-pro">
                        <div class="dashboard-card-icon">📅</div>
                        <div class="dashboard-card-title">Événements à venir</div>
                        <div class="dashboard-card-value">${upcomingEvents.length}</div>
                        ${nextEvent ? `
                            <div class="dashboard-card-meta">
                                🔥 Prochain : ${this.escapeHtml(nextEvent.name)}
                            </div>
                        ` : upcomingEvents.length === 0 ? `
                            <div class="dashboard-card-meta">
                                💡 Aucun événement prévu
                            </div>
                        ` : ''}
                    </a>

                    <a href="/admin/events" data-link class="dashboard-card-pro">
                        <div class="dashboard-card-icon">🕓</div>
                        <div class="dashboard-card-title">Événements passés</div>
                        <div class="dashboard-card-value">${pastEvents.length}</div>
                        ${pastEvents.length > 0 ? `
                            <div class="dashboard-card-meta">
                                📊 Historique complet
                            </div>
                        ` : `
                            <div class="dashboard-card-meta">
                                ➡️ Commencez par créer un tournoi
                            </div>
                        `}
                    </a>

                    <a href="/admin/teams" data-link class="dashboard-card-pro">
                        <div class="dashboard-card-icon">👥</div>
                        <div class="dashboard-card-title">Mes équipes</div>
                        <div class="dashboard-card-value">${teams.length}</div>
                        <div class="dashboard-card-meta">
                            ${teams.length >= 10 
                                ? '💪 Excellent effectif !' 
                                : teams.length >= 5 
                                    ? '📈 Bonne progression' 
                                    : '🚀 Continuez à recruter'}
                        </div>
                    </a>

                   <a href="/admin/events/create" data-link class="dashboard-card-pro cta">
    <div class="dashboard-card-icon">🏆</div>
    <div class="dashboard-card-title">Créer un tournoi</div>
    <div class="dashboard-card-value">Événement complet</div>
    <div class="dashboard-card-meta">
        ⚡ Poules + Phase finale
    </div>
</a>

<!-- 🆕 NOUVELLE CARTE MATCH UNIQUE -->
<a href="/admin/events/create-match" data-link class="dashboard-card-pro cta" style="background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);">
    <div class="dashboard-card-icon">⚽</div>
    <div class="dashboard-card-title">Créer un match</div>
    <div class="dashboard-card-value">Match unique</div>
    <div class="dashboard-card-meta">
        ⚡ Rapide et simple
    </div>
</a>

                </div>

                <!-- ✅ QUICK ACTIONS -->
                <div class="quick-actions-section">
                    <h2 class="section-title">⚡ Actions rapides</h2>
                 <div class="quick-actions-grid">
    <a href="/admin/events/create" data-link class="quick-action-btn">
    <i class="fas fa-trophy"></i>
    <span>Nouveau tournoi</span>
</a>

<a href="/admin/events/create-match" data-link class="quick-action-btn" style="background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);">
    <i class="fas fa-futbol"></i>
    <span>Créer un match</span>
</a>

<a href="/admin/teams" data-link class="quick-action-btn">
    <i class="fas fa-users"></i>
    <span>Gérer mes équipes</span>
</a>

<a href="/admin/events" data-link class="quick-action-btn">
    <i class="fas fa-calendar-check"></i>
    <span>Voir tous les événements</span>
</a>
</div>
                </div>

                <!-- ✅ ACTIVITÉ RÉCENTE -->
                ${upcomingEvents.length > 0 || pastEvents.length > 0 ? `
                    <div class="recent-activity-section">
                        <h2 class="section-title">📊 Activité récente</h2>
                        <div class="activity-list">
                            ${this.renderRecentActivity(upcomingEvents, pastEvents)}
                        </div>
                    </div>
                ` : ''}
            `;

        } catch (err) {
            console.error("Dashboard Admin Error:", err);
            container.innerHTML = `
                <div style="
                    background: #fadbd8;
                    border: 2px solid #e74c3c;
                    border-radius: 12px;
                    padding: 20px;
                    text-align: center;
                ">
                    <p style="color: #e74c3c; font-weight: 600; margin: 0;">
                        ❌ Erreur lors du chargement du tableau de bord
                    </p>
                    <p style="color: #7f8c8d; margin: 10px 0 0 0; font-size: 0.9rem;">
                        ${this.escapeHtml(err.message || 'Erreur inconnue')}
                    </p>
                </div>
            `;
        }
 
}, 

    // =====================================================
    // 🎨 RENDU ACTIVITÉ RÉCENTE
    // =====================================================
    renderRecentActivity(upcomingEvents, pastEvents) {
        const allEvents = [...upcomingEvents, ...pastEvents]
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 5);

        if (allEvents.length === 0) {
            return `
                <div class="activity-empty">
                    <p>Aucune activité récente</p>
                </div>
            `;
        }

        return allEvents.map(event => {
            const eventDate = new Date(event.date);
            const isPast = eventDate < new Date();
            const formattedDate = eventDate.toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            });

            return `
                <a href="/admin/events/${event.id}" data-link class="activity-item">
                    <div class="activity-icon ${isPast ? 'past' : 'upcoming'}">
                        ${isPast ? '✅' : '📅'}
                    </div>
                    <div class="activity-content">
                        <div class="activity-title">${this.escapeHtml(event.name)}</div>
                        <div class="activity-meta">
                            ${formattedDate} • ${event.city || 'Lieu NC'}
                        </div>
                    </div>
                    <div class="activity-arrow">→</div>
                </a>
            `;
        }).join('');
    },

    // =====================================================
    // 🔐 UTILITAIRES
    // =====================================================
    async safeFetch(url, token) {
        const res = await fetch(url, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!res.ok) {
            console.warn("Fetch error:", url);
            return [];
        }

        const json = await res.json();

        if (Array.isArray(json)) return json;
        if (Array.isArray(json.data)) return json.data;
        if (json.content && Array.isArray(json.content)) return json.content;

        return [];
    },

    async safeFetchSingle(url, token) {
        const res = await fetch(url, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
        }

        const json = await res.json();
        return json.data || json;
    },

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

export default AdminDashboardPage;