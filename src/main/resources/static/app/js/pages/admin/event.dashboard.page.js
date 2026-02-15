// /static/app/js/pages/admin/event.dashboard.page.js
// ✅ VERSION AVEC ONGLETS - ARCHITECTURE MODERNE
// 🎯 Interface professionnelle avec navigation par onglets

import { Router } from "../../router.js";
import { ScoreUpdater } from "../../components/ScoreUpdater.js";
import { AdminNav } from '../../components/admin-nav.js';

const ROUND_LABELS = {
    BARRAGE: "⚔️ Barrages", 
    PRELIM: "⚽ Tour préliminaire",
    R32: "⚽ 1/16 de finale",
    R16: "⚽ 1/8 de finale",
    QF: "⚽ Quarts de finale",
    SF: "🎯 Demi-finales",
    FINAL: "🏆 Finale",
    CQF: "⚽ Quarts de finale consolante",
    CSF: "🎯 Demi-finales consolante",
    CFINAL: "🏆 Finale consolante"
};

export const AdminEventDashboardPage = {
    scoreUpdater: null,
    isOrganizer: false,
    currentTab: 'overview', // Onglet actif par défaut
    
    // 🔥 NOUVEAU : Cache pour la checklist
    cachedMatchesCount: 0,
    cachedRemainingScores: 0,
    cachedHasBracket: false,

  
     applyEventMode(event) {
        const isSingleMatch = event?.format === "SINGLE_MATCH";

        // Titre
        const titleEl = document.getElementById("event-dashboard-title");
        if (titleEl) {
            titleEl.textContent = isSingleMatch ? "⚽ Gestion du match" : "⚽ Gestion du tournoi";
        }

          const actionsTitle = document.getElementById("event-actions-title");
    if (actionsTitle) {
        actionsTitle.textContent = isSingleMatch ? "🎮 Actions match" : "🎮 Actions tournoi";
    }

        // Masquer les onglets non pertinents en match unique
        const tabsToHide = isSingleMatch
            ? ["progression", "registrations", "planning", "bracket", "rankings"]
            : [];

        tabsToHide.forEach(tab => {
            const btn = document.querySelector(`.tab-btn[data-tab="${tab}"]`);
            const content = document.querySelector(`.tab-content[data-content="${tab}"]`);
            if (btn) btn.style.display = "none";
            if (content) content.style.display = "none";
        });

        // Masquer les actions tournoi en match unique
        const tournamentButtons = [
            "btn-generate-groups",
            "btn-generate-bracket",
            "btn-generate-consolante",
            "btn-start-tournament"
        ];

        if (isSingleMatch) {
            tournamentButtons.forEach(id => {
                const el = document.getElementById(id);
                if (el) el.style.display = "none";
            });
        }


        const myTeamsSection = document.getElementById("my-teams-section");
if (myTeamsSection) {
  myTeamsSection.style.display = isSingleMatch ? "none" : "";
}

    },

    normStatus(s) {
  return String(s || "").trim().toUpperCase();
},


    // ================================
    // 🧱 RENDER
    // ================================
 async render() {
    return `
        ${AdminNav.render('events')}
        <div class="admin-main" style="padding: 20px; margin-top: 60px;">
     <h1 id="event-dashboard-title" class="admin-title">⚽ Gestion de l'événement</h1>


                <p id="event-global-message" class="admin-message"></p>

                <!-- 🆕 NAVIGATION PAR ONGLETS -->
                <div class="dashboard-tabs">
                    <button class="tab-btn active" data-tab="overview">
                        <i class="fas fa-home"></i>
                        <span>Vue d'ensemble</span>
                    </button>
                     <button class="tab-btn" data-tab="progression">
                        <i class="fas fa-tasks"></i>
                        <span>Progression</span>
                    </button>
                    <button class="tab-btn" data-tab="registrations">
                        <i class="fas fa-users"></i>
                        <span>Inscriptions</span>
                    </button>
                    <button class="tab-btn" data-tab="matches">
                        <i class="fas fa-futbol"></i>
                        <span>Matchs</span>
                    </button>
                    <button class="tab-btn" data-tab="planning">
                        <i class="fas fa-calendar-alt"></i>
                        <span>Planning</span>
                    </button>
                    <button class="tab-btn" data-tab="bracket">
                        <i class="fas fa-trophy"></i>
                        <span>Phase finale</span>
                    </button>
                    <button class="tab-btn" data-tab="rankings">
                        <i class="fas fa-chart-line"></i>
                        <span>Classements</span>
                    </button>
                    <button class="tab-btn" data-tab="archived">
                        <i class="fas fa-archive"></i>
                        <span>Archivés</span>
                    </button>
                </div>

                <!-- 🆕 CONTENEUR DES ONGLETS -->
                <div class="dashboard-content">
                    
                    <!-- ONGLET 1: VUE D'ENSEMBLE -->
                    <div class="tab-content active" data-content="overview">
                        
                        <!-- Infos générales -->
                        <section class="admin-card">
                            <h2>📋 Informations générales</h2>
                            <div id="event-details" class="admin-loading">
                                <div class="loader">⏳ Chargement...</div>
                            </div>
                        </section>

                        <!-- Actions globales -->
                        <section class="admin-card">
                          <h2 id="event-actions-title">🎮 Actions</h2>

                            <div class="admin-dashboard-grid">
                                <button id="btn-generate-groups" class="admin-btn admin-btn-primary">
                                    🧩 Générer les poules
                                </button>
                               <div style="display: flex; gap: 10px;">
    <button id="btn-generate-bracket-uefa" class="admin-btn admin-btn-primary" style="flex: 1;">
        🏆 Bracket UEFA (Fixe)
    </button>
    <button id="btn-generate-bracket-semi" class="admin-btn" style="flex: 1; background: #9b59b6;">
        🎲 Tirage Champions League
    </button>
</div>
                                <button id="btn-generate-consolante" class="admin-btn">
                                    ♻️ Générer la consolante
                                </button>
                                <button id="btn-refresh-all" class="admin-btn">
                                    🔄 Rafraîchir
                                </button>
                            </div>
                            <div id="tournament-format" style="margin-top:15px;font-weight:600;color:#2c3e50;"></div>
                        </section>

                        <!-- Mes équipes -->
                       <section class="admin-card" id="my-teams-section">

                            <h2>🏟️ Mes équipes</h2>
                            <div id="my-teams">
                                <div class="loader">⏳ Chargement...</div>
                            </div>
                        </section>

                        <!-- Gestion de l'événement -->
                        <section class="admin-card">
                            <h2>⚙️ Gestion de l'événement</h2>
                            <div class="admin-dashboard-grid">
                                <button id="btn-cancel-event" class="admin-btn" style="background: #f39c12;">
                                    <i class="fas fa-ban"></i>
                                    Annuler l'événement
                                </button>
                                <button id="btn-delete-event" class="admin-btn" style="background: #e74c3c;">
                                    <i class="fas fa-trash"></i>
                                    Archiver l'événement
                                </button>
                            </div>
                        </section>
                    </div>

                    <!-- ONGLET 2: PROGRESSION -->
                            <div class="tab-content" data-content="progression">
                            <section class="admin-card">
                            <h2>📋 Progression du tournoi</h2>
                            <div id="progression-checklist-container"></div>
                            </section>
                            </div>

<!-- ONGLET 3: INSCRIPTIONS -->
<div class="tab-content" data-content="registrations">
    <section class="admin-card">
        <h2>👥 Inscriptions des équipes</h2>
                            <div id="event-registrations" class="admin-loading">
                                <div class="loader">⏳ Chargement...</div>
                            </div>
                        </section>
                    </div>

                    <!-- ONGLET 3: MATCHS -->
                    <div class="tab-content" data-content="matches">
                       <section class="admin-card">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h2 style="margin: 0;">⚽ Tous les matchs</h2>
        <button id="btn-delete-round" class="admin-btn" style="background: #e74c3c;">
            🗑️ Supprimer un round
        </button>
    </div>
    <div id="event-matches" class="admin-loading">
                                <div class="loader">⏳ Chargement...</div>
                            </div>
                        </section>
                    </div>

                    <!-- ONGLET 4: PHASE FINALE -->
                    <div class="tab-content" data-content="bracket">
                        <section class="admin-card">
                            <h2>🏆 Bracket principal</h2>
                            <div id="event-bracket" class="admin-loading">
                                <div class="loader">⏳ Chargement...</div>
                            </div>
                        </section>

                        <section class="admin-card">
                            <h2>♻️ Consolante</h2>
                            <div id="event-consolante" class="admin-loading">
                                <div class="loader">⏳ Chargement...</div>
                            </div>
                        </section>
                    </div>
<!-- ONGLET 4: PLANNING -->
<div class="tab-content" data-content="planning">
    
    <!-- ======================== -->
    <!-- 🎯 SECTION PRINCIPALE -->
    <!-- ======================== -->
    <section class="admin-card">
        <h2>📅 Planification du tournoi</h2>
        
        <!-- SÉLECTEUR MODE -->
        <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 25px;">
            <label style="display: block; margin-bottom: 12px; font-weight: 600; color: #2c3e50; font-size: 1em;">
                📆 Durée du tournoi
            </label>
            
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 20px;">
                <div class="duration-option" data-days="1" style="
                    background: white;
                    border: 3px solid #3498db;
                    border-radius: 12px;
                    padding: 20px;
                    text-align: center;
                    cursor: pointer;
                    transition: all 0.3s;
                ">
                    <div style="font-size: 2.5em; margin-bottom: 10px;">📅</div>
                    <div style="font-weight: 700; font-size: 1.1em; color: #2c3e50; margin-bottom: 8px;">1 JOUR</div>
                    <div style="font-size: 0.85em; color: #7f8c8d; line-height: 1.4;">
                        Tout le tournoi sur une seule journée
                    </div>
                </div>
                
                <div class="duration-option" data-days="2" style="
                    background: white;
                    border: 3px solid #e0e0e0;
                    border-radius: 12px;
                    padding: 20px;
                    text-align: center;
                    cursor: pointer;
                    transition: all 0.3s;
                ">
                    <div style="font-size: 2.5em; margin-bottom: 10px;">📅📅</div>
                    <div style="font-weight: 700; font-size: 1.1em; color: #2c3e50; margin-bottom: 8px;">2 JOURS</div>
                    <div style="font-size: 0.85em; color: #7f8c8d; line-height: 1.4;">
                        J1: Poules<br>J2: Finales
                    </div>
                </div>
                
                <div class="duration-option" data-days="3" style="
                    background: white;
                    border: 3px solid #e0e0e0;
                    border-radius: 12px;
                    padding: 20px;
                    text-align: center;
                    cursor: pointer;
                    transition: all 0.3s;
                ">
                    <div style="font-size: 2.5em; margin-bottom: 10px;">📅📅📅</div>
                    <div style="font-weight: 700; font-size: 1.1em; color: #2c3e50; margin-bottom: 8px;">3 JOURS</div>
                    <div style="font-size: 0.85em; color: #7f8c8d; line-height: 1.4;">
                            J1: Poules<br>J2: Consolante<br>J3: Bracket
                    </div>
                </div>
            </div>
            
            <!-- INFOBULLE EXPLICATIVE -->
            <div id="duration-info" style="
                background: #e3f2fd;
                border-left: 4px solid #3498db;
                padding: 15px;
                border-radius: 8px;
            ">
                <div style="font-weight: 600; color: #1976d2; margin-bottom: 8px;">
                    ℹ️ Mode 1 jour sélectionné
                </div>
                <div style="color: #1976d2; font-size: 0.9em; line-height: 1.5;">
                    Tous les matchs (poules et finales) seront planifiés le même jour.
                </div>
            </div>
        </div>

        <!-- BOUTON RESET -->
<section class="admin-card" style="background: #fff3cd; border-left: 4px solid #f39c12;">
    <div style="display: flex; justify-content: space-between; align-items: center;">
        <div>
            <h3 style="margin: 0 0 8px 0; color: #856404; font-size: 1em;">
                ⚠️ Réinitialiser le planning
            </h3>
            <p style="margin: 0; color: #856404; font-size: 0.9em;">
               Réinitialise la date/heure/terrain des matchs non joués (SCHEDULED/CREATED).
Les matchs terminés (COMPLETED) ne sont pas modifiés.
            </p>
        </div>
        <button id="btn-reset-planning" class="admin-btn" style="
            background: #e74c3c;
            border-color: #c0392b;
            padding: 12px 20px;
            white-space: nowrap;
        ">
            🗑️ Réinitialiser
        </button>
    </div>
</section>
        
      <!-- FORMULAIRE PRINCIPAL -->

    
<!-- 🆕 MODE 1 JOUR : CHAMPS + 2 BOUTONS -->
<div id="planning-mode-1-day" style="display: none;">
    
    <!-- CHAMPS DATE & HORAIRES (visible en mode 1 jour) -->
    <div style="background: white; padding: 20px; border-radius: 10px; border: 2px solid #e0e0e0; margin-bottom: 20px;">
        <h3 style="margin: 0 0 15px 0; color: #2c3e50; font-size: 1em;">📅 Configuration de la journée</h3>
        
        <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #2c3e50; font-size: 0.9em;">
                📅 Date du tournoi *
            </label>
            <input type="date" id="planning-date-1day" required
                   style="width: 100%; padding: 12px; border: 2px solid #3498db; border-radius: 8px; font-size: 0.95em;">
        </div>
        
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px;">
            <div>
                <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #2c3e50; font-size: 0.9em;">
                    🌤️ Matin - Début
                </label>
                <input type="time" id="planning-morning-start-1day" value="09:00"
                       style="width: 100%; padding: 12px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 0.95em;">
            </div>
            <div>
                <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #2c3e50; font-size: 0.9em;">
                    🌤️ Matin - Fin
                </label>
                <input type="time" id="planning-morning-end-1day" value="12:45"
                       style="width: 100%; padding: 12px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 0.95em;">
            </div>
            <div>
                <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #2c3e50; font-size: 0.9em;">
                    🌇 Après-midi - Début
                </label>
                <input type="time" id="planning-afternoon-start-1day" value="14:00"
                       style="width: 100%; padding: 12px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 0.95em;">
            </div>
            <div>
                <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #2c3e50; font-size: 0.9em;">
                    🌇 Après-midi - Fin
                </label>
                <input type="time" id="planning-afternoon-end-1day" value="18:30"
                       style="width: 100%; padding: 12px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 0.95em;">
            </div>
        </div>
        
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-top: 15px;">
            <div>
                <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #2c3e50; font-size: 0.9em;">
                    ⚽ Durée match (min)
                </label>
                <input type="number" id="planning-match-duration-1day" min="10" max="120" value="40"
                       style="width: 100%; padding: 12px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 0.95em;">
            </div>
            <div>
                <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #2c3e50; font-size: 0.9em;">
                    ⏸️ Pause (min)
                </label>
                <input type="number" id="planning-break-duration-1day" min="0" max="60" value="10"
                       style="width: 100%; padding: 12px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 0.95em;">
            </div>
            <div>
                <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #2c3e50; font-size: 0.9em;">
                    🏟️ Terrains
                </label>
                <input type="number" id="planning-fields-count-1day" min="1" max="10" value="2"
                       style="width: 100%; padding: 12px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 0.95em;">
            </div>
        </div>
    </div>
    
    <!-- ÉTAPE 1 : POULES -->
    <div style="background: white; padding: 25px; border-radius: 12px; border: 2px solid #3498db; margin-bottom: 20px;">
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 15px;">
            <div style="
                width: 40px;
                height: 40px;
                background: #3498db;
                color: white;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 700;
                font-size: 1.2em;
            ">1</div>
            <h3 style="margin: 0; color: #2c3e50; font-size: 1.2em;">📋 Planifier les POULES (matin)</h3>
        </div>
        
        <p style="margin: 0 0 15px 0; color: #7f8c8d; font-size: 0.95em;">
            Créneau horaire du matin pour les matchs de poules
        </p>
        
        <button 
            type="button"
            id="btn-planning-poules" 
            class="admin-btn admin-btn-primary"
            style="width: 100%; padding: 15px; font-size: 1.1em;">
            🌤️ Planifier les POULES
        </button>
    </div>
    
    <!-- ÉTAPE 2 : FINALES -->
    <div style="background: white; padding: 25px; border-radius: 12px; border: 2px solid #e74c3c; margin-bottom: 20px;">
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 15px;">
            <div style="
                width: 40px;
                height: 40px;
                background: #e74c3c;
                color: white;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 700;
                font-size: 1.2em;
            ">2</div>
            <h3 style="margin: 0; color: #2c3e50; font-size: 1.2em;">🏆 Planifier les FINALES (après-midi)</h3>
        </div>
        
        <div id="finales-warning" style="
            background: #fff3cd;
            padding: 12px;
            border-radius: 8px;
            margin-bottom: 15px;
            display: none;
        ">
            <div style="color: #856404; font-size: 0.9em;">
                ⚠️ Le bracket doit être généré avant de planifier les finales
            </div>
        </div>
        
        <p style="margin: 0 0 15px 0; color: #7f8c8d; font-size: 0.95em;">
            Créneau horaire de l'après-midi pour les phases finales (bracket + consolante)
        </p>
        
        <button 
            type="button"
            id="btn-planning-finales" 
            class="admin-btn"
            style="width: 100%; padding: 15px; font-size: 1.1em; background: #e74c3c;">
            🌇 Planifier les FINALES
        </button>
    </div>
</div>

<form id="planning-unified-form" style="display: grid; gap: 20px;">
    
    <!-- DATE & HORAIRES -->
    <div style="background: white; padding: 20px; border-radius: 10px; border: 2px solid #e0e0e0;">
        <h3 style="margin: 0 0 15px 0; color: #2c3e50; font-size: 1em; display: flex; align-items: center; gap: 8px;">
            <i class="fas fa-calendar-alt" style="color: #3498db;"></i>
            Date et horaires
        </h3>
       
        <!-- ✅ DATE TOUJOURS VISIBLE -->
        <div style="margin-bottom: 20px;">
            <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #2c3e50; font-size: 0.9em;">
                📅 Date de début *
            </label>
            <input type="date" id="planning-date-debut" required
                   style="width: 100%; padding: 12px; border: 2px solid #3498db; border-radius: 8px; font-size: 0.95em;">
        </div>
       
        <!-- Créneaux classiques (2/3 jours) -->
        <div id="planning-range-classic">
            <div class="form-row" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px;">
                <div>
                    <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #2c3e50; font-size: 0.9em;">
                        ⏰ Heure de début *
                    </label>
                    <input type="time" id="planning-start-time" required value="09:00"
                           style="width: 100%; padding: 12px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 0.95em;">
                </div>
                
                <div>
                    <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #2c3e50; font-size: 0.9em;">
                        🕐 Heure de fin *
                    </label>
                    <input type="time" id="planning-end-time" required value="18:00"
                           style="width: 100%; padding: 12px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 0.95em;">
                </div>
            </div>
        </div>
        
   
    </div>
            
    <!-- CONFIGURATION MATCHS -->
    <div style="background: white; padding: 20px; border-radius: 10px; border: 2px solid #e0e0e0;">
        <h3 style="margin: 0 0 15px 0; color: #2c3e50; font-size: 1em; display: flex; align-items: center; gap: 8px;">
            <i class="fas fa-cog" style="color: #e67e22;"></i>
            Configuration des matchs
        </h3>
        
        <div class="form-row" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px;">
            <div>
                <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #2c3e50; font-size: 0.9em;">
                    ⚽ Durée d'un match (min) *
                </label>
                <input type="number" id="planning-match-duration" min="10" max="120" value="40" required
                       style="width: 100%; padding: 12px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 0.95em;">
            </div>
            
            <div>
                <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #2c3e50; font-size: 0.9em;">
                    ⏸️ Pause entre matchs (min) *
                </label>
                <input type="number" id="planning-break-duration" min="0" max="60" value="10" required
                       style="width: 100%; padding: 12px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 0.95em;">
            </div>
            
            <div>
                <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #2c3e50; font-size: 0.9em;">
                    🏟️ Nombre de terrains *
                </label>
                <input type="number" id="planning-fields-count" min="1" max="10" value="2" required
                       style="width: 100%; padding: 12px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 0.95em;">
            </div>
        </div>
    </div>

    <!-- OPTIONS PLANNING -->
    <div style="background: white; padding: 20px; border-radius: 10px; border: 2px solid #e0e0e0;">
        <h3 style="margin: 0 0 15px 0; color: #2c3e50; font-size: 1em; display: flex; align-items: center; gap: 8px;">
            <i class="fas fa-sliders-h" style="color: #3498db;"></i>
            Options planning
        </h3>

        <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <div>
                <label style="display:block; margin-bottom:8px; font-weight:600; color:#2c3e50; font-size:0.9em;">
                    Phase à planifier
                </label>
                <select id="planning-phase" style="width:100%; padding:12px; border:2px solid #e0e0e0; border-radius:8px;">
                    <option value="POULES">POULES (matin)</option>
                    <option value="FINALES">FINALES (après-midi)</option>
                    <option value="ALL">ALL (tout)</option>
                </select>
            </div>

            <div style="display:flex; align-items:flex-end;">
                <label style="display:flex; align-items:center; gap:8px; font-weight:600; color:#2c3e50; font-size:0.9em;">
                    <input type="checkbox" id="planning-advanced-toggle">
                    Avancé
                </label>
            </div>
        </div>

        <div id="planning-advanced" style="display:none; margin-top:15px; padding-top:15px; border-top:1px solid #eee;">
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <div>
                    <label style="display:block; margin-bottom:8px; font-weight:600; color:#2c3e50; font-size:0.9em;">
                        Repos entre rounds (min)
                    </label>
                    <input type="number" id="planning-rest-between-rounds" min="0" value="10"
                        style="width:100%; padding:12px; border:2px solid #e0e0e0; border-radius:8px; font-size:0.95em;">
                    <div style="font-size:0.8em; color:#7f8c8d; margin-top:6px;">
                        Option avancée : 0–10 recommandé.
                    </div>
                </div>

                <div style="display:flex; align-items:flex-end;">
                    <label style="display:flex; align-items:center; gap:8px; font-weight:600; color:#2c3e50; font-size:0.9em;">
                        <input type="checkbox" id="planning-overwrite">
                        Replanifier (overwrite)
                    </label>
                </div>
            </div>
        </div>

        <div id="planning-suggestions" style="display:none; margin-top:15px; padding:15px; border-radius:10px; background:#fff3cd; border:1px solid #ffeeba;">
            <div style="font-weight:700; margin-bottom:10px;">⚠️ Ajustements proposés</div>
            <div id="planning-suggestions-msg" style="margin-bottom:12px; color:#856404;"></div>
            <div style="display:flex; gap:10px; flex-wrap:wrap;">
                <button type="button" id="btn-suggest-more-time" class="admin-btn" style="background:#f39c12;">+30 min</button>
                <button type="button" id="btn-suggest-more-fields" class="admin-btn" style="background:#9b59b6;">+1 terrain</button>
                <button type="button" id="btn-suggest-rest-zero" class="admin-btn" style="background:#27ae60;">repos=0</button>
            </div>
        </div>
    </div>
    
    <!-- APERÇU PLANIFICATION -->
    <div id="planning-preview" style="
        background: #fff3cd;
        border-left: 4px solid #f39c12;
        padding: 20px;
        border-radius: 10px;
        display: none;
    ">
        <h3 style="margin: 0 0 12px 0; color: #856404; font-size: 1em; display: flex; align-items: center; gap: 8px;">
            <i class="fas fa-eye"></i>
            Aperçu de la planification
        </h3>
        <div id="preview-content" style="color: #856404; font-size: 0.9em; line-height: 1.6;"></div>
    </div>
    
    <!-- BOUTON GÉNÉRATION -->
    <button type="submit" class="admin-btn admin-btn-primary" style="
        width: 100%;
        padding: 18px;
        font-size: 1.15em;
        font-weight: 700;
        background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
        border: none;
        box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
    ">
        <i class="fas fa-magic"></i> Générer le planning du tournoi
    </button>
</form>
    </section>
    
    <!-- ======================== -->
    <!-- 📋 AFFICHAGE DU PLANNING -->
    <!-- ======================== -->
    <section class="admin-card">
        <h2>🗓️ Planning complet des matchs</h2>
        <div id="planning-matches-container">
            <p style="text-align: center; color: #7f8c8d; padding: 40px;">
                Générez d'abord le planning pour voir les horaires
            </p>
        </div>
    </section>
</div>

                    <!-- ONGLET 5: CLASSEMENTS -->
                    <div class="tab-content" data-content="rankings">
                        <section class="admin-card">
                            <h2>🧩 Poules & classements</h2>
                            <div id="event-groups" class="admin-loading">
                                <div class="loader">⏳ Chargement...</div>
                            </div>
                            <div id="event-groups-rankings" style="margin-top: 10px;"></div>
                        </section>

                        <section class="admin-card">
                            <h2>📊 Résumé du tournoi</h2>
                            <div id="event-summary" class="admin-loading">
                                <div class="loader">⏳ Chargement...</div>
                            </div>
                        </section>
                    </div>

                </div>

                <!-- ONGLET 6: ARCHIVÉS -->
<div class="tab-content" data-content="archived">
    <section class="admin-card">
        <h2>📦 Événements archivés</h2>
        <p style="color: #7f8c8d; margin-bottom: 20px;">
            Les événements archivés ne sont plus visibles publiquement. Vous pouvez les restaurer à tout moment.
        </p>
        <div id="archived-events-list">
            <div class="loader">⏳ Chargement...</div>
        </div>
    </section>
</div>
                <!-- MODAL ÉDITION HORAIRE -->
<div id="edit-match-schedule-modal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 9999; overflow-y: auto;">
    <div style="
        background: white;
        max-width: 500px;
        margin: 50px auto;
        padding: 30px;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    ">
        <h3 style="margin: 0 0 20px 0; color: #2c3e50;">✏️ Modifier l'horaire du match</h3>
        
        <div id="edit-match-info" style="
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            font-size: 0.9em;
        "></div>
        
        <div style="display: grid; gap: 15px;">
            <div>
                <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #2c3e50;">
                    📅 Date
                </label>
                <input type="date" id="edit-match-date" 
                       style="width: 100%; padding: 10px; border: 2px solid #e0e0e0; border-radius: 8px;">
            </div>
            
            <div>
                <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #2c3e50;">
                    🕐 Heure
                </label>
                <input type="time" id="edit-match-time" 
                       style="width: 100%; padding: 10px; border: 2px solid #e0e0e0; border-radius: 8px;">
            </div>
            
            <div>
                <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #2c3e50;">
                    🏟️ Terrain
                </label>
                <input type="text" id="edit-match-field" placeholder="Ex: Terrain 1"
                       style="width: 100%; padding: 10px; border: 2px solid #e0e0e0; border-radius: 8px;">
            </div>
        </div>
        
        <div style="display: flex; gap: 10px; margin-top: 25px;">
            <button id="cancel-edit-match" class="admin-btn" style="flex: 1; background: #95a5a6;">
                Annuler
            </button>
            <button id="save-edit-match" class="admin-btn admin-btn-primary" style="flex: 1;">
                ✅ Enregistrer
            </button>
        </div>
    </div>
</div>
            </div>
        `;
    },

    // ================================
    // 🚀 INIT
    // ================================
    async init() {
        // ✅ INJECTER LE CSS EN PREMIER
      
        const currentUserRaw = localStorage.getItem("currentUser");

       if (!Auth.accessToken || !currentUserRaw) {

            this.setGlobalMessage("❌ Vous devez être connecté", true);
            setTimeout(() => Router.go("/login"), 2000);
            return;
        }

        const token = Auth.accessToken;

        const currentUser = JSON.parse(currentUserRaw);
        const eventId = this.extractEventIdFromPath();

        if (!eventId) {
            this.setGlobalMessage("❌ ID de l'événement invalide", true);
            return;
        }

        try {
const eventData = await this.safeGet(`/api/events/public/${eventId}`, token);

            this.applyEventMode(eventData);
            
            this.isOrganizer = eventData.organizerId === currentUser.id;
            
            if (!this.isOrganizer) {
                this.setGlobalMessage(
                  "❌ Accès refusé : Vous n'êtes pas l'organisateur de cet événement",
                    true
                );
                setTimeout(() => Router.go("/events"), 2000);
                return;
            }

            this.initTabs();

            // ✅ MATCH UNIQUE : ne pas exécuter le dashboard tournoi
if (eventData.format === "SINGLE_MATCH") {
    await this.loadEventDetails(eventId, token);
    await this.loadMatches(eventId, token);
    this.initActionButtons(eventId, token);  // 🆕 AJOUTE CETTE LIGNE
    this.initEditMatchSchedule(eventId, token);
    return;
}

        } catch (err) {
            console.error("Erreur vérification droits:", err);
            this.setGlobalMessage("❌ Erreur de vérification des droits", true);
            return;
        }

        this.scoreUpdater = new ScoreUpdater(); // ou Auth inside

        try {
   const results = await Promise.allSettled([
    this.loadEventDetails(eventId, token),
    this.loadRegistrations(eventId, token),
    this.loadMyTeams(eventId, token),
    this.loadGroups(eventId, token),
    this.loadBracket(eventId, token),
    this.loadConsolante(eventId, token),
    this.loadMatches(eventId, token),
    this.loadSummary(eventId, token),
]);

    // 🔥 NOUVEAU : Rafraîchir la checklist dans l'onglet Progression
const progressionContainer = document.getElementById('progression-checklist-container');
if (progressionContainer) {
const event2 = await this.safeGet(`/api/events/public/${eventId}`, token);

if (event2.format !== "SINGLE_MATCH") {
    progressionContainer.innerHTML = this.renderTournamentChecklist(event2);
} else {
    progressionContainer.innerHTML = ""; // ou un message "Match unique : pas de checklist tournoi"
}

}

            results.forEach((result, index) => {
                if (result.status === 'rejected') {
                    const labels = ['Details', 'Registrations', 'MyTeams', 'Groups', 'Bracket', 'Consolante', 'Matches', 'Summary'];
                    console.warn(`⚠️ Erreur lors du chargement de ${labels[index]}:`, result.reason);
                }
            });

        } catch (err) {
            console.error("Erreur critique lors du chargement du dashboard :", err);
            this.setGlobalMessage("❌ Erreur lors du chargement des données", true);
        }

        this.initActionButtons(eventId, token);
        this.initPlanningForm(eventId, token);
        this.initEditMatchSchedule(eventId, token);


        
    },

    // ================================
    // 🆕 SYSTÈME D'ONGLETS
    // ================================
    initTabs() {
        const tabButtons = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');

        tabButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetTab = btn.getAttribute('data-tab');

                // Retirer la classe active de tous les boutons et contenus
                tabButtons.forEach(b => b.classList.remove('active'));
                tabContents.forEach(c => c.classList.remove('active'));

                // Ajouter la classe active au bouton et contenu cliqué
                btn.classList.add('active');
                const targetContent = document.querySelector(`[data-content="${targetTab}"]`);
                if (targetContent) {
                    targetContent.classList.add('active');
                }

                // Mémoriser l'onglet actif
                this.currentTab = targetTab;

                // 🆕 RECHARGER LES DONNÉES SELON L'ONGLET
const eventId = this.extractEventIdFromPath();
const token = Auth.accessToken;

if (eventId && token) {
    switch (targetTab) {
        case 'planning':
            this.loadPlanningMatches(eventId, token);
            break;
        case 'matches':
            this.loadMatches(eventId, token);
            break;
        case 'rankings':
            this.loadGroups(eventId, token);
            break;
        case 'bracket':
            this.loadBracket(eventId, token);
            this.loadConsolante(eventId, token);
            break;
            case 'archived':
                    this.loadArchivedEvents(eventId, token);
                    break;
    }
}
            });
        });
    },

    // ================================
    // 🎮 INITIALISER LES BOUTONS
    // ================================
    initActionButtons(eventId, token) {
        const btnGenerateGroups = document.getElementById("btn-generate-groups");
     
        const btnGenerateConsolante = document.getElementById("btn-generate-consolante");
        const btnRefreshAll = document.getElementById("btn-refresh-all");

        if (btnGenerateGroups) {
            btnGenerateGroups.addEventListener("click", () => this.handleGenerateGroups(eventId, token));
        }

       const btnGenerateBracketUefa = document.getElementById("btn-generate-bracket-uefa");
const btnGenerateBracketSemi = document.getElementById("btn-generate-bracket-semi");

if (btnGenerateBracketUefa) {
    btnGenerateBracketUefa.addEventListener("click", () => this.handleGenerateBracket(eventId, token, "uefa"));
}

if (btnGenerateBracketSemi) {
    btnGenerateBracketSemi.addEventListener("click", () => this.handleGenerateBracket(eventId, token, "semi"));
}

        if (btnGenerateConsolante) {
            btnGenerateConsolante.addEventListener("click", () => this.handleGenerateConsolante(eventId, token));
        }

        if (btnRefreshAll) {
            btnRefreshAll.addEventListener("click", async () => {
                this.setGlobalMessage("🔄 Rafraîchissement en cours...", false);
                await this.refreshAllData(eventId, token);
                this.setGlobalMessage("✅ Données mises à jour", false);
            });
        }


        const btnCancelEvent = document.getElementById("btn-cancel-event");
        const btnDeleteEvent = document.getElementById("btn-delete-event");

      

        if (btnCancelEvent) {
            btnCancelEvent.addEventListener("click", () => {
                this.handleCancelEvent(eventId, token);
            });
        }

        if (btnDeleteEvent) {
            btnDeleteEvent.addEventListener("click", () => {
                this.handleDeleteEvent(eventId, token);
            });
        }

        const btnDeleteRound = document.getElementById("btn-delete-round");

if (btnDeleteRound) {
    btnDeleteRound.addEventListener("click", () => this.handleDeleteRound(eventId, token));
}

    },

