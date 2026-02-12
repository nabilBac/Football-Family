// event-detail-components.js
// 🎨 TOUS LES COMPOSANTS VISUELS - VERSION CORRIGÉE POUR TON CSS

export function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/* ============================================================================
   HEADER
   ============================================================================ */
export function renderHeader(isOrganizer) {
    return `
        <div class="event-detail-header">
            <button class="back-btn" id="backBtn">
                <i class="fas fa-arrow-left"></i>
            </button>
            <h1>Détail événement</h1>
            ${isOrganizer ? `
                <button class="menu-btn" id="menuBtn">
                    <i class="fas fa-ellipsis-v"></i>
                </button>
            ` : '<div style="width: 42px;"></div>'}
        </div>
    `;
}
function getPlacesRestantes(inscrits, max) {
    if (!max) return 'Places illimitées';
    const restantes = max - (inscrits || 0);
    if (restantes <= 0) return 'Complet';
    return `${restantes} place${restantes > 1 ? 's' : ''} restante${restantes > 1 ? 's' : ''}`;
}
/* ============================================================================
   HERO SECTION
   ============================================================================ */
export function renderHero(event) {
    const statusBadge = getStatusBadge(event.status, event.format === "SINGLE_MATCH");
    const typeIcon = event.format === "SINGLE_MATCH" ? "fa-futbol" : "fa-trophy";
    const typeLabel = event.format === "SINGLE_MATCH" ? "Match" : "Tournoi";
    
    return `
        <div class="hero-section-pro">
            <div class="hero-background"></div>
            <div class="hero-gradient"></div>
            <div class="hero-content-grid">
                <div class="hero-left">
                    ${statusBadge}
                    <div class="hero-badges-row">
                        <span class="hero-badge">
                            <i class="fas ${typeIcon}"></i>
                            ${typeLabel}
                        </span>
                    </div>
                    <h1 class="hero-title">${escapeHtml(event.name)}</h1>
                    <div class="hero-meta-grid">
                        <div class="hero-meta-item">
                            <i class="fas fa-calendar-alt"></i>
                            ${formatDate(event.startDate)}
                        </div>
                        <div class="hero-meta-item">
                            <i class="fas fa-map-marker-alt"></i>
                            ${escapeHtml(event.location)}
                        </div>
                    </div>
                </div>
                <div class="hero-right">
                   <div class="hero-stat-mini accent">
    <div class="stat-mini-value">
        ${event.acceptedParticipants ?? 0}/${event.maxParticipants ?? '∞'}
    </div>
    <div class="stat-mini-label">
        ${getPlacesRestantes(event.acceptedParticipants, event.maxParticipants)}
    </div>
</div>
                    <div class="hero-stat-mini secondary">
                        <div class="stat-mini-value">${event.category ?? 'U19'}</div>
                        <div class="stat-mini-label">Catégorie</div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function getStatusBadge(status, isSingleMatch) {
    if (status === 'ONGOING') {
        return `
            <div class="hero-status-badge live">
                <span class="pulse-dot"></span>
                EN DIRECT
            </div>
        `;
    }
    if (status === 'PUBLISHED' || status === 'REGISTRATION_CLOSED') {
        return `<div class="hero-status-badge upcoming"><i class="fas fa-calendar"></i> À venir</div>`;
    }
    if (status === 'COMPLETED') {
        return `<div class="hero-status-badge completed"><i class="fas fa-check-circle"></i> Terminé</div>`;
    }
    return '';
}

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

/* ============================================================================
   QUICK INFO CARDS
   ============================================================================ */
export function renderQuickInfo(event) {
    const isClubEvent = event.registrationType === "CLUB_ONLY";
    
    return `
        <div class="quick-stats-scroll">
            <div class="stat-card-scroll accent">
                <div class="stat-icon-scroll">
                    <i class="fas ${isClubEvent ? 'fa-shield-alt' : 'fa-users'}"></i>
                </div>
                <div class="stat-info-scroll">
                    <div class="stat-value-scroll">
                        ${isClubEvent ? (event.teamsRegisteredByMyClub ?? 0) : (event.acceptedParticipants ?? 0)} 
                        / ${isClubEvent ? (event.maxTeamsPerClub ?? '∞') : (event.maxParticipants ?? '∞')}
                    </div>
                    <div class="stat-label-scroll">
                        ${isClubEvent ? 'Équipes' : 'Participants'}
                    </div>
                </div>
            </div>

            <div class="stat-card-scroll success">
                <div class="stat-icon-scroll">
                    <i class="fas fa-trophy"></i>
                </div>
                <div class="stat-info-scroll">
                    <div class="stat-value-scroll">${escapeHtml(event.category || 'Standard')}</div>
                    <div class="stat-label-scroll">Catégorie</div>
                </div>
            </div>

            <div class="stat-card-scroll warning">
                <div class="stat-icon-scroll">
                    <i class="fas fa-futbol"></i>
                </div>
                <div class="stat-info-scroll">
                    <div class="stat-value-scroll">${getFormatLabel(event)}</div>
                    <div class="stat-label-scroll">Format</div>
                </div>
            </div>

            <div class="stat-card-scroll danger">
                <div class="stat-icon-scroll">
                    <i class="fas fa-clock"></i>
                </div>
                <div class="stat-info-scroll">
                    <div class="stat-value-scroll">${getDuration(event)}</div>
                    <div class="stat-label-scroll">Durée</div>
                </div>
            </div>
        </div>
    `;
}

function getFormatLabel(event) {
    if (event.format === 'SINGLE_MATCH') return 'Match unique';
    if (event.teamSize) return `${event.teamSize} vs ${event.teamSize}`;
    return 'Standard';
}

function getDuration(event) {
    if (!event.startDate || !event.endDate) return '1 jour';
    const start = new Date(event.startDate);
    const end = new Date(event.endDate);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    return `${days} jour${days > 1 ? 's' : ''}`;
}

/* ============================================================================
   DESCRIPTION
   ============================================================================ */
export function renderDescription(description, isSingleMatch) {
    if (!description) return '';
    
    return `
        <div class="description">
            <h2 class="section-title">
                <i class="fas fa-align-left"></i>
                À propos ${isSingleMatch ? 'du match' : 'du tournoi'}
            </h2>
            <div class="description-text">${escapeHtml(description)}</div>
        </div>
    `;
}

/* ============================================================================
   STATS GRID
   ============================================================================ */
export function renderStats(event) {
    return `
        <div class="stats-grid">
            <div class="stat-box">
                <div class="stat-value">${event.totalMatches ?? '-'}</div>
                <div class="stat-label">Matchs</div>
            </div>
            <div class="stat-box">
                <div class="stat-value">${event.groupCount ?? '-'}</div>
                <div class="stat-label">Poules</div>
            </div>
            <div class="stat-box">
                <div class="stat-value">${event.registrationFee ? '€' + event.registrationFee : 'Gratuit'}</div>
                <div class="stat-label">Inscription</div>
            </div>
        </div>
    `;
}

/* ============================================================================
   TABS NAVIGATION
   ============================================================================ */
export function renderTabs(isSingleMatch, isOrganizer) {
    const tabs = isSingleMatch ? [
        { id: 'live', icon: 'fa-video', label: 'Live' },
        { id: 'feed', icon: 'fa-newspaper', label: 'Actualités' },
        { id: 'infos', icon: 'fa-info-circle', label: 'Infos' },
    ] : [
        { id: 'live', icon: 'fa-video', label: 'Live' },
        { id: 'matches', icon: 'fa-futbol', label: 'Matchs' },
        { id: 'rankings', icon: 'fa-list-ol', label: 'Classements' },
        { id: 'bracket', icon: 'fa-trophy', label: 'Phase finale' },
        { id: 'feed', icon: 'fa-newspaper', label: 'Actualités' },
        { id: 'planning', icon: 'fa-calendar-day', label: 'Planning' },
        { id: 'gallery', icon: 'fa-images', label: 'Galerie' },
        { id: 'infos', icon: 'fa-info-circle', label: 'Infos pratiques' },
    ];
    
    if (isOrganizer) {
        tabs.push({ id: 'admin', icon: 'fa-crown', label: 'Gestion' });
    }
    
    return `
        <div class="tabs-sticky-container">
            <div class="tabs-sticky-pro">
                ${tabs.map((tab, index) => `
                    <button class="tab-pill tournament-tab ${index === 0 ? 'active' : ''}" data-tab="${tab.id}">
                        <i class="fas ${tab.icon}"></i>
                        <span>${tab.label}</span>
                    </button>
                `).join('')}
            </div>
        </div>
    `;
}

/* ============================================================================
   TAB CONTENT CONTAINERS
   ============================================================================ */
export function renderTabContents(isSingleMatch, isOrganizer) {
    const tabs = isSingleMatch ? ['live', 'feed', 'infos'] : 
        ['live', 'matches', 'rankings', 'bracket', 'feed', 'planning', 'gallery', 'infos'];
    
    if (isOrganizer) tabs.push('admin');
    
    return tabs.map((tab, index) => `
        <div id="tab-${tab}" class="tab-content-pro tournament-tab-content ${index === 0 ? 'active' : ''}"></div>
    `).join('');
}

/* ============================================================================
   LIVE VIDEO PLACEHOLDER
   ============================================================================ */
export function renderLiveVideo(match) {
    return `
        <div class="live-video-container">
            <div class="video-placeholder">
                <span class="live-badge-video">
                    <span class="pulse-dot"></span>
                    DIRECT
                </span>
                <i class="fas fa-video"></i>
                <p style="color: var(--text-secondary); font-size: 14px;">
                    ${match ? `${escapeHtml(match.teamA)} vs ${escapeHtml(match.teamB)}` : 'Stream en direct'}
                </p>
            </div>
            <div class="video-info">
                <div class="video-title">🔴 Match en direct</div>
                <div class="video-meta">
                    <span><i class="fas fa-eye"></i> Spectateurs</span>
                    <span><i class="fas fa-clock"></i> En cours</span>
                </div>
            </div>
        </div>
    `;
}

/* ============================================================================
   MATCH CARD
   ============================================================================ */
export function renderMatchCard(match) {
    const isLive = match.status === 'IN_PROGRESS' || match.status === 'ONGOING';
    const isFinished = match.status === 'FINISHED' || match.status === 'COMPLETED';
    
    return `
        <div class="match-card ${isLive ? 'live' : ''} ${isFinished ? 'finished' : ''}">
            ${isLive ? `<div class="live-badge">🔴 ${match.elapsedMinutes ?? 0}'</div>` : ''}
            <div class="match-row-grid">
                <div class="finished-team-name">${escapeHtml(match.teamA?.name || match.teamA || 'Équipe A')}</div>
                <div class="match-score">${match.scoreTeamA ?? '-'} - ${match.scoreTeamB ?? '-'}</div>
                <div class="finished-team-name">${escapeHtml(match.teamB?.name || match.teamB || 'Équipe B')}</div>
            </div>
            ${match.scheduledStartTime || match.location || match.round ? `
                <div class="match-details">
                    ${match.round ? `<div class="match-detail"><i class="fas fa-trophy"></i> ${escapeHtml(match.round)}</div>` : ''}
                    ${match.scheduledStartTime ? `<div class="match-detail"><i class="fas fa-clock"></i> ${formatMatchTime(match)}</div>` : ''}
                    ${match.location ? `<div class="match-detail"><i class="fas fa-map-marker-alt"></i> ${escapeHtml(match.location)}</div>` : ''}
                </div>
            ` : ''}
        </div>
    `;
}

function formatMatchTime(match) {
    if (!match.scheduledStartTime) return 'À définir';
    const date = new Date(match.scheduledStartTime);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

/* ============================================================================
   RANKING TABLE
   ============================================================================ */
export function renderRankingTable(groupName, teams) {
    return `
        <div class="ranking-group">
            <div class="ranking-group-header">🏆 ${escapeHtml(groupName)}</div>
            <table class="ranking-table">
                <thead>
                    <tr>
                        <th class="ranking-position">#</th>
                        <th>Équipe</th>
                        <th>Pts</th>
                        <th>J</th>
                        <th>+/-</th>
                    </tr>
                </thead>
                <tbody>
                    ${teams.map((team, index) => `
                        <tr>
                            <td class="ranking-position ${index < 2 ? 'qualified' : ''}">${index + 1}</td>
                            <td class="ranking-team-name">${escapeHtml(team.teamName || team.name)}</td>
                            <td class="ranking-points">${team.points ?? 0}</td>
                            <td>${team.played ?? 0}</td>
                            <td style="color: ${(team.goalDifference ?? 0) >= 0 ? 'var(--primary)' : '#ef4444'};">
                                ${(team.goalDifference ?? 0) > 0 ? '+' : ''}${team.goalDifference ?? 0}
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

/* ============================================================================
   BRACKET
   ============================================================================ */
export function renderBracket(rounds) {
    return `
        <div class="bracket-tree">
            ${rounds.map(round => `
                <div class="bracket-column">
                    <div class="bracket-round-title">${escapeHtml(round.name)}</div>
                    ${round.matches.map(match => renderBracketMatch(match)).join('')}
                </div>
            `).join('')}
        </div>
    `;
}

function renderBracketMatch(match) {
    const teamAWins = match.status === 'FINISHED' && (match.scoreTeamA ?? 0) > (match.scoreTeamB ?? 0);
    const teamBWins = match.status === 'FINISHED' && (match.scoreTeamB ?? 0) > (match.scoreTeamA ?? 0);
    const isLive = match.status === 'IN_PROGRESS' || match.status === 'ONGOING';
    
    return `
        <div class="bracket-match ${isLive ? 'live' : ''}">
            ${isLive ? '<div class="live-badge">DIRECT</div>' : ''}
            <div class="bracket-team ${teamAWins ? 'winner' : ''}">
                <span class="bracket-team-name">${escapeHtml(match.teamA?.name || match.teamA || 'TBD')}</span>
                <span class="bracket-score">${match.scoreTeamA ?? '-'}</span>
            </div>
            <div class="bracket-divider"></div>
            <div class="bracket-team ${teamBWins ? 'winner' : ''}">
                <span class="bracket-team-name">${escapeHtml(match.teamB?.name || match.teamB || 'TBD')}</span>
                <span class="bracket-score">${match.scoreTeamB ?? '-'}</span>
            </div>
        </div>
    `;
}

/* ============================================================================
   FEED ITEM
   ============================================================================ */
export function renderFeedItem(item) {
    const icon = item.type === 'GOAL' ? 'fa-futbol' :
                 item.type === 'CARD' ? 'fa-square' :
                 item.type === 'MATCH_START' ? 'fa-play-circle' :
                 item.type === 'MATCH_END' ? 'fa-flag-checkered' :
                 'fa-newspaper';
    
    return `
        <div class="feed-item">
            <div class="feed-icon">
                <i class="fas ${icon}"></i>
            </div>
            <div class="feed-content">
                <div class="feed-text">${escapeHtml(item.description || item.title)}</div>
                <div class="feed-meta">
                    <span class="feed-time">${getTimeAgo(item.timestamp)}</span>
                    ${item.matchName ? `<span class="feed-match">${escapeHtml(item.matchName)}</span>` : ''}
                </div>
            </div>
        </div>
    `;
}

function getTimeAgo(timestamp) {
    if (!timestamp) return '';
    const now = new Date();
    const time = new Date(timestamp);
    const diff = Math.floor((now - time) / 1000);
    
    if (diff < 60) return 'À l\'instant';
    if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)}h`;
    return `Il y a ${Math.floor(diff / 86400)}j`;
}

/* ============================================================================
   PRACTICAL INFO SECTIONS
   ============================================================================ */
export function renderPracticalInfo(event) {
    return `
        <div class="info-section">
            <div class="info-section-title">
                <i class="fas fa-map-marker-alt"></i>
                Accès & Localisation
            </div>
            <div class="info-row">
                <i class="fas fa-location-arrow"></i>
                <div>
                    <strong>Adresse</strong><br>
                    ${escapeHtml(event.location || 'Non défini')}<br>
                    ${event.address ? escapeHtml(event.address) : ''}
                </div>
            </div>
        </div>
    `;
}

/* ============================================================================
   ADMIN SECTION
   ============================================================================ */
export function renderAdminSection(event) {
    return `
        <h3 style="font-size: 16px; font-weight: 700; margin-bottom: 12px;">
            <i class="fas fa-crown"></i> Actions rapides
        </h3>
        <div class="admin-actions">
            <button onclick="location.href='/admin/events/${event.id}'">Dashboard</button>
        </div>
    `;
}

/* ============================================================================
   FLOATING CTA
   ============================================================================ */
export function renderFloatingCTA(event, isAuthenticated, isOrganizer, registrationInfo, hasClub) {
    if (!isAuthenticated || isOrganizer) return '';
    
    const isClubEvent = event.registrationType === "CLUB_ONLY";
    
    // Cas 1 : Inscrit avec différents statuts
    if (registrationInfo) {
        const status = registrationInfo.status;
        const isPaid = registrationInfo.paymentStatus === 'PAID';
        
        // Statut PENDING (en attente validation)
        if (status === 'PENDING') {
            return `
                <div class="sticky-cta-pro disabled">
                    <div class="cta-icon-pro">
                        <i class="fas fa-hourglass-half"></i>
                    </div>
                    <div class="cta-text-pro">
                        <div class="cta-title-pro">⏳ En attente de validation</div>
                        <div class="cta-subtitle-pro">L'organisateur va traiter votre demande</div>
                    </div>
                </div>
            `;
        }
        
      // Statut ACCEPTED mais non payé
if (status === 'ACCEPTED' && !isPaid && event.registrationFeeCents > 0) {
            return `
                <div class="sticky-cta-pro active" id="payRegistrationBtn">
                    <div class="cta-icon-pro">
                        <i class="fas fa-credit-card"></i>
                    </div>
                    <div class="cta-text-pro">
                        <div class="cta-title-pro">💳 Payer mon inscription</div>
                        <div class="cta-subtitle-pro">${event.registrationFee}€</div>
                    </div>
                    <div class="cta-arrow-pro">
                        <i class="fas fa-arrow-right"></i>
                    </div>
                </div>
            `;
        }
        
      // Statut ACCEPTED et payé (ou gratuit)
if (status === 'ACCEPTED' && (isPaid || event.registrationFeeCents === 0)) {
            return `
                <div class="sticky-cta-pro disabled success">
                    <div class="cta-icon-pro">
                        <i class="fas fa-check-circle"></i>
                    </div>
                    <div class="cta-text-pro">
                        <div class="cta-title-pro">✅ Inscription confirmée</div>
                        <div class="cta-subtitle-pro">Vous êtes inscrit !</div>
                    </div>
                </div>
            `;
        }
    }
    
    // Cas 2 : Inscriptions fermées ou complet
    if (event.registrationClosed || event.isFull) {
        return `
            <div class="sticky-cta-pro disabled">
                <div class="cta-icon-pro">
                    <i class="fas fa-lock"></i>
                </div>
                <div class="cta-text-pro">
                    <div class="cta-title-pro">${event.registrationClosed ? 'Inscriptions fermées' : 'Événement complet'}</div>
                </div>
            </div>
        `;
    }
    
    // Cas 3 : Non inscrit - Événement CLUB_ONLY
    if (isClubEvent && hasClub) {
        return `
            <div class="sticky-cta-pro active" id="registerClubBtn">
                <div class="cta-icon-pro">
                    <i class="fas fa-shield-alt"></i>
                </div>
                <div class="cta-text-pro">
                    <div class="cta-title-pro">Inscrire mon équipe</div>
                    <div class="cta-subtitle-pro">Places disponibles</div>
                </div>
                <div class="cta-arrow-pro">
                    <i class="fas fa-arrow-right"></i>
                </div>
            </div>
        `;
    }
    
    // Cas 4 : Non inscrit - Inscription individuelle
    if (!isClubEvent) {
        return `
            <div class="sticky-cta-pro active" id="registerBtn">
                <div class="cta-icon-pro">
                    <i class="fas fa-user-plus"></i>
                </div>
                <div class="cta-text-pro">
                    <div class="cta-title-pro">S'inscrire</div>
                    <div class="cta-subtitle-pro">Places disponibles</div>
                </div>
                <div class="cta-arrow-pro">
                    <i class="fas fa-arrow-right"></i>
                </div>
            </div>
        `;
    }
    
    return '';
}

/* ============================================================================
   EMPTY STATE
   ============================================================================ */
export function renderEmptyState(icon, text, subtext) {
    return `
        <div class="empty-state">
            <i class="fas ${icon}"></i>
            <p>${escapeHtml(text)}</p>
            ${subtext ? `<small>${escapeHtml(subtext)}</small>` : ''}
        </div>
    `;
}

/* ============================================================================
   EXPORTS
   ============================================================================ */
export default {
    escapeHtml,
    renderHeader,
    renderHero,
    renderQuickInfo,
    renderDescription,
    renderStats,
    renderTabs,
    renderTabContents,
    renderLiveVideo,
    renderMatchCard,
    renderRankingTable,
    renderBracket,
    renderFeedItem,
    renderPracticalInfo,
    renderAdminSection,
    renderFloatingCTA,
    renderEmptyState
};