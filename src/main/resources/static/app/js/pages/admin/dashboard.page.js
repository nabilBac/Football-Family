// /app/js/pages/admin/dashboard.page.js
// ✅ VERSION PRO — Design dark theme inspiré de la démo HTML Admin Module
// Conserve toute la logique existante, remplace uniquement le rendu visuel


export const AdminDashboardPage = {

async render() {
    return `
        <div class="admin-main" style="padding: 20px; margin-top: 40px;">
            <div id="admin-dashboard-content"></div>
        </div>
    `;
},


async init() {
    await new Promise(resolve => requestAnimationFrame(resolve));

    const container = document.getElementById("admin-dashboard-content");
    if (!container) {
        console.error("❌ Container #admin-dashboard-content introuvable");
        return;
    }

    // ✅ Injecter le CSS dark theme une seule fois
    if (!document.getElementById('admin-dash-pro-css')) {
        const styleEl = document.createElement('style');
        styleEl.id = 'admin-dash-pro-css';
        styleEl.textContent = this.getStyles();
        document.head.appendChild(styleEl);
    }

    // ✅ Anti-flash loader
    let t = setTimeout(() => {
        if (container) {
            container.innerHTML = `
                <div class="adp-loader">
                    <div class="adp-loader-spinner"></div>
                    <p>Chargement du tableau de bord…</p>
                </div>
            `;
        }
    }, 200);

    const token = localStorage.getItem("accessToken");
    const currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");

    if (!currentUser) {
        clearTimeout(t);
        container.innerHTML = `<div class="adp-error-msg">Utilisateur non connecté.</div>`;
        return;
    }

    const userRole = currentUser.highestRole || "";
    const isAllowed = userRole === "CLUB_ADMIN" || userRole === "SUPER_ADMIN";

    if (!isAllowed) {
        clearTimeout(t);
        container.innerHTML = `<div class="adp-error-msg">❌ Accès refusé. Vous devez être CLUB_ADMIN ou SUPER_ADMIN.</div>`;
        return;
    }

    if (!currentUser.clubId) {
        clearTimeout(t);
        container.innerHTML = `<div class="adp-error-msg">❌ Aucun club n'est associé à ce compte.</div>`;
        return;
    }

    const clubId = currentUser.clubId;

    try {
        // =============================
        // 📊 CHARGER LES DONNÉES
        // =============================
        const [clubInfo, events, teams] = await Promise.all([
            this.safeFetchSingle(`/api/clubs/${clubId}`, token).catch(() => null),
            this.safeFetch("/api/tournament/admin/events", token).catch(() => []),
            this.safeFetch(`/api/teams/club/${clubId}`, token).catch(() => [])
        ]);

        // =============================
        // 📈 CALCULS
        // =============================
        const today = new Date().setHours(0, 0, 0, 0);

        const upcomingEvents = events.filter(e => {
            const eventDate = new Date(e.date).setHours(0, 0, 0, 0);
            const isFuture = eventDate >= today;
            const isActive = ['DRAFT', 'PUBLISHED', 'ONGOING'].includes(e.status);
            return isFuture && isActive;
        });

        const pastEvents = events.filter(e => {
            const eventDate = new Date(e.date).setHours(0, 0, 0, 0);
            const isPast = eventDate < today;
            const isCompleted = e.status === 'COMPLETED';
            return isPast || isCompleted;
        });

        const ongoingEvents = events.filter(e => e.status === 'ONGOING');
        const draftEvents = events.filter(e => e.status === 'DRAFT');
        const publishedEvents = events.filter(e => e.status === 'PUBLISHED');

        const nextEvent = upcomingEvents.length > 0
            ? upcomingEvents.sort((a, b) => new Date(a.date) - new Date(b.date))[0]
            : null;

        // Nombre total d'inscriptions en attente (si dispo dans les données)
        const pendingRegistrations = events.reduce((acc, e) => acc + (e.pendingRegistrations || 0), 0);

        clearTimeout(t);

        // =============================
        // 🎨 RENDU HTML — DESIGN PRO
        // =============================
        container.innerHTML = `
            <div class="adp-page">

                <!-- ═══════ WELCOME + ACTIONS ═══════ -->
                <div class="adp-welcome">
                    <div class="adp-welcome-left">
                        <h2 class="adp-welcome-title">
                            👋 Bienvenue, ${this.escapeHtml(currentUser.firstName || currentUser.username || 'Admin')} !
                        </h2>
                        <p class="adp-welcome-sub">
                            ${clubInfo?.name ? `🏆 ${this.escapeHtml(clubInfo.name)}` : 'Votre club'}
                        </p>
                        <div class="adp-welcome-actions">
                            <a href="/admin/events/create" data-link class="adp-btn adp-btn-primary adp-btn-sm">+ Créer un événement</a>
                            <a href="/admin/events/create-match" data-link class="adp-btn adp-btn-match adp-btn-sm">⚽ Créer un match</a>
                            ${pendingRegistrations > 0 ? `
                                <a href="/admin/registrations" data-link class="adp-btn adp-btn-warn adp-btn-sm">
                                    🔔 ${pendingRegistrations} alerte${pendingRegistrations > 1 ? 's' : ''}
                                </a>
                            ` : ''}
                        </div>
                    </div>
                    ${clubInfo?.logoUrl ? `
                        <img src="${this.escapeHtml(clubInfo.logoUrl)}" alt="Logo" class="adp-welcome-logo">
                    ` : `
                        <div class="adp-welcome-logo-placeholder">⚽</div>
                    `}
                </div>

                <!-- ═══════ STATS ROW ═══════ -->
                <div class="adp-stats-row">
                    <a href="/admin/events" data-link class="adp-stat-card">
                        <div class="adp-stat-label">Événements actifs</div>
                        <div class="adp-stat-value adp-green">${ongoingEvents.length + publishedEvents.length}</div>
                        <div class="adp-stat-delta">${upcomingEvents.length > 0 ? `↑ ${upcomingEvents.length} à venir` : 'Aucun à venir'}</div>
                    </a>
                    <div class="adp-stat-card">
                        <div class="adp-stat-label">Inscriptions en attente</div>
                        <div class="adp-stat-value adp-orange">${pendingRegistrations || '—'}</div>
                        <div class="adp-stat-delta">${pendingRegistrations > 0 ? 'Action requise' : 'Aucune en attente'}</div>
                    </div>
                    <div class="adp-stat-card">
                        <div class="adp-stat-label">Événements passés</div>
                        <div class="adp-stat-value adp-blue">${pastEvents.length}</div>
                        <div class="adp-stat-delta">${pastEvents.length > 0 ? '📊 Historique complet' : '—'}</div>
                    </div>
                    <a href="/admin/teams" data-link class="adp-stat-card">
                        <div class="adp-stat-label">Mes équipes</div>
                        <div class="adp-stat-value adp-purple">${teams.length}</div>
                        <div class="adp-stat-delta">${teams.length >= 10 ? '💪 Excellent effectif' : teams.length >= 5 ? '📈 Bonne progression' : '🚀 Continuez à recruter'}</div>
                    </a>
                </div>

                <!-- ═══════ ALERTE INSCRIPTIONS ═══════ -->
                ${pendingRegistrations > 0 ? `
                    <div class="adp-alert-banner">
                        <span class="adp-alert-icon">⚠️</span>
                        <div class="adp-alert-text">
                            <strong>${pendingRegistrations} inscription${pendingRegistrations > 1 ? 's' : ''} en attente de validation.</strong>
                            Traitez-les avant expiration.
                        </div>
                        <a href="/admin/registrations" data-link class="adp-btn adp-btn-warn adp-btn-sm">Traiter maintenant</a>
                    </div>
                ` : ''}

                <!-- ═══════ TABLE ÉVÉNEMENTS ═══════ -->
                <div class="adp-card">
                    <div class="adp-card-header">
                        <span class="adp-card-title">Tous les événements</span>
                        <div style="display:flex;gap:8px">
                            <a href="/admin/events/create" data-link class="adp-btn adp-btn-primary adp-btn-sm">+ Nouveau</a>
                        </div>
                    </div>
                    <div class="adp-card-body-flush">
                        ${events.length > 0 ? `
                            <table class="adp-events-table">
                                <thead>
                                    <tr>
                                        <th>Événement</th>
                                        <th>Statut</th>
                                        <th>Équipes</th>
                                        <th>Date</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${events
                                        .sort((a, b) => new Date(b.date) - new Date(a.date))
                                        .map(event => this.renderEventRow(event))
                                        .join('')}
                                </tbody>
                            </table>
                        ` : `
                            <div class="adp-empty-state">
                                <div class="adp-empty-icon">🏆</div>
                                <p class="adp-empty-title">Aucun événement pour le moment</p>
                                <p class="adp-empty-sub">Créez votre premier tournoi ou match pour commencer.</p>
                                <div style="display:flex;gap:10px;justify-content:center;margin-top:16px">
                                    <a href="/admin/events/create" data-link class="adp-btn adp-btn-primary">+ Créer un tournoi</a>
                                    <a href="/admin/events/create-match" data-link class="adp-btn adp-btn-match">⚽ Créer un match</a>
                                </div>
                            </div>
                        `}
                    </div>
                </div>

                <!-- ═══════ ACTIONS RAPIDES ═══════ -->
                <div class="adp-quick-section">
                    <h3 class="adp-section-title">⚡ Actions rapides</h3>
                    <div class="adp-action-grid">
                        <a href="/admin/events/create" data-link class="adp-action-card">
                            <div class="adp-action-icon">🏆</div>
                            <div>
                                <div class="adp-action-label">Nouveau tournoi</div>
                                <div class="adp-action-sub">Poules + Phase finale</div>
                            </div>
                        </a>
                        <a href="/admin/events/create-match" data-link class="adp-action-card">
                            <div class="adp-action-icon">⚽</div>
                            <div>
                                <div class="adp-action-label">Créer un match</div>
                                <div class="adp-action-sub">Rapide et simple</div>
                            </div>
                        </a>
                        <a href="/admin/teams" data-link class="adp-action-card">
                            <div class="adp-action-icon">👥</div>
                            <div>
                                <div class="adp-action-label">Gérer mes équipes</div>
                                <div class="adp-action-sub">${teams.length} équipe${teams.length > 1 ? 's' : ''}</div>
                            </div>
                        </a>
                        <a href="/admin/events" data-link class="adp-action-card">
                            <div class="adp-action-icon">📅</div>
                            <div>
                                <div class="adp-action-label">Tous les événements</div>
                                <div class="adp-action-sub">${events.length} au total</div>
                            </div>
                        </a>
                    </div>
                </div>

            </div>
        `;

    } catch (err) {
        console.error("Dashboard Admin Error:", err);
        clearTimeout(t);
        container.innerHTML = `
            <div class="adp-error-block">
                <p class="adp-error-title">❌ Erreur lors du chargement</p>
                <p class="adp-error-detail">${this.escapeHtml(err.message || 'Erreur inconnue')}</p>
            </div>
        `;
    }
},


// =====================================================
// 🎨 RENDU LIGNE ÉVÉNEMENT
// =====================================================
renderEventRow(event) {
    const statusMap = {
        'DRAFT':     { label: 'Brouillon',             cls: 'adp-status-draft' },
        'PUBLISHED': { label: 'Inscriptions ouvertes',  cls: 'adp-status-open' },
        'ONGOING':   { label: 'En cours',               cls: 'adp-status-started' },
        'COMPLETED': { label: 'Terminé',                cls: 'adp-status-finished' },
        'CANCELLED': { label: 'Annulé',                 cls: 'adp-status-cancelled' }
    };

    const st = statusMap[event.status] || { label: event.status || '—', cls: 'adp-status-draft' };

    const eventDate = event.date ? new Date(event.date).toLocaleDateString('fr-FR', {
        day: 'numeric', month: 'short', year: 'numeric'
    }) : '—';

    const teamsCount = event.registeredTeams ?? event.teamsCount ?? '—';
    const teamsMax = event.maxTeams ?? '—';
    const fillPercent = (teamsMax && teamsMax !== '—' && teamsCount !== '—')
        ? Math.min(100, Math.round((teamsCount / teamsMax) * 100))
        : 0;

    const typeIcon = event.eventType === 'SINGLE_MATCH' ? '⚽' : '🏆';
    const meta = [
        event.category,
        event.format,
        event.city
    ].filter(Boolean).join(' · ');

    return `
        <tr>
            <td>
                <div class="adp-event-name">${typeIcon} ${this.escapeHtml(event.name || 'Sans nom')}</div>
                <div class="adp-event-meta">${this.escapeHtml(meta) || '—'}</div>
            </td>
            <td><span class="adp-status-badge ${st.cls}">${st.label}</span></td>
            <td>
                <div class="adp-teams-count">${teamsCount} / ${teamsMax}</div>
                ${fillPercent > 0 ? `
                    <div class="adp-progress-mini">
                        <div class="adp-progress-fill" style="width:${fillPercent}%"></div>
                    </div>
                ` : ''}
            </td>
            <td class="adp-cell-date">${eventDate}</td>
            <td>
                <a href="/admin/events/${event.id}" data-link class="adp-btn adp-btn-ghost adp-btn-sm">Gérer →</a>
            </td>
        </tr>
    `;
},


// =====================================================
// 🎨 CSS — DARK THEME PRO
// =====================================================
getStyles() {
    return `
    /* ============================================================
       ADMIN DASHBOARD PRO — DARK THEME
       ============================================================ */
    :root {
        --adp-bg: #0a0e1a;
        --adp-surface: #111827;
        --adp-surface2: #1a2235;
        --adp-border: #1f2e47;
        --adp-accent: #22c55e;
        --adp-accent2: #16a34a;
        --adp-accent-glow: rgba(34,197,94,0.15);
        --adp-text: #f0f4ff;
        --adp-muted: #64748b;
        --adp-warn: #f59e0b;
        --adp-danger: #ef4444;
        --adp-info: #3b82f6;
        --adp-purple: #a855f7;
    }

    .adp-page {
        max-width: 1200px;
        margin: 0 auto;
        padding: 0 4px 40px;
        font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        color: var(--adp-text);
    }

    /* WELCOME */
    .adp-welcome {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 20px 0;
        margin-bottom: 4px;
    }
    .adp-welcome-title {
        font-family: 'Syne', sans-serif;
        font-size: 24px;
        font-weight: 800;
        margin: 0 0 4px;
    }
    .adp-welcome-sub {
        color: var(--adp-muted);
        font-size: 14px;
        margin: 0;
    }
    .adp-welcome-actions {
        display: flex;
        gap: 8px;
        margin-top: 12px;
        flex-wrap: wrap;
    }
    .adp-welcome-logo {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        object-fit: cover;
        border: 1px solid var(--adp-border);
    }
    .adp-welcome-logo-placeholder {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        background: var(--adp-surface2);
        border: 1px solid var(--adp-border);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 22px;
    }

    /* STATS ROW */
    .adp-stats-row {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 16px;
        margin-bottom: 24px;
    }
    .adp-stat-card {
        background: var(--adp-surface);
        border: 1px solid var(--adp-border);
        border-radius: 12px;
        padding: 20px;
        text-decoration: none;
        color: inherit;
        transition: border-color 0.2s, transform 0.15s;
    }
    .adp-stat-card:hover {
        border-color: var(--adp-accent);
        transform: translateY(-2px);
    }
    .adp-stat-label {
        font-size: 12px;
        color: var(--adp-muted);
        text-transform: uppercase;
        letter-spacing: 1px;
        margin-bottom: 8px;
    }
    .adp-stat-value {
        font-family: 'Syne', sans-serif;
        font-size: 32px;
        font-weight: 800;
        line-height: 1;
    }
    .adp-stat-delta {
        font-size: 12px;
        color: var(--adp-muted);
        margin-top: 6px;
    }
    .adp-green { color: var(--adp-accent); }
    .adp-orange { color: var(--adp-warn); }
    .adp-blue { color: var(--adp-info); }
    .adp-purple { color: var(--adp-purple); }

    /* ALERT BANNER */
    .adp-alert-banner {
        background: rgba(245,158,11,0.08);
        border: 1px solid rgba(245,158,11,0.3);
        border-radius: 10px;
        padding: 14px 18px;
        margin-bottom: 24px;
        display: flex;
        align-items: center;
        gap: 12px;
    }
    .adp-alert-icon { font-size: 20px; }
    .adp-alert-text {
        font-size: 13px;
        flex: 1;
    }
    .adp-alert-text strong { color: var(--adp-warn); }

    /* CARDS */
    .adp-card {
        background: var(--adp-surface);
        border: 1px solid var(--adp-border);
        border-radius: 12px;
        overflow: hidden;
        margin-bottom: 24px;
    }
    .adp-card-header {
        padding: 18px 20px;
        border-bottom: 1px solid var(--adp-border);
        display: flex;
        align-items: center;
        justify-content: space-between;
    }
    .adp-card-title {
        font-family: 'Syne', sans-serif;
        font-weight: 700;
        font-size: 15px;
    }
    .adp-card-body-flush { padding: 0; }

    /* EVENTS TABLE */
    .adp-events-table {
        width: 100%;
        border-collapse: collapse;
    }
    .adp-events-table th {
        text-align: left;
        font-size: 11px;
        color: var(--adp-muted);
        text-transform: uppercase;
        letter-spacing: 1px;
        padding: 12px 16px;
        border-bottom: 1px solid var(--adp-border);
        font-weight: 500;
    }
    .adp-events-table td {
        padding: 14px 16px;
        border-bottom: 1px solid rgba(31,46,71,0.5);
        font-size: 14px;
        vertical-align: middle;
    }
    .adp-events-table tr:last-child td { border-bottom: none; }
    .adp-events-table tr:hover td { background: var(--adp-surface2); }

    .adp-event-name { font-weight: 500; }
    .adp-event-meta { font-size: 12px; color: var(--adp-muted); margin-top: 2px; }
    .adp-cell-date { font-size: 13px; color: var(--adp-muted); }

    .adp-teams-count { font-size: 14px; font-weight: 500; }

    /* PROGRESS BAR */
    .adp-progress-mini {
        width: 80px;
        height: 4px;
        background: var(--adp-border);
        border-radius: 99px;
        overflow: hidden;
        margin-top: 4px;
    }
    .adp-progress-fill {
        height: 100%;
        background: var(--adp-accent);
        border-radius: 99px;
        transition: width 0.4s ease;
    }

    /* STATUS BADGES */
    .adp-status-badge {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        padding: 4px 10px;
        border-radius: 99px;
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        white-space: nowrap;
    }
    .adp-status-badge::before {
        content: '';
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: currentColor;
        flex-shrink: 0;
    }
    .adp-status-draft    { color: #64748b; background: rgba(100,116,139,0.15); }
    .adp-status-open     { color: var(--adp-info); background: rgba(59,130,246,0.15); }
    .adp-status-started  { color: var(--adp-accent); background: rgba(34,197,94,0.15); }
    .adp-status-finished { color: var(--adp-purple); background: rgba(168,85,247,0.15); }
    .adp-status-cancelled{ color: var(--adp-danger); background: rgba(239,68,68,0.15); }

    /* BUTTONS */
    .adp-btn {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 9px 18px;
        border-radius: 8px;
        border: none;
        cursor: pointer;
        font-family: 'DM Sans', sans-serif;
        font-size: 14px;
        font-weight: 500;
        transition: all 0.15s;
        text-decoration: none;
        white-space: nowrap;
    }
    .adp-btn-primary { background: var(--adp-accent); color: #000; }
    .adp-btn-primary:hover { background: var(--adp-accent2); }
    .adp-btn-ghost {
        background: transparent;
        color: var(--adp-muted);
        border: 1px solid var(--adp-border);
    }
    .adp-btn-ghost:hover { background: var(--adp-surface2); color: var(--adp-text); }
    .adp-btn-warn {
        background: rgba(245,158,11,0.15);
        color: var(--adp-warn);
        border: 1px solid rgba(245,158,11,0.3);
    }
    .adp-btn-warn:hover { background: rgba(245,158,11,0.25); }
    .adp-btn-match {
        background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
        color: #fff;
    }
    .adp-btn-match:hover { opacity: 0.9; }
    .adp-btn-sm { padding: 6px 12px; font-size: 12px; }

    /* QUICK ACTIONS */
    .adp-quick-section { margin-bottom: 24px; }
    .adp-section-title {
        font-family: 'Syne', sans-serif;
        font-size: 15px;
        font-weight: 700;
        margin: 0 0 14px;
    }
    .adp-action-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 12px;
    }
    .adp-action-card {
        padding: 16px;
        background: var(--adp-surface2);
        border: 1px solid var(--adp-border);
        border-radius: 10px;
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        gap: 12px;
        text-decoration: none;
        color: inherit;
    }
    .adp-action-card:hover {
        border-color: var(--adp-accent);
        background: var(--adp-accent-glow);
    }
    .adp-action-icon { font-size: 22px; }
    .adp-action-label { font-size: 13px; font-weight: 500; }
    .adp-action-sub { font-size: 11px; color: var(--adp-muted); }

    /* EMPTY STATE */
    .adp-empty-state {
        padding: 48px 20px;
        text-align: center;
    }
    .adp-empty-icon { font-size: 40px; margin-bottom: 12px; }
    .adp-empty-title { font-size: 16px; font-weight: 600; margin: 0 0 6px; }
    .adp-empty-sub { font-size: 13px; color: var(--adp-muted); margin: 0; }

    /* LOADER */
    .adp-loader {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 80px 20px;
        color: var(--adp-muted);
        gap: 16px;
    }
    .adp-loader-spinner {
        width: 32px;
        height: 32px;
        border: 3px solid var(--adp-border);
        border-top-color: var(--adp-accent);
        border-radius: 50%;
        animation: adpSpin 0.8s linear infinite;
    }
    @keyframes adpSpin { to { transform: rotate(360deg); } }

    /* ERROR */
    .adp-error-msg {
        background: var(--adp-surface);
        border: 1px solid var(--adp-border);
        border-radius: 12px;
        padding: 24px;
        text-align: center;
        color: var(--adp-muted);
        margin: 40px auto;
        max-width: 500px;
    }
    .adp-error-block {
        background: rgba(239,68,68,0.08);
        border: 2px solid rgba(239,68,68,0.3);
        border-radius: 12px;
        padding: 24px;
        text-align: center;
        max-width: 500px;
        margin: 40px auto;
    }
    .adp-error-title { color: var(--adp-danger); font-weight: 600; margin: 0 0 8px; }
    .adp-error-detail { color: var(--adp-muted); font-size: 13px; margin: 0; }

    /* ═══════ RESPONSIVE ═══════ */
    @media (max-width: 768px) {
        .adp-page { padding: 0 12px 24px; }
        .adp-stats-row { grid-template-columns: repeat(2, 1fr); gap: 10px; }
        .adp-action-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
        .adp-topbar { flex-direction: column; gap: 10px; align-items: flex-start; }
        .adp-topbar-right { flex-wrap: wrap; }
        .adp-stat-value { font-size: 24px; }
        .adp-welcome-title { font-size: 18px; }
        .adp-events-table th:nth-child(3),
        .adp-events-table td:nth-child(3) { display: none; }
    }
    @media (max-width: 480px) {
        .adp-stats-row { grid-template-columns: 1fr; }
        .adp-action-grid { grid-template-columns: 1fr; }
        .adp-events-table th:nth-child(4),
        .adp-events-table td:nth-child(4) { display: none; }
    }
    `;
},


// =====================================================
// 🔐 UTILITAIRES (inchangés)
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