// ================================
// 🗓️ GESTION DU PLANNING
// ================================
initPlanningForm(eventId, token) {
    console.count("initPlanningForm called");
    console.log("[planning] init for eventId=", eventId);

    const form = document.getElementById('planning-unified-form');
    if (!form) return;

    // ✅ anti-doublon
    if (this.__planningInitForEventId === eventId && this.__planningInitFormEl === form) return;
    this.__planningInitForEventId = eventId;
    this.__planningInitFormEl = form;

    // ========================
    // 🎨 GESTION DES OPTIONS DE DURÉE
    // ========================
    const durationOptions = document.querySelectorAll('.duration-option');
    const durationInfo = document.getElementById('duration-info');
    const previewContainer = document.getElementById('planning-preview');
    const previewContent = document.getElementById('preview-content');
    
    let selectedDays = 1;
    
    const infoTexts = {
        1: {
            title: 'ℹ️ Mode 1 jour sélectionné',
            desc: 'Workflow guidé en 2 étapes : Poules d\'abord (matin), puis Finales (après-midi).'
        },
        2: {
            title: 'ℹ️ Mode 2 jours sélectionné',
            desc: '<strong>Jour 1 :</strong> Phase de poules<br><strong>Jour 2 :</strong> Phase finale (bracket + consolante)'
        },
        3: {
            title: 'ℹ️ Mode 3 jours sélectionné',
            desc: '<strong>Jour 1 :</strong> Phase de poules<br><strong>Jour 2 :</strong> Bracket principal<br><strong>Jour 3 :</strong> Consolante'
        }
    };

    // ========================
    // 📊 APERÇU EN TEMPS RÉEL
    // ========================
   const updatePreview = () => {
  const isOneDay = selectedDays === 1;

  const dateDebut = isOneDay
    ? document.getElementById('planning-date-1day')?.value
    : document.getElementById('planning-date-debut')?.value;

  const startTime = document.getElementById('planning-start-time')?.value;
  const endTime = document.getElementById('planning-end-time')?.value;

  const morningStart = isOneDay ? document.getElementById('planning-morning-start-1day')?.value : null;
  const morningEnd   = isOneDay ? document.getElementById('planning-morning-end-1day')?.value : null;
  const afternoonStart = isOneDay ? document.getElementById('planning-afternoon-start-1day')?.value : null;
  const afternoonEnd   = isOneDay ? document.getElementById('planning-afternoon-end-1day')?.value : null;

  const matchDuration = parseInt(
    (isOneDay
      ? document.getElementById('planning-match-duration-1day')?.value
      : document.getElementById('planning-match-duration')?.value) || "0",
    10
  ) || 0;

  const breakDuration = parseInt(
    (isOneDay
      ? document.getElementById('planning-break-duration-1day')?.value
      : document.getElementById('planning-break-duration')?.value) || "0",
    10
  ) || 0;

  const fieldsCount = parseInt(
    (isOneDay
      ? document.getElementById('planning-fields-count-1day')?.value
      : document.getElementById('planning-fields-count')?.value) || "0",
    10
  ) || 0;

  const phase = document.getElementById('planning-phase')?.value || 'POULES';
  const overwrite = !!document.getElementById('planning-overwrite')?.checked;
  const restBetweenRoundsMinutes = parseInt(document.getElementById('planning-rest-between-rounds')?.value || "10", 10);

  const hasClassicTimes = !!startTime && !!endTime;
  const hasDay1Slots = !!morningStart && !!morningEnd && !!afternoonStart && !!afternoonEnd;

  if (!dateDebut || !matchDuration || !fieldsCount || (!isOneDay && !hasClassicTimes) || (isOneDay && !hasDay1Slots)) {
    previewContainer.style.display = 'none';
    return;
  }

  previewContainer.style.display = 'block';

  const creneauDuration = matchDuration + breakDuration;
  const dates = [];

  for (let i = 0; i < selectedDays; i++) {
    const date = new Date(dateDebut);
    date.setDate(date.getDate() + i);
    dates.push(date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }));
  }

  let preview = '';

  if (selectedDays === 1) {
    preview = `
      <div><strong>📅 ${dates[0]}</strong></div>
      <div>🌤️ Matin (Poules) : ${morningStart} → ${morningEnd}</div>
      <div>🌇 Après-midi (Finales) : ${afternoonStart} → ${afternoonEnd}</div>
      <div>🏟️ ${fieldsCount} terrain(x) disponible(s)</div>
      <div>⚽ Durée par créneau : ${creneauDuration} min (${matchDuration} min de match + ${breakDuration} min de pause)</div>
    `;
  } else if (selectedDays === 2) {
    preview = `
      <div style="margin-bottom: 12px;">
        <strong>📅 Jour 1 - ${dates[0]}</strong><br>
        <div style="margin-left: 15px; margin-top: 5px;">→ Phase de poules</div>
      </div>
      <div>
        <strong>📅 Jour 2 - ${dates[1]}</strong><br>
        <div style="margin-left: 15px; margin-top: 5px;">→ Phase finale complète</div>
      </div>
      <div style="margin-top:10px;">
        <div>⏰ Créneau : ${startTime} → ${endTime}</div>
        <div>🏟️ ${fieldsCount} terrain(x)</div>
        <div>⚽ ${creneauDuration} min / créneau</div>
        <div>🎛️ Phase: ${phase} | overwrite: ${overwrite ? 'oui' : 'non'} | repos rounds: ${restBetweenRoundsMinutes} min</div>
      </div>
    `;
  } else {
    preview = `
      <div style="margin-bottom: 10px;">
        <strong>📅 Jour 1 - ${dates[0]}</strong><br>
        <div style="margin-left: 15px; margin-top: 5px;">→ Phase de poules</div>
      </div>
      <div style="margin-bottom: 10px;">
        <strong>📅 Jour 2 - ${dates[1]}</strong><br>
        <div style="margin-left: 15px; margin-top: 5px;">→ Bracket principal</div>
      </div>
      <div>
        <strong>📅 Jour 3 - ${dates[2]}</strong><br>
        <div style="margin-left: 15px; margin-top: 5px;">→ Consolante</div>
      </div>
      <div style="margin-top:10px;">
        <div>⏰ Créneau : ${startTime} → ${endTime}</div>
        <div>🏟️ ${fieldsCount} terrain(x)</div>
        <div>⚽ ${creneauDuration} min / créneau</div>
        <div>🎛️ Phase: ${phase} | overwrite: ${overwrite ? 'oui' : 'non'} | repos rounds: ${restBetweenRoundsMinutes} min</div>
      </div>
    `;
  }

  previewContent.innerHTML = preview;
};


    // ========================
    // 🔄 TOGGLE MODE 1 JOUR vs 2/3 JOURS
    // ========================
    durationOptions.forEach(option => {
        option.addEventListener('click', () => {
            durationOptions.forEach(opt => {
                opt.style.borderColor = '#e0e0e0';
                opt.style.background = 'white';
            });

            option.style.borderColor = '#3498db';
            option.style.background = '#e3f2fd';

            selectedDays = parseInt(option.dataset.days, 10) || 1;

            // ✅ TOGGLE UI selon le mode
            const classic = document.getElementById("planning-range-classic");
         
            const phaseSelect = document.getElementById("planning-phase");
            const mode1DayContainer = document.getElementById("planning-mode-1-day");
            const formClassic = document.getElementById("planning-unified-form");

            const isOneDay = selectedDays === 1;
            
            
            // ✅ AFFICHER/CACHER LES CONTENEURS PRINCIPAUX
if (mode1DayContainer) mode1DayContainer.style.display = isOneDay ? "block" : "none";
if (formClassic) formClassic.style.display = isOneDay ? "none" : "grid";  // ✅ FIX

            // ✅ UI interne au form classique
            if (classic) classic.style.display = isOneDay ? "none" : "block";
        

            const classicStart = document.getElementById('planning-start-time');
            const classicEnd = document.getElementById('planning-end-time');
            if (classicStart) classicStart.required = !isOneDay;
            if (classicEnd) classicEnd.required = !isOneDay;

            if (phaseSelect) {
                phaseSelect.disabled = isOneDay;
                if (isOneDay) phaseSelect.value = "ALL";
            }

            const sugg = document.getElementById('planning-suggestions');
            if (sugg) sugg.style.display = 'none';

            updatePreview();

            const info = infoTexts[selectedDays];
            durationInfo.innerHTML = `
                <div style="font-weight: 600; color: #1976d2; margin-bottom: 8px;">
                    ${info.title}
                </div>
                <div style="color: #1976d2; font-size: 0.9em; line-height: 1.5;">
                    ${info.desc}
                </div>
            `;

           
            // ✅ VÉRIFIER L'ÉTAT DU BRACKET POUR ACTIVER/DÉSACTIVER LE BOUTON FINALES
if (isOneDay) {
    this.checkBracketAndUpdateFinalesButton(eventId, token);
    this.updatePlanningButtonsState(eventId, token);  // 🔥 AJOUTE CETTE LIGNE
}
        });
    });

    // ✅ Mise à jour de l'aperçu en temps réel

[
  // 🔵 2/3 jours
  'planning-date-debut',
  'planning-start-time', 'planning-end-time',
  'planning-match-duration', 'planning-break-duration', 'planning-fields-count',

  // 🟠 1 jour
  'planning-date-1day',
  'planning-morning-start-1day', 'planning-morning-end-1day',
  'planning-afternoon-start-1day', 'planning-afternoon-end-1day',
  'planning-match-duration-1day', 'planning-break-duration-1day', 'planning-fields-count-1day',

  // options communes
  'planning-phase', 'planning-overwrite', 'planning-rest-between-rounds', 'planning-advanced-toggle'
].forEach(id => {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener('input', updatePreview);
  el.addEventListener('change', updatePreview);
});


    updatePreview();

    // ✅ État initial
{
  const mode1DayContainer = document.getElementById("planning-mode-1-day");
  const formClassic = document.getElementById("planning-unified-form");
  const classic = document.getElementById("planning-range-classic");
  const phaseSelect = document.getElementById("planning-phase");

  const isOneDay = selectedDays === 1;

  if (mode1DayContainer) mode1DayContainer.style.display = isOneDay ? "block" : "none";
  if (formClassic) formClassic.style.display = isOneDay ? "none" : "grid";
  if (classic) classic.style.display = isOneDay ? "none" : "block";

  const classicStart = document.getElementById('planning-start-time');
  const classicEnd = document.getElementById('planning-end-time');
  if (classicStart) classicStart.required = !isOneDay;
  if (classicEnd) classicEnd.required = !isOneDay;

  if (phaseSelect) {
    phaseSelect.disabled = isOneDay;
    if (isOneDay) phaseSelect.value = "ALL";
  }

  if (isOneDay) {
    this.checkBracketAndUpdateFinalesButton(eventId, token);
    this.updatePlanningButtonsState(eventId, token);
  }
}


    // ========================
    // 📤 HANDLER BOUTON POULES (MODE 1 JOUR)
    // ========================
    const btnPoules = document.getElementById('btn-planning-poules');
    if (btnPoules) {
        btnPoules.addEventListener('click', async () => {
            await this.handlePlanningPoules(eventId, token);
        });
    }

    // ========================
    // 📤 HANDLER BOUTON FINALES (MODE 1 JOUR)
    // ========================
    const btnFinales = document.getElementById('btn-planning-finales');
    if (btnFinales) {
        btnFinales.addEventListener('click', async () => {
            await this.handlePlanningFinales(eventId, token);
        });
    }

    // ========================
    // 📤 SOUMISSION DU FORMULAIRE (MODE 2/3 JOURS)
    // ========================
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const dateDebut = document.getElementById('planning-date-debut')?.value;
            const startTime = document.getElementById('planning-start-time')?.value;
            const endTime = document.getElementById('planning-end-time')?.value;
            const matchDuration = parseInt(document.getElementById('planning-match-duration')?.value || "0", 10);
            const breakDuration = parseInt(document.getElementById('planning-break-duration')?.value || "0", 10);
            const fieldsCount = parseInt(document.getElementById('planning-fields-count')?.value || "0", 10);
            const phase = document.getElementById('planning-phase')?.value || 'POULES';
            const overwrite = !!document.getElementById('planning-overwrite')?.checked;
            const restBetweenRoundsMinutes = parseInt(document.getElementById('planning-rest-between-rounds')?.value || "10", 10);

            if (!dateDebut) {
                this.setGlobalMessage("❌ Veuillez renseigner la date de début", true);
                return;
            }

            if (!startTime || !endTime) {
                this.setGlobalMessage("❌ Veuillez renseigner l'heure de début et de fin", true);
                return;
            }

            try {
                this.setGlobalMessage(`🔄 Génération du planning sur ${selectedDays} jour(s)...`, false);

                await this.safePost(
                    `/api/tournament/admin/${eventId}/generate-planning`,
                    token,
                    {
                        dateDebut,
                        nombreJours: selectedDays,
                        startTime,
                        endTime,
                        matchDurationMinutes: matchDuration,
                        breakDurationMinutes: breakDuration,
                        numberOfFields: fieldsCount,
                        phase,
                        overwrite,
                        restBetweenRoundsMinutes
                    }
                );

                this.setGlobalMessage("✅ Planning généré avec succès !", false);
                await this.loadPlanningMatches(eventId, token);

            } catch (err) {
                const errorMsg = this.extractErrorMessage(err);
                this.setGlobalMessage(`❌ ${errorMsg}`, true);

                if (err?.status === 409) {
                    const box = document.getElementById('planning-suggestions');
                    const msg = document.getElementById('planning-suggestions-msg');
                    if (box && msg) {
                        msg.textContent = errorMsg;
                        box.style.display = 'block';
                    }
                }
            }
        });
    }

    // ========================
    // 🎛️ HANDLERS AVANCÉS
    // ========================
    const advToggle = document.getElementById('planning-advanced-toggle');
    const advBox = document.getElementById('planning-advanced');
    if (advToggle && advBox) {
        advToggle.addEventListener('change', () => {
            advBox.style.display = advToggle.checked ? 'block' : 'none';
        });
    }

    const addMinutesToTime = (t, add) => {
        const [h, m] = (t || "18:00").split(':').map(n => parseInt(n, 10));
        const total = h * 60 + m + add;
        const hh = String(Math.floor(total / 60)).padStart(2,'0');
        const mm = String(total % 60).padStart(2,'0');
        return `${hh}:${mm}`;
    };

   const getEndTimeInput = () => {
  if (selectedDays === 1) {
    return document.getElementById('planning-afternoon-end-1day');
  }
  return document.getElementById('planning-end-time');
};


    document.getElementById('btn-suggest-more-time')?.addEventListener('click', () => {
        const end = getEndTimeInput();
        if (end) end.value = addMinutesToTime(end.value, 30);

        const box = document.getElementById('planning-suggestions');
        if (box) box.style.display = 'none';

        updatePreview();
    });

   document.getElementById('btn-suggest-more-fields')?.addEventListener('click', () => {
  const f = (selectedDays === 1)
    ? document.getElementById('planning-fields-count-1day')
    : document.getElementById('planning-fields-count');

  if (f) f.value = String(parseInt(f.value || "2", 10) + 1);

  const box = document.getElementById('planning-suggestions');
  if (box) box.style.display = 'none';

  updatePreview();
});


    document.getElementById('btn-suggest-rest-zero')?.addEventListener('click', () => {
        const r = document.getElementById('planning-rest-between-rounds');
        if (r) r.value = "0";

        const advToggle = document.getElementById('planning-advanced-toggle');
        const advBox = document.getElementById('planning-advanced');
        if (advToggle) advToggle.checked = true;
        if (advBox) advBox.style.display = 'block';

        const box = document.getElementById('planning-suggestions');
        if (box) box.style.display = 'none';

        updatePreview();
    });

    // 🗑️ BOUTON RESET
    const btnReset = document.getElementById('btn-reset-planning');
    if (btnReset) {
        btnReset.addEventListener('click', async () => {
            if (!confirm('⚠️ RÉINITIALISER TOUT LE PLANNING ?\n\nToutes les dates/heures/terrains seront supprimés.\n\nÊtes-vous sûr ?')) {
                return;
            }
            
            btnReset.disabled = true;
            btnReset.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Réinitialisation...';
            
            try {
                const response = await fetch(`/api/tournament/admin/${eventId}/matches/reset`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (!response.ok) throw new Error('Erreur');
                
                this.setGlobalMessage('✅ Planning réinitialisé (matchs non joués)', false);
                await this.loadPlanningMatches(eventId, token);
                
            } catch (err) {
                this.setGlobalMessage('❌ Erreur lors de la réinitialisation', true);
            } finally {
                btnReset.disabled = false;
                btnReset.innerHTML = '🗑️ Réinitialiser';
            }
        });
    }
},

            // ================================
// 🆕 VÉRIFIER BRACKET ET ACTIVER/DÉSACTIVER BOUTON FINALES
// ================================
async checkBracketAndUpdateFinalesButton(eventId, token) {
    const btnFinales = document.getElementById('btn-planning-finales');
    const finalesWarning = document.getElementById('finales-warning');
    
    if (!btnFinales) return;

    try {
        const matches = await this.safeGet(`/api/events/${eventId}/bracket`, token);
        const hasBracket = matches && matches.length > 0;

        if (hasBracket) {
            btnFinales.disabled = false;
            btnFinales.style.opacity = "1";
            btnFinales.style.cursor = "pointer";
            if (finalesWarning) finalesWarning.style.display = "none";
        } else {
            btnFinales.disabled = true;
            btnFinales.style.opacity = "0.6";
            btnFinales.style.cursor = "not-allowed";
            if (finalesWarning) finalesWarning.style.display = "block";
        }
    } catch (err) {
        console.warn("Erreur vérification bracket:", err);
        btnFinales.disabled = true;
        btnFinales.style.opacity = "0.6";
        if (finalesWarning) finalesWarning.style.display = "block";
    }
},


