async render() {
        return `
<style>
/* ============================================ */
/* DARK THEME - EVENT DASHBOARD STEPPER+ACCORDION */
/* ============================================ */
.ed-dashboard {
    padding: 16px;
    margin-top: 60px;
    background: #0f1923;
    min-height: 100vh;
    color: #e0e6ed;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
.ed-dashboard .admin-title { color: #ffffff; font-size: 1.4em; margin: 0 0 20px 0; }
.ed-dashboard .admin-message { border-radius: 8px; font-weight: 500; transition: all 0.3s; }

/* -- STEPPER -- */
.ed-stepper {
    display: flex; align-items: center; gap: 4px;
    padding: 14px 16px; background: #1a2735; border-radius: 12px;
    margin-bottom: 16px; overflow-x: auto;
    -webkit-overflow-scrolling: touch; scrollbar-width: none;
}
.ed-stepper::-webkit-scrollbar { display: none; }
.stepper-step {
    display: flex; align-items: center; gap: 6px;
    padding: 8px 12px; border-radius: 8px;
    font-size: 0.78em; font-weight: 600; white-space: nowrap;
    cursor: pointer; transition: all 0.25s;
    color: #5a6a7a; background: transparent;
    border: 2px solid transparent; flex-shrink: 0;
}
.stepper-step:hover { background: rgba(52,152,219,0.1); color: #8899aa; }
.stepper-step.active { background: #3498db; color: #fff; border-color: #3498db; }
.stepper-step.completed { color: #2ecc71; }
.stepper-step.completed .step-icon { background: #2ecc71; color: #fff; }
.step-icon {
    width: 24px; height: 24px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 0.75em; background: #2a3a4a; color: #5a6a7a;
    font-weight: 700; flex-shrink: 0;
}
.stepper-step.active .step-icon { background: rgba(255,255,255,0.25); color: #fff; }
.stepper-connector { width: 16px; height: 2px; background: #2a3a4a; flex-shrink: 0; }

/* -- CTA BANNER -- */
.ed-cta-banner {
    background: linear-gradient(135deg, #1a5276 0%, #1a3c5e 100%);
    border: 1px solid #2980b9; border-radius: 12px;
    padding: 16px 20px; margin-bottom: 16px;
    display: flex; align-items: center; justify-content: space-between;
    gap: 16px; flex-wrap: wrap;
}
.ed-cta-banner .cta-text { color: #85c1e9; font-size: 0.95em; font-weight: 600; }
.ed-cta-banner .cta-text strong { color: #fff; }
.ed-cta-btn {
    padding: 10px 20px; background: #3498db; color: #fff;
    border: none; border-radius: 8px; font-weight: 700;
    font-size: 0.9em; cursor: pointer; white-space: nowrap; transition: background 0.2s;
}
.ed-cta-btn:hover { background: #2980b9; }

/* -- ACCORDION -- */
.ed-accordion {
    background: #1a2735; border-radius: 12px; margin-bottom: 12px;
    overflow: hidden; border: 1px solid #243447; transition: border-color 0.3s;
}
.ed-accordion:hover { border-color: #2c4a60; }
.ed-accordion-header {
    display: flex; align-items: center; gap: 12px;
    padding: 16px 20px; cursor: pointer; user-select: none;
    transition: background 0.2s; background: transparent;
}
.ed-accordion-header:hover { background: rgba(52,152,219,0.05); }
.ed-accordion-header .acc-icon {
    width: 36px; height: 36px; background: #243447; border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    font-size: 1.1em; flex-shrink: 0;
}
.ed-accordion-header .acc-title { flex: 1; font-weight: 700; font-size: 1em; color: #e0e6ed; }
.ed-accordion-header .acc-badge {
    padding: 4px 10px; border-radius: 12px; font-size: 0.75em;
    font-weight: 600; background: #243447; color: #7f8c9a;
}
.ed-accordion-header .acc-chevron { color: #5a6a7a; transition: transform 0.3s; font-size: 0.9em; }
.ed-accordion.open .acc-chevron { transform: rotate(180deg); }
.ed-accordion-body {
    max-height: 0; overflow: hidden;
    transition: max-height 0.4s ease, padding 0.3s ease;
    padding: 0 20px;
}
.ed-accordion.open .ed-accordion-body { max-height: 8000px; padding: 0 20px 20px 20px; }

/* -- CARDS -- */
.ed-card {
    background: #0f1923; border-radius: 10px; padding: 20px;
    margin-bottom: 15px; border: 1px solid #1e2d3d;
}
.ed-card h2, .ed-card h3 { color: #e0e6ed; margin: 0 0 15px 0; }
.ed-dashboard .admin-btn { border-radius: 8px; font-weight: 600; transition: all 0.2s; }
.ed-dashboard .admin-dashboard-grid {
    display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px;
}

/* -- DANGER ZONE -- */
.ed-danger-zone {
    background: rgba(231, 76, 60, 0.08); border: 1px solid rgba(231, 76, 60, 0.25);
    border-radius: 12px; padding: 20px; margin-top: 8px;
}
.ed-danger-zone h3 { color: #e74c3c; margin: 0 0 15px 0; font-size: 1em; }

/* -- MISC -- */
.ed-dashboard .loader { color: #5a6a7a; text-align: center; padding: 30px; }
.ed-dashboard .admin-table { width: 100%; border-collapse: collapse; }
.ed-dashboard .admin-table th { background: #1a2735; color: #8899aa; padding: 10px; text-align: left; font-size: 0.85em; }
.ed-dashboard .admin-table td { padding: 10px; border-bottom: 1px solid #1e2d3d; color: #c0cdd8; font-size: 0.9em; }

/* -- BRACKET -- */
.bracket-tree { display: flex; gap: 20px; overflow-x: auto; padding: 10px 0; }
.bracket-column { min-width: 200px; }
.bracket-round-title { text-align: center; font-size: 0.95em; margin-bottom: 15px; padding: 8px; background: #1a2735; border-radius: 8px; }
.bracket-matches { display: flex; flex-direction: column; gap: 15px; }
.bracket-match { background: #1a2735; border-radius: 8px; padding: 12px; border-left: 4px solid #3498db; }
.bracket-match.finished { opacity: 0.8; }
.bracket-match.bye { text-align: center; padding: 15px; }
.bracket-bye-label { color: #f39c12; font-weight: 600; }
.bracket-team { display: flex; justify-content: space-between; padding: 6px 0; color: #c0cdd8; }
.bracket-team.winner { color: #2ecc71; font-weight: 700; }
.bracket-team-name { flex: 1; }
.bracket-score { font-weight: 700; min-width: 25px; text-align: center; }
.bracket-divider { height: 1px; background: #243447; margin: 4px 0; }

/* -- MATCH CARDS -- */
.match-groups-wrapper { display: flex; flex-direction: column; gap: 20px; }
.match-container { background: #0f1923; border-radius: 10px; padding: 15px; border: 1px solid #1e2d3d; }
.match-group-title { color: #3498db; margin: 0 0 15px 0; font-size: 1.1em; padding-bottom: 10px; border-bottom: 1px solid #243447; }
.match-card { background: #1a2735; border-radius: 10px; padding: 15px; margin-bottom: 12px; border-left: 4px solid #3498db; }
.match-card.finished { border-left-color: #27ae60; opacity: 0.85; }
.match-teams { margin-bottom: 12px; }
.match-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; color: #c0cdd8; }
.match-team-name { font-weight: 600; flex: 1; }
.match-score { font-weight: 700; font-size: 1.1em; min-width: 30px; text-align: center; color: #fff; }
.match-button { width: 100%; padding: 10px; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; color: white; background: #3498db; font-size: 0.9em; transition: all 0.2s; margin-bottom: 4px; }
.match-button:hover { filter: brightness(1.1); }
.match-button:disabled { opacity: 0.5; cursor: not-allowed; }

/* -- RESPONSIVE -- */
@media (max-width: 768px) {
    .ed-stepper { gap: 2px; padding: 10px 8px; }
    .stepper-step { padding: 6px 8px; font-size: 0.7em; }
    .stepper-step span { display: none; }
    .step-icon { width: 28px; height: 28px; font-size: 0.85em; }
    .stepper-connector { width: 8px; }
    .ed-cta-banner { flex-direction: column; text-align: center; }
    .ed-accordion-header { padding: 14px 16px; }
    .ed-accordion-body { padding: 0 16px; }
    .ed-accordion.open .ed-accordion-body { padding: 0 16px 16px 16px; }
}

@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
</style>

<div class="ed-dashboard">
    <h1 id="event-dashboard-title" class="admin-title">⚽ Gestion de l'événement</h1>
    <p id="event-global-message" class="admin-message"></p>

    <!-- STEPPER -->
    <div class="ed-stepper" id="dashboard-stepper">
        <div class="stepper-step active" data-step="overview"><div class="step-icon">1</div><span>Vue d'ensemble</span></div>
        <div class="stepper-connector"></div>
        <div class="stepper-step" data-step="progression"><div class="step-icon">2</div><span>Progression</span></div>
        <div class="stepper-connector"></div>
        <div class="stepper-step" data-step="registrations"><div class="step-icon">3</div><span>Inscriptions</span></div>
        <div class="stepper-connector"></div>
        <div class="stepper-step" data-step="matches"><div class="step-icon">4</div><span>Matchs</span></div>
        <div class="stepper-connector"></div>
        <div class="stepper-step" data-step="planning"><div class="step-icon">5</div><span>Planning</span></div>
        <div class="stepper-connector"></div>
        <div class="stepper-step" data-step="bracket"><div class="step-icon">6</div><span>Phase finale</span></div>
        <div class="stepper-connector"></div>
        <div class="stepper-step" data-step="rankings"><div class="step-icon">7</div><span>Classements</span></div>
    </div>

    <!-- CTA BANNER -->
    <div class="ed-cta-banner" id="next-step-cta" style="display:none;">
        <div class="cta-text" id="cta-text"><strong>Prochaine étape :</strong> <span id="cta-description"></span></div>
        <button class="ed-cta-btn" id="cta-action-btn">→ Y aller</button>
    </div>

    <!-- ═══ ACCORDION: VUE D'ENSEMBLE ═══ -->
    <div class="ed-accordion open" id="accordion-overview">
        <div class="ed-accordion-header" data-target="overview">
            <div class="acc-icon">📋</div>
            <div class="acc-title">Vue d'ensemble</div>
            <div class="acc-badge" id="badge-overview">Info</div>
            <i class="fas fa-chevron-down acc-chevron"></i>
        </div>
        <div class="ed-accordion-body">
            <div id="event-details" class="admin-loading"><div class="loader">⏳ Chargement...</div></div>
            <div class="ed-card" id="event-actions-card">
                <h2 id="event-actions-title">🎮 Actions</h2>
                <div class="admin-dashboard-grid">
                    <button id="btn-generate-groups" class="admin-btn admin-btn-primary">🧩 Générer les poules</button>
                    <div style="display: flex; gap: 10px;">
                        <button id="btn-generate-bracket-uefa" class="admin-btn admin-btn-primary" style="flex: 1;">🏆 Bracket UEFA</button>
                        <button id="btn-generate-bracket-semi" class="admin-btn" style="flex: 1; background: #9b59b6;">🎲 Tirage LDC</button>
                    </div>
                    <button id="btn-generate-consolante" class="admin-btn">♻️ Consolante</button>
                    <button id="btn-refresh-all" class="admin-btn">🔄 Rafraîchir</button>
                </div>
                <div id="tournament-format" style="margin-top:15px;font-weight:600;color:#8899aa;"></div>
            </div>
            <div class="ed-card" id="my-teams-section">
                <h2>🏟️ Mes équipes</h2>
                <div id="my-teams"><div class="loader">⏳ Chargement...</div></div>
            </div>
        </div>
    </div>

    <!-- ═══ ACCORDION: PROGRESSION ═══ -->
    <div class="ed-accordion" id="accordion-progression">
        <div class="ed-accordion-header" data-target="progression">
            <div class="acc-icon">📊</div>
            <div class="acc-title">Progression du tournoi</div>
            <div class="acc-badge" id="badge-progression">0%</div>
            <i class="fas fa-chevron-down acc-chevron"></i>
        </div>
        <div class="ed-accordion-body">
            <div id="progression-checklist-container"></div>
        </div>
    </div>

    <!-- ═══ ACCORDION: INSCRIPTIONS ═══ -->
    <div class="ed-accordion" id="accordion-registrations">
        <div class="ed-accordion-header" data-target="registrations">
            <div class="acc-icon">👥</div>
            <div class="acc-title">Inscriptions des équipes</div>
            <div class="acc-badge" id="badge-registrations">—</div>
            <i class="fas fa-chevron-down acc-chevron"></i>
        </div>
        <div class="ed-accordion-body">
            <div id="event-registrations" class="admin-loading"><div class="loader">⏳ Chargement...</div></div>
        </div>
    </div>

    <!-- ═══ ACCORDION: MATCHS ═══ -->
    <div class="ed-accordion" id="accordion-matches">
        <div class="ed-accordion-header" data-target="matches">
            <div class="acc-icon">⚽</div>
            <div class="acc-title">Tous les matchs</div>
            <div class="acc-badge" id="badge-matches">—</div>
            <i class="fas fa-chevron-down acc-chevron"></i>
        </div>
        <div class="ed-accordion-body">
            <div style="display: flex; justify-content: flex-end; margin-bottom: 15px;">
                <button id="btn-delete-round" class="admin-btn" style="background: #e74c3c;">🗑️ Supprimer un round</button>
            </div>
            <div id="event-matches" class="admin-loading"><div class="loader">⏳ Chargement...</div></div>
        </div>
    </div>

    <!-- ═══ ACCORDION: PLANNING ═══ -->
    <div class="ed-accordion" id="accordion-planning">
        <div class="ed-accordion-header" data-target="planning">
            <div class="acc-icon">📅</div>
            <div class="acc-title">Planification du tournoi</div>
            <div class="acc-badge" id="badge-planning">Config</div>
            <i class="fas fa-chevron-down acc-chevron"></i>
        </div>
        <div class="ed-accordion-body">
            <!-- SÉLECTEUR DURÉE -->
            <div style="background: #0f1923; padding: 20px; border-radius: 10px; margin-bottom: 25px; border: 1px solid #1e2d3d;">
                <label style="display: block; margin-bottom: 12px; font-weight: 600; color: #e0e6ed; font-size: 1em;">📆 Durée du tournoi</label>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 20px;">
                    <div class="duration-option" data-days="1" style="background: #1a2735; border: 3px solid #3498db; border-radius: 12px; padding: 20px; text-align: center; cursor: pointer; transition: all 0.3s; color: #e0e6ed;">
                        <div style="font-size: 2.5em; margin-bottom: 10px;">📅</div>
                        <div style="font-weight: 700; font-size: 1.1em; margin-bottom: 8px;">1 JOUR</div>
                        <div style="font-size: 0.85em; color: #7f8c9a; line-height: 1.4;">Tout sur une journée</div>
                    </div>
                    <div class="duration-option" data-days="2" style="background: #1a2735; border: 3px solid #2a3a4a; border-radius: 12px; padding: 20px; text-align: center; cursor: pointer; transition: all 0.3s; color: #e0e6ed;">
                        <div style="font-size: 2.5em; margin-bottom: 10px;">📅📅</div>
                        <div style="font-weight: 700; font-size: 1.1em; margin-bottom: 8px;">2 JOURS</div>
                        <div style="font-size: 0.85em; color: #7f8c9a; line-height: 1.4;">J1: Poules / J2: Finales</div>
                    </div>
                    <div class="duration-option" data-days="3" style="background: #1a2735; border: 3px solid #2a3a4a; border-radius: 12px; padding: 20px; text-align: center; cursor: pointer; transition: all 0.3s; color: #e0e6ed;">
                        <div style="font-size: 2.5em; margin-bottom: 10px;">📅📅📅</div>
                        <div style="font-weight: 700; font-size: 1.1em; margin-bottom: 8px;">3 JOURS</div>
                        <div style="font-size: 0.85em; color: #7f8c9a; line-height: 1.4;">J1: Poules / J2: Consolante / J3: Bracket</div>
                    </div>
                </div>
                <div id="duration-info" style="background: rgba(52,152,219,0.1); border-left: 4px solid #3498db; padding: 15px; border-radius: 8px; color: #85c1e9;">
                    <div style="font-weight: 600; margin-bottom: 8px;">ℹ️ Mode 1 jour sélectionné</div>
                    <div style="font-size: 0.9em; line-height: 1.5;">Tous les matchs seront planifiés le même jour.</div>
                </div>
            </div>

            <!-- RESET -->
            <div class="ed-card" style="background: rgba(243,156,18,0.08); border-color: rgba(243,156,18,0.3);">
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
                    <div>
                        <h3 style="margin: 0 0 8px 0; color: #f39c12; font-size: 1em;">⚠️ Réinitialiser le planning</h3>
                        <p style="margin: 0; color: #d4a053; font-size: 0.9em;">Réinitialise date/heure/terrain des matchs non joués.</p>
                    </div>
                    <button id="btn-reset-planning" class="admin-btn" style="background: #e74c3c; padding: 12px 20px; white-space: nowrap;">🗑️ Réinitialiser</button>
                </div>
            </div>

            <!-- MODE 1 JOUR -->
            <div id="planning-mode-1-day" style="display: none;">
                <div class="ed-card">
                    <h3 style="margin: 0 0 15px 0; font-size: 1em;">📅 Configuration de la journée</h3>
                    <div style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 600; font-size: 0.9em;">📅 Date du tournoi *</label>
                        <input type="date" id="planning-date-1day" required style="width: 100%; padding: 12px; border: 2px solid #3498db; border-radius: 8px; font-size: 0.95em; background: #0f1923; color: #e0e6ed;">
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px;">
                        <div><label style="display: block; margin-bottom: 8px; font-weight: 600; font-size: 0.9em;">🌤️ Matin - Début</label><input type="time" id="planning-morning-start-1day" value="09:00" style="width: 100%; padding: 12px; border: 2px solid #2a3a4a; border-radius: 8px; font-size: 0.95em; background: #0f1923; color: #e0e6ed;"></div>
                        <div><label style="display: block; margin-bottom: 8px; font-weight: 600; font-size: 0.9em;">🌤️ Matin - Fin</label><input type="time" id="planning-morning-end-1day" value="12:45" style="width: 100%; padding: 12px; border: 2px solid #2a3a4a; border-radius: 8px; font-size: 0.95em; background: #0f1923; color: #e0e6ed;"></div>
                        <div><label style="display: block; margin-bottom: 8px; font-weight: 600; font-size: 0.9em;">🌇 Après-midi - Début</label><input type="time" id="planning-afternoon-start-1day" value="14:00" style="width: 100%; padding: 12px; border: 2px solid #2a3a4a; border-radius: 8px; font-size: 0.95em; background: #0f1923; color: #e0e6ed;"></div>
                        <div><label style="display: block; margin-bottom: 8px; font-weight: 600; font-size: 0.9em;">🌇 Après-midi - Fin</label><input type="time" id="planning-afternoon-end-1day" value="18:30" style="width: 100%; padding: 12px; border: 2px solid #2a3a4a; border-radius: 8px; font-size: 0.95em; background: #0f1923; color: #e0e6ed;"></div>
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-top: 15px;">
                        <div><label style="display: block; margin-bottom: 8px; font-weight: 600; font-size: 0.9em;">⚽ Durée match (min)</label><input type="number" id="planning-match-duration-1day" min="10" max="120" value="40" style="width: 100%; padding: 12px; border: 2px solid #2a3a4a; border-radius: 8px; font-size: 0.95em; background: #0f1923; color: #e0e6ed;"></div>
                        <div><label style="display: block; margin-bottom: 8px; font-weight: 600; font-size: 0.9em;">⏸️ Pause (min)</label><input type="number" id="planning-break-duration-1day" min="0" max="60" value="10" style="width: 100%; padding: 12px; border: 2px solid #2a3a4a; border-radius: 8px; font-size: 0.95em; background: #0f1923; color: #e0e6ed;"></div>
                        <div><label style="display: block; margin-bottom: 8px; font-weight: 600; font-size: 0.9em;">🏟️ Terrains</label><input type="number" id="planning-fields-count-1day" min="1" max="10" value="2" style="width: 100%; padding: 12px; border: 2px solid #2a3a4a; border-radius: 8px; font-size: 0.95em; background: #0f1923; color: #e0e6ed;"></div>
                    </div>
                </div>
                <div class="ed-card" style="border-color: #3498db;">
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 15px;">
                        <div style="width: 40px; height: 40px; background: #3498db; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 1.2em;">1</div>
                        <h3 style="margin: 0; font-size: 1.2em;">📋 Planifier les POULES (matin)</h3>
                    </div>
                    <button type="button" id="btn-planning-poules" class="admin-btn admin-btn-primary" style="width: 100%; padding: 15px; font-size: 1.1em;">🌤️ Planifier les POULES</button>
                </div>
                <div class="ed-card" style="border-color: #e74c3c;">
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 15px;">
                        <div style="width: 40px; height: 40px; background: #e74c3c; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 1.2em;">2</div>
                        <h3 style="margin: 0; font-size: 1.2em;">🏆 Planifier les FINALES (après-midi)</h3>
                    </div>
                    <div id="finales-warning" style="background: rgba(243,156,18,0.1); padding: 12px; border-radius: 8px; margin-bottom: 15px; display: none;"><div style="color: #f39c12; font-size: 0.9em;">⚠️ Le bracket doit être généré avant de planifier les finales</div></div>
                    <button type="button" id="btn-planning-finales" class="admin-btn" style="width: 100%; padding: 15px; font-size: 1.1em; background: #e74c3c;">🌇 Planifier les FINALES</button>
                </div>
            </div>

            <!-- FORMULAIRE 2/3 JOURS -->
            <form id="planning-unified-form" style="display: grid; gap: 20px;">
                <div class="ed-card">
                    <h3 style="margin: 0 0 15px 0; font-size: 1em;">📅 Date et horaires</h3>
                    <div style="margin-bottom: 20px;"><label style="display: block; margin-bottom: 8px; font-weight: 600; font-size: 0.9em;">📅 Date de début *</label><input type="date" id="planning-date-debut" required style="width: 100%; padding: 12px; border: 2px solid #3498db; border-radius: 8px; font-size: 0.95em; background: #0f1923; color: #e0e6ed;"></div>
                    <div id="planning-range-classic">
                        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px;">
                            <div><label style="display: block; margin-bottom: 8px; font-weight: 600; font-size: 0.9em;">⏰ Heure début *</label><input type="time" id="planning-start-time" required value="09:00" style="width: 100%; padding: 12px; border: 2px solid #2a3a4a; border-radius: 8px; font-size: 0.95em; background: #0f1923; color: #e0e6ed;"></div>
                            <div><label style="display: block; margin-bottom: 8px; font-weight: 600; font-size: 0.9em;">🕐 Heure fin *</label><input type="time" id="planning-end-time" required value="18:00" style="width: 100%; padding: 12px; border: 2px solid #2a3a4a; border-radius: 8px; font-size: 0.95em; background: #0f1923; color: #e0e6ed;"></div>
                        </div>
                    </div>
                </div>
                <div class="ed-card">
                    <h3 style="margin: 0 0 15px 0; font-size: 1em;">⚙️ Configuration des matchs</h3>
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px;">
                        <div><label style="display: block; margin-bottom: 8px; font-weight: 600; font-size: 0.9em;">⚽ Durée (min) *</label><input type="number" id="planning-match-duration" min="10" max="120" value="40" required style="width: 100%; padding: 12px; border: 2px solid #2a3a4a; border-radius: 8px; font-size: 0.95em; background: #0f1923; color: #e0e6ed;"></div>
                        <div><label style="display: block; margin-bottom: 8px; font-weight: 600; font-size: 0.9em;">⏸️ Pause (min) *</label><input type="number" id="planning-break-duration" min="0" max="60" value="10" required style="width: 100%; padding: 12px; border: 2px solid #2a3a4a; border-radius: 8px; font-size: 0.95em; background: #0f1923; color: #e0e6ed;"></div>
                        <div><label style="display: block; margin-bottom: 8px; font-weight: 600; font-size: 0.9em;">🏟️ Terrains *</label><input type="number" id="planning-fields-count" min="1" max="10" value="2" required style="width: 100%; padding: 12px; border: 2px solid #2a3a4a; border-radius: 8px; font-size: 0.95em; background: #0f1923; color: #e0e6ed;"></div>
                    </div>
                </div>
                <div class="ed-card">
                    <h3 style="margin: 0 0 15px 0; font-size: 1em;">🎚️ Options planning</h3>
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                        <div><label style="display:block; margin-bottom:8px; font-weight:600; font-size:0.9em;">Phase</label><select id="planning-phase" style="width:100%; padding:12px; border:2px solid #2a3a4a; border-radius:8px; background: #0f1923; color: #e0e6ed;"><option value="POULES">POULES</option><option value="FINALES">FINALES</option><option value="ALL">ALL</option></select></div>
                        <div style="display:flex; align-items:flex-end;"><label style="display:flex; align-items:center; gap:8px; font-weight:600; font-size:0.9em;"><input type="checkbox" id="planning-advanced-toggle"> Avancé</label></div>
                    </div>
                    <div id="planning-advanced" style="display:none; margin-top:15px; padding-top:15px; border-top:1px solid #243447;">
                        <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                            <div><label style="display:block; margin-bottom:8px; font-weight:600; font-size:0.9em;">Repos entre rounds (min)</label><input type="number" id="planning-rest-between-rounds" min="0" value="10" style="width:100%; padding:12px; border:2px solid #2a3a4a; border-radius:8px; font-size:0.95em; background: #0f1923; color: #e0e6ed;"></div>
                            <div style="display:flex; align-items:flex-end;"><label style="display:flex; align-items:center; gap:8px; font-weight:600; font-size:0.9em;"><input type="checkbox" id="planning-overwrite"> Replanifier</label></div>
                        </div>
                    </div>
                    <div id="planning-suggestions" style="display:none; margin-top:15px; padding:15px; border-radius:10px; background:rgba(243,156,18,0.1); border:1px solid rgba(243,156,18,0.3);">
                        <div style="font-weight:700; margin-bottom:10px; color:#f39c12;">⚠️ Ajustements proposés</div>
                        <div id="planning-suggestions-msg" style="margin-bottom:12px; color:#d4a053;"></div>
                        <div style="display:flex; gap:10px; flex-wrap:wrap;">
                            <button type="button" id="btn-suggest-more-time" class="admin-btn" style="background:#f39c12;">+30 min</button>
                            <button type="button" id="btn-suggest-more-fields" class="admin-btn" style="background:#9b59b6;">+1 terrain</button>
                            <button type="button" id="btn-suggest-rest-zero" class="admin-btn" style="background:#27ae60;">repos=0</button>
                        </div>
                    </div>
                </div>
                <div id="planning-preview" style="background: rgba(243,156,18,0.08); border-left: 4px solid #f39c12; padding: 20px; border-radius: 10px; display: none;">
                    <h3 style="margin: 0 0 12px 0; color: #f39c12; font-size: 1em;">👁️ Aperçu</h3>
                    <div id="preview-content" style="color: #d4a053; font-size: 0.9em; line-height: 1.6;"></div>
                </div>
                <button type="submit" class="admin-btn admin-btn-primary" style="width: 100%; padding: 18px; font-size: 1.15em; font-weight: 700; background: linear-gradient(135deg, #3498db 0%, #2980b9 100%); border: none;">
                    ✨ Générer le planning du tournoi
                </button>
            </form>

            <div class="ed-card" style="margin-top: 20px;">
                <h2>🗓️ Planning complet des matchs</h2>
                <div id="planning-matches-container"><p style="text-align: center; color: #5a6a7a; padding: 40px;">Générez d'abord le planning</p></div>
            </div>
        </div>
    </div>

    <!-- ═══ ACCORDION: PHASE FINALE ═══ -->
    <div class="ed-accordion" id="accordion-bracket">
        <div class="ed-accordion-header" data-target="bracket">
            <div class="acc-icon">🏆</div>
            <div class="acc-title">Phase finale</div>
            <div class="acc-badge" id="badge-bracket">—</div>
            <i class="fas fa-chevron-down acc-chevron"></i>
        </div>
        <div class="ed-accordion-body">
            <div class="ed-card"><h2>🏆 Bracket principal</h2><div id="event-bracket" class="admin-loading"><div class="loader">⏳ Chargement...</div></div></div>
            <div class="ed-card"><h2>♻️ Consolante</h2><div id="event-consolante" class="admin-loading"><div class="loader">⏳ Chargement...</div></div></div>
        </div>
    </div>

    <!-- ═══ ACCORDION: CLASSEMENTS ═══ -->
    <div class="ed-accordion" id="accordion-rankings">
        <div class="ed-accordion-header" data-target="rankings">
            <div class="acc-icon">📊</div>
            <div class="acc-title">Classements</div>
            <div class="acc-badge" id="badge-rankings">—</div>
            <i class="fas fa-chevron-down acc-chevron"></i>
        </div>
        <div class="ed-accordion-body">
            <div class="ed-card"><h2>🧩 Poules & classements</h2><div id="event-groups" class="admin-loading"><div class="loader">⏳ Chargement...</div></div><div id="event-groups-rankings" style="margin-top: 10px;"></div></div>
            <div class="ed-card"><h2>📊 Résumé</h2><div id="event-summary" class="admin-loading"><div class="loader">⏳ Chargement...</div></div></div>
        </div>
    </div>

    <!-- ═══ ACCORDION: ARCHIVÉS ═══ -->
    <div class="ed-accordion" id="accordion-archived">
        <div class="ed-accordion-header" data-target="archived">
            <div class="acc-icon">📦</div>
            <div class="acc-title">Archivés</div>
            <i class="fas fa-chevron-down acc-chevron"></i>
        </div>
        <div class="ed-accordion-body">
            <p style="color: #5a6a7a; margin-bottom: 20px;">Les événements archivés ne sont plus visibles publiquement.</p>
            <div id="archived-events-list"><div class="loader">⏳ Chargement...</div></div>
        </div>
    </div>

    <!-- DANGER ZONE -->
    <div class="ed-danger-zone">
        <h3>⚠️ Zone de danger</h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <button id="btn-cancel-event" class="admin-btn" style="background: #f39c12; width: 100%;"><i class="fas fa-ban"></i> Annuler</button>
            <button id="btn-delete-event" class="admin-btn" style="background: #e74c3c; width: 100%;"><i class="fas fa-trash"></i> Archiver</button>
        </div>
    </div>

    <!-- MODAL ÉDITION HORAIRE -->
    <div id="edit-match-schedule-modal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 9999; overflow-y: auto;">
        <div style="background: #1a2735; max-width: 500px; margin: 50px auto; padding: 30px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.3); color: #e0e6ed;">
            <h3 style="margin: 0 0 20px 0;">✏️ Modifier l'horaire</h3>
            <div id="edit-match-info" style="background: #0f1923; padding: 15px; border-radius: 8px; margin-bottom: 20px; font-size: 0.9em;"></div>
            <div style="display: grid; gap: 15px;">
                <div><label style="display: block; margin-bottom: 8px; font-weight: 600;">📅 Date</label><input type="date" id="edit-match-date" style="width: 100%; padding: 10px; border: 2px solid #2a3a4a; border-radius: 8px; background: #0f1923; color: #e0e6ed;"></div>
                <div><label style="display: block; margin-bottom: 8px; font-weight: 600;">🕐 Heure</label><input type="time" id="edit-match-time" style="width: 100%; padding: 10px; border: 2px solid #2a3a4a; border-radius: 8px; background: #0f1923; color: #e0e6ed;"></div>
                <div><label style="display: block; margin-bottom: 8px; font-weight: 600;">🏟️ Terrain</label><input type="text" id="edit-match-field" placeholder="Ex: Terrain 1" style="width: 100%; padding: 10px; border: 2px solid #2a3a4a; border-radius: 8px; background: #0f1923; color: #e0e6ed;"></div>
            </div>
            <div style="display: flex; gap: 10px; margin-top: 25px;">
                <button id="cancel-edit-match" class="admin-btn" style="flex: 1; background: #95a5a6;">Annuler</button>
                <button id="save-edit-match" class="admin-btn admin-btn-primary" style="flex: 1;">✅ Enregistrer</button>
            </div>
        </div>
    </div>
</div>
        `;
    },