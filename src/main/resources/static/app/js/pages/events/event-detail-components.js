// =====================================================
// 🏆 EVENT DETAIL COMPONENTS V2.0
// Architecture moderne - UN SEUL système onglets
// Flux vertical scroll - 0 doublon
// =====================================================

export const EventDetailComponents = {

    // =====================================================
    // 🎨 HERO SECTION (VERSION COMPACTE)
    // =====================================================
    renderHeroCompact(event) {
        const safeName = this.escapeHtml(event.name || "Tournoi");
        const safeLocation = this.escapeHtml(event.city || event.location || "Lieu NC");
        const date = event.date ? new Date(event.date).toLocaleDateString('fr-FR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        }) : 'Date à confirmer';
        
        const statusConfig = this.getStatusConfig(event.status);
        
        return `
            <div class="hero-compact">
                <!-- Image ou Logo -->
                ${event.logoUrl || event.imageUrl ? `
                    <div class="hero-image">
                        <img src="${this.escapeHtml(event.logoUrl || event.imageUrl)}" 
                             alt="${safeName}"
                             loading="lazy">
                    </div>
                ` : `
                    <div class="hero-icon">🏆</div>
                `}
                
                <!-- Infos principales -->
                <div class="hero-content">
                    <h1 class="hero-title">${safeName}</h1>
                    
                    <div class="hero-meta">
                        <span class="meta-item">
                            <i class="fas fa-calendar"></i>
                            ${date}
                        </span>
                        <span class="meta-item">
                            <i class="fas fa-map-marker-alt"></i>
                            ${safeLocation}
                        </span>
                        <span class="meta-item">
                            <i class="fas fa-users"></i>
                            ${event.acceptedParticipants || 0} équipes
                        </span>
                    </div>
                    
                    <!-- Badge statut -->
                    <div class="hero-status">
                        <span class="status-badge" style="
                            background: ${statusConfig.bg};
                            color: ${statusConfig.color};
                        ">
                            ${statusConfig.icon} ${statusConfig.label}
                        </span>
                    </div>
                    
                    <!-- CTA principal (si applicable) -->
                    ${this.renderHeroCTA(event)}
                </div>
            </div>
            
            <style>
                .hero-compact {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 30px 20px;
                    border-radius: 16px;
                    margin-bottom: 20px;
                    display: flex;
                    align-items: center;
                    gap: 20px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                }
                
                .hero-image {
                    width: 100px;
                    height: 100px;
                    border-radius: 12px;
                    overflow: hidden;
                    flex-shrink: 0;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                }
                
                .hero-image img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
                
                .hero-icon {
                    width: 100px;
                    height: 100px;
                    background: rgba(255,255,255,0.2);
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 3em;
                    flex-shrink: 0;
                }
                
                .hero-content {
                    flex: 1;
                }
                
                .hero-title {
                    margin: 0 0 15px 0;
                    font-size: 1.8em;
                    font-weight: 800;
                    line-height: 1.2;
                }
                
                .hero-meta {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 15px;
                    margin-bottom: 15px;
                }
                
                .meta-item {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 0.9em;
                    opacity: 0.95;
                }
                
                .meta-item i {
                    opacity: 0.8;
                }
                
                .hero-status {
                    margin-top: 15px;
                }
                
                .status-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    padding: 8px 16px;
                    border-radius: 20px;
                    font-weight: 700;
                    font-size: 0.9em;
                }
                
                .hero-cta {
                    margin-top: 15px;
                }
                
                .hero-cta button {
                    background: white;
                    color: #667eea;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 8px;
                    font-weight: 700;
                    font-size: 1em;
                    cursor: pointer;
                    transition: all 0.3s;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
                }
                
                .hero-cta button:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                }
                
                @media (max-width: 768px) {
                    .hero-compact {
                        flex-direction: column;
                        text-align: center;
                    }
                    
                    .hero-title {
                        font-size: 1.5em;
                    }
                    
                    .hero-meta {
                        justify-content: center;
                    }
                }
            </style>
        `;
    },

    renderHeroCTA(event) {
        const status = event.status?.toUpperCase();
        
        // Inscriptions ouvertes
        if (status === 'PUBLISHED') {
            return `
                <div class="hero-cta">
                    <button onclick="EventDetailPage.showRegistrationModal()">
                        ➕ S'inscrire au tournoi
                    </button>
                </div>
            `;
        }
        
        // Tournoi en cours
        if (status === 'ONGOING') {
            return `
                <div class="hero-cta">
                    <button onclick="EventDetailPage.scrollToLive()">
                        🔴 Voir le live
                    </button>
                </div>
            `;
        }
        
        return '';
    },

    // =====================================================
    // 📊 STICKY TABS (SEUL SYSTÈME D'ONGLETS)
    // =====================================================
    renderStickyTabs(event) {
        const status = event.status?.toUpperCase();
        const isSingleMatch = event.format === "SINGLE_MATCH";
        
        // Déterminer quels onglets afficher selon le mode
        const tabs = this.getTabsForEvent(event);
        
        return `
            <div class="sticky-tabs-container" id="sticky-tabs">
                <div class="sticky-tabs">
                    ${tabs.map((tab, index) => `
                        <button 
                            class="tournament-tab tab-btn ${index === 0 ? 'active' : ''}" 
                            data-tab="${tab.id}"
                            ${tab.disabled ? 'disabled' : ''}
                        >
                            <i class="${tab.icon}"></i>
                            <span>${tab.label}</span>
                        </button>
                    `).join('')}
                </div>
            </div>
            
            <style>
                .sticky-tabs-container {
                    position: sticky;
                    top: 60px;
                    background: white;
                    z-index: 100;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                    margin: 0 -20px 30px -20px;
                    padding: 0 20px;
                }
                
                .sticky-tabs {
                    display: flex;
                    gap: 8px;
                    overflow-x: auto;
                    -webkit-overflow-scrolling: touch;
                    scrollbar-width: thin;
                    padding: 12px 0;
                }
                
                .sticky-tabs::-webkit-scrollbar {
                    height: 4px;
                }
                
                .sticky-tabs::-webkit-scrollbar-thumb {
                    background: #bdc3c7;
                    border-radius: 4px;
                }
                
                .tab-btn {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 12px 20px;
                    background: transparent;
                    border: none;
                    border-bottom: 3px solid transparent;
                    color: #7f8c8d;
                    font-weight: 600;
                    font-size: 0.95em;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    white-space: nowrap;
                }
                
                .tab-btn:hover:not(:disabled) {
                    background: #f8f9fa;
                    color: #2c3e50;
                }
                
                .tab-btn.active {
                    color: #3498db;
                    border-bottom-color: #3498db;
                    background: rgba(52, 152, 219, 0.05);
                }
                
                .tab-btn:disabled {
                    opacity: 0.4;
                    cursor: not-allowed;
                }
                
                @media (max-width: 768px) {
                    .tab-btn {
                        flex-direction: column;
                        padding: 10px 12px;
                        gap: 4px;
                        min-width: 70px;
                    }
                    
                    .tab-btn i {
                        font-size: 1.3em;
                    }
                    
                    .tab-btn span {
                        font-size: 0.75em;
                    }
                }
            </style>
        `;
    },

    getTabsForEvent(event) {
        const status = event.status?.toUpperCase();
        const isSingleMatch = event.format === "SINGLE_MATCH";
        
        // MATCH UNIQUE : onglets simplifiés
        if (isSingleMatch) {
            return [
                { id: 'live', label: 'Live', icon: 'fas fa-broadcast-tower', disabled: status !== 'ONGOING' },
                { id: 'matches', label: 'Match', icon: 'fas fa-futbol', disabled: false },
                { id: 'feed', label: 'Actu', icon: 'fas fa-newspaper', disabled: false }
            ];
        }
        
        // TOURNOI : onglets complets
        const tabs = [];
        
        // Onglet Live (en premier si tournoi en cours)
        if (status === 'ONGOING') {
            tabs.push({ id: 'live', label: 'Live', icon: 'fas fa-broadcast-tower', disabled: false });
        }
        
        // Onglets toujours visibles
        tabs.push(
            { id: 'matches', label: 'Matchs', icon: 'fas fa-futbol', disabled: false },
            { id: 'rankings', label: 'Classements', icon: 'fas fa-chart-line', disabled: false }
        );
        
        // Bracket (si phase finale)
        if (status === 'ONGOING' || status === 'COMPLETED') {
            tabs.push({ id: 'bracket', label: 'Phase finale', icon: 'fas fa-trophy', disabled: false });
        }
        
        // Fil d'actualité
        tabs.push({ id: 'feed', label: 'Actu', icon: 'fas fa-newspaper', disabled: false });
        
        return tabs;
    },

    // =====================================================
    // 📱 CONTENU DYNAMIQUE SELON ONGLET ACTIF
    // =====================================================
    renderTabContent(event, tabId) {
        switch(tabId) {
            case 'overview':
                return this.renderOverviewTab(event);
            case 'live':
                return this.renderLiveTab(event);
            case 'matches':
                return this.renderMatchesTab(event);
            case 'rankings':
                return this.renderRankingsTab(event);
            case 'bracket':
                return this.renderBracketTab(event);
            case 'infos':
                return this.renderInfosTab(event);
            default:
                return '<p>Onglet non trouvé</p>';
        }
    },

    // =====================================================
    // 🏠 ONGLET VUE D'ENSEMBLE
    // =====================================================
    renderOverviewTab(event) {
        return `
            <div class="tab-content-wrapper">
                <!-- Description -->
                ${event.description ? `
                    <div class="content-card">
                        <h3>📝 À propos</h3>
                        <p>${this.escapeHtml(event.description)}</p>
                    </div>
                ` : ''}
                
                <!-- Stats rapides -->
                <div class="content-card">
                    <h3>📊 Chiffres clés</h3>
                    <div class="stats-grid">
                        <div class="stat-item">
                            <div class="stat-value">${event.acceptedParticipants || 0}</div>
                            <div class="stat-label">Équipes</div>
                        </div>
                        ${event.groupCount ? `
                            <div class="stat-item">
                                <div class="stat-value">${event.groupCount}</div>
                                <div class="stat-label">Poules</div>
                            </div>
                        ` : ''}
                        <div class="stat-item">
                            <div class="stat-value">${event.totalMatches || 0}</div>
                            <div class="stat-label">Matchs</div>
                        </div>
                    </div>
                </div>
                
                <!-- Prochains matchs (si applicable) -->
                <div id="overview-next-matches"></div>
            </div>
            
            <style>
                .tab-content-wrapper {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }
                
                .content-card {
                    background: white;
                    padding: 25px;
                    border-radius: 12px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                }
                
                .content-card h3 {
                    margin: 0 0 15px 0;
                    color: #2c3e50;
                    font-size: 1.2em;
                    font-weight: 700;
                }
                
                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
                    gap: 15px;
                }
                
                .stat-item {
                    text-align: center;
                    padding: 20px;
                    background: #f8f9fa;
                    border-radius: 10px;
                }
                
                .stat-value {
                    font-size: 2.5em;
                    font-weight: 800;
                    color: #3498db;
                    line-height: 1;
                    margin-bottom: 8px;
                }
                
                .stat-label {
                    color: #7f8c8d;
                    font-size: 0.85em;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
            </style>
        `;
    },

    // =====================================================
    // 🔴 ONGLET LIVE
    // =====================================================
    renderLiveTab(event) {
        return `
            <div class="tab-content-wrapper">
                <!-- Feed actualité en direct -->
                <div class="content-card">
                    <h3>🔴 Fil d'actualité en direct</h3>
                    <div id="liveFeedContainer">
                        <div class="loader">⏳ Chargement du live...</div>
                    </div>
                </div>
                
                <!-- Matchs en cours -->
                <div class="content-card">
                    <h3>⚽ Matchs en cours</h3>
                    <div id="liveMatchesContainer">
                        <div class="loader">⏳ Chargement...</div>
                    </div>
                </div>
            </div>
            
            <style>
                .live-event-item {
                    padding: 15px;
                    border-left: 4px solid #e74c3c;
                    background: #fff5f5;
                    border-radius: 8px;
                    margin-bottom: 12px;
                }
                
                .live-event-time {
                    font-weight: 700;
                    color: #e74c3c;
                    margin-bottom: 5px;
                }
                
                .live-event-content {
                    color: #2c3e50;
                }
                
                .loader {
                    text-align: center;
                    padding: 40px;
                    color: #7f8c8d;
                }
            </style>
        `;
    },

    // =====================================================
    // ⚽ ONGLET MATCHS
    // =====================================================
    renderMatchesTab(event) {
        return `
            <div class="tab-content-wrapper">
                <div class="content-card">
                    <h3>⚽ Tous les matchs</h3>
                    <div id="allMatchesContainer">
                        <div class="loader">⏳ Chargement des matchs...</div>
                    </div>
                </div>
            </div>
        `;
    },

    // =====================================================
    // 📊 ONGLET CLASSEMENTS
    // =====================================================
    renderRankingsTab(event) {
        return `
            <div class="tab-content-wrapper">
                <div class="content-card">
                    <h3>📊 Classements des poules</h3>
                    <div id="rankingsContainer">
                        <div class="loader">⏳ Chargement des classements...</div>
                    </div>
                </div>
            </div>
        `;
    },

    // =====================================================
    // 🏆 ONGLET BRACKET
    // =====================================================
    renderBracketTab(event) {
        return `
            <div class="tab-content-wrapper">
                <!-- Bracket principal -->
                <div class="content-card">
                    <h3>🏆 Phase finale principale</h3>
                    <div id="bracketContainer">
                        <div class="loader">⏳ Chargement du bracket...</div>
                    </div>
                </div>
            </div>
        `;
    },

    // =====================================================
    // ℹ️ ONGLET INFOS PRATIQUES
    // =====================================================
    renderInfosTab(event) {
        const safeLocation = this.escapeHtml(event.location || event.city || "Lieu non communiqué");
        const deadline = event.registrationDeadline ? 
            new Date(event.registrationDeadline).toLocaleDateString('fr-FR') : 
            "Non définie";
        
        return `
            <div class="tab-content-wrapper">
                <div class="content-card">
                    <h3>ℹ️ Informations pratiques</h3>
                    
                    <div class="info-grid">
                        <div class="info-item">
                            <div class="info-icon">📍</div>
                            <div class="info-content">
                                <div class="info-label">Lieu</div>
                                <div class="info-value">${safeLocation}</div>
                            </div>
                        </div>
                        
                        ${event.surface ? `
                            <div class="info-item">
                                <div class="info-icon">🏟️</div>
                                <div class="info-content">
                                    <div class="info-label">Surface</div>
                                    <div class="info-value">${this.formatSurface(event.surface)}</div>
                                </div>
                            </div>
                        ` : ''}
                        
                        <div class="info-item">
                            <div class="info-icon">⏰</div>
                            <div class="info-content">
                                <div class="info-label">Date limite d'inscription</div>
                                <div class="info-value">${deadline}</div>
                            </div>
                        </div>
                        
                        ${event.entryFee ? `
                            <div class="info-item">
                                <div class="info-icon">💰</div>
                                <div class="info-content">
                                    <div class="info-label">Frais d'inscription</div>
                                    <div class="info-value">${event.entryFee}€</div>
                                </div>
                            </div>
                        ` : ''}
                    </div>
                    
                    ${event.rules ? `
                        <div style="margin-top: 25px;">
                            <h4 style="margin: 0 0 12px 0; color: #2c3e50;">📜 Règlement</h4>
                            <div style="padding: 15px; background: #f8f9fa; border-radius: 8px; line-height: 1.6;">
                                ${this.escapeHtml(event.rules)}
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>
            
            <style>
                .info-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 20px;
                }
                
                .info-item {
                    display: flex;
                    gap: 15px;
                    align-items: flex-start;
                }
                
                .info-icon {
                    font-size: 2em;
                    flex-shrink: 0;
                }
                
                .info-content {
                    flex: 1;
                }
                
                .info-label {
                    color: #7f8c8d;
                    font-size: 0.85em;
                    font-weight: 600;
                    margin-bottom: 5px;
                }
                
                .info-value {
                    color: #2c3e50;
                    font-weight: 700;
                    font-size: 1.1em;
                }
            </style>
        `;
    },

    // =====================================================
    // 🎯 STICKY CTA (UN SEUL)
    // =====================================================
    renderStickyCTA(event) {
        const status = event.status?.toUpperCase();
        
        // Pas de CTA si tournoi terminé
        if (status === 'COMPLETED' || status === 'CANCELLED') {
            return '';
        }
        
        let ctaText = '';
        let ctaAction = '';
        let ctaColor = '#3498db';
        
        if (status === 'PUBLISHED') {
            ctaText = '➕ S\'inscrire au tournoi';
            ctaAction = 'EventDetailPage.showRegistrationModal()';
            ctaColor = '#27ae60';
        } else if (status === 'ONGOING') {
            ctaText = '🔴 Voir le live';
            ctaAction = 'EventDetailPage.scrollToLive()';
            ctaColor = '#e74c3c';
        }
        
        if (!ctaText) return '';
        
        return `
            <div class="sticky-cta">
                <button 
                    class="cta-button" 
                    onclick="${ctaAction}"
                    style="background: ${ctaColor};"
                >
                    ${ctaText}
                </button>
            </div>
            
            <style>
                .sticky-cta {
                    position: fixed;
                    bottom: 20px;
                    left: 50%;
                    transform: translateX(-50%);
                    z-index: 999;
                    animation: slideUp 0.5s ease-out;
                }
                
                .cta-button {
                    padding: 16px 32px;
                    color: white;
                    border: none;
                    border-radius: 50px;
                    font-weight: 700;
                    font-size: 1.1em;
                    cursor: pointer;
                    box-shadow: 0 6px 20px rgba(0,0,0,0.25);
                    transition: all 0.3s;
                }
                
                .cta-button:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 8px 25px rgba(0,0,0,0.3);
                }
                
                .cta-button:active {
                    transform: translateY(-1px);
                }
                
                @keyframes slideUp {
                    from {
                        opacity: 0;
                        transform: translateX(-50%) translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(-50%) translateY(0);
                    }
                }
                
                @media (max-width: 768px) {
                    .sticky-cta {
                        left: 20px;
                        right: 20px;
                        transform: none;
                    }
                    
                    .cta-button {
                        width: 100%;
                    }
                }
            </style>
        `;
    },

    // =====================================================
    // 🛠️ HELPERS
    // =====================================================
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    getStatusConfig(status) {
        const configs = {
            'DRAFT': { 
                label: 'Brouillon', 
                icon: '📝', 
                color: '#95a5a6', 
                bg: '#ecf0f1' 
            },
            'PUBLISHED': { 
                label: 'Inscriptions ouvertes', 
                icon: '✅', 
                color: '#27ae60', 
                bg: '#d4edda' 
            },
            'REGISTRATION_CLOSED': { 
                label: 'Inscriptions fermées', 
                icon: '🔒', 
                color: '#f39c12', 
                bg: '#fff3cd' 
            },
            'ONGOING': { 
                label: 'EN DIRECT', 
                icon: '🔴', 
                color: '#e74c3c', 
                bg: '#fee' 
            },
            'COMPLETED': { 
                label: 'Terminé', 
                icon: '🏆', 
                color: '#3498db', 
                bg: '#e3f2fd' 
            },
            'CANCELLED': { 
                label: 'Annulé', 
                icon: '❌', 
                color: '#e74c3c', 
                bg: '#f8d7da' 
            }
        };
        
        return configs[status?.toUpperCase()] || configs['DRAFT'];
    },

    formatSurface(surface) {
        const surfaces = {
            'NATURAL_GRASS': '🌿 Pelouse naturelle',
            'SYNTHETIC': '🟢 Synthétique',
            'INDOOR': '🏢 Salle',
            'BEACH': '🏖️ Beach soccer'
        };
        return surfaces[surface] || surface;
    },

    // =====================================================
    // 🔙 HEADER (COMPATIBILITÉ)
    // =====================================================
    renderHeader(isOrganizer) {
        return `
            <div class="event-header">
                <button id="backBtn" class="back-button">
                    <i class="fas fa-arrow-left"></i>
                    Retour
                </button>
            </div>
            
            <style>
                .event-header {
                    padding: 15px 20px;
                    background: white;
                    border-bottom: 1px solid #e1e8ed;
                }
                
                .back-button {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    padding: 10px 16px;
                    background: transparent;
                    border: none;
                    color: #3498db;
                    font-weight: 600;
                    font-size: 1em;
                    cursor: pointer;
                    border-radius: 8px;
                    transition: all 0.3s;
                }
                
                .back-button:hover {
                    background: #f8f9fa;
                    color: #2980b9;
                }
                
                .back-button i {
                    font-size: 1.1em;
                }
            </style>
        `;
    },

    // =====================================================
    // 🎨 HERO SECTION PRO (ALIAS POUR COMPATIBILITÉ)
    // =====================================================
    renderHeroSectionPro(event) {
        return this.renderHeroCompact(event);
    },

    // =====================================================
    // ℹ️ PRACTICAL INFO SECTION
    // =====================================================
    renderPracticalInfoSection(event) {
        return ''; // Intégré dans l'onglet Infos maintenant
    },

    // =====================================================
    // 📊 QUICK STATS SCROLL
    // =====================================================
    renderQuickStatsScroll(event) {
        return ''; // Intégré dans Hero compact maintenant
    },

    // =====================================================
    // 📊 STICKY TABS PRO (ALIAS POUR COMPATIBILITÉ)
    // =====================================================
    renderStickyTabsPro(event, isOrganizer, currentUser) {
        return this.renderStickyTabs(event);
    },

    // =====================================================
    // 📝 DESCRIPTION
    // =====================================================
    renderDescription(description) {
        if (!description) return '';
        
        return `
            <div class="event-description">
                <h3>À propos</h3>
                <p>${this.escapeHtml(description)}</p>
            </div>
        `;
    },

    // =====================================================
    // 🎯 STICKY CTA PRO (ALIAS POUR COMPATIBILITÉ)
    // =====================================================
    renderStickyCTAPro(event, isAuthenticated, isOrganizer, isRegistered, hasClub) {
        return this.renderStickyCTA(event);
    },

    // =====================================================
    // 🏢 MODAL INSCRIPTION CLUB
    // =====================================================
    renderClubRegistrationModal(event) {
        return `
            <div id="clubRegistrationModal" class="utf-modal hidden">
                <div class="utf-modal-overlay"></div>
                <div class="utf-modal-content">
                    <div class="utf-modal-header">
                        <h3>Inscrire mes équipes</h3>
                        <button class="utf-modal-close" id="cancelClubModal">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <div class="utf-modal-body">
                        <div style="margin-bottom: 20px;">
                            <label style="display: block; margin-bottom: 8px; font-weight: 600;">
                                Nombre d'équipes à inscrire
                            </label>
                            <select id="teamCountSelect" style="
                                width: 100%;
                                padding: 10px;
                                border: 2px solid #e1e8ed;
                                border-radius: 8px;
                                font-size: 1em;
                            ">
                                <option value="1">1 équipe</option>
                            </select>
                        </div>
                        
                        <div style="margin-bottom: 20px;">
                            <label style="display: block; margin-bottom: 12px; font-weight: 600;">
                                Sélectionner les équipes
                            </label>
                            <div id="club-teams-checkboxes" style="
                                display: flex;
                                flex-direction: column;
                                gap: 12px;
                                max-height: 300px;
                                overflow-y: auto;
                                padding: 15px;
                                background: #f8f9fa;
                                border-radius: 8px;
                            ">
                                <!-- Rempli dynamiquement -->
                            </div>
                        </div>
                    </div>
                    
                    <div class="utf-modal-footer">
                        <button class="btn-secondary" id="cancelClubModal">
                            Annuler
                        </button>
                        <button class="btn-primary" id="confirmClubRegistration">
                            Inscrire les équipes
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    // =====================================================
    // 🍞 TOAST
    // =====================================================
    renderToast() {
        return `
            <div id="toast" class="toast"></div>
            
            <style>
                .toast {
                    position: fixed;
                    bottom: -100px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: #2c3e50;
                    color: white;
                    padding: 15px 25px;
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                    z-index: 10000;
                    transition: bottom 0.3s ease;
                    font-weight: 600;
                }
                
                .toast.show {
                    bottom: 30px;
                }
            </style>
        `;
    },

    // =====================================================
    // 👤 SECTIONS UTILISATEUR
    // =====================================================
    renderGuestSection() {
        return `
            <div class="user-section guest-section">
                <p>Connectez-vous pour participer</p>
            </div>
        `;
    },

    renderPlayerSection(registrationStatus) {
        return `
            <div class="user-section player-section">
                <p>Statut inscription : ${registrationStatus}</p>
            </div>
        `;
    },

    renderVisitorSection() {
        return `
            <div class="user-section visitor-section">
                <p>Inscrivez-vous pour participer</p>
            </div>
        `;
    },

    renderOrganizerSection(event) {
        return `
            <div class="user-section organizer-section">
                <h3>👑 Espace organisateur</h3>
                <button class="btn-primary" onclick="Router.go('/admin/events/${event.id}')">
                    <i class="fas fa-cog"></i>
                    Gérer l'événement
                </button>
            </div>
        `;
    },

    // =====================================================
    // 🎨 EVENT STATUS BADGE
    // =====================================================
    renderEventStatusBadge(event) {
        const config = this.getStatusConfig(event.status);
        
        return `
            <span class="event-status-badge" style="
                background: ${config.bg};
                color: ${config.color};
                padding: 6px 12px;
                border-radius: 12px;
                font-weight: 700;
                font-size: 0.85em;
                display: inline-flex;
                align-items: center;
                gap: 6px;
            ">
                ${config.icon} ${config.label}
            </span>
        `;
    }
};

// Export par défaut
export default EventDetailComponents;