// ================================
// 🌤️ PLANIFIER LES POULES (MODE 1 JOUR)
// ================================
async handlePlanningPoules(eventId, token) {
    // 🔥 VÉRIFIER L'ÉTAT DES MATCHS DE POULES
    try {
        const matches = await this.safeGet(`/api/events/${eventId}/matches`, token);
        const poulesMatches = matches.filter(m => m.group !== null);
        
        // Cas 1 : Matchs déjà joués ou en cours
        const poulesPlayed = poulesMatches.some(m => 
            m.status === 'COMPLETED' || m.status === 'IN_PROGRESS'
        );
        
        if (poulesPlayed) {
            this.setGlobalMessage(
                "❌ Impossible de replanifier : des matchs de poules ont déjà été joués ou sont en cours",
                true
            );
            return;
        }
        
        // Cas 2 : Matchs déjà planifiés mais pas joués
        const poulesScheduled = poulesMatches.some(m => 
            m.status === 'SCHEDULED' && m.date !== null
        );
        
        if (poulesScheduled) {
            if (!confirm(
                '⚠️ ATTENTION : Les poules sont déjà planifiées !\n\n' +
                'Voulez-vous REPLANIFIER les matchs ?\n\n' +
                '⚠️ Les horaires actuels seront écrasés.\n\n' +
                'Continuer ?'
            )) {
                return;
            }
        }
        
    } catch (err) {
        console.warn("Erreur vérification matchs poules:", err);
    }
    
    // 🔄 PLANIFICATION NORMALE
 const dateDebut = document.getElementById('planning-date-1day')?.value;
const morningStart = document.getElementById('planning-morning-start-1day')?.value;
const morningEnd = document.getElementById('planning-morning-end-1day')?.value;
const matchDuration = parseInt(document.getElementById('planning-match-duration-1day')?.value || "0", 10);
const breakDuration = parseInt(document.getElementById('planning-break-duration-1day')?.value || "0", 10);
const fieldsCount = parseInt(document.getElementById('planning-fields-count-1day')?.value || "0", 10);

    const restBetweenRoundsMinutes = parseInt(document.getElementById('planning-rest-between-rounds')?.value || "10", 10);

    if (!dateDebut || !morningStart || !morningEnd) {
        this.setGlobalMessage("❌ Renseignez la date et les horaires du matin", true);
        return;
    }

    if (!matchDuration || !fieldsCount) {
        this.setGlobalMessage("❌ Configurez la durée des matchs et le nombre de terrains", true);
        return;
    }

    try {
        this.setGlobalMessage("🔄 Génération du planning des POULES (matin)...", false);

        await this.safePost(
            `/api/tournament/admin/${eventId}/generate-planning`,
            token,
            {
                dateDebut,
                nombreJours: 1,
                startTime: morningStart,
                endTime: morningEnd,
                matchDurationMinutes: matchDuration,
                breakDurationMinutes: breakDuration,
                numberOfFields: fieldsCount,
                phase: "POULES",
                overwrite: false,
                restBetweenRoundsMinutes
            }
        );

        this.setGlobalMessage("✅ Planning des POULES généré avec succès !", false);
        await this.loadPlanningMatches(eventId, token);
        
        // 🔥 METTRE À JOUR L'ÉTAT DES BOUTONS
        await this.updatePlanningButtonsState(eventId, token);

    } catch (err) {
        const errorMsg = this.extractErrorMessage(err);
        this.setGlobalMessage(`❌ ${errorMsg}`, true);

        if (err?.status === 409) {
            const box = document.getElementById('planning-suggestions');
            const msg = document.getElementById('planning-suggestions-msg');
            if (box && msg) {
                msg.textContent = errorMsg;
                box.style.display = 'block';
            }
        }
    }
},



// ================================
// 🎨 METTRE À JOUR L'ÉTAT VISUEL DES BOUTONS
// ================================
async updatePlanningButtonsState(eventId, token) {
    console.log("🔥 updatePlanningButtonsState APPELÉE !", eventId, token ? "token OK" : "token NULL");
    
    try {

                 // ✅ HARD LOCK: si event COMPLETED => on bloque et on sort
    const evResp = await this.safeGet(`/api/events/public/${eventId}`, token);
    const ev = evResp?.data ?? evResp;
    const status = this.normStatus(ev?.status);

    if (status === "COMPLETED") {
      const btnPoules  = document.getElementById('btn-planning-poules');
      const btnFinales = document.getElementById('btn-planning-finales');
      const btnReset   = document.getElementById('btn-reset-planning');

      [btnPoules, btnFinales, btnReset].forEach(b => {
        if (!b) return;
        b.disabled = true;
        b.title = "🏁 Tournoi terminé (planning verrouillé)";
        b.style.opacity = "0.6";
        b.style.cursor = "not-allowed";
        b.style.background = "#95a5a6";
      });

      console.log("🔒 Planning verrouillé: event COMPLETED -> stop updatePlanningButtonsState");
      return; // ✅ IMPORTANT
    }
       console.log("🔥 Avant safeGet matches");
const matchesResp = await this.safeGet(`/api/events/${eventId}/matches`, token);

const matches = Array.isArray(matchesResp?.data)
  ? matchesResp.data
  : (Array.isArray(matchesResp) ? matchesResp : []);

console.log("🔥 Après safeGet matches, isArray:", Array.isArray(matches), "count:", matches.length);

        
        console.log("🔥 Recherche des boutons...");
        const btnPoules = document.getElementById('btn-planning-poules');
        const btnFinales = document.getElementById('btn-planning-finales');
        console.log("🔥 Boutons trouvés:", btnPoules ? "POULES OK" : "POULES NULL", btnFinales ? "FINALES OK" : "FINALES NULL");
        
       // 🔵 BOUTON POULES
if (btnPoules) {
    console.log("🔥 Traitement bouton POULES...");
    const poulesMatches = matches.filter(m => m.group !== null);
    console.log("🔥 Poules matches:", poulesMatches.length);
    
    console.log("🔥 Calcul poulesPlayed...");
    const poulesPlayed = poulesMatches.some(m => 
        m.status === 'COMPLETED' || m.status === 'IN_PROGRESS'
    );
    console.log("🔥 poulesPlayed:", poulesPlayed);
    
    console.log("🔥 Calcul poulesScheduled...");
    const poulesScheduled = poulesMatches.some(m => 
        m.status === 'SCHEDULED' && m.date !== null
    );
    console.log("🔥 poulesScheduled:", poulesScheduled);
    
    console.log("🔥 Début modification bouton...");
    
    if (poulesPlayed) {
        console.log("🔥 Cas 1: Poules jouées");
        btnPoules.disabled = true;
        btnPoules.style.opacity = '0.6';
        btnPoules.style.cursor = 'not-allowed';
        btnPoules.style.background = '#95a5a6';
        btnPoules.innerHTML = '🔒 Poules jouées (verrouillé)';
        btnPoules.title = 'Impossible : des matchs ont été joués';
        console.log("🔥 Cas 1 terminé");
    } else if (poulesScheduled) {
        console.log("🔥 Cas 2: Poules à replanifier");
        btnPoules.disabled = false;
        btnPoules.style.opacity = '1';
        btnPoules.style.cursor = 'pointer';
        btnPoules.style.background = '#f39c12';
        btnPoules.innerHTML = '🔄 Replanifier les POULES';
        btnPoules.title = 'Cliquez pour replanifier les horaires';
        console.log("🔥 Cas 2 terminé");
    } else {
        console.log("🔥 Cas 3: Poules pas encore planifiées");
        btnPoules.disabled = false;
        btnPoules.style.opacity = '1';
        btnPoules.style.cursor = 'pointer';
        btnPoules.style.background = '#3498db';
        btnPoules.innerHTML = '🌤️ Planifier les POULES';
        btnPoules.title = '';
        console.log("🔥 Cas 3 terminé");
    }
    
    console.log("🔥 Bouton POULES terminé !");
}

console.log("🔥 ENTRE les deux blocs if"); 
        
        // 🔴 BOUTON FINALES (avec vérification bracket intégrée)
        if (btnFinales) {
    console.log("🔥 DÉBUT traitement FINALES");
    let bracketExists = false;
    
    try {
      const bracketResp = await this.safeGet(`/api/events/${eventId}/bracket`, token);
const bracketArr = Array.isArray(bracketResp?.data)
  ? bracketResp.data
  : (Array.isArray(bracketResp) ? bracketResp : []);
bracketExists = bracketArr.length > 0;
console.log("🔥 bracketExists:", bracketExists, "bracketLen:", bracketArr.length);


    } catch (err) {
        console.log("🔥 Pas de bracket trouvé:", err);
        bracketExists = false;
    }
            
            if (!bracketExists) {
                // Pas de bracket → Désactiver
                btnFinales.disabled = true;
                btnFinales.style.opacity = '0.6';
                btnFinales.style.cursor = 'not-allowed';
                btnFinales.style.background = '#95a5a6';
                btnFinales.innerHTML = '⚠️ Générez le bracket d\'abord';
                btnFinales.title = 'Générez le bracket dans l\'onglet "Phase finale"';
            } else {
                // Bracket existe → Vérifier état des matchs
               const finalesMatches = matches.filter(m => 
    m.group === null && m.round !== null
);
                
             console.log("🔥 finalesMatches:", finalesMatches.length);
                
                const finalesPlayed = finalesMatches.some(m => 
                    m.status === 'COMPLETED' || m.status === 'IN_PROGRESS'
                );
                
                const finalesScheduled = finalesMatches.some(m => 
                    m.status === 'SCHEDULED' && m.date !== null
                );
                
                if (finalesPlayed) {
                    btnFinales.disabled = true;
                    btnFinales.style.opacity = '0.6';
                    btnFinales.style.cursor = 'not-allowed';
                    btnFinales.style.background = '#95a5a6';
                    btnFinales.innerHTML = '🔒 Finales jouées (verrouillé)';
                    btnFinales.title = 'Impossible : des matchs ont été joués';
                } else if (finalesScheduled) {
                    btnFinales.disabled = false;
                    btnFinales.style.opacity = '1';
                    btnFinales.style.cursor = 'pointer';
                    btnFinales.style.background = '#f39c12';
                    btnFinales.innerHTML = '🔄 Replanifier les FINALES';
                    btnFinales.title = 'Cliquez pour replanifier les horaires';
                } else {
                    // Bracket existe mais pas encore planifié
                    btnFinales.disabled = false;
                    btnFinales.style.opacity = '1';
                    btnFinales.style.cursor = 'pointer';
                    btnFinales.style.background = '#e67e22';
                    btnFinales.innerHTML = '🌇 Planifier les FINALES';
                    btnFinales.title = '';
                }
            }
        }
        
    } catch (err) {
        console.warn("Erreur updatePlanningButtonsState:", err);
    }
},

// ================================
// 🌇 PLANIFIER LES FINALES (MODE 1 JOUR)
// ================================
async handlePlanningFinales(eventId, token) {
    // 🔥 VÉRIFIER L'ÉTAT DES MATCHS DE FINALES
    try {
        const matches = await this.safeGet(`/api/events/${eventId}/matches`, token);
      const finalesMatches = matches.filter(m => 
    m.group === null && m.round !== null
);
        
        // Cas 1 : Matchs déjà joués ou en cours
        const finalesPlayed = finalesMatches.some(m => 
            m.status === 'COMPLETED' || m.status === 'IN_PROGRESS'
        );
        
        if (finalesPlayed) {
            this.setGlobalMessage(
                "❌ Impossible de replanifier : des matchs de finales ont déjà été joués ou sont en cours",
                true
            );
            return;
        }
        
        // Cas 2 : Matchs déjà planifiés mais pas joués
        const finalesScheduled = finalesMatches.some(m => 
            m.status === 'SCHEDULED' && m.date !== null
        );
        
        if (finalesScheduled) {
            if (!confirm(
                '⚠️ ATTENTION : Les finales sont déjà planifiées !\n\n' +
                'Voulez-vous REPLANIFIER les matchs ?\n\n' +
                '⚠️ Les horaires actuels seront écrasés.\n\n' +
                'Continuer ?'
            )) {
                return;
            }
        }
        
   } catch (err) {
  console.warn("Erreur vérification matchs finales:", err);
  this.setGlobalMessage("❌ Impossible de vérifier l'état des matchs finales", true);
  return;
}


    // ✅ Garde-fou : bracket obligatoire
try {
 const bracketResp = await this.safeGet(`/api/events/${eventId}/bracket`, token);

const bracket = Array.isArray(bracketResp?.data)
  ? bracketResp.data
  : (Array.isArray(bracketResp) ? bracketResp : []);

bracketExists = bracket.length > 0;

  if (!bracketExists) {
    this.setGlobalMessage("⚠️ Générez le bracket avant de planifier les finales", true);
    return;
  }
} catch (e) {
  this.setGlobalMessage("⚠️ Générez le bracket avant de planifier les finales", true);
  return;
}

    
    // 🔄 PLANIFICATION NORMALE
 const dateDebut = document.getElementById('planning-date-1day')?.value;
const afternoonStart = document.getElementById('planning-afternoon-start-1day')?.value;
const afternoonEnd = document.getElementById('planning-afternoon-end-1day')?.value;
  const matchDuration = parseInt(document.getElementById('planning-match-duration-1day')?.value || "0", 10);
const breakDuration = parseInt(document.getElementById('planning-break-duration-1day')?.value || "0", 10);
const fieldsCount = parseInt(document.getElementById('planning-fields-count-1day')?.value || "0", 10);

    const restBetweenRoundsMinutes = parseInt(document.getElementById('planning-rest-between-rounds')?.value || "10", 10);

    if (!dateDebut || !afternoonStart || !afternoonEnd) {
        this.setGlobalMessage("❌ Renseignez la date et les horaires de l'après-midi", true);
        return;
    }

    if (!matchDuration || !fieldsCount) {
        this.setGlobalMessage("❌ Configurez la durée des matchs et le nombre de terrains", true);
        return;
    }

    try {
        this.setGlobalMessage("🔄 Génération du planning des FINALES (après-midi)...", false);

        await this.safePost(
            `/api/tournament/admin/${eventId}/generate-planning`,
            token,
            {
                dateDebut,
                nombreJours: 1,
                startTime: afternoonStart,
                endTime: afternoonEnd,
                matchDurationMinutes: matchDuration,
                breakDurationMinutes: breakDuration,
                numberOfFields: fieldsCount,
                phase: "FINALES",
                overwrite: false,
                restBetweenRoundsMinutes
            }
        );

        this.setGlobalMessage("✅ Planning des FINALES généré avec succès !", false);
        await this.loadPlanningMatches(eventId, token);
        
        // 🔥 METTRE À JOUR L'ÉTAT DES BOUTONS
        await this.updatePlanningButtonsState(eventId, token);

    } catch (err) {
        const errorMsg = this.extractErrorMessage(err);
        this.setGlobalMessage(`❌ ${errorMsg}`, true);

        if (err?.status === 409) {
            const box = document.getElementById('planning-suggestions');
            const msg = document.getElementById('planning-suggestions-msg');
            if (box && msg) {
                msg.textContent = errorMsg;
                box.style.display = 'block';
            }
        }
    }
},

async loadPlanningMatches(eventId, token) {
    const container = document.getElementById('planning-matches-container');
    if (!container) return;
    
    try {
        const matches = await this.safeGet(`/api/events/${eventId}/matches`, token);
        
        if (!matches || matches.length === 0) {
            container.innerHTML = `
                <p style="text-align: center; color: #7f8c8d; padding: 40px;">
                    Aucun match trouvé. Générez d'abord les matchs du tournoi.
                </p>
            `;
            return;
        }
        
        // Grouper par date
        const matchesByDate = {};
        matches.forEach(match => {
            if (!match.date) return;
            if (!matchesByDate[match.date]) {
                matchesByDate[match.date] = [];
            }
            matchesByDate[match.date].push(match);
        });
        
        // Trier les matchs par heure dans chaque groupe
        Object.keys(matchesByDate).forEach(date => {
            matchesByDate[date].sort((a, b) => {
                const timeA = a.time || '00:00';
                const timeB = b.time || '00:00';
                return timeA.localeCompare(timeB);
            });
        });
        
        // Afficher avec des CARDS
        let html = '';
        Object.keys(matchesByDate).sort().forEach(date => {
            const dateMatches = matchesByDate[date];
            const formattedDate = new Date(date + 'T00:00:00').toLocaleDateString('fr-FR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });
            
            html += `
                <div style="margin-bottom: 35px;">
                    <h3 style="
                        color: #2c3e50; 
                        margin: 0 0 20px 0; 
                        padding: 12px 15px; 
                        background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
                        color: white;
                        border-radius: 10px;
                        font-size: 1em;
                        font-weight: 700;
                        text-align: center;
                        box-shadow: 0 2px 8px rgba(52, 152, 219, 0.3);
                    ">
                        📅 ${this.escapeHtml(formattedDate)}
                    </h3>
                    
                    <div style="display: flex; flex-direction: column; gap: 12px;">
                        ${dateMatches.map(match => {
                            const teamA = this.escapeHtml(match.teamA || "?");
                            const teamB = this.escapeHtml(match.teamB || "?");
                            const time = match.time ? match.time.substring(0, 5) : "-";
                            const field = match.field || "-";
                            const status = match.status || "SCHEDULED";
                            
                            const statusColors = {
                                'SCHEDULED': { bg: '#e3f2fd', color: '#1976d2', icon: '📅' },
                                'IN_PROGRESS': { bg: '#fff3cd', color: '#856404', icon: '🔴' },
                                'COMPLETED': { bg: '#d4edda', color: '#155724', icon: '✅' },
                                'CANCELLED': { bg: '#f8d7da', color: '#721c24', icon: '❌' }
                            };
                            
                            const statusStyle = statusColors[status] || statusColors['SCHEDULED'];
                            
                            return `
                                <div style="
                                    background: white;
                                    border-radius: 12px;
                                    padding: 16px;
                                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                                    border-left: 4px solid #3498db;
                                    transition: transform 0.2s, box-shadow 0.2s;
                                ">
                                    <!-- EN-TÊTE : HEURE + TERRAIN -->
                                    <div style="
                                        display: flex;
                                        justify-content: space-between;
                                        align-items: center;
                                        margin-bottom: 12px;
                                        padding-bottom: 12px;
                                        border-bottom: 1px solid #ecf0f1;
                                    ">
                                        <div style="
                                            display: flex;
                                            align-items: center;
                                            gap: 8px;
                                            font-size: 1.1em;
                                            font-weight: 700;
                                            color: #2c3e50;
                                        ">
                                            <i class="fas fa-clock" style="color: #3498db;"></i>
                                            ${time}
                                        </div>
                                        
                                        <div style="
                                            display: flex;
                                            align-items: center;
                                            gap: 6px;
                                            padding: 6px 12px;
                                            background: #f8f9fa;
                                            border-radius: 20px;
                                            font-size: 0.85em;
                                            font-weight: 600;
                                            color: #495057;
                                        ">
                                            <i class="fas fa-map-marker-alt" style="color: #e67e22;"></i>
                                            ${field}
                                        </div>
                                    </div>
                                    
                                    <!-- MATCH -->
                                    <div style="
                                        display: flex;
                                        flex-direction: column;
                                        gap: 8px;
                                        margin-bottom: 12px;
                                    ">
                                        <div style="
                                            font-size: 0.95em;
                                            color: #2c3e50;
                                            font-weight: 600;
                                            line-height: 1.4;
                                        ">
                                            ${teamA}
                                        </div>
                                        
                                        <div style="
                                            text-align: center;
                                            font-weight: 700;
                                            color: #95a5a6;
                                            font-size: 0.9em;
                                        ">
                                            VS
                                        </div>
                                        
                                        <div style="
                                            font-size: 0.95em;
                                            color: #2c3e50;
                                            font-weight: 600;
                                            line-height: 1.4;
                                        ">
                                            ${teamB}
                                        </div>
                                    </div>
                                    
                                    <!-- FOOTER : STATUT + ACTIONS -->
                                    <div style="
                                        display: flex;
                                        justify-content: space-between;
                                        align-items: center;
                                        gap: 10px;
                                        flex-wrap: wrap;
                                    ">
                                        <span style="
                                            padding: 6px 12px;
                                            border-radius: 6px;
                                            font-size: 0.8em;
                                            font-weight: 600;
                                            background: ${statusStyle.bg};
                                            color: ${statusStyle.color};
                                            display: inline-flex;
                                            align-items: center;
                                            gap: 6px;
                                        ">
                                            ${statusStyle.icon} ${status}
                                        </span>
                                        
                                       <button 
    class="admin-btn btn-edit-match-schedule" 
    data-match-id="${match.id}"
    data-match-team-a="${this.escapeHtml(teamA)}"
    data-match-team-b="${this.escapeHtml(teamB)}"
    data-match-date="${match.date || ''}"
    data-match-time="${match.time || ''}"
    data-match-field="${this.escapeHtml(field)}"
    style="
        padding: 8px 16px; 
        font-size: 0.85em;
        background: #95a5a6;
        border: none;
        border-radius: 6px;
        color: white;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
    ">
    ✏️ Modifier
</button>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        });
        
        
        container.innerHTML = html;
        
    } catch (err) {
        console.error("Erreur loadPlanningMatches:", err);
        container.innerHTML = `
            <p style="color: #e74c3c; text-align: center; padding: 20px;">
                ❌ Erreur de chargement du planning
            </p>
        `;
    }
},

// ================================
// ✏️ ÉDITION MANUELLE D'UN HORAIRE
// ================================
initEditMatchSchedule(eventId, token) {
    const modal = document.getElementById('edit-match-schedule-modal');
    const matchInfo = document.getElementById('edit-match-info');
    const dateInput = document.getElementById('edit-match-date');
    const timeInput = document.getElementById('edit-match-time');
    const fieldInput = document.getElementById('edit-match-field');
    const cancelBtn = document.getElementById('cancel-edit-match');
    const saveBtn = document.getElementById('save-edit-match');
    
    let currentMatchId = null;
    
    // Fermer la modal
    const closeModal = () => {
        modal.style.display = 'none';
        currentMatchId = null;
    };
    
    cancelBtn.addEventListener('click', closeModal);
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
    
    // Ouvrir la modal pour éditer un match
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn-edit-match-schedule');
        if (!btn) return;
        
        currentMatchId = btn.dataset.matchId;
        const teamA = btn.dataset.matchTeamA;
        const teamB = btn.dataset.matchTeamB;
        const date = btn.dataset.matchDate;
        const time = btn.dataset.matchTime;
        const field = btn.dataset.matchField;
        
        // Afficher les infos du match
        matchInfo.innerHTML = `
            <strong>Match :</strong><br>
            ${teamA}<br>
            <span style="text-align: center; display: block; color: #95a5a6; font-weight: 700;">VS</span>
            ${teamB}
        `;
        
        // Pré-remplir les champs
        dateInput.value = date || '';
        timeInput.value = time ? time.substring(0, 5) : '';
        fieldInput.value = field || '';
        
        modal.style.display = 'block';
    });
    
    // Sauvegarder les modifications
    saveBtn.addEventListener('click', async () => {
        if (!currentMatchId) return;
        
        const newDate = dateInput.value;
        const newTime = timeInput.value;
        const newField = fieldInput.value;
        
        if (!newDate || !newTime) {
            alert('❌ La date et l\'heure sont obligatoires');
            return;
        }
        
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enregistrement...';
        
        try {
            const response = await this.safePost(
                `/api/tournament/admin/matches/${currentMatchId}/schedule`,
                token,
                {
                    date: newDate,
                    time: newTime + ':00',
                    field: newField || null
                },
                'PUT'
            );
            
            this.setGlobalMessage('✅ Horaire modifié avec succès !', false);
            closeModal();
            await this.loadPlanningMatches(eventId, token);
            
        } catch (err) {
            const errorMsg = this.extractErrorMessage(err);
            this.setGlobalMessage(`❌ ${errorMsg}`, true);
        } finally {
            saveBtn.disabled = false;
            saveBtn.innerHTML = '✅ Enregistrer';
        }
    });
},

    // ================================
    // 🔄 RAFRAÎCHIR TOUTES LES DONNÉES
    // ================================
  async refreshAllData(eventId, token) {
  // 1) Charger l'event en priorité (pour la phase et les boutons)
  const event = await this.loadEventDetails(eventId, token);

  // 2) Ensuite charger le reste en parallèle
  await Promise.allSettled([
    this.loadRegistrations(eventId, token),
    this.loadMyTeams(eventId, token),
    this.loadGroups(eventId, token),
    this.loadBracket(eventId, token),
    this.loadConsolante(eventId, token),
    this.loadMatches(eventId, token),
    this.loadSummary(eventId, token)
  ]);

  return event;
},
    // ================================
    // 🔒 INSCRIRE UNE ÉQUIPE
    // ================================
  async registerTeam(eventId, teamId, token) {
    try {
        console.log("🔥 REGISTER TEAM APPELÉ :", {
            eventId,
            teamId,
            token: token ? "✅ Présent" : "❌ Manquant",
            tokenLength: token?.length
        });

        await this.safePost(
            `/api/events/registration/${eventId}/register-team`,
            token,
            { teamId }
        );

        this.setGlobalMessage("✅ Équipe inscrite avec succès", false);

        await this.loadRegistrations(eventId, token);
        await this.loadEventDetails(eventId, token);
        await this.loadMyTeams(eventId, token);

    } catch (err) {
        console.error("🔴 REGISTER TEAM ERROR:", err);
        console.error("🔴 STATUS:", err.status);
        console.error("🔴 PAYLOAD:", err.payload);
        const errorMsg = this.extractErrorMessage(err);
        this.setGlobalMessage(`❌ ${errorMsg}`, true);
    }
},

    // ================================
    // 🧩 UTILS GÉNÉRIQUES
    // ================================
    extractEventIdFromPath() {
        const path = window.location.pathname;
        const match = path.match(/^\/admin\/events\/([^/]+)$/) || path.match(/^\/tournament\/([^/]+)\/dashboard/);
        return match ? match[1] : null;
    },

    extractErrorMessage(error) {
        if (typeof error === 'string') return error;
        if (error?.message) return error.message;
        if (error?.error) return error.error;
        return "Une erreur est survenue";
    },

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    getRoundLabel(round) {
        return ROUND_LABELS[round] || this.escapeHtml(round || "Match KO");
    },

   isBye(match) {
  // ✅ BYE uniquement si le backend le dit
  if (match?.status === "BYE") return true;

  // ✅ compat : BYE = une seule équipe connue (pas deux inconnues)
  const a = match?.teamA ?? null;
  const b = match?.teamB ?? null;

  // si les deux sont null/?, c'est un placeholder, pas un BYE
  const aKnown = a && a !== "?";
  const bKnown = b && b !== "?";

  return (aKnown && !bKnown) || (!aKnown && bKnown);
},

    setGlobalMessage(msg, isError = false) {
        const el = document.getElementById("event-global-message");
        if (!el) return;
        el.textContent = msg || "";
        el.style.color = isError ? "#e74c3c" : "#27ae60";
        el.style.padding = msg ? "12px" : "0";
        el.style.borderRadius = "8px";
        el.style.backgroundColor = isError ? "#fadbd8" : "#d5f4e6";
        el.style.fontWeight = "500";
        el.style.marginBottom = msg ? "20px" : "0";
        el.style.border = msg ? (isError ? "2px solid #e74c3c" : "2px solid #27ae60") : "none";
    },

    showLoading(containerId) {
        const el = document.getElementById(containerId);
        if (el) {
            el.innerHTML = `<div class="loader">⏳ Chargement...</div>`;
            el.classList.add("admin-loading");
        }
    },

    hideLoading(containerId) {
        const el = document.getElementById(containerId);
        if (el) {
            el.classList.remove("admin-loading");
        }
    },

    async safeGet(url, token) {
        const res = await fetch(url, {
            headers: { "Authorization": `Bearer ${token}` }
        });

       if (!res.ok) {
  const json = await res.json().catch(() => ({}));
  const errorMsg = json?.message || json?.error || `Erreur HTTP ${res.status}`;
  const err = new Error(errorMsg);
  err.status = res.status;
  err.payload = json;
  throw err;
}


        const json = await res.json();
        return Array.isArray(json) ? json : (json.data || json);
    },

 async safePost(url, token, body = null, method = "POST") {
  const options = {
    method,
    headers: {
      "Authorization": `Bearer ${token}`
    }
  };

  // ✅ accepte {} / 0 / false
  if (body !== null && body !== undefined) {
    options.headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(body);
  }

  const res = await fetch(url, options);

 if (!res.ok) {
  const json = await res.json().catch(() => ({}));
  const errorMsg = json?.message || json?.error || `Erreur HTTP ${res.status}`;

  const err = new Error(errorMsg);
  err.status = res.status;
  err.payload = json;
  throw err;
}


  // ✅ réponses sans contenu
  if (res.status === 204) return null;

  const ct = (res.headers.get("content-type") || "").toLowerCase();
  if (!ct.includes("application/json")) {
    return await res.text().catch(() => null);
  }

  return await res.json().catch(() => null);
},
// ================================
// ❌ ANNULER L'ÉVÉNEMENT
// ================================
async handleCancelEvent(eventId, token) {
  if (!confirm("❌ ANNULER CET ÉVÉNEMENT ?\n\n⚠️ L'événement sera marqué comme ANNULÉ.\n\nLes participants seront notifiés.\n\nCette action est irréversible.")) {
    return;
  }

  try {
    this.setGlobalMessage("🔄 Annulation de l'événement...", false);

    await this.safePost(`/api/events/manage/${eventId}/cancel`, token, null, "PUT");

    this.setGlobalMessage("✅ Événement annulé avec succès", false);

  } catch (err) {
    const errorMsg = this.extractErrorMessage(err);
    this.setGlobalMessage(`❌ ${errorMsg}`, true);

    // ✅ si manque de créneaux (HTTP 409), on affiche les actions rapides
    if (err?.status === 409) {
      const box = document.getElementById('planning-suggestions');
      const msg = document.getElementById('planning-suggestions-msg');
      if (box && msg) {
        msg.textContent = errorMsg;
        box.style.display = 'block';
      }
    }

  } finally {
    // ✅ refresh UI dans tous les cas
    await this.loadEventDetails(eventId, token);
    window.dispatchEvent(new CustomEvent("events:changed"));
  }
},

disableArchiveButtonUI(label = "✅ Déjà archivé", title = "📦 Événement déjà archivé") {
  const b = document.getElementById("btn-delete-event");
  if (!b) return;
  b.disabled = true;
  b.innerHTML = label;
  b.style.opacity = "0.6";
  b.style.cursor = "not-allowed";
  b.title = title;
},


// ================================
// 📦 ARCHIVER (soft delete)
// ================================
async handleDeleteEvent(eventId, token) {

  // ✅ 0) Anti double-clic immédiat
  const btn = document.getElementById("btn-delete-event");
  if (btn?.disabled) return;          // déjà en cours / déjà archivé
  if (btn) btn.disabled = true;       // lock immédiat

  // ✅ 1) Confirm (si annulation -> on remet)
  if (!confirm("📦 Archiver cet événement ?\n\nIl disparaîtra des listes.\nVous pourrez le restaurer depuis 'Archivés'.")) {
    if (btn) btn.disabled = false;
    return;
  }

  try {
    this.setGlobalMessage("🔄 Archivage en cours...", false);

    const res = await fetch(`/api/events/admin/${eventId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });

    const ct = (res.headers.get("content-type") || "").toLowerCase();
    const txt = await res.text().catch(() => "");
    let json = {};
    if (ct.includes("application/json")) {
      try { json = JSON.parse(txt || "{}"); } catch (e) { json = {}; }
    }

    const msgLower = String(json.message || txt || "").toLowerCase();
    const alreadyDeleted = msgLower.includes("already deleted");

    if ((res.ok && json.success) || alreadyDeleted) {

      this.setGlobalMessage(
        alreadyDeleted ? "✅ Événement déjà archivé" : "✅ Événement archivé avec succès",
        false
      );

      // ✅ utilise ta méthode centralisée
      this.disableArchiveButtonUI("✅ Déjà archivé", "📦 Événement déjà archivé");

      // ✅ mémoriser côté client
      const key = "archived_event_ids";
      const arr = JSON.parse(localStorage.getItem(key) || "[]");
      const idNum = Number(eventId);
      if (!arr.includes(idNum)) arr.push(idNum);
      localStorage.setItem(key, JSON.stringify(arr));

      await this.refreshAllData(eventId, token);
      window.dispatchEvent(new CustomEvent("events:changed", { detail: { eventId } }));
      return;
    }

    throw new Error(json.message || `HTTP ${res.status}`);

  } catch (err) {
    console.error(err);
    this.setGlobalMessage(`❌ ${err.message || "Erreur lors de l'archivage"}`, true);

    // ✅ en cas de vraie erreur -> on réactive pour retenter
    const b = document.getElementById("btn-delete-event");
    if (b) b.disabled = false;
  }
},


    // ================================
// 🗑️ SUPPRIMER UN MATCH
// ================================
async handleDeleteMatch(matchId, eventId, token) {
    try {
        this.setGlobalMessage("🔄 Suppression du match...", false);
        
        const response = await fetch(`/api/tournament/admin/matches/${matchId}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` }
        });
        
        if (!response.ok) {
            const json = await response.json().catch(() => ({}));
            throw new Error(json.message || json.error || `Erreur HTTP ${response.status}`);
        }
        
        this.setGlobalMessage("✅ Match supprimé avec succès", false);
        await this.refreshAllData(eventId, token);
        
    } catch (err) {
        const errorMsg = this.extractErrorMessage(err);
        this.setGlobalMessage(`❌ ${errorMsg}`, true);
    }
},


// ================================
// 🗑️ SUPPRIMER TOUS LES MATCHS D'UN ROUND
// ================================
async handleDeleteRound(eventId, token) {
const res = await this.safeGet(`/api/events/${eventId}/matches`, token);
const matches = res?.data ?? res ?? [];


  const koLocked = (matches || []).some(m =>
    m.group === null && m.round !== null &&
    (m.status === "IN_PROGRESS" || m.status === "COMPLETED")
  );

  if (koLocked) {
    alert("Impossible : un match de phase finale a déjà commencé/terminé.");
    return;
  }

   const rounds = [
    'FINALE', 'DEMI-FINALE', 'QUART DE FINALE',
    'SF', 'QF', 'R16', 'R32',
    'CFINALE', 'CDEMI-FINALE', 'CQUART DE FINALE'  // ← NOMS CORRECTS
];
    
    let roundOptions = rounds.map(r => `- ${r}`).join('\n');
    
    const round = prompt(`Quel round voulez-vous supprimer ?\n\n${roundOptions}\n\nEntrez le nom exact :`);
    
    if (!round) return;
    
    if (!rounds.includes(round.toUpperCase())) {
        alert('❌ Round invalide. Choisissez parmi la liste.');
        return;
    }
    
    if (!confirm(`⚠️ SUPPRIMER TOUS LES MATCHS DU ROUND "${round}" ?\n\nCette action archivera tous les matchs de ce round.\n\nContinuer ?`)) {
        return;
    }
    
    try {
        this.setGlobalMessage(`🔄 Suppression des matchs du round ${round}...`, false);
        
        const response = await fetch(`/api/tournament/admin/${eventId}/matches/round/${round}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` }
        });
        
        if (!response.ok) {
            const json = await response.json().catch(() => ({}));
            throw new Error(json.message || json.error || `Erreur HTTP ${response.status}`);
        }
        
        const result = await response.json();
        const count = result.data || 0;
        
        this.setGlobalMessage(`✅ ${count} match(s) du round ${round} supprimé(s) avec succès`, false);
        await this.refreshAllData(eventId, token);
        
    } catch (err) {
        const errorMsg = this.extractErrorMessage(err);
        this.setGlobalMessage(`❌ ${errorMsg}`, true);
    }
},

    // ================================
// 📋 CHECKLIST DE PROGRESSION DU TOURNOI
// ================================
renderTournamentChecklist(event) {
    const steps = this.calculateTournamentSteps(event);
    const progress = this.calculateProgress(steps);
    
    return `
        <div class="tournament-checklist-card" style="
            background: white;
            border-radius: 12px;
            padding: 25px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            margin-bottom: 25px;
        ">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
                <h3 style="margin: 0; color: #2c3e50; font-size: 1.2em;">
                    📋 Progression du tournoi
                </h3>
                <span style="
                    background: ${progress === 100 ? '#27ae60' : '#3498db'};
                    color: white;
                    padding: 6px 12px;
                    border-radius: 20px;
                    font-weight: 700;
                    font-size: 0.9em;
                ">
                    ${progress}%
                </span>
            </div>
            
            <!-- Barre de progression -->
            <div style="
                width: 100%;
                height: 8px;
                background: #ecf0f1;
                border-radius: 4px;
                margin-bottom: 25px;
                overflow: hidden;
            ">
                <div style="
                    width: ${progress}%;
                    height: 100%;
                    background: linear-gradient(90deg, #3498db 0%, #2ecc71 100%);
                    transition: width 0.5s ease;
                "></div>
            </div>
            
            <!-- Liste des étapes -->
            <div class="checklist-steps" style="display: flex; flex-direction: column; gap: 12px;">
                ${steps.map((step, index) => this.renderChecklistStep(step, index + 1)).join('')}
            </div>
            
            ${this.renderNextAction(steps)}
        </div>
    `;
},

// ================================
// 🧮 CALCULER LES ÉTAPES
// ================================
calculateTournamentSteps(event) {
    const status = event.status || 'DRAFT';
    const hasMinTeams = (event.acceptedParticipants || 0) >= 4;
    const hasGroups = event.groupCount !== null && event.groupCount > 0;
    
    // 🔥 CALCULER hasMatches et hasBracket depuis les données chargées
    const hasMatches = this.cachedMatchesCount > 0;
    const hasBracket = this.cachedHasBracket;

    const remainingScores = this.cachedRemainingScores ?? 0;
    const scoresDone = hasMatches && remainingScores === 0;

    
    return [
        {
            id: 'create',
            label: 'Créer l\'événement',
            completed: true,
            current: status === 'DRAFT',
            locked: false,
            help: 'Événement créé avec succès'
        },
        {
            id: 'publish',
            label: 'Publier l\'événement',
            completed: ['PUBLISHED', 'REGISTRATION_CLOSED', 'ONGOING', 'COMPLETED'].includes(status),
            current: status === 'DRAFT',
            locked: false,
            help: 'Rendre l\'événement visible et ouvrir les inscriptions'
        },
        {
            id: 'registrations',
            label: 'Attendre les inscriptions (min 4 équipes)',
            completed: hasMinTeams && ['REGISTRATION_CLOSED', 'ONGOING', 'COMPLETED'].includes(status),
            current: status === 'PUBLISHED' && !hasMinTeams,
            locked: status === 'DRAFT',
            help: `${event.acceptedParticipants || 0} équipes inscrites`
        },
        {
            id: 'close_registrations',
            label: 'Clôturer les inscriptions',
            completed: ['REGISTRATION_CLOSED', 'ONGOING', 'COMPLETED'].includes(status),
            current: status === 'PUBLISHED' && hasMinTeams,
            locked: !hasMinTeams,
            help: 'Fermer les inscriptions avant de générer les poules'
        },
        {
            id: 'generate_groups',
            label: 'Générer les poules',
            completed: hasGroups,
            current: status === 'REGISTRATION_CLOSED' && !hasGroups,
            locked: status !== 'REGISTRATION_CLOSED',
            help: hasGroups ? 'Poules créées' : 'Cliquez sur "Générer les poules"'
        },
        {
            id: 'generate_planning',
            label: 'Générer le planning des matchs',
            completed: hasMatches,
            current: hasGroups && !hasMatches,
            locked: !hasGroups,
            help: hasMatches ? 'Planning créé' : 'Allez dans l\'onglet Planning'
        },
        {
            id: 'start_tournament',
            label: 'DÉMARRER LE TOURNOI',
            completed: ['ONGOING', 'COMPLETED'].includes(status),
            current: hasMatches && status !== 'ONGOING' && status !== 'COMPLETED',
            locked: !hasMatches,
            help: status === 'ONGOING' ? 'Tournoi en cours' : 'Cliquez sur "Démarrer le tournoi"'
        },
       {
  id: 'enter_scores',
  label: 'Saisir les scores des matchs',
  completed: status === 'COMPLETED' || (status === 'ONGOING' && scoresDone),
  current: status === 'ONGOING' && hasMatches && !scoresDone,
  locked: status !== 'ONGOING' || !hasMatches,
  help: scoresDone
    ? 'Tous les matchs sont scorés'
    : `${remainingScores} match(s) à scorer (onglet Matchs)`
},

        {
            id: 'generate_bracket',
            label: 'Générer le bracket (phase finale)',
            completed: hasBracket,
            current: status === 'ONGOING' && !hasBracket,
            locked: status !== 'ONGOING',
            help: hasBracket ? 'Bracket généré' : 'Une fois les poules terminées'
        },
        {
            id: 'finish_tournament',
            label: 'TERMINER LE TOURNOI',
            completed: status === 'COMPLETED',
            current: status === 'ONGOING' && hasBracket && scoresDone,

            locked: status !== 'ONGOING' || !hasBracket || !scoresDone,

            help: status === 'COMPLETED' ? 'Tournoi terminé' : 'Quand tous les matchs sont joués'
        }
    ];
},

// ================================
// 🎨 RENDER UNE ÉTAPE
// ================================
renderChecklistStep(step, number) {
    const icon = step.completed ? '✅' : step.current ? '🔵' : step.locked ? '🔒' : '⚪';
    const color = step.completed ? '#27ae60' : step.current ? '#3498db' : step.locked ? '#95a5a6' : '#bdc3c7';
    
    return `
        <div style="
            display: flex;
            align-items: flex-start;
            gap: 15px;
            padding: 15px;
            background: ${step.current ? '#e3f2fd' : step.completed ? '#e8f5e9' : '#f8f9fa'};
            border-radius: 8px;
            border-left: 4px solid ${color};
            ${step.locked ? 'opacity: 0.6;' : ''}
        ">
            <!-- Numéro + Icône -->
            <div style="
                min-width: 40px;
                height: 40px;
                background: ${color};
                color: white;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 700;
                font-size: 1.2em;
            ">
                ${step.completed ? '✓' : number}
            </div>
            
            <!-- Contenu -->
            <div style="flex: 1;">
                <div style="
                    font-weight: ${step.current ? '700' : '600'};
                    color: ${step.completed ? '#27ae60' : step.current ? '#3498db' : '#2c3e50'};
                    margin-bottom: 5px;
                    font-size: ${step.current ? '1.05em' : '1em'};
                ">
                    ${this.escapeHtml(step.label)}
                </div>
                <div style="
                    font-size: 0.85em;
                    color: #7f8c8d;
                ">
                    ${this.escapeHtml(step.help)}
                </div>
            </div>
            
            <!-- Statut -->
            <div style="
                font-size: 1.5em;
            ">
                ${icon}
            </div>
        </div>
    `;
},

// ================================
// 📊 CALCULER LE POURCENTAGE
// ================================
calculateProgress(steps) {
    const completed = steps.filter(s => s.completed).length;
    const total = steps.length;
    return Math.round((completed / total) * 100);
},

// ================================
// 💡 PROCHAINE ACTION RECOMMANDÉE
// ================================
renderNextAction(steps) {
    const nextStep = steps.find(s => s.current && !s.completed && !s.locked);
    
    if (!nextStep) return '';
    
    const actions = {
        'publish': 'Modifiez l\'événement et changez le statut en PUBLISHED',
        'registrations': 'Partagez le lien de l\'événement pour recevoir des inscriptions',
        'close_registrations': 'Allez dans l\'onglet Inscriptions pour les clôturer',
        'generate_groups': 'Cliquez sur le bouton "Générer les poules" ci-dessous',
        'generate_planning': 'Allez dans l\'onglet Planning pour créer les horaires',
        'start_tournament': 'Cliquez sur "DÉMARRER LE TOURNOI" dans Contrôle du Tournoi',
        'enter_scores': 'Allez dans l\'onglet Matchs pour saisir les scores',
        'generate_bracket': 'Cliquez sur "Générer le bracket" une fois les poules terminées',
        'finish_tournament': 'Cliquez sur "TERMINER LE TOURNOI" dans Contrôle du Tournoi'
    };
    
    return `
        <div style="
            margin-top: 20px;
            padding: 15px;
            background: #fff3cd;
            border-radius: 8px;
            border-left: 4px solid #f39c12;
        ">
            <div style="font-weight: 700; color: #856404; margin-bottom: 8px;">
                💡 Prochaine étape recommandée :
            </div>
            <div style="color: #856404;">
                ${actions[nextStep.id] || nextStep.help}
            </div>
        </div>
    `;
},

    // ================================
    // 🔹 1. INFOS GÉNÉRALES
    // ================================
    async loadEventDetails(eventId, token) {
        const container = document.getElementById("event-details");
      if (!container) return null;


        this.showLoading("event-details");

        try {
            const res = await this.safeGet(`/api/events/public/${eventId}`, token);
            const event = res?.data ?? res;

            const isSingleMatch = event?.format === "SINGLE_MATCH";

     if (!isSingleMatch) {
    this.currentTournamentPhase = event.tournamentPhase;
    // SUPPRIMÉ : this.updateTournamentActionsUI(event);

    if (event.groupCount !== null) {
        this.displayTournamentFormat(event);
    } else {
        this.enableGenerateGroupsButton();
    }
}
  
            const safeName = this.escapeHtml(event.name || "Tournoi");
            const safeDescription = this.escapeHtml(event.description);
            const safeLocation = this.escapeHtml(event.city || event.location || "Lieu NC");
container.innerHTML = `
    <!-- Infos de l'événement -->
    <div style="
        display: block;
        width: 100%;
        background: white;
        padding: 20px;
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        margin-bottom: 20px;
    ">
        <div style="display: flex; gap: 20px; align-items: flex-start; flex-wrap: wrap;">
            ${event.logoUrl || event.imageUrl ? `
                <img src="${this.escapeHtml(event.logoUrl || event.imageUrl)}" 
                     alt="Logo"
                     style="width: 100px; height: 100px; border-radius: 12px; object-fit: cover;">
            ` : `
                <div style="
                    width: 100px; 
                    height: 100px; 
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 3em;
                ">🏆</div>
            `}

            <div style="flex: 1; min-width: 200px;">
                <h2 style="margin: 0 0 15px 0; color: #2c3e50; font-size: 1.5em;">${safeName}</h2>

                <div style="display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 10px;">
                    <span style="
                        display: inline-flex;
                        align-items: center;
                        gap: 6px;
                        padding: 6px 12px;
                        background: #f0f9ff;
                        border-radius: 20px;
                        font-size: 0.9em;
                        color: #2c3e50;
                    ">
                        <i class="fa-solid fa-calendar"></i> ${event.date || "NC"}
                    </span>
                    <span style="
                        display: inline-flex;
                        align-items: center;
                        gap: 6px;
                        padding: 6px 12px;
                        background: #f0f9ff;
                        border-radius: 20px;
                        font-size: 0.9em;
                        color: #2c3e50;
                    ">
                        <i class="fa-solid fa-map-marker-alt"></i> ${safeLocation}
                    </span>
                    <span style="
                        display: inline-flex;
                        align-items: center;
                        gap: 6px;
                        padding: 6px 12px;
                        background: #f0f9ff;
                        border-radius: 20px;
                        font-size: 0.9em;
                        color: #2c3e50;
                    ">
                        <i class="fa-solid fa-users"></i>
                        ${event.acceptedParticipants ?? 0} / ${event.capacity ?? event.maxParticipants ?? "?"} équipes
                    </span>
                    <span style="
                        display: inline-flex;
                        align-items: center;
                        gap: 6px;
                        padding: 6px 12px;
                        background: ${event.status === 'ONGOING' ? '#fee' : event.status === 'COMPLETED' ? '#d4edda' : '#fff3cd'};
                        border-radius: 20px;
                        font-size: 0.9em;
                        font-weight: 700;
                        color: ${event.status === 'ONGOING' ? '#e74c3c' : event.status === 'COMPLETED' ? '#27ae60' : '#f39c12'};
                    ">
                        ${this.escapeHtml(event.status || "NC")}
                    </span>
                </div>

                ${safeDescription ? `
                    <p style="margin: 10px 0 0 0; color: #7f8c8d; line-height: 1.5;">${safeDescription}</p>
                ` : ``}
            </div>
        </div>
    </div>

    <!-- Boutons de contrôle (FORCÉ EN BLOCK) -->
    <div style="display: block; width: 100%; clear: both;">
      ${isSingleMatch ? this.renderMatchControlButtons(event) : this.renderTournamentControlButtons(event)}

    </div>
`;

// ✅ MVP: pas de commentaires dans l'admin dashboard
const cm = document.getElementById("comments-modal");
if (cm) cm.remove();

// 🔥 FORCE L'AFFICHAGE VERTICAL
container.style.display = 'block';
container.style.flexDirection = 'column';

Array.from(container.children).forEach(child => {
    child.style.display = 'block';
    child.style.width = '100%';
    child.style.marginBottom = '20px';
});
const progressionContainer = document.getElementById('progression-checklist-container');
if (progressionContainer) {
    progressionContainer.innerHTML = isSingleMatch ? '' : this.renderTournamentChecklist(event);
}

// 🔥 MISE À JOUR DES BOUTONS APRÈS CRÉATION DU HTML
if (!isSingleMatch && event) {
  await this.updateTournamentActionsUI(event).catch(console.warn);
}
        // ✅ Si déjà archivé (mémoire locale), on grise le bouton dès le chargement
const key = "archived_event_ids";
const arr = JSON.parse(localStorage.getItem(key) || "[]");
if (arr.includes(Number(eventId))) {
  this.disableArchiveButtonUI("✅ Déjà archivé", "📦 Événement déjà archivé");
}


    // ✅ IMPORTANT : listeners ICI (avant return)
    const btnStart = document.getElementById('btn-start-tournament-control');
    const btnFinish = document.getElementById('btn-finish-tournament-control');
   if (btnStart) btnStart.onclick = () => this.startTournament(token);
 if (btnFinish) btnFinish.onclick = () => this.finishTournament(token);
    const btnStartMatch = document.getElementById('btn-start-match-control');
    const btnFinishMatch = document.getElementById('btn-finish-match-control');
if (btnStartMatch) btnStartMatch.onclick = () => this.startTournament(token);
if (btnFinishMatch) btnFinishMatch.onclick = () => this.finishTournament(token);

return event;

        } catch (err) {
            console.error("loadEventDetails error:", err);
            const errorMsg = this.extractErrorMessage(err);
            container.innerHTML = `<p style="color: #e74c3c;">❌ ${this.escapeHtml(errorMsg)}</p>`;
             return null;
        } finally {
        // 🔥 LA LIGNE CRUCIALE
        this.hideLoading("event-details");
    }

    },

async updateTournamentActionsUI(event) {
    console.log('🎯 updateTournamentActionsUI appelé pour event:', event);
    
    if (!event) {
        console.warn('⚠️ Event null dans updateTournamentActionsUI');
        return;
    }

    const phase = event.tournamentPhase;
    console.log('📊 Phase actuelle:', phase);

    // 🔥 RECHARGER L'EVENT POUR AVOIR LES BONNES DONNÉES
    const token = Auth.accessToken || localStorage.getItem("accessToken");
    const freshEvent = await this.safeGet(`/api/events/public/${event.id}`, token);
    const acceptedCount = freshEvent?.acceptedParticipants ?? 0;


    // ✅ VERROU GLOBAL : si l'event est COMPLETED, on bloque toutes les actions
const eventStatus = this.normStatus(freshEvent?.status ?? event?.status);
this.cachedEventStatus = eventStatus;
if (eventStatus === "COMPLETED") {
 const lockIds = [
  // génération / tournoi
  "btn-generate-groups",
  "btn-generate-bracket-uefa",
  "btn-generate-bracket-semi",
  "btn-generate-consolante",
  "btn-start-tournament",
  "btn-start-tournament-control",
  "btn-finish-tournament-control",

  // ✅ ceux que tu as en screen
  "btn-cancel-event",      // Annuler l'événement
  "btn-reset-planning",    // Réinitialiser le planning
  "btn-planning-poules",   // Planifier poules
  "btn-planning-finales",  // Planifier finales
  "btn-delete-round"       // Supprimer round (si présent)
];


  lockIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.disabled = true;
      el.title = "🏁 Tournoi terminé";
    }
  });

  // optionnel : on garde l'accès lecture aux vues
  const viewBracket = document.getElementById("btn-view-bracket");
  if (viewBracket) viewBracket.style.display = "block";
  const viewConso = document.getElementById("btn-view-consolante");
  if (viewConso) viewConso.style.display = "block";


            // 🔒 Verrouiller tout le formulaire Planning (inputs/select/buttons) en COMPLETED
const planningTab = document.querySelector('div.tab-content[data-content="planning"]');
if (planningTab) {
 planningTab.querySelectorAll('input, select, textarea, button').forEach(el => {
  if (el.id === "btn-refresh-all") return;
  if (el.id === "btn-delete-event") return;
  if (el.id === "btn-view-bracket") return;
  if (el.id === "btn-view-consolante") return;
  el.disabled = true;
  el.title = "🏁 Tournoi terminé (lecture seule)";
});

}

// ✅ UX: libellés + style cohérents en COMPLETED (planning)
[
  { id: "btn-planning-poules",   label: "🔒 Poules (lecture seule)" },
  { id: "btn-planning-finales",  label: "🔒 Finales (lecture seule)" },
  { id: "btn-reset-planning",    label: "🔒 Reset désactivé" }
].forEach(({id, label}) => {
  const b = document.getElementById(id);
  if (!b) return;
  b.disabled = true;
  b.innerHTML = label;
  b.style.opacity = "0.6";
  b.style.cursor = "not-allowed";
  b.title = "🏁 Tournoi terminé (lecture seule)";
});


// 🔒 Verrouiller la sélection 1/2/3 jours (cards cliquables)
document.querySelectorAll('.duration-option').forEach(card => {
  card.style.pointerEvents = "none";
  card.style.opacity = "0.6";
  card.title = "🏁 Tournoi terminé (lecture seule)";
});

// 🔒 COMPLETED : bloquer bouton Inscrire
document.querySelectorAll("button").forEach(btn => {
  const txt = (btn.textContent || "").trim().toLowerCase();
  if (txt === "➕ inscrire" || txt.includes("inscrire")) {
    btn.disabled = true;
    btn.title = "🏁 Tournoi terminé : inscriptions fermées";
    btn.style.opacity = "0.6";
    btn.style.cursor = "not-allowed";
  }
});
            // 🔒 COMPLETED : bloquer tous les boutons "Modifier"
document.querySelectorAll("button").forEach(btn => {
  const txt = (btn.textContent || "").trim().toLowerCase();
  if (txt.includes("modifier")) {
    btn.disabled = true;
    btn.title = "🏁 Tournoi terminé (lecture seule)";
    btn.style.opacity = "0.6";
    btn.style.cursor = "not-allowed";
  }
});

// 🔒 COMPLETED : bloquer l'enregistrement dans la modale d'édition de match (si ouverte)
const saveBtn = document.getElementById("save-edit-match");
if (saveBtn) {
  saveBtn.disabled = true;
  saveBtn.title = "🏁 Tournoi terminé (lecture seule)";
}

const cancelBtn = document.getElementById("cancel-edit-match");
if (cancelBtn) {
  cancelBtn.disabled = false; // on laisse fermer la modale
}

// 🔒 COMPLETED : désactiver tous les boutons "Inscrire" (mes équipes)
document.querySelectorAll('button[id^="btn-register-team-"]').forEach(b => {
  b.disabled = true;
  b.style.opacity = "0.6";
  b.style.cursor = "not-allowed";
  b.title = "🏁 Tournoi terminé : inscriptions fermées";
});


  return; // ✅ on sort : pas de switch phase
}

    
    console.log('✅ Équipes acceptées:', acceptedCount);

    // 🔥 NOUVEAU : Vérifier s'il y a des matchs scorés
    const hasGroups = (freshEvent?.groupCount ?? 0) > 0;
    let hasScoredMatches = false;
    
    if (hasGroups) {
        try {
            const matches = await this.safeGet(`/api/events/${event.id}/matches`, token);
            const matchesArray = matches?.data ?? matches ?? [];
            // Vérifier s'il y a des matchs de poules terminés
            hasScoredMatches = matchesArray.some(m => 
                m.group !== null && m.status === "COMPLETED"
            );
        } catch (e) {
            console.warn("⚠️ Erreur vérification matchs scorés", e);
        }
    }
    
    console.log('🎲 Matchs scorés:', hasScoredMatches);

    // 🔒 SAFE: Fonction helper
    const safeSetDisabled = (elementId, disabled, reason = "") => {
        const el = document.getElementById(elementId);
        if (!el) {
            console.warn(`⚠️ Élément introuvable: ${elementId}`);
            return;
        }
        el.disabled = disabled;
        el.title = disabled ? reason : "";
        console.log(`✅ ${elementId}.disabled = ${disabled}${reason ? " (" + reason + ")" : ""}`);
    };

    const safeSetDisplay = (elementId, display) => {
        const el = document.getElementById(elementId);
        if (el) {
            el.style.display = display;
            console.log(`✅ ${elementId}.display = ${display}`);
        } else {
            console.warn(`⚠️ Élément introuvable: ${elementId}`);
        }
    };

    // 🎯 LOGIQUE SELON LA PHASE
    switch (phase) {
        case 'GROUP_STAGE':
            console.log('📌 Phase: GROUP_STAGE - Poules en cours');
            
            // 🔥 FIX : Bloquer si poules existent OU si matchs scorés
            const canGenerateGroups = !hasGroups && acceptedCount >= 4;
            
            let disableReason = "";
            if (hasGroups && hasScoredMatches) {
                disableReason = "🔒 Poules déjà générées avec des matchs scorés";
            } else if (hasGroups) {
                disableReason = "✅ Poules déjà générées";
            } else {
                disableReason = `⏳ Il faut 4 équipes validées (${acceptedCount}/4)`;
            }
            
            safeSetDisabled(
                'btn-generate-groups',
                !canGenerateGroups,
                disableReason
            );
            
            safeSetDisabled('btn-generate-bracket-uefa', true);
            safeSetDisabled('btn-generate-bracket-semi', true);
            safeSetDisabled('btn-generate-consolante', true);
            
            safeSetDisplay('btn-view-bracket', 'none');
            safeSetDisplay('btn-view-consolante', 'none');
            
            this.tryEnableBracketButtonsIfGroupsFinished(event.id, safeSetDisabled).catch(console.warn);
            break;

        case 'GROUP_STAGE_FINISHED':
            console.log('📌 Phase: GROUP_STAGE_FINISHED - Poules terminées');
            
            // 🔥 FIX : Toujours bloquer en GROUP_STAGE_FINISHED
            safeSetDisabled(
                'btn-generate-groups',
                true,
                "🔒 Les poules sont terminées, impossible de régénérer"
            );
            
            safeSetDisabled('btn-generate-bracket-uefa', false);
            safeSetDisabled('btn-generate-bracket-semi', false);
            safeSetDisabled('btn-generate-consolante', false);
            
            safeSetDisplay('btn-view-bracket', 'none');
            safeSetDisplay('btn-view-consolante', 'none');
            break;

        case 'KNOCKOUT_STAGE':
            console.log('📌 Phase: KNOCKOUT_STAGE - Phase finale en cours');
            safeSetDisabled('btn-generate-groups', true, "🔒 Phase finale en cours, poules verrouillées");
            safeSetDisabled('btn-generate-bracket-uefa', true, "Bracket déjà généré");
            safeSetDisabled('btn-generate-bracket-semi', true, "Bracket déjà généré");
            
            safeSetDisabled('btn-generate-consolante', true, "Vérification...");
            
            let consoExists = false;
            try {
                consoExists = await this.hasConsolante(event.id);
            } catch (e) {
                console.warn("⚠️ check consolante failed", e);
                consoExists = false;
            }
            
            safeSetDisabled(
                'btn-generate-consolante',
                consoExists,
                consoExists ? "Consolante déjà générée" : ""
            );
            
            safeSetDisplay('btn-view-bracket', 'block');
            safeSetDisplay('btn-view-consolante', 'block');
            break;

        case 'FINAL_PLAYED':
            console.log('📌 Phase: FINAL_PLAYED - Tournoi terminé');
            safeSetDisabled('btn-generate-groups', true, "🔒 Tournoi terminé");
            safeSetDisabled('btn-generate-bracket-uefa', true);
            safeSetDisabled('btn-generate-bracket-semi', true);
            safeSetDisabled('btn-generate-consolante', true);
            
            safeSetDisplay('btn-view-bracket', 'block');
            safeSetDisplay('btn-view-consolante', 'block');
            break;

        default:
            console.log('📌 Phase: Autre (' + phase + ')');
            
            // 🔥 FIX : Vérifier aussi en phase default
            const defaultCanGenerate = !hasGroups && acceptedCount >= 4;
            
            let defaultReason = "";
            if (hasGroups && hasScoredMatches) {
                defaultReason = "🔒 Poules déjà générées avec des matchs scorés";
            } else if (hasGroups) {
                defaultReason = "✅ Poules déjà générées";
            } else {
                defaultReason = `⏳ Il faut 4 équipes validées (${acceptedCount}/4)`;
            }
            
            safeSetDisabled(
                'btn-generate-groups',
                !defaultCanGenerate,
                defaultReason
            );
            
            safeSetDisabled('btn-generate-bracket-uefa', true);
            safeSetDisabled('btn-generate-bracket-semi', true);
            safeSetDisabled('btn-generate-consolante', true);
            
            safeSetDisplay('btn-view-bracket', 'none');
            safeSetDisplay('btn-view-consolante', 'none');
    }
},

async tryEnableBracketButtonsIfGroupsFinished(eventId, safeSetDisabled) {
  try {
    const token = Auth.accessToken || localStorage.getItem("accessToken");
    if (!token) return;

    const res = await this.safeGet(`/api/events/tournament/${eventId}/group-rankings`, token);

    // si ton safeGet renvoie déjà ApiResponse { success, data }, on prend .data
    const rankingsObj = res?.data ?? res;

    const groups = Object.values(rankingsObj || {});
    if (!groups.length) return;

    // groupe de N équipes => chaque équipe doit avoir played = N-1
    const finished = groups.every(g => {
      const expected = (g?.length ?? 0) - 1;
      if (expected < 1) return false;
      return g.every(t => (t.played ?? 0) >= expected);
    });

    console.log("✅ groupsFinished =", finished);

    if (finished) {
      safeSetDisabled('btn-generate-groups', true);
      safeSetDisabled('btn-generate-bracket-uefa', false);
      safeSetDisabled('btn-generate-bracket-semi', false);
      safeSetDisabled('btn-generate-consolante', false);
    }
  } catch (e) {
    console.warn("⚠️ Impossible de vérifier group-rankings", e);
  }
},

    // ================================
// 🔹 2. INSCRIPTIONS
// ================================
async loadRegistrations(eventId, token) {
    const container = document.getElementById("event-registrations");
    if (!container) return;

    try {
        const response = await this.safeGet(`/api/events/manage/${eventId}/registrations?size=100`, token);
        const registrations = response.content || response || [];

        if (!registrations.length) {
            container.innerHTML = `<p style="color: #7f8c8d;">Aucune inscription pour le moment</p>`;
            return;
        }

        const pending = registrations.filter(r => (r.status || "").toUpperCase() === "PENDING");
        const accepted = registrations.filter(r => (r.status || "").toUpperCase() === "ACCEPTED");
        this.acceptedParticipantsCount = accepted.length;
        const rejected = registrations.filter(r => (r.status || "").toUpperCase() === "REJECTED");

        let html = '';

        // 🆕 Bouton Actualiser
        html += `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-radius: 10px; border: 2px solid #3498db;">
                <h3 style="margin: 0; color: #2c3e50; font-size: 1.2em; font-weight: 700;">
                    📋 Gestion des inscriptions (${registrations.length} total)
                </h3>
                <button id="btn-refresh-registrations" class="admin-btn" style="background: #3498db; padding: 10px 20px; border: none; border-radius: 8px; color: white; cursor: pointer; font-weight: 600; display: flex; align-items: center; gap: 8px; transition: background 0.3s;">
                    <i class="fas fa-sync-alt"></i> Actualiser
                </button>
            </div>
        `;

        html += `
            <div style="display: flex; gap: 15px; margin-bottom: 25px; flex-wrap: wrap;">
                <div style="flex: 1; min-width: 100px; padding: 15px; background: #fff3cd; border-radius: 10px; text-align: center; border: 2px solid #f39c12;">
                    <div style="font-size: 2em; font-weight: 700; color: #f39c12;">${pending.length}</div>
                    <div style="font-size: 0.9em; color: #856404; font-weight: 600;">⏳ En attente</div>
                </div>
                <div style="flex: 1; min-width: 100px; padding: 15px; background: #d4edda; border-radius: 10px; text-align: center; border: 2px solid #27ae60;">
                    <div style="font-size: 2em; font-weight: 700; color: #27ae60;">${accepted.length}</div>
                    <div style="font-size: 0.9em; color: #155724; font-weight: 600;">✅ Validées</div>
                </div>
                ${rejected.length > 0 ? `
                    <div style="flex: 1; min-width: 100px; padding: 15px; background: #f8d7da; border-radius: 10px; text-align: center; border: 2px solid #e74c3c;">
                        <div style="font-size: 2em; font-weight: 700; color: #e74c3c;">${rejected.length}</div>
                        <div style="font-size: 0.9em; color: #721c24; font-weight: 600;">❌ Refusées</div>
                    </div>
                ` : ''}
            </div>
        `;

        if (pending.length > 0) {
            html += `<h3 style="color: #f39c12; margin: 25px 0 15px 0; font-size: 1.1em;">⏳ Inscriptions en attente (${pending.length})</h3>`;
            pending.forEach(reg => {
                html += this.renderRegistrationCard(reg, true);
            });
        }

        if (accepted.length > 0) {
            html += `<h3 style="color: #27ae60; margin: 25px 0 15px 0; font-size: 1.1em;">✅ Équipes validées (${accepted.length})</h3>`;
            accepted.forEach(reg => {
                html += this.renderRegistrationCard(reg, false);
            });
        }

        container.innerHTML = html;

        container.querySelectorAll(".btn-accept-reg").forEach(btn => {
            btn.addEventListener("click", async (e) => {
                const regId = e.target.getAttribute("data-reg-id");
                const teamName = e.target.getAttribute("data-team-name");
                
                if (!confirm(`Accepter l'inscription de "${teamName}" ?\n\nCette action est irréversible.`)) {
                    return;
                }
                
                await this.handleAcceptRegistration(eventId, regId, token);
            });
        });

        container.querySelectorAll(".btn-reject-reg").forEach(btn => {
            btn.addEventListener("click", async (e) => {
                const regId = e.target.getAttribute("data-reg-id");
                const teamName = e.target.getAttribute("data-team-name");
                
                if (!confirm(`Refuser l'inscription de "${teamName}" ?\n\nCette action est irréversible.`)) {
                    return;
                }
                
                await this.handleRejectRegistration(eventId, regId, token);
            });
        });

        // 🆕 LISTENER BOUTON ACTUALISER (LA SEULE CHOSE AJOUTÉE)
        const btnRefresh = document.getElementById("btn-refresh-registrations");
        if (btnRefresh) {
            btnRefresh.addEventListener("click", async () => {
                btnRefresh.disabled = true;
                btnRefresh.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Actualisation...';
                
                await this.loadRegistrations(eventId, token);
                
                this.setGlobalMessage("✅ Inscriptions actualisées", false);
            });
        }

    } catch (err) {
        console.error("loadRegistrations error:", err);
        const errorMsg = this.extractErrorMessage(err);
        container.innerHTML = `<p style="color: #e74c3c;">❌ ${this.escapeHtml(errorMsg)}</p>`;
    }
},

    // ================================
    // 🔹 MES ÉQUIPES (ORGANISATEUR)
    // ================================
    async loadMyTeams(eventId, token) {
        const container = document.getElementById("my-teams");
        if (!container) return;

        try {
            const teams = await this.safeGet("/api/teams/my-club", token);

            if (!teams || teams.length === 0) {
                container.innerHTML = "<p>Aucune équipe dans votre club</p>";
                return;
            }

            const registrationsResponse = await this.safeGet(
    `/api/events/manage/${eventId}/registrations?size=100`,
    token
);


            const registrations = registrationsResponse.content || registrationsResponse || [];

            const registeredTeamIds = new Set(
                registrations
                    .filter(r => r.team || r.teamId)
                    .map(r => r.team?.id || r.teamId)
            );

            container.innerHTML = teams.map(team => {
                const safeName = this.escapeHtml(team.name);
                const isRegistered = registeredTeamIds.has(team.id);

                return `
                    <div style="
                        display:flex;
                        justify-content:space-between;
                        align-items:center;
                        padding:12px;
                        border:1px solid #ddd;
                        border-radius:8px;
                        margin-bottom:10px;
                        background:#fff;
                    ">
                        <span>🏆 ${safeName}</span>

                        ${isRegistered ? `
                            <span style="
                                padding:6px 12px;
                                border-radius:20px;
                                background:#d4edda;
                                color:#27ae60;
                                font-weight:600;
                                font-size:0.85em;
                            ">
                                ✅ Déjà inscrite
                            </span>
                        ` : `
                          <button 
  id="btn-register-team-${team.id}"
  class="admin-btn admin-btn-primary"
  data-team-id="${team.id}"
  data-team-name="${this.escapeHtml(team.name)}">
  ➕ Inscrire
</button>

                        `}
                    </div>
                `;
            }).join("");

            container.querySelectorAll("button").forEach(btn => {
                btn.addEventListener("click", () => {
                    const teamId = Number(btn.dataset.teamId);
                    const teamName = btn.dataset.teamName;

                    if (registeredTeamIds.has(teamId)) return;

                    if (!confirm(`Inscrire l'équipe "${teamName}" au tournoi ?`)) {
                        return;
                    }

                    this.registerTeam(eventId, teamId, token);

                });
            });

        } catch (err) {
            console.error("loadMyTeams error:", err);
            const errorMsg = this.extractErrorMessage(err);
            container.innerHTML = `<p style='color:red'>${this.escapeHtml(errorMsg)}</p>`;
        }
    },

    renderRegistrationCard(reg, showActions) {
        const teamName = this.escapeHtml(reg.teamName || reg.team?.name || "Équipe");
        const clubName = this.escapeHtml(reg.clubName || reg.club?.name || "");
        const status = (reg.status || "").toUpperCase();
        const registrationDate = reg.registrationDate || reg.createdAt || "";
        
        let formattedDate = "";
        if (registrationDate) {
            try {
                const date = new Date(registrationDate);
                formattedDate = date.toLocaleDateString('fr-FR', { 
                    day: '2-digit', 
                    month: 'short', 
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
            } catch (e) {
                formattedDate = registrationDate;
            }
        }

        const borderColor = status === "PENDING" ? '#f39c12' : status === "ACCEPTED" ? '#27ae60' : '#e74c3c';
        const bgColor = status === "PENDING" ? '#fff3cd' : status === "ACCEPTED" ? '#d4edda' : '#f8d7da';

        return `
            <div style="
               border: 2px solid ${borderColor}; 
            border-radius: 12px; 
            padding: 20px; 
            background: white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            transition: transform 0.2s, box-shadow 0.2s;
            margin-bottom: 15px;
            width: 100%;
            display: block;
            ">
                
                <div style="display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 12px; flex-wrap: wrap; gap: 10px;">
                    <div style="flex: 1; min-width: 150px;">
                        <h4 style="margin: 0 0 5px 0; color: #2c3e50; font-size: 1.1em; word-break: break-word;">
                            🏆 ${teamName}
                        </h4>
                        ${clubName ? `
                            <p style="margin: 0; color: #7f8c8d; font-size: 0.9em;">
                                ⚽ ${clubName}
                            </p>
                        ` : ''}
                    </div>
                    <span style="
                        background: ${bgColor}; 
                        color: ${borderColor}; 
                        padding: 6px 12px; 
                        border-radius: 20px; 
                        font-size: 0.85em; 
                        font-weight: 600;
                        white-space: nowrap;
                        align-self: flex-start;
                    ">
                        ${status === "PENDING" ? "⏳ EN ATTENTE" : status === "ACCEPTED" ? "✅ VALIDÉE" : "❌ REFUSÉE"}
                    </span>
                </div>

                ${formattedDate ? `
                    <p style="margin: 10px 0 0 0; color: #95a5a6; font-size: 0.85em;">
                        📅 ${formattedDate}
                    </p>
                ` : ''}

                ${showActions ? `
                    <div style="display: flex; gap: 10px; margin-top: auto; padding-top: 15px; border-top: 1px solid #ecf0f1;">
                        <button class="admin-btn admin-btn-primary btn-accept-reg" 
                                data-reg-id="${reg.id}"
                                data-team-name="${teamName}"
                                style="flex: 1; padding: 10px; font-size: 0.9em;">
                            ✅ Accepter
                        </button>
                        <button class="admin-btn btn-reject-reg" 
                                data-reg-id="${reg.id}"
                                data-team-name="${teamName}"
                                style="flex: 1; padding: 10px; font-size: 0.9em; background: #e74c3c; border-color: #e74c3c;">
                            ❌ Refuser
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
    },
async handleAcceptRegistration(eventId, regId, token) {
    try {
        const response = await fetch(`/api/events/registration/${eventId}/registrations/${regId}/accept`, {
            method: "PUT",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) {
            const json = await response.json().catch(() => ({}));
            throw new Error(json.message || json.error || "Erreur lors de l'acceptation");
        }

        this.setGlobalMessage("✅ Inscription acceptée avec succès", false);
        await this.loadRegistrations(eventId, token);
        await this.loadEventDetails(eventId, token);
        
    } catch (err) {
        const errorMsg = this.extractErrorMessage(err);
        this.setGlobalMessage(`❌ ${errorMsg}`, true);
    }
},

async handleRejectRegistration(eventId, regId, token) {
    try {
        const response = await fetch(`/api/events/registration/${eventId}/registrations/${regId}/reject`, {
            method: "PUT",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) {
            const json = await response.json().catch(() => ({}));
            throw new Error(json.message || json.error || "Erreur lors du rejet");
        }

        this.setGlobalMessage("✅ Inscription rejetée", false);
        await this.loadRegistrations(eventId, token);
        await this.loadEventDetails(eventId, token);
        
    } catch (err) {
        const errorMsg = this.extractErrorMessage(err);
        this.setGlobalMessage(`❌ ${errorMsg}`, true);
    }
},

    // ================================
    // 🔹 3. POULES & CLASSEMENTS
    // ================================
    async loadGroups(eventId, token) {
        const groupsContainer = document.getElementById("event-groups");
        const rankingsContainer = document.getElementById("event-groups-rankings");
        if (!groupsContainer) return;

        try {
            const groups = await this.safeGet(`/api/events/tournament/${eventId}/groups`, token);

            if (!groups || !groups.length) {
                groupsContainer.innerHTML = `<p style="color: #7f8c8d;">Aucune poule générée. Cliquez sur "Générer les poules"</p>`;
            } else {
               groupsContainer.innerHTML = `
                <div style="display: flex; flex-direction: column; gap: 20px;">
                    ${groups.map(group => {
                        const groupName = this.escapeHtml(group.name || `Poule ${group.id}`);
                        const teams = group.teams || [];

                        return `
                            <div style="
                                background: white;
                                border: 2px solid #3498db;
                                border-radius: 12px;
                                padding: 20px;
                                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                            ">
                                <h3 style="
                                    color: #3498db;
                                    margin: 0 0 15px 0;
                                    font-size: 1.2em;
                                    text-align: center;
                                    padding-bottom: 10px;
                                    border-bottom: 2px solid #3498db;
                                ">${groupName}</h3>
                                ${teams.length ? `
                                    <div style="display: flex; flex-direction: column; gap: 8px;">
                                        ${teams.map((t, idx) => {
                                            const teamName = typeof t === 'string' ? t : (t.name || "Équipe");
                                            const safeTeamName = this.escapeHtml(teamName);
                                            
                                            return `
                                                <div style="
                                                    padding: 12px;
                                                    background: ${idx % 2 === 0 ? '#f8f9fa' : 'white'};
                                                    border-radius: 8px;
                                                    display: flex;
                                                    align-items: center;
                                                    gap: 10px;
                                                ">
                                                    <span style="
                                                        min-width: 30px;
                                                        height: 30px;
                                                        background: #3498db;
                                                        color: white;
                                                        border-radius: 50%;
                                                        display: flex;
                                                        align-items: center;
                                                        justify-content: center;
                                                        font-weight: 700;
                                                        font-size: 0.9em;
                                                    ">${idx + 1}</span>
                                                    <span style="
                                                        flex: 1;
                                                        color: #2c3e50;
                                                        font-weight: 500;
                                                    ">${safeTeamName}</span>
                                                </div>
                                            `;
                                        }).join("")}
                                    </div>
                                ` : `<p style="color: #7f8c8d; text-align: center;">Aucune équipe</p>`}
                            </div>
                        `;
                    }).join("")}
                </div>
                `;
            }

            try {
                const rankings = await this.safeGet(`/api/events/tournament/${eventId}/group-rankings`, token);
                if (rankings && rankings.length && rankingsContainer) {
                    rankingsContainer.innerHTML = rankings.map(r => {
                        const rows = r.rankings || r.teams || [];
                        const groupName = this.escapeHtml(r.groupName || r.name);
                        
                        return `
                            <div class="admin-dashboard-card">
                                <h3>Classement - ${groupName}</h3>
                                <table class="admin-table" style="width:100%;">
                                    <thead>
                                        <tr>
                                            <th>#</th><th>Équipe</th><th>Pts</th><th>J</th><th>G</th><th>N</th><th>P</th><th>Diff</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${rows.map((row, i) => {
                                            const teamName = this.escapeHtml(row.teamName || row.name);
                                            return `
                                                <tr>
                                                    <td>${i + 1}</td>
                                                    <td>${teamName}</td>
                                                    <td><strong>${row.points ?? "-"}</strong></td>
                                                    <td>${row.played ?? "-"}</td>
                                                    <td>${row.won ?? "-"}</td>
                                                    <td>${row.drawn ?? "-"}</td>
                                                    <td>${row.lost ?? "-"}</td>
                                                    <td>${row.goalDifference ?? "-"}</td>
                                                </tr>
                                            `;
                                        }).join("")}
                                    </tbody>
                                </table>
                            </div>
                        `;
                    }).join("");
                }
            } catch (err) {
                console.warn("Rankings error:", err);
            }

        } catch (err) {
            console.error("loadGroups error:", err);
            const errorMsg = this.extractErrorMessage(err);
            groupsContainer.innerHTML = `<p style="color: #e74c3c;">❌ ${this.escapeHtml(errorMsg)}</p>`;
        }
    },

    // ================================
    // MODAL DE SAISIE DE SCORE
    // ================================
async showScoreModal(matchId, teamA, teamB, scoreA, scoreB, eventId, token) {

        // 🔒 Guard : si tournoi terminé, on n'ouvre pas la modale
if (this.normStatus(this.cachedEventStatus) === "COMPLETED") {
  this.setGlobalMessage("🏁 Tournoi terminé : modification des scores désactivée", true);
  return;
}


    const safeTeamA = this.escapeHtml(teamA);
    const safeTeamB = this.escapeHtml(teamB);
    
    const validScoreA = Math.max(0, Math.min(99, parseInt(scoreA) || 0));
    const validScoreB = Math.max(0, Math.min(99, parseInt(scoreB) || 0));
    
    // 🔥 RÉCUPÉRER LES IDs DES ÉQUIPES
    let teamAId = null;
    let teamBId = null;
    
    try {
        const matchResponse = await fetch(`/api/matches/${matchId}`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        if (matchResponse.ok) {
            const matchData = await matchResponse.json();
            const match = matchData.data;
            teamAId = match.teamAId;
            teamBId = match.teamBId;

             console.log("🔥 IDs RÉCUPÉRÉS :", {
            teamAId: teamAId,
            teamBId: teamBId,
            match: match
        });
        }
    } catch (err) {
        console.error("Erreur récupération IDs équipes:", err);
    }
    
    // 🔥 CHARGER LES ÉVÉNEMENTS EXISTANTS
    let matchEvents = [];
    try {
        const eventsResponse = await fetch(`/api/matches/${matchId}/events`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        if (eventsResponse.ok) {
            const eventsData = await eventsResponse.json();
            matchEvents = eventsData.data || [];
        }
    } catch (err) {
        console.error("Erreur chargement événements:", err);
    }
    
    const modal = document.createElement('div');
    modal.id = 'score-modal';
    modal.dataset.eventId = eventId;  // 🔥 AJOUTE
    modal.dataset.scoreA = validScoreA;  // 🔥 AJOUTE
    modal.dataset.scoreB = validScoreB;
  modal.dataset.teamAId = teamAId || '';
    modal.dataset.teamBId = teamBId || '';
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
        background: rgba(0,0,0,0.7); display: flex; align-items: center; 
        justify-content: center; z-index: 9999; overflow-y: auto; padding: 20px;
    `;
    
    modal.innerHTML = `
        <div style="background: white; padding: 30px; border-radius: 12px; max-width: 700px; width: 100%; max-height: 90vh; overflow-y: auto; box-shadow: 0 4px 20px rgba(0,0,0,0.3);">

        
            <h3 style="margin: 0 0 20px 0; color: #2c3e50; text-align: center;">📝 Saisir le score</h3>
            
            <!-- SCORE TEMPS RÉGLEMENTAIRE -->
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                <h4 style="margin: 0 0 15px 0; color: #2c3e50; font-size: 0.95em;">⚽ Temps réglementaire</h4>
                <div style="display: flex; align-items: center; justify-content: space-between;">
                    <div style="flex: 1; text-align: center;">
                        <div style="font-weight: 600; color: #2c3e50; margin-bottom: 10px; font-size: 0.9em;">${safeTeamA}</div>
                        <input type="number" id="score-a" min="0" max="99" value="${validScoreA}" 
                               style="width: 60px; padding: 10px; font-size: 24px; text-align: center; border: 2px solid #3498db; border-radius: 8px;">
                    </div>
                    <div style="font-size: 24px; color: #95a5a6; margin: 0 20px;">-</div>
                    <div style="flex: 1; text-align: center;">
                        <div style="font-weight: 600; color: #2c3e50; margin-bottom: 10px; font-size: 0.9em;">${safeTeamB}</div>
                        <input type="number" id="score-b" min="0" max="99" value="${validScoreB}" 
                               style="width: 60px; padding: 10px; font-size: 24px; text-align: center; border: 2px solid #3498db; border-radius: 8px;">
                    </div>
                </div>
            </div>
            
            <!-- PROLONGATIONS -->
            <div id="extra-time-section" style="background: #fff3cd; padding: 15px; border-radius: 8px; margin-bottom: 15px; display: none;">
                <label style="display: flex; align-items: center; gap: 10px; cursor: pointer; margin-bottom: 15px;">
                    <input type="checkbox" id="had-extra-time" style="width: 20px; height: 20px; cursor: pointer;">
                    <span style="font-weight: 600; color: #856404;">⏱️ Le match est allé aux prolongations</span>
                </label>
                
                <div id="extra-time-inputs" style="display: none;">
                    <h4 style="margin: 0 0 10px 0; color: #856404; font-size: 0.9em;">Score après prolongations</h4>
                    <div style="display: flex; align-items: center; justify-content: space-between; gap: 10px;">
                        <input type="number" id="extra-score-a" min="0" max="99" value="0" 
                               style="width: 60px; padding: 8px; font-size: 20px; text-align: center; border: 2px solid #f39c12; border-radius: 6px;">
                        <span style="font-size: 20px; color: #856404;">-</span>
                        <input type="number" id="extra-score-b" min="0" max="99" value="0" 
                               style="width: 60px; padding: 8px; font-size: 20px; text-align: center; border: 2px solid #f39c12; border-radius: 6px;">
                    </div>
                </div>
            </div>
            
            <!-- TIRS AU BUT -->
            <div id="penalties-section" style="background: #ffe5e5; padding: 15px; border-radius: 8px; margin-bottom: 20px; display: none;">
                <label style="display: flex; align-items: center; gap: 10px; cursor: pointer; margin-bottom: 15px;">
                    <input type="checkbox" id="had-penalties" style="width: 20px; height: 20px; cursor: pointer;">
                    <span style="font-weight: 600; color: #c0392b;">🎯 Le match est allé aux tirs au but</span>
                </label>
                
                <div id="penalties-inputs" style="display: none;">
                    <h4 style="margin: 0 0 10px 0; color: #c0392b; font-size: 0.9em;">Score des tirs au but</h4>
                    <div style="display: flex; align-items: center; justify-content: space-between; gap: 10px;">
                        <input type="number" id="penalty-score-a" min="0" max="20" value="0" 
                               style="width: 60px; padding: 8px; font-size: 20px; text-align: center; border: 2px solid #e74c3c; border-radius: 6px;">
                        <span style="font-size: 20px; color: #c0392b;">-</span>
                        <input type="number" id="penalty-score-b" min="0" max="20" value="0" 
                               style="width: 60px; padding: 8px; font-size: 20px; text-align: center; border: 2px solid #e74c3c; border-radius: 6px;">
                    </div>
                </div>
            </div>

            <!-- 🆕 ÉVÉNEMENTS DU MATCH -->
            <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <h4 style="margin: 0 0 15px 0; color: #1976d2; font-size: 1em; display: flex; align-items: center; gap: 8px;">
                    📊 Événements du match
                </h4>
                
                <div id="match-events-list" style="max-height: 300px; overflow-y: auto; margin-bottom: 15px;">
                    ${matchEvents.length === 0 ? `
                        <p style="text-align: center; color: #7f8c8d; padding: 20px; font-size: 0.9em;">
                            Aucun événement enregistré
                        </p>
                    ` : matchEvents.map(event => this.renderMatchEvent(event)).join('')}
                </div>
                
                <button id="btn-add-event" style="
                    width: 100%;
                    padding: 12px;
                    background: #27ae60;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                ">
                    ➕ Ajouter un événement
                </button>
            </div>
            
            <!-- TERMINER LE MATCH -->
            <div style="background: #d4edda; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                    <input type="checkbox" id="is-final" style="width: 20px; height: 20px; cursor: pointer;">
                    <span style="font-weight: 600; color: #155724;">✅ Terminer le match</span>
                </label>
                <p style="margin: 8px 0 0 30px; font-size: 0.85em; color: #155724;">
                    Les équipes seront qualifiées automatiquement
                </p>
            </div>
            
            <div style="display: flex; gap: 10px;">
                <button id="btn-cancel" style="flex: 1; padding: 12px; background: #95a5a6; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
                    Annuler
                </button>
                <button id="btn-save-score" style="flex: 1; padding: 12px; background: #27ae60; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
                    ✅ Valider
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // GESTION DE L'AFFICHAGE CONDITIONNEL
    const scoreAInput = document.getElementById('score-a');
    const scoreBInput = document.getElementById('score-b');
    const extraTimeSection = document.getElementById('extra-time-section');
    const penaltiesSection = document.getElementById('penalties-section');
    const hadExtraTimeCheckbox = document.getElementById('had-extra-time');
    const extraTimeInputs = document.getElementById('extra-time-inputs');
    const hadPenaltiesCheckbox = document.getElementById('had-penalties');
    const penaltiesInputs = document.getElementById('penalties-inputs');
    
    const checkForDraw = () => {
        const a = parseInt(scoreAInput.value) || 0;
        const b = parseInt(scoreBInput.value) || 0;
        
        if (a === b) {
            extraTimeSection.style.display = 'block';
            penaltiesSection.style.display = 'block';
        } else {
            extraTimeSection.style.display = 'none';
            penaltiesSection.style.display = 'none';
            hadExtraTimeCheckbox.checked = false;
            hadPenaltiesCheckbox.checked = false;
            extraTimeInputs.style.display = 'none';
            penaltiesInputs.style.display = 'none';
        }
    };
    
    scoreAInput.addEventListener('input', checkForDraw);
    scoreBInput.addEventListener('input', checkForDraw);
    
    hadExtraTimeCheckbox.addEventListener('change', (e) => {
        extraTimeInputs.style.display = e.target.checked ? 'block' : 'none';
        if (!e.target.checked) {
            hadPenaltiesCheckbox.checked = false;
            penaltiesInputs.style.display = 'none';
        }
    });
    
    hadPenaltiesCheckbox.addEventListener('change', (e) => {
        penaltiesInputs.style.display = e.target.checked ? 'block' : 'none';
        if (e.target.checked) {
            hadExtraTimeCheckbox.checked = true;
            extraTimeInputs.style.display = 'block';
        }
    });
    
    checkForDraw();
    
    // 🆕 BOUTON AJOUTER UN ÉVÉNEMENT
    document.getElementById('btn-add-event').addEventListener('click', () => {
this.showAddEventModal(
    matchId, 
    teamA, 
    teamB, 
    modal.dataset.teamAId ? parseInt(modal.dataset.teamAId) : null,
    modal.dataset.teamBId ? parseInt(modal.dataset.teamBId) : null,
    token, 
    modal
);
    });
    
    // FERMETURE
    modal.querySelector('#btn-cancel').addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });
    
    // VALIDATION
    modal.querySelector('#btn-save-score').addEventListener('click', async () => {
        const inputA = document.getElementById('score-a');
        const inputB = document.getElementById('score-b');
        const isFinal = document.getElementById('is-final').checked;
        
        let newScoreA = parseInt(inputA.value);
        let newScoreB = parseInt(inputB.value);
        
        if (isNaN(newScoreA) || newScoreA < 0 || newScoreA > 99) {
            alert("❌ Le score de l'équipe A doit être entre 0 et 99");
            inputA.focus();
            return;
        }
        
        if (isNaN(newScoreB) || newScoreB < 0 || newScoreB > 99) {
            alert("❌ Le score de l'équipe B doit être entre 0 et 99");
            inputB.focus();
            return;
        }
        
        const scoreData = {
            scoreA: newScoreA,
            scoreB: newScoreB,
            isFinal: isFinal
        };
        
        if (hadExtraTimeCheckbox.checked) {
            const extraA = parseInt(document.getElementById('extra-score-a').value) || 0;
            const extraB = parseInt(document.getElementById('extra-score-b').value) || 0;
            
            scoreData.hadExtraTime = true;
            scoreData.extraTimeScoreA = extraA;
            scoreData.extraTimeScoreB = extraB;
        }
        
        if (hadPenaltiesCheckbox.checked) {
            const penaltyA = parseInt(document.getElementById('penalty-score-a').value) || 0;
            const penaltyB = parseInt(document.getElementById('penalty-score-b').value) || 0;
            
            if (penaltyA === penaltyB) {
                alert("❌ Les tirs au but ne peuvent pas être à égalité !\n\nIl doit y avoir un vainqueur.");
                return;
            }
            
            scoreData.hadPenalties = true;
            scoreData.penaltyScoreA = penaltyA;
            scoreData.penaltyScoreB = penaltyB;
        }
        
        if (isFinal) {
            let confirmMsg = `Terminer définitivement le match ?\n\n${safeTeamA} ${newScoreA} - ${newScoreB} ${safeTeamB}`;
            
            if (scoreData.hadExtraTime) {
                confirmMsg += `\n(après prolongations: ${scoreData.extraTimeScoreA}-${scoreData.extraTimeScoreB})`;
            }
            
            if (scoreData.hadPenalties) {
                confirmMsg += `\n(tirs au but: ${scoreData.penaltyScoreA}-${scoreData.penaltyScoreB})`;
            }
            
            confirmMsg += `\n\nCette action est irréversible.`;
            
            if (!confirm(confirmMsg)) {
                return;
            }
        }
        
        await this.saveMatchScore(matchId, scoreData, token);
        document.body.removeChild(modal);
        await this.refreshAllData(eventId, token);
    });
},

// ================================
// 🆕 RENDER UN ÉVÉNEMENT
// ================================
renderMatchEvent(event) {
    const eventIcons = {
        'GOAL': '⚽',
        'YELLOW_CARD': '🟨',
        'RED_CARD': '🟥',
        'SUBSTITUTION': '🔄',
        'HALF_TIME': '⏱️',
        'FULL_TIME': '🏁',
        'PENALTY_SHOOTOUT': '🎯'
    };
    
    const icon = eventIcons[event.type] || '📌';
    const minute = event.minute !== null ? `${event.minute}'` : '-';
    const player = event.playerName || '';
    const team = event.teamName || '';
    
    return `
        <div style="
            background: white;
            padding: 12px;
            border-radius: 8px;
            margin-bottom: 8px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-left: 4px solid #3498db;
        ">
            <div style="flex: 1;">
                <div style="font-weight: 600; color: #2c3e50; margin-bottom: 4px;">
                    ${icon} ${minute} - ${event.type.replace('_', ' ')}
                </div>
                ${player ? `
                    <div style="font-size: 0.9em; color: #7f8c8d;">
                        ${this.escapeHtml(player)} ${team ? `(${this.escapeHtml(team)})` : ''}
                    </div>
                ` : ''}
            </div>
            <button 
                class="btn-delete-event" 
                data-event-id="${event.id}"
                style="
                    padding: 8px 12px;
                    background: #e74c3c;
                    color: white;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 0.85em;
                    font-weight: 600;
                ">
                🗑️
            </button>
        </div>
    `;
},

// ================================
// 🆕 MODAL AJOUTER UN ÉVÉNEMENT
// ================================
showAddEventModal(matchId, teamA, teamB, teamAId, teamBId, token, parentModal) {
    const eventModal = document.createElement('div');
    eventModal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
        background: rgba(0,0,0,0.8); display: flex; align-items: center; 
        justify-content: center; z-index: 10000;
    `;
    
    eventModal.innerHTML = `
        <div style="background: white; padding: 30px; border-radius: 12px; max-width: 500px; width: 90%; box-shadow: 0 4px 20px rgba(0,0,0,0.3);">
            <h3 style="margin: 0 0 20px 0; color: #2c3e50;">➕ Ajouter un événement</h3>
            
            <div style="display: grid; gap: 15px;">
                <div>
                    <label style="display: block; margin-bottom: 8px; font-weight: 600;">Type d'événement</label>
                    <select id="event-type" style="width: 100%; padding: 10px; border: 2px solid #e0e0e0; border-radius: 8px;">
                        <option value="GOAL">⚽ But</option>
                        <option value="YELLOW_CARD">🟨 Carton jaune</option>
                        <option value="RED_CARD">🟥 Carton rouge</option>
                        <option value="SUBSTITUTION">🔄 Remplacement</option>
                        <option value="HALF_TIME">⏱️ Mi-temps</option>
                        <option value="FULL_TIME">🏁 Fin du match</option>
                    </select>
                </div>
                
                <div>
                    <label style="display: block; margin-bottom: 8px; font-weight: 600;">Minute</label>
                    <input type="number" id="event-minute" min="0" max="120" placeholder="Ex: 23" 
                           style="width: 100%; padding: 10px; border: 2px solid #e0e0e0; border-radius: 8px;">
                </div>
                
                <div>
                    <label style="display: block; margin-bottom: 8px; font-weight: 600;">Équipe</label>
                    <select id="event-team" style="width: 100%; padding: 10px; border: 2px solid #e0e0e0; border-radius: 8px;">
                        <option value="">Aucune équipe spécifique</option>
                        <option value="A">${this.escapeHtml(teamA)}</option>
                        <option value="B">${this.escapeHtml(teamB)}</option>
                    </select>
                </div>
                
                <div>
                    <label style="display: block; margin-bottom: 8px; font-weight: 600;">Nom du joueur (optionnel)</label>
                    <input type="text" id="event-player" placeholder="Ex: Mbappé" 
                           style="width: 100%; padding: 10px; border: 2px solid #e0e0e0; border-radius: 8px;">
                </div>
                
                <div>
                    <label style="display: block; margin-bottom: 8px; font-weight: 600;">Détails (optionnel)</label>
                    <textarea id="event-details" placeholder="Ex: But sur corner" rows="2"
                              style="width: 100%; padding: 10px; border: 2px solid #e0e0e0; border-radius: 8px; resize: vertical;"></textarea>
                </div>
            </div>
            
            <div style="display: flex; gap: 10px; margin-top: 20px;">
                <button id="btn-cancel-event" style="flex: 1; padding: 12px; background: #95a5a6; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
                    Annuler
                </button>
                <button id="btn-save-event" style="flex: 1; padding: 12px; background: #27ae60; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
                    ✅ Ajouter
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(eventModal);
    
    // Fermeture
    eventModal.querySelector('#btn-cancel-event').addEventListener('click', () => {
        document.body.removeChild(eventModal);
    });
    
 // 🔥 RÉCUPÉRER LES DONNÉES DU PARENT
const eventIdFromParent = parentModal.dataset.eventId || null;
// teamAId et teamBId sont maintenant des paramètres de la fonction, pas besoin de les récupérer du dataset
    
    // Sauvegarde
    eventModal.querySelector('#btn-save-event').addEventListener('click', async () => {
        const type = document.getElementById('event-type').value;
        const minute = parseInt(document.getElementById('event-minute').value) || null;
        const teamSelection = document.getElementById('event-team').value; // "A" ou "B" ou ""
        const player = document.getElementById('event-player').value || null;
        const details = document.getElementById('event-details').value || null;
        
        // 🔥 RÉCUPÉRER LE teamId SELON LA SÉLECTION
        let teamId = null;
        
        if (teamSelection === 'A') {
            teamId = teamAId ? parseInt(teamAId) : null;
        } else if (teamSelection === 'B') {
            teamId = teamBId ? parseInt(teamBId) : null;
        }

        // 🔥 DEBUG - AJOUTE CETTE LIGNE
console.log("🔥 ENVOI ÉVÉNEMENT :", {
    type: type,
    minute: minute,
    playerName: player,
    teamId: teamId,  // ← DOIT AFFICHER UN NOMBRE, PAS NULL
    teamAId: teamAId, // ← DEBUG
    teamBId: teamBId, // ← DEBUG
    teamSelection: teamSelection // ← DEBUG
});
        
        try {
            const response = await fetch(`/api/matches/${matchId}/events`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    type: type,
                    minute: minute,
                    playerName: player,
                    teamId: teamId,
                    details: details
                })
            });
            
            if (!response.ok) {
                throw new Error('Erreur lors de la création de l\'événement');
            }
            
            this.setGlobalMessage('✅ Événement ajouté avec succès !', false);
            document.body.removeChild(eventModal);
            document.body.removeChild(parentModal);
            
            // 🔥 RAFRAÎCHIR TOUT LE DASHBOARD
            if (eventIdFromParent) {
                await this.refreshAllData(eventIdFromParent, token);
            }
            
            // 🔥 TRIGGER ÉVÉNEMENT GLOBAL POUR LA PAGE PUBLIQUE
            setTimeout(() => {
                window.dispatchEvent(new CustomEvent('match-updated', { 
                    detail: { matchId, eventId: eventIdFromParent } 
                }));
            }, 500);
            
        } catch (err) {
            this.setGlobalMessage('❌ Erreur lors de l\'ajout de l\'événement', true);
            console.error(err);
        }
    });
},

async saveMatchScore(matchId, scoreData, token) {
    try {
        const response = await fetch(`/api/tournament/admin/matches/${matchId}/score`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(scoreData)
        });

        if (!response.ok) {
            const json = await response.json().catch(() => ({}));
            const errorMsg = json?.message || json?.error || `HTTP ${response.status}`;
            throw new Error(errorMsg);
        }

        let message = scoreData.isFinal 
            ? "✅ Match terminé" 
            : "✅ Score temporaire enregistré";
        
        if (scoreData.hadPenalties) {
            message += " (avec tirs au but)";
        } else if (scoreData.hadExtraTime) {
            message += " (avec prolongations)";
        }
        
        this.setGlobalMessage(message, false);
    } catch (error) {
        console.error("Erreur saveMatchScore:", error);
        const errorMsg = this.extractErrorMessage(error);
        this.setGlobalMessage(`❌ ${errorMsg}`, true);
    }
},


// ================================
// 🆕 RÉCUPÉRER LES DÉTAILS D'UN MATCH
// ================================
async getMatchDetails(matchId, token) {
    try {
        const response = await fetch(`/api/matches/${matchId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) {
            throw new Error('Erreur lors de la récupération du match');
        }
        
        const data = await response.json();
        return data.data || data;
    } catch (err) {
        console.error('Erreur getMatchDetails:', err);
        return null;
    }
},

    // ================================
    // GÉNÉRER LES POULES
    // ================================
    async handleGenerateGroups(eventId, token) {
        const allowedGroups = [2, 4, 6, 8];
        const allowedQualified = [1, 2, 4];

        const nbGroups = parseInt(
            prompt("Combien de poules ? (2, 4, 6, 8)", "4"),
            10
        );

        if (!allowedGroups.includes(nbGroups)) {
            alert("Nombre de poules autorisé : 2, 4, 6, 8");
            return;
        }

        const qualifiedPerGroup = parseInt(
            prompt("Combien de qualifiés par poule ? (1, 2, 4)", "2"),
            10
        );

        if (!allowedQualified.includes(qualifiedPerGroup)) {
            alert("Nombre de qualifiés autorisé : 1, 2, 4");
            return;
        }

        try {
            await this.safePost(
                `/api/tournament/admin/${eventId}/generate-groups?nbGroups=${nbGroups}&qualifiedPerGroup=${qualifiedPerGroup}`,
                token
            );

            this.setGlobalMessage("✅ Poules générées", false);
            await this.loadGroups(eventId, token);

        } catch (err) {
            const msg = this.extractErrorMessage(err);

            if (msg.includes("Confirmation requise")) {
                const confirmForce = confirm(
                    `${msg}\n\nVoulez-vous lancer le tournoi quand même ?`
                );

                if (!confirmForce) {
                    this.setGlobalMessage("❌ Génération annulée", false);
                    return;
                }

                await this.safePost(
                    `/api/tournament/admin/${eventId}/generate-groups/force?nbGroups=${nbGroups}&qualifiedPerGroup=${qualifiedPerGroup}`,
                    token
                );

                this.setGlobalMessage("⚠️ Poules générées malgré tournoi incomplet", false);
                await this.loadGroups(eventId, token);

            } else {
                this.setGlobalMessage(`❌ ${msg}`, true);
            }
        }
    },

    // ================================
    // 🔹 4. BRACKET
    // ================================
    async loadBracket(eventId, token) {
        const container = document.getElementById("event-bracket");
        if (!container) return;

        try {
            const matches = await this.safeGet(`/api/events/${eventId}/bracket`, token);

           if (!matches || matches.length === 0) {
    this.cachedHasBracket = false; // 🔥 Pas de bracket
    container.innerHTML = `<p style="color:#7f8c8d;">Bracket non généré.</p>`;
    return;
}

this.cachedHasBracket = true; // 🔥 Bracket généré

this.cachedHasBracket = true; // 🔥 NOUVEAU

            const mainBracketMatches = matches.filter(
                m => m.round && !m.round.startsWith("C")
            );

            // Grouper par round
const rounds = {};
mainBracketMatches.forEach(m => {
    if (!rounds[m.round]) rounds[m.round] = [];
    rounds[m.round].push(m);
});

// 🔥 DÉTECTION AUTOMATIQUE des rounds présents (triés)
const roundOrder = Object.keys(rounds).sort((a, b) => {
    // Ordre logique : KO1 < KO2 < ... < QF < SF < FINAL
    const order = {
        'KO1': 1, 'KO2': 2, 'KO3': 3, 'KO4': 4, 
        'KO5': 5, 'KO6': 6, 'KO7': 7, 'KO8': 8,
        'R16': 10, 'QF': 20, 'SF': 30, 'FINAL': 40
    };
    return (order[a] || 0) - (order[b] || 0);
});

            container.innerHTML = `
                <div class="bracket-tree">
                    ${roundOrder.map((roundName, roundIndex) => {
                        const roundMatches = rounds[roundName];
                        const roundConfig = this.getRoundConfig(roundName);
                        
                        return `
                            <div class="bracket-column">
                                <h3 class="bracket-round-title" style="color: ${roundConfig.color};">
                                    ${roundConfig.label}
                                </h3>
                                <div class="bracket-matches">
                                    ${roundMatches.map((m, i) => {
                                        if (this.isBye(m)) {
                                            return `
                                                <div class="bracket-match bye">
                                                    <div class="bracket-bye-label">
                                                        🟡 BYE
                                                    </div>
                                                </div>
                                            `;
                                        }

                                        const teamAWins = m.scoreA > m.scoreB && m.scoreA !== null;
                                        const teamBWins = m.scoreB > m.scoreA && m.scoreB !== null;
                                        const isFinished = m.status === "COMPLETED";

                                        return `
                                            <div class="bracket-match ${isFinished ? 'finished' : ''}" 
                                                 style="border-left: 4px solid ${roundConfig.color};">
                                                
                                                <div class="bracket-team ${teamAWins ? 'winner' : ''}">
                                                    <span class="bracket-team-name">
                                                        ${this.escapeHtml(m.teamA || "?")}
                                                    </span>
                                                    <span class="bracket-score">
                                                        ${m.scoreA ?? "-"}
                                                    </span>
                                                </div>

                                                <div class="bracket-divider"></div>

                                                <div class="bracket-team ${teamBWins ? 'winner' : ''}">
                                                    <span class="bracket-team-name">
                                                        ${this.escapeHtml(m.teamB || "?")}
                                                    </span>
                                                    <span class="bracket-score">
                                                        ${m.scoreB ?? "-"}
                                                    </span>
                                                </div>
                                            </div>
                                        `;
                                    }).join("")}
                                </div>
                            </div>
                        `;
                    }).join("")}
                </div>
            `;

        } catch (err) {
            console.error("loadBracket error:", err);
            container.innerHTML = `<p style="color:red;">❌ Erreur chargement bracket</p>`;
        }
    },

  getRoundConfig(round) {
    const configs = {
        // 🔥 NOUVEAU : Support des rounds KO (utilisés par ton système)
        "KO1": { 
            label: "⚽ Quart de finale 1", 
            color: "#27ae60" 
        },
        "KO2": { 
            label: "⚽ Quart de finale 2", 
            color: "#27ae60" 
        },
        "KO3": { 
            label: "⚽ Quart de finale 3", 
            color: "#27ae60" 
        },
        "KO4": { 
            label: "⚽ Quart de finale 4", 
            color: "#27ae60" 
        },
        "KO5": { 
            label: "🎯 Demi-finale 1", 
            color: "#e67e22" 
        },
        "KO6": { 
            label: "🎯 Demi-finale 2", 
            color: "#e67e22" 
        },
        "KO7": { 
            label: "🏆 Finale", 
            color: "#c0392b" 
        },
        "KO8": { 
            label: "🥉 Match pour la 3ème place", 
            color: "#f39c12" 
        },
        
        // Rounds classiques (au cas où ton système les utiliserait aussi)
        "R16": { 
            label: "⚽ 1/8 de finale", 
            color: "#3498db" 
        },
        "QF": { 
            label: "⚽ Quarts de finale", 
            color: "#27ae60" 
        },
        "SF": { 
            label: "🎯 Demi-finales", 
            color: "#e67e22" 
        },
        "FINAL": { 
            label: "🏆 Finale", 
            color: "#c0392b" 
        }
    };
    
    return configs[round] || { 
        label: round, 
        color: "#95a5a6" 
    };
},

async handleGenerateBracket(eventId, token, mode = "semi") {
  const btnUefa = document.getElementById("btn-generate-bracket-uefa");
  const btnLdc  = document.getElementById("btn-generate-bracket-semi");

  try {
    // 🔒 anti double-clic
    btnUefa && (btnUefa.disabled = true);
    btnLdc  && (btnLdc.disabled  = true);

    this.setGlobalMessage("🔄 Génération du bracket en cours...", false);

    const phase = this.currentTournamentPhase;

    if (phase === "BARRAGE") {
      await this.safePost(`/api/events/${eventId}/bracket/generate-after-barrages`, token);
      this.setGlobalMessage("✅ Phase finale générée avec succès !", false);

    } else {
      if (mode === "uefa") {
        await this.safePost(`/api/events/${eventId}/bracket/generate`, token);
        this.setGlobalMessage("✅ Bracket UEFA généré avec succès !", false);
      } else {
        await this.safePost(`/api/events/${eventId}/bracket/semi-directed`, token);
        this.setGlobalMessage("✅ Bracket LDC (tirage) généré avec succès !", false);
      }
    }

    await this.refreshAllData(eventId, token);

  } catch (err) {
    const errorMsg = this.extractErrorMessage(err);
    this.setGlobalMessage(`❌ ${errorMsg}`, true);

    // 🔓 réactiver si erreur
    btnUefa && (btnUefa.disabled = false);
    btnLdc  && (btnLdc.disabled  = false);
  }
},

   // ================================
// 🔹 5. CONSOLANTE
// ================================
async loadConsolante(eventId, token) {
    const container = document.getElementById("event-consolante");
    if (!container) return;

    try {
        const matches = await this.safeGet(`/api/events/${eventId}/consolante`, token);

        if (!matches || matches.length === 0) {
            container.innerHTML = `<p style="color:#7f8c8d;">Consolante non générée.</p>`;
            return;
        }

        const consolanteMatches = matches.filter(
            m => m.round && m.round.startsWith("C")
        );

        if (consolanteMatches.length === 0) {
            container.innerHTML = `<p style="color:#7f8c8d;">Consolante vide.</p>`;
            return;
        }

        // ✅ GROUPER PAR ROUND (COMME LE BRACKET PRINCIPAL)
        const rounds = {};
        consolanteMatches.forEach(m => {
            if (!rounds[m.round]) rounds[m.round] = [];
            rounds[m.round].push(m);
        });

        // ✅ ORDRE DES ROUNDS
        const roundOrder = ["CQF", "CSF", "CFINAL"].filter(r => rounds[r]);

        // ✅ UTILISER LA MÊME STRUCTURE QUE LE BRACKET PRINCIPAL
        container.innerHTML = `
            <div class="bracket-tree bracket-section consolation">
                ${roundOrder.map((roundName, roundIndex) => {
                    const roundMatches = rounds[roundName];
                    const roundConfig = this.getConsolanteRoundConfig(roundName);
                    
                    return `
                        <div class="bracket-column">
                            <h3 class="bracket-round-title" style="color: ${roundConfig.color};">
                                ${roundConfig.label}
                            </h3>
                            <div class="bracket-matches">
                               ${roundMatches.map((m, i) => {

  // ✅ PLACEHOLDER = en attente des vainqueurs (pas un BYE)
  const isPlaceholder =
    (!m.teamA || m.teamA === "?") &&
    (!m.teamB || m.teamB === "?") &&
    m.round;

  if (isPlaceholder) {
    return `
      <div class="bracket-match placeholder">
        <div class="bracket-bye-label">⏳ En attente des vainqueurs</div>
      </div>
    `;
  }

  // ✅ vrai BYE
  if (this.isBye(m)) {
    return `
      <div class="bracket-match bye">
        <div class="bracket-bye-label">🟡 BYE</div>
      </div>
    `;
  }

                                    const teamAWins = m.scoreA > m.scoreB && m.scoreA !== null;
                                    const teamBWins = m.scoreB > m.scoreA && m.scoreB !== null;
                                    const isFinished = m.status === "COMPLETED";

                                    return `
                                        <div class="bracket-match ${isFinished ? 'finished' : ''}" 
                                             style="border-left: 4px solid ${roundConfig.color};">
                                            
                                            <div class="bracket-team ${teamAWins ? 'winner' : ''}">
                                                <span class="bracket-team-name">
                                                    ${this.escapeHtml(m.teamA || "?")}
                                                </span>
                                                <span class="bracket-score">
                                                    ${m.scoreA ?? "-"}
                                                </span>
                                            </div>

                                            <div class="bracket-divider"></div>

                                            <div class="bracket-team ${teamBWins ? 'winner' : ''}">
                                                <span class="bracket-team-name">
                                                    ${this.escapeHtml(m.teamB || "?")}
                                                </span>
                                                <span class="bracket-score">
                                                    ${m.scoreB ?? "-"}
                                                </span>
                                            </div>
                                        </div>
                                    `;
                                }).join("")}
                            </div>
                        </div>
                    `;
                }).join("")}
            </div>
        `;
    } catch (err) {
        console.error("loadConsolante error:", err);
        container.innerHTML = `<p style="color:red;">❌ Erreur chargement consolante</p>`;
    }
},

async hasConsolante(eventId) {
  try {
    const token = Auth.accessToken || localStorage.getItem("accessToken");
    if (!token) return false;

    const res = await this.safeGet(`/api/events/${eventId}/consolante`, token);

    // safeGet peut renvoyer soit tableau, soit ApiResponse { data: [...] }
    const matches = res?.data ?? res ?? [];
    if (!Array.isArray(matches)) return false;

    // Consolante = rounds CQF/CSF/CFINAL (ou tout round qui commence par "C")
    return matches.some(m => {
      const r = (m?.round ?? "").toString().toUpperCase().trim();
      return r === "CQF" || r === "CSF" || r === "CFINAL" || r.startsWith("C");
    });
  } catch (e) {
    console.warn("⚠️ hasConsolante() failed", e);
    return false;
  }
},


// ✅ AJOUTE CETTE NOUVELLE FONCTION JUSTE APRÈS
getConsolanteRoundConfig(round) {
    const configs = {
        "CQF": { 
            label: "⚽ Quarts de finale consolante", 
            color: "#27ae60" 
        },
        "CSF": { 
            label: "🎯 Demi-finales consolante", 
            color: "#2ecc71" 
        },
        "CFINAL": { 
            label: "🏆 Finale consolante", 
            color: "#16a085" 
        }
    };
    
    return configs[round] || { 
        label: round, 
        color: "#95a5a6" 
    };
},

   async handleGenerateConsolante(eventId, token) {

  if (!confirm(
    "🥈 Générer la consolante (UEFA)\n\n" +
    "✅ Elle prend UNIQUEMENT les équipes NON qualifiées des poules.\n" +
    "⚠️ Assure-toi que les matchs de poules sont terminés.\n\n" +
    "Cette action est irréversible."
  )) {
    return;
  }

  try {
    this.setGlobalMessage("🔄 Génération de la consolante...", false);
    await this.safePost(`/api/events/${eventId}/consolante/generate`, token);
    this.setGlobalMessage("✅ Consolante générée avec succès", false);
    await this.refreshAllData(eventId, token);

  } catch (err) {
    const errorMsg = this.extractErrorMessage(err);
    this.setGlobalMessage(`❌ ${errorMsg}`, true);
  }
}
,


    /**
 * 🏆 Génère le bracket principal (UEFA ou SEMI_DIRECTED)
 */
async generateBracket(eventId, type, token) {
    console.log(`🎯 generateBracket appelé: eventId=${eventId}, type=${type}`);
    
    try {
        // Afficher un loader
        this.setGlobalMessage("🔄 Génération du bracket en cours...", false);
        
        // Déterminer l'endpoint selon le type
        const endpoint = type === 'SEMI_DIRECTED' 
            ? `/api/tournament/admin/${eventId}/generate-bracket-semi-directed`
            : `/api/tournament/admin/${eventId}/generate-bracket`;
        
        console.log(`📡 Appel API: POST ${endpoint}`);
        
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: 'Erreur inconnue' }));
            throw new Error(error.message || `Erreur ${response.status}`);
        }

        const result = await response.json();
        console.log('✅ Bracket généré:', result);

        // Notification de succès
        const message = type === 'SEMI_DIRECTED' 
            ? '✅ Bracket LDC généré avec succès !'
            : '✅ Bracket UEFA généré avec succès !';
        
        this.setGlobalMessage(message, false);

        // Recharger les détails pour mettre à jour l'interface
        await this.refreshAllData(eventId, token);

    } catch (error) {
        console.error('❌ Erreur génération bracket:', error);
        this.setGlobalMessage(`❌ ${this.extractErrorMessage(error)}`, true);
    }
},

/**
 * 🥉 Génère la consolante (3e et 4e places)
 */
async generateConsolante(eventId, token) {
    console.log(`🎯 generateConsolante appelé: eventId=${eventId}`);
    
    try {
        this.setGlobalMessage("🔄 Génération de la consolante...", false);
        
        const endpoint = `/api/tournament/admin/${eventId}/generate-consolante`;
        console.log(`📡 Appel API: POST ${endpoint}`);
        
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: 'Erreur inconnue' }));
            throw new Error(error.message || `Erreur ${response.status}`);
        }

        const result = await response.json();
        console.log('✅ Consolante générée:', result);

        this.setGlobalMessage('✅ Consolante générée avec succès !', false);
        await this.refreshAllData(eventId, token);

    } catch (error) {
        console.error('❌ Erreur génération consolante:', error);
        this.setGlobalMessage(`❌ ${this.extractErrorMessage(error)}`, true);
    }
},
    // ================================
    // 🔹 6. MATCHS
    // ================================
 async loadMatches(eventId, token) {
    const container = document.getElementById("event-matches");
    if (!container) return;

    try {
       const response = await this.safeGet(`/api/events/${eventId}/matches`, token);

// ✅ Cas "aucun match" : reset caches + UI + return
if (!response || response.length === 0) {
  this.cachedMatchesCount = 0;
  this.cachedRemainingScores = 0;

  container.innerHTML = `
      <div class="match-card">
          <p>Aucun match généré</p>
          <button class="match-button btn-generate-matches">⚽ Générer les matchs</button>
      </div>
  `;
  container.querySelector(".btn-generate-matches")
      ?.addEventListener("click", async () => {
          await this.handleGenerateMatches(eventId, token);
      });
  return;
}

// 🔥 Mettre à jour le cache pour la checklist
this.cachedMatchesCount = response.length;

// ✅ Progression: combien de matchs "jouables" restent à scorer
const isRealTeam = (t) => {
  const s = String(t ?? "").trim();
  return s.length > 0 && s !== "?" && s.toUpperCase() !== "TBD";
};

const isPlayable = (m) => {
  // jouable = 2 équipes réelles + pas BYE
  return isRealTeam(m.teamA) && isRealTeam(m.teamB) && !this.isBye(m);
};

const isCompleted = (m) => this.normStatus(m.status) === "COMPLETED";

this.cachedRemainingScores = response
  .filter(isPlayable)
  .filter(m => !isCompleted(m))
  .length;
console.log("[Progression] matches=", this.cachedMatchesCount, "remainingScores=", this.cachedRemainingScores);

        const poolMatches = response.filter(m => m.group !== null);
        const bracketMatches = response.filter(m => m.group === null && m.round !== null);
        const koLocked = bracketMatches.some(m =>
             m.status === "IN_PROGRESS" || m.status === "COMPLETED"
            );

        const singleMatches = response.filter(m => m.group === null && m.round === null);

        const groups = {};
        for (const m of poolMatches) {
            const groupName = m.group || m.groupName || "Groupe";
            if (!groups[groupName]) groups[groupName] = [];
            groups[groupName].push(m);
        }

        let html = `<div class="match-groups-wrapper">`;

        // ============================================
        // 🔵 SECTION POULES
        // ============================================
        Object.keys(groups).sort().forEach(groupName => {

           

            html += `
                <div class="match-container">
                    <h3 class="match-group-title">${this.escapeHtml(groupName)}</h3>
            `;


            groups[groupName].forEach(match => {
                const scoreA = match.scoreTeamA ?? "-";
                const scoreB = match.scoreTeamB ?? "-";
                const hasScore = match.scoreTeamA !== null && match.scoreTeamB !== null;
                const isFinished = match.status === "COMPLETED" || this.isBye(match);
                const deleteLocked = match.status === "IN_PROGRESS" || match.status === "COMPLETED";
                const deleteReason = "Impossible : match déjà joué";

                const teamAWins = hasScore && scoreA > scoreB;
                const teamBWins = hasScore && scoreB > scoreA;
                
                const safeTeamA = this.escapeHtml(match.teamA);
                const safeTeamB = this.escapeHtml(match.teamB);

                html += `
                    <div class="match-card ${isFinished ? "finished" : ""}">
                        <div class="match-teams">
                            <div class="match-row">
                                <span class="match-team-name">${safeTeamA}</span>
                                <span class="match-score" style="${teamAWins ? 'color:#27ae60;font-weight:900;' : ''}">
                                    ${scoreA}
                                </span>
                            </div>

                            <div style="border-bottom:1px solid #e0e0e0;margin:8px 0;"></div>

                            <div class="match-row">
                                <span class="match-team-name">${safeTeamB}</span>
                                <span class="match-score" style="${teamBWins ? 'color:#27ae60;font-weight:900;' : ''}">
                                    ${scoreB}
                                </span>
                            </div>
                        </div>
${match.status === 'SCHEDULED' ? `
  <button 
    class="match-button btn-start-match"
    data-match-id="${match.id}"
    style="background: #27ae60; margin-bottom: 8px;">
    ▶️ Démarrer le match
  </button>
` : ''}

${match.status === 'IN_PROGRESS' ? `
  <div style="
    background: #e74c3c;
    color: white;
    padding: 8px;
    border-radius: 6px;
    text-align: center;
    font-weight: 700;
    margin-bottom: 8px;
    animation: pulse 1.5s infinite;
  ">
    🔴 MATCH EN COURS
  </div>
` : ''}

<button 
  class="match-button btn-edit-score"
  data-match-id="${match.id}"
  data-team-a="${safeTeamA}"
  data-team-b="${safeTeamB}"
  data-score-a="${scoreA}"
  data-score-b="${scoreB}"
  ${isFinished ? 'disabled title="Match terminé" style="opacity:0.6;cursor:not-allowed;"' : ''}
>
  ${isFinished
    ? (this.isBye(match) ? "🟡 BYE – qualifié automatiquement" : "✅ Score final")
    : (hasScore ? "✏️ Modifier le score" : "📝 Saisir le score")
  }
</button>
<button
  class="match-button btn-delete-match"
  data-match-id="${match.id}"
  data-team-a="${safeTeamA}"
  data-team-b="${safeTeamB}"
  ${deleteLocked
    ? `disabled title="${deleteReason}" style="background:#e74c3c;opacity:0.6;cursor:not-allowed;margin-top:8px;"`
    : `style="background:#e74c3c;margin-top:8px;"`
  }
>
  🗑️ Supprimer ce match
</button>

                    </div>
                `;
            });

            html += `</div>`;
        });

        // ============================================
        // 🏆 SECTION BRACKET PRINCIPAL
        // ============================================
        const mainBracketMatches = bracketMatches.filter(m => !m.round || !m.round.startsWith('C'));

        if (mainBracketMatches.length > 0) {
            html += `
                <div class="match-container">
                    <h3 class="match-group-title">🏆 Bracket principal (Phase finale)</h3>
            `;

            mainBracketMatches.forEach(match => {
                const scoreA = match.scoreTeamA ?? "-";
                const scoreB = match.scoreTeamB ?? "-";
                const hasScore = match.scoreTeamA !== null && match.scoreTeamB !== null;
                const isFinished = match.status === "COMPLETED" || this.isBye(match);

                const safeTeamA = this.escapeHtml(match.teamA || "?");
                const safeTeamB = this.escapeHtml(match.teamB || "?");
                const playable = !!match.teamA && !!match.teamB; // pas de "?" si null
                const blockedReason = "En attente des qualifiés (les 2 équipes ne sont pas encore connues)";
                const deleteLocked = match.status === "IN_PROGRESS" || match.status === "COMPLETED";
                const deleteReason = "Impossible : match déjà joué";



                html += `
                    <div class="match-card ${isFinished ? "finished" : ""}">
                        <div class="match-row" style="font-weight:700;margin-bottom:10px;">
                            ${this.getRoundLabel(match.round)}
                        </div>

                        <div class="match-teams">
                            <div class="match-row">
                                <span class="match-team-name">${safeTeamA}</span>
                                <span class="match-score">${scoreA}</span>
                            </div>
                            <div class="match-row">
                                <span class="match-team-name">${safeTeamB}</span>
                                <span class="match-score">${scoreB}</span>
                            </div>
                        </div>

                       ${match.status === 'SCHEDULED' ? `
  <button 
    class="match-button btn-start-match"
    data-match-id="${match.id}"
    ${playable ? "" : "disabled"}
    title="${playable ? "" : blockedReason}"
    style="background: #27ae60; margin-bottom: 8px; ${playable ? "" : "opacity:0.6;cursor:not-allowed;"}">
    ▶️ Démarrer le match
  </button>
` : ''}


                        ${match.status === 'IN_PROGRESS' ? `
                            <div style="
                                background: #e74c3c;
                                color: white;
                                padding: 8px;
                                border-radius: 6px;
                                text-align: center;
                                font-weight: 700;
                                margin-bottom: 8px;
                                animation: pulse 1.5s infinite;
                            ">
                                🔴 MATCH EN COURS
                            </div>
                        ` : ''}

                      <button 
  class="match-button btn-edit-score"
  data-match-id="${match.id}"
  data-team-a="${safeTeamA}"
  data-team-b="${safeTeamB}"
  data-score-a="${scoreA}"
  data-score-b="${scoreB}"
  ${(!playable || isFinished) ? `disabled title="${!playable ? blockedReason : "Match terminé"}" style="opacity:0.6;cursor:not-allowed;"` : ''}
>
  ${!playable
    ? "⏳ En attente des qualifiés"
    : isFinished
      ? (this.isBye(match) ? "🟡 BYE – qualifié automatiquement" : "✅ Score final")
      : (hasScore ? "✏️ Modifier le score" : "📝 Saisir le score")
  }
</button>

   <button
  class="match-button btn-delete-match"
  data-match-id="${match.id}"
  data-team-a="${safeTeamA}"
  data-team-b="${safeTeamB}"
  ${deleteLocked
    ? `disabled title="${deleteReason}" style="background:#e74c3c;opacity:0.6;cursor:not-allowed;margin-top:8px;"`
    : `style="background:#e74c3c;margin-top:8px;"`
  }
>
  🗑️ Supprimer ce match
</button>

                    </div>
                `;
            });

            html += `</div>`;
        }

        // ============================================
        // ♻️ SECTION CONSOLANTE
        // ============================================
        const consolanteMatches = bracketMatches.filter(m => m.round && m.round.startsWith('C'));

        if (consolanteMatches.length > 0) {
            html += `
                <div class="match-container">
                    <h3 class="match-group-title" style="color:#27ae60;">♻️ Consolante (Phase finale)</h3>
            `;

            consolanteMatches.forEach(match => {
                const scoreA = match.scoreTeamA ?? "-";
                const scoreB = match.scoreTeamB ?? "-";
                const hasScore = match.scoreTeamA !== null && match.scoreTeamB !== null;
                const isFinished = match.status === "COMPLETED" || this.isBye(match);

                const safeTeamA = this.escapeHtml(match.teamA || "?");
                const safeTeamB = this.escapeHtml(match.teamB || "?");

                const playable = !!match.teamA && !!match.teamB;
                const blockedReason = "En attente des qualifiés (les 2 équipes ne sont pas encore connues)";

                const deleteLocked = match.status === "IN_PROGRESS" || match.status === "COMPLETED";
                const deleteReason = "Impossible : match déjà joué";



                html += `
                    <div class="match-card ${isFinished ? "finished" : ""}" style="border-left: 4px solid #27ae60;">
                        <div class="match-row" style="font-weight:700;margin-bottom:10px;color:#27ae60;">
                            ${this.getRoundLabel(match.round)}
                        </div>

                        <div class="match-teams">
                            <div class="match-row">
                                <span class="match-team-name">${safeTeamA}</span>
                                <span class="match-score">${scoreA}</span>
                            </div>
                            <div class="match-row">
                                <span class="match-team-name">${safeTeamB}</span>
                                <span class="match-score">${scoreB}</span>
                            </div>
                        </div>

                      ${match.status === 'SCHEDULED' ? `
  <button 
    class="match-button btn-start-match"
    data-match-id="${match.id}"
    ${playable ? "" : "disabled"}
    title="${playable ? "" : blockedReason}"
    style="background: #27ae60; margin-bottom: 8px; ${playable ? "" : "opacity:0.6;cursor:not-allowed;"}">
    ▶️ Démarrer le match
  </button>
` : ''}


                        ${match.status === 'IN_PROGRESS' ? `
                            <div style="
                                background: #e74c3c;
                                color: white;
                                padding: 8px;
                                border-radius: 6px;
                                text-align: center;
                                font-weight: 700;
                                margin-bottom: 8px;
                                animation: pulse 1.5s infinite;
                            ">
                                🔴 MATCH EN COURS
                            </div>
                        ` : ''}

                       <button 
  class="match-button btn-edit-score"
  data-match-id="${match.id}"
  data-team-a="${safeTeamA}"
  data-team-b="${safeTeamB}"
  data-score-a="${scoreA}"
  data-score-b="${scoreB}"
  ${(!playable || isFinished) ? `disabled title="${!playable ? blockedReason : "Match terminé"}" style="opacity:0.6;cursor:not-allowed;"` : ''}
>
  ${!playable
    ? "⏳ En attente des qualifiés"
    : isFinished
      ? (this.isBye(match) ? "🟡 BYE – qualifié automatiquement" : "✅ Score final")
      : (hasScore ? "✏️ Modifier le score" : "📝 Saisir le score")
  }
</button>
<button
  class="match-button btn-delete-match"
  data-match-id="${match.id}"
  data-team-a="${safeTeamA}"
  data-team-b="${safeTeamB}"
  ${deleteLocked
    ? `disabled title="${deleteReason}" style="background:#e74c3c;opacity:0.6;cursor:not-allowed;margin-top:8px;"`
    : `style="background:#e74c3c;margin-top:8px;"`
  }
>
  🗑️ Supprimer ce match
</button>

                    </div>
                `;
            });

            html += `</div>`;
        }

        // MATCH UNIQUE
if (singleMatches.length > 0) {
    html += `<div class="match-container"><h3 class="match-group-title">⚽ Match unique</h3>`;
    singleMatches.forEach(match => {
        const scoreA = match.scoreTeamA ?? "-";
        const scoreB = match.scoreTeamB ?? "-";
        html += `
            <div class="match-card">
                <div class="match-teams">
                    <div class="match-row"><span>${this.escapeHtml(match.teamA)}</span><span>${scoreA}</span></div>
                    <div class="match-row"><span>${this.escapeHtml(match.teamB)}</span><span>${scoreB}</span></div>
                </div>
                <button class="match-button btn-edit-score" data-match-id="${match.id}" data-team-a="${this.escapeHtml(match.teamA)}" data-team-b="${this.escapeHtml(match.teamB)}" data-score-a="${scoreA}" data-score-b="${scoreB}">📝 Saisir le score</button>
            </div>`;
    });
    html += `</div>`;
}

        html += `</div>`;
        container.innerHTML = html;

        const btnDeleteRound = document.getElementById("btn-delete-round");
if (btnDeleteRound) {
  btnDeleteRound.disabled = koLocked;
  btnDeleteRound.title = koLocked
    ? "Impossible : un match de phase finale a déjà commencé/terminé"
    : "";
}


        // ============================================
        // 🎮 HANDLERS D'ÉVÉNEMENTS
        // ============================================
         

        // Handler pour éditer le score (EXISTANT)
        container.querySelectorAll(".btn-edit-score").forEach(btn => {
            btn.addEventListener("click", e => {
                         if (e.currentTarget.disabled) return; 

                const b = e.currentTarget;
                this.showScoreModal(
                    b.dataset.matchId,
                    b.dataset.teamA,
                    b.dataset.teamB,
                    parseInt(b.dataset.scoreA) || 0,
                    parseInt(b.dataset.scoreB) || 0,
                    eventId,
                    token
                );
            });
        });

      
        // 🆕 Handler pour démarrer un match (NOUVEAU)
        container.querySelectorAll(".btn-start-match").forEach(btn => {
            btn.addEventListener("click", async (e) => {

                 if (e.currentTarget.disabled) return; 
                const matchId = e.currentTarget.dataset.matchId;
                
                if (!confirm('🔴 Démarrer ce match maintenant ?\n\nLe match passera en direct et sera visible par tous les spectateurs.')) {
                    return;
                }
                
                e.currentTarget.disabled = true;
                e.currentTarget.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Démarrage...';
                
                try {
                    const response = await fetch(`/api/matches/${matchId}/start`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    
                    if (!response.ok) {
                        throw new Error('Erreur lors du démarrage du match');
                    }
                    
                    this.setGlobalMessage('✅ Match démarré avec succès !', false);
                    await this.refreshAllData(eventId, token);
                    
                } catch (err) {
                    this.setGlobalMessage('❌ ' + err.message, true);
                    console.error(err);
                    e.currentTarget.disabled = false;
                    e.currentTarget.innerHTML = '▶️ Démarrer le match';
                }
            });
        });

    } catch (error) {
        console.error("Erreur chargement matchs:", error);
        const errorMsg = this.extractErrorMessage(error);
        container.innerHTML = `<p style="color:#e74c3c;">❌ ${this.escapeHtml(errorMsg)}</p>`;
    }
            // 🗑️ Handler pour supprimer un match (NOUVEAU)
container.querySelectorAll(".btn-delete-match").forEach(btn => {
    btn.addEventListener("click", async (e) => {
        if (e.currentTarget.disabled) return;

        const matchId = e.currentTarget.dataset.matchId;
        const teamA = e.currentTarget.dataset.teamA;
        const teamB = e.currentTarget.dataset.teamB;
        
        if (!confirm(`⚠️ SUPPRIMER CE MATCH ?\n\n${teamA} vs ${teamB}\n\nLe match sera archivé (soft delete) et pourra être restauré.`)) {
            return;
        }
        
        await this.handleDeleteMatch(matchId, eventId, token);
    });
});

},

    async handleGenerateMatches(eventId, token) {
        if (!confirm("Générer tous les matchs du tournoi ?\n\nLes équipes doivent être inscrites.\n\nCette action est irréversible.")) {
            return;
        }

        try {
            this.setGlobalMessage("🔄 Génération des matchs...", false);
            await this.safePost(`/api/events/tournament/${eventId}/generate-matches`, token);
            this.setGlobalMessage("✅ Matchs générés avec succès", false);
            await this.refreshAllData(eventId, token);
        } catch (err) {
            const errorMsg = this.extractErrorMessage(err);
            this.setGlobalMessage(`❌ ${errorMsg}`, true);
        }
    },

    // ================================
    // 🔹 7. RÉSUMÉ
    // ================================
    async loadSummary(eventId, token) {
        const container = document.getElementById("event-summary");
        if (!container) return;

        try {
            const data = await this.safeGet(`/api/events/${eventId}/tournament-summary`, token);

            let html = "";

            if (data.finalResults) {
                const fr = data.finalResults;
                
                html += `
                    <div style="
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 20px;
                    ">
                `;
                
                if (fr.champion) {
                    const safeChampion = this.escapeHtml(fr.champion);
                    const safeFinalist = this.escapeHtml(fr.finalist || "");
                    const safeThird = this.escapeHtml(fr.thirdPlace || "");

                    html += `
                        <div style="
                            background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%);
                            padding: 20px;
                            border-radius: 12px;
                            color: white;
                            box-shadow: 0 3px 10px rgba(230, 126, 34, 0.25);
                        ">
                            <h3 style="margin: 0 0 15px 0; font-size: 1.2em; text-align: center; font-weight: 700;">
                                🏆 Podium du tournoi
                            </h3>
                            
                            <div style="background: rgba(255,255,255,0.3); padding: 18px; border-radius: 10px; text-align: center; margin-bottom: 12px;">
                                <div style="font-size: 3em; margin-bottom: 8px;">🏆</div>
                                <div style="font-weight: 700; font-size: 0.95em; line-height: 1.3;">${safeChampion}</div>
                                <div style="margin-top: 6px; font-size: 0.75em; opacity: 0.95; text-transform: uppercase; letter-spacing: 0.5px;">CHAMPION</div>
                            </div>
                            
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                                ${safeFinalist ? `
                                    <div style="background: rgba(255,255,255,0.2); padding: 15px 10px; border-radius: 8px; text-align: center;">
                                        <div style="font-size: 2.2em; margin-bottom: 6px;">🥈</div>
                                        <div style="font-weight: 600; font-size: 0.8em; line-height: 1.25;">${safeFinalist}</div>
                                        <div style="margin-top: 5px; font-size: 0.7em; opacity: 0.9;">2ème place</div>
                                    </div>
                                ` : ''}
                                
                                ${safeThird ? `
                                    <div style="background: rgba(255,255,255,0.2); padding: 15px 10px; border-radius: 8px; text-align: center;">
                                        <div style="font-size: 2.2em; margin-bottom: 6px;">🥉</div>
                                        <div style="font-weight: 600; font-size: 0.8em; line-height: 1.25;">${safeThird}</div>
                                        <div style="margin-top: 5px; font-size: 0.7em; opacity: 0.9;">3ème place</div>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    `;
                }

                if (fr.consolanteWinner) {
                    const safeWinner = this.escapeHtml(fr.consolanteWinner);
                    const safeFinalist = this.escapeHtml(fr.consolanteFinalist || "");
                    const safeThird = this.escapeHtml(fr.consolanteThird || "");
                    const safeFourth = this.escapeHtml(fr.consolanteFourth || "");

                    html += `
                        <div style="
                            background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%);
                            padding: 20px;
                            border-radius: 12px;
                            color: white;
                            box-shadow: 0 3px 10px rgba(46, 204, 113, 0.25);
                        ">
                            <h3 style="margin: 0 0 15px 0; font-size: 1.1em; text-align: center; font-weight: 700;">
                                ♻️ Podium Consolante
                            </h3>
                            
                            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px;">
                                <div style="background: rgba(255,255,255,0.25); padding: 12px 8px; border-radius: 8px; text-align: center;">
                                    <div style="font-size: 1.8em; margin-bottom: 4px;">🏆</div>
                                    <div style="font-weight: 700; font-size: 0.75em; line-height: 1.2;">${safeWinner}</div>
                                    <div style="font-size: 0.65em; margin-top: 4px; opacity: 0.9;">Champion</div>
                                </div>
                                
                                ${safeFinalist ? `
                                    <div style="background: rgba(255,255,255,0.2); padding: 12px 8px; border-radius: 8px; text-align: center;">
                                        <div style="font-size: 1.8em; margin-bottom: 4px;">🥈</div>
                                        <div style="font-weight: 600; font-size: 0.75em; line-height: 1.2;">${safeFinalist}</div>
                                        <div style="font-size: 0.65em; margin-top: 4px; opacity: 0.9;">2ème place</div>
                                    </div>
                                ` : ''}
                                
                                ${safeThird ? `
                                    <div style="background: rgba(255,255,255,0.2); padding: 12px 8px; border-radius: 8px; text-align: center;">
                                        <div style="font-size: 1.8em; margin-bottom: 4px;">🥉</div>
                                        <div style="font-weight: 600; font-size: 0.75em; line-height: 1.2;">${safeThird}</div>
                                        <div style="font-size: 0.65em; margin-top: 4px; opacity: 0.9;">3ème place</div>
                                    </div>
                                ` : ''}
                                
                                ${safeFourth ? `
                                    <div style="background: rgba(255,255,255,0.2); padding: 12px 8px; border-radius: 8px; text-align: center;">
                                        <div style="font-size: 1.8em; margin-bottom: 4px;">4️⃣</div>
                                        <div style="font-weight: 600; font-size: 0.75em; line-height: 1.2;">${safeFourth}</div>
                                        <div style="font-size: 0.65em; margin-top: 4px; opacity: 0.9;">4ème place</div>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    `;
                }
                
                html += `</div>`;
            }

            container.innerHTML = html || `<p style="color: #7f8c8d;">Le tournoi n'est pas encore terminé</p>`;

        } catch (err) {
            console.error("loadSummary error:", err);
            const errorMsg = this.extractErrorMessage(err);
            container.innerHTML = `<p style="color: #e74c3c;">❌ ${this.escapeHtml(errorMsg)}</p>`;
        }
    },

    // ═══════════════════════════════════════════════════════════
    // 🆕 CHARGER LES ÉVÉNEMENTS ARCHIVÉS (ADMIN)
    // ═══════════════════════════════════════════════════════════
    async loadArchivedEvents(eventId, token) {
        const container = document.getElementById('archived-events-list');
        if (!container) return;

        container.innerHTML = '<div class="loader">⏳ Chargement...</div>';

        try {
            const res = await this.safeGet('/api/events/admin/deleted', token);
            const events = res || [];

            if (events.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-box-open"></i>
                        <h3>Aucun événement archivé</h3>
                        <p>Les événements archivés apparaîtront ici</p>
                    </div>
                `;
                return;
            }

            // Afficher les events archivés
            let html = '<div style="display: flex; flex-direction: column; gap: 15px;">';
            
            events.forEach(event => {
                const date = new Date(event.date).toLocaleDateString('fr-FR');
                const deletedDate = event.deletedAt ? new Date(event.deletedAt).toLocaleDateString('fr-FR') : 'N/A';
                
                html += `
                    <div style="
                        background: #f8f9fa;
                        border: 2px solid #e0e0e0;
                        border-radius: 12px;
                        padding: 20px;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        gap: 20px;
                    ">
                        <div style="flex: 1;">
                            <h3 style="margin: 0 0 10px 0; color: #2c3e50;">
                                ${this.escapeHtml(event.name)}
                            </h3>
                            <div style="color: #7f8c8d; font-size: 0.9em;">
                                📅 Date : ${date}<br>
                                📦 Archivé le : ${deletedDate}<br>
                                📍 ${this.escapeHtml(event.location || 'Lieu NC')}
                            </div>
                        </div>
                        
                        <button 
                            class="admin-btn btn-restore-event"
                            style="background: #10b981; white-space: nowrap;"
                            data-event-id="${event.id}"
                        >
                            <i class="fas fa-undo"></i> Restaurer
                        </button>
                    </div>
                `;
            });
            
            html += '</div>';
            container.innerHTML = html;

            // Ajouter les listeners sur les boutons Restaurer
            container.querySelectorAll('.btn-restore-event').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const eventId = e.currentTarget.dataset.eventId;
                    await this.restoreEvent(eventId, token);
                });
            });

        } catch (err) {
            console.error('Erreur chargement events archivés:', err);
            container.innerHTML = `
                <p style="color: #e74c3c; text-align: center;">
                    ❌ Erreur de chargement
                </p>
            `;
        }
    },


                    // ═══════════════════════════════════════════════════════════
    // 🆕 RESTAURER UN ÉVÉNEMENT ARCHIVÉ
    // ═══════════════════════════════════════════════════════════
    async restoreEvent(eventId, token) {
        if (!confirm('♻️ RESTAURER CET ÉVÉNEMENT ?\n\nL\'événement redeviendra visible dans l\'historique public.')) {
            return;
        }

        try {
            this.setGlobalMessage('🔄 Restauration en cours...', false);

            const res = await this.safePost(
                `/api/events/admin/${eventId}/restore`,
                token,
                null,
                'POST'
            );

            this.setGlobalMessage('✅ Événement restauré avec succès !', false);

            // Recharger la liste des archivés
            await this.loadArchivedEvents(eventId, token);

        } catch (err) {
            const errorMsg = this.extractErrorMessage(err);
            this.setGlobalMessage(`❌ ${errorMsg}`, true);
        }
    },

    displayTournamentFormat(event) {
        if (!event || !event.groupCount || !event.qualifiedPerGroup) return;

        const el = document.getElementById("tournament-format");
        if (!el) return;

        el.textContent =
            `📐 Format du tournoi : ${event.groupCount} poules – ` +
            `${event.qualifiedPerGroup} qualifiés par poule`;
    },

   disableGenerateGroupsButton(reason = "✅ Poules déjà générées") {
  const btn = document.getElementById("btn-generate-groups");
  if (!btn) return;

  btn.disabled = true;                // ✅ IMPORTANT
  btn.textContent = reason;
  btn.style.opacity = "0.6";
  btn.style.cursor = "not-allowed";
},


    enableGenerateGroupsButton() {
        const btn = document.getElementById("btn-generate-groups");
        if (!btn) return;

        btn.disabled = false;
        btn.textContent = "🧩 Générer les poules";
        btn.style.opacity = "1";
        btn.style.cursor = "pointer";
    },

     /**
     * ✅ NOUVEAU : Démarre le tournoi
     */
 async startTournament() {
    const eventId = this.extractEventIdFromPath();
    const token = localStorage.getItem("accessToken");
    
    if (!confirm('⚠️ Êtes-vous sûr de vouloir DÉMARRER ce tournoi ?\n\nCette action ne peut pas être annulée.')) {
        return;
    }

    try {
        const response = await fetch(`/api/events/manage/${eventId}/start`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const txt = await response.text().catch(() => "");
            throw new Error(txt || `HTTP ${response.status}`);
        }
        
        const data = await response.json();

        if (data.success) {
            // 🔥 CORRECTION FSM_EVENT_SYNC (identique à finishTournament)
            localStorage.setItem("events_invalidated_at", String(Date.now()));
            window.dispatchEvent(new CustomEvent("events:changed", { detail: { eventId } }));

            this.setGlobalMessage('✅ Tournoi démarré avec succès !', false);
            
            // 🔥 Refresh au lieu de reload
            await this.refreshAllData(eventId, token);
        } else {
            this.setGlobalMessage('❌ ' + data.message, true);
        }
    } catch (error) {
        console.error('Erreur démarrage tournoi:', error);
        this.setGlobalMessage('❌ ' + (error.message || 'Erreur lors du démarrage du tournoi'), true);
    }
},

    /**
     * ✅ NOUVEAU : Termine le tournoi
     */
    async finishTournament() {
        const eventId = this.extractEventIdFromPath();
        const token = localStorage.getItem("accessToken");
        
        if (!confirm('⚠️ Êtes-vous sûr de vouloir TERMINER ce tournoi ?\n\nCette action ne peut pas être annulée.')) {
            return;
        }

        try {
            const response = await fetch(`/api/events/manage/${eventId}/finish`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
  const txt = await response.text().catch(() => "");
  throw new Error(txt || `HTTP ${response.status}`);
}
const data = await response.json();


   if (data.success) {
  // 1) Signal global (list page)
  localStorage.setItem("events_invalidated_at", String(Date.now()));
  window.dispatchEvent(new CustomEvent("events:changed", { detail: { eventId } }));

  // 2) UX
  this.setGlobalMessage("✅ Tournoi terminé avec succès !", false);

  // 3) Refresh SPA (met à jour status + checklist + verrous)
  await this.refreshAllData(eventId, token);

  // 4) Optionnel: basculer sur l’onglet Archivés ou Vue d’ensemble
  // this.activateTab("archived"); // si tu as une fonction
  return;
}
else {
  this.setGlobalMessage('❌ ' + (data.message || 'Erreur inconnue'), true);
}


        } catch (error) {
  console.error('Erreur fin tournoi:', error);
  this.setGlobalMessage('❌ ' + (error.message || 'Erreur lors de la fin du tournoi'), true);
}

    },

/**
 * ✅ NOUVEAU : Rend les boutons de contrôle du tournoi
 */
renderTournamentControlButtons(event) {
    const status = this.normStatus(event?.status);

    const phase = event?.tournamentPhase;
    
    if (!status) return '';

    let html = '';

    // 🟢 Bouton DÉMARRER (si PUBLISHED ou REGISTRATION_CLOSED)
   if (status === 'PUBLISHED') {

        html += `
            <div class="tournament-control-buttons" style="margin: 20px 0;">
                <button 
                    id="btn-start-tournament-control"
                    class="admin-btn admin-btn-primary"
                    style="width: 100%; padding: 15px; font-size: 1.1em;">
                    <i class="fas fa-play-circle"></i>
                    DÉMARRER LE TOURNOI
                </button>
                <p style="margin: 10px 0 0 0; font-size: 0.9em; color: #7f8c8d; text-align: center;">
                    ⚠️ Une fois démarré, le tournoi sera visible comme "EN DIRECT"
                </p>
            </div>
        `;
    }

    // 🔴 Badge TOURNOI EN COURS + Bouton TERMINER (si ONGOING)
    if (status === 'ONGOING') {
        html += `
            <div class="tournament-control-buttons" style="margin: 20px 0;">
                <div style="
                    background: #fee;
                    border: 2px solid #e74c3c;
                    border-radius: 8px;
                    padding: 15px;
                    text-align: center;
                    margin-bottom: 15px;
                ">
                    <div style="
                        display: inline-flex;
                        align-items: center;
                        gap: 8px;
                        background: #e74c3c;
                        color: white;
                        padding: 8px 16px;
                        border-radius: 20px;
                        font-weight: 700;
                        font-size: 1em;
                    ">
                        <span style="width: 8px; height: 8px; background: white; border-radius: 50%; animation: blink 1s infinite;"></span>
                        🔴 TOURNOI EN COURS
                    </div>
                    <div style="margin-top: 8px; color: #7f8c8d; font-size: 0.85em;">
                        Démarré le ${event.actualStartDateTime ? new Date(event.actualStartDateTime).toLocaleString('fr-FR') : 'inconnu'}
                    </div>
                </div>
                
                <button 
                    id="btn-finish-tournament-control"
                    class="admin-btn"
                    style="width: 100%; padding: 15px; font-size: 1.1em; background: #2c3e50;">
                    <i class="fas fa-flag-checkered"></i>
                    TERMINER LE TOURNOI
                </button>
                <p style="margin: 10px 0 0 0; font-size: 0.9em; color: #7f8c8d; text-align: center;">
                    ⚠️ Cela marquera le tournoi comme terminé définitivement
                </p>
            </div>
            
            <style>
                @keyframes blink {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.3; }
                }
            </style>
        `;
    }

    // ✅ Badge TOURNOI TERMINÉ (si COMPLETED)
    if (status === 'COMPLETED') {
        html += `
            <div class="tournament-control-buttons" style="margin: 20px 0;">
                <div style="
                    background: #d4edda;
                    border: 2px solid #27ae60;
                    border-radius: 8px;
                    padding: 15px;
                    text-align: center;
                ">
                    <div style="
                        display: inline-flex;
                        align-items: center;
                        gap: 8px;
                        background: #27ae60;
                        color: white;
                        padding: 8px 16px;
                        border-radius: 20px;
                        font-weight: 700;
                        font-size: 1em;
                    ">
                        ✅ TOURNOI TERMINÉ
                    </div>
                    ${event.actualEndDateTime ? `
                        <div style="margin-top: 8px; color: #7f8c8d; font-size: 0.85em;">
                            Terminé le ${new Date(event.actualEndDateTime).toLocaleString('fr-FR')}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }



    return html;
},
    
/**
 * ✅ NOUVEAU : Boutons de contrôle pour MATCH UNIQUE
 */
renderMatchControlButtons(event) {
    const status = event?.status;
    
    if (!status) return '';

    if (status === "COMPLETED") {
  return `
    <div style="margin: 20px 0; padding: 14px; border-radius: 12px; background: #f1f5f9; border: 1px solid #e2e8f0;">
      <strong>🏁 Tournoi terminé</strong>
      <div style="margin-top: 6px; color:#64748b; font-size:.9em;">
        Les actions de génération/démarrage sont désactivées.
      </div>
    </div>
  `;
}


    // 🟢 Bouton DÉMARRER (si PUBLISHED ou SCHEDULED)
    if (status === 'PUBLISHED' || status === 'SCHEDULED') {
        return `
            <div class="tournament-control-buttons" style="margin: 20px 0;">
                <button 
                    id="btn-start-match-control"
                    class="admin-btn admin-btn-primary"
                    style="width: 100%; padding: 15px; font-size: 1.1em;">
                    <i class="fas fa-play-circle"></i>
                    DÉMARRER LE MATCH
                </button>
                <p style="margin: 10px 0 0 0; font-size: 0.9em; color: #7f8c8d; text-align: center;">
                    ⚠️ Le match sera visible en direct sur la page publique
                </p>
            </div>
        `;
    }

    // 🔴 Badge MATCH EN COURS + Bouton TERMINER (si ONGOING)
    if (status === 'ONGOING') {
        return `
            <div class="tournament-control-buttons" style="margin: 20px 0;">
                <div style="
                    background: #fee;
                    border: 2px solid #e74c3c;
                    border-radius: 8px;
                    padding: 15px;
                    text-align: center;
                    margin-bottom: 15px;
                ">
                    <div style="
                        display: inline-flex;
                        align-items: center;
                        gap: 8px;
                        background: #e74c3c;
                        color: white;
                        padding: 8px 16px;
                        border-radius: 20px;
                        font-weight: 700;
                        font-size: 1em;
                    ">
                        <span style="width: 8px; height: 8px; background: white; border-radius: 50%; animation: blink 1s infinite;"></span>
                        🔴 MATCH EN COURS
                    </div>
                </div>
                
                <button 
                    id="btn-finish-match-control"
                    class="admin-btn"
                    style="width: 100%; padding: 15px; font-size: 1.1em; background: #2c3e50;">
                    <i class="fas fa-flag-checkered"></i>
                    TERMINER LE MATCH
                </button>
                <p style="margin: 10px 0 0 0; font-size: 0.9em; color: #7f8c8d; text-align: center;">
                    ⚠️ Le match sera marqué comme terminé
                </p>
            </div>
            
            <style>
                @keyframes blink {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.3; }
                }
            </style>
        `;
    }

    // ✅ Badge MATCH TERMINÉ (si COMPLETED)
    if (status === 'COMPLETED') {
        return `
            <div class="tournament-control-buttons" style="margin: 20px 0;">
                <div style="
                    background: #d4edda;
                    border: 2px solid #27ae60;
                    border-radius: 8px;
                    padding: 15px;
                    text-align: center;
                ">
                    <div style="
                        display: inline-flex;
                        align-items: center;
                        gap: 8px;
                        background: #27ae60;
                        color: white;
                        padding: 8px 16px;
                        border-radius: 20px;
                        font-weight: 700;
                        font-size: 1em;
                    ">
                        ✅ MATCH TERMINÉ
                    </div>
                </div>
            </div>
        `;
    }

    return '';
},

};
// 🔧 DEV ONLY: exposer la page dans la console (Eruda/DevTools)
try {
  window.AdminEventDashboardPage = AdminEventDashboardPage;
  console.log("✅ AdminEventDashboardPage exposé sur window");
} catch(e) {
  console.warn("❌ Impossible d'exposer AdminEventDashboardPage", e);
}

export default AdminEventDashboardPage;