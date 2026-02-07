// /static/app/js/pages/admin/match-create-wizard.page.js
// ✅ CRÉATION MATCH UNIQUE - MÉDIATISATION

import { Router } from "../../router.js";

export const AdminCreateMatchWizardPage = {
  currentStep: 1,
  totalSteps: 3,
  formData: {},
  myTeams: [], // Équipes de mon club

  async render() {
    // Charger mes équipes au démarrage
    await this.loadMyTeams();

    return `
  <div class="wizard-page" style="
  position: fixed;
  inset: 0;
  background: #f5f7fa;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 20px 0;
">
        <div class="wizard-container" style="
          max-width: 800px;
          margin: 40px auto;
          padding: 30px;
          background: white;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        ">
        
        <!-- BARRE DE PROGRESSION -->
        <div class="wizard-progress" style="
          display: flex;
          justify-content: space-between;
          margin-bottom: 40px;
          position: relative;
        ">
          <div style="
            position: absolute;
            top: 20px;
            left: 0;
            right: 0;
            height: 3px;
            background: #ecf0f1;
            z-index: 0;
          "></div>
          <div id="progress-line" style="
            position: absolute;
            top: 20px;
            left: 0;
            height: 3px;
            background: #e74c3c;
            transition: width 0.3s;
            z-index: 1;
            width: ${((this.currentStep - 1) / (this.totalSteps - 1)) * 100}%;
          "></div>

          ${[1, 2, 3].map(step => `
            <div class="wizard-step ${this.currentStep >= step ? 'active' : ''}" style="
              display: flex;
              flex-direction: column;
              align-items: center;
              z-index: 2;
              position: relative;
            ">
              <div style="
                width: 40px;
                height: 40px;
                border-radius: 50%;
                background: ${this.currentStep >= step ? '#e74c3c' : '#ecf0f1'};
                color: ${this.currentStep >= step ? 'white' : '#95a5a6'};
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 700;
                font-size: 1.1em;
                margin-bottom: 8px;
                transition: all 0.3s;
              ">
                ${this.currentStep > step ? '✓' : step}
              </div>
              <div style="
                font-size: 0.85em;
                font-weight: 600;
                color: ${this.currentStep >= step ? '#2c3e50' : '#95a5a6'};
                text-align: center;
              ">
                ${this.getStepLabel(step)}
              </div>
            </div>
          `).join('')}
        </div>

        <div id="wizard-message" style="display: none; margin-bottom: 20px;"></div>

        <div id="wizard-content" style="min-height: 400px;">
          ${this.renderStep(this.currentStep)}
        </div>

        <div class="wizard-actions" style="
          display: flex;
          justify-content: space-between;
          margin-top: 40px;
          padding-top: 25px;
          border-top: 2px solid #ecf0f1;
        ">
          ${this.currentStep > 1 ? `
            <button id="btn-prev" style="
              padding: 12px 30px;
              background: white;
              border: 2px solid #e74c3c;
              color: #e74c3c;
              border-radius: 8px;
              font-weight: 600;
              cursor: pointer;
              font-size: 1em;
            ">
              ← Précédent
            </button>
          ` : '<div></div>'}
          
          ${this.currentStep < 3 ? `
            <button id="btn-next" style="
              padding: 12px 30px;
              background: #e74c3c;
              border: 2px solid #e74c3c;
              color: white;
              border-radius: 8px;
              font-weight: 600;
              cursor: pointer;
              font-size: 1em;
            ">
              Suivant →
            </button>
          ` : `
            <button id="btn-create" style="
              padding: 12px 40px;
              background: #27ae60;
              border: 2px solid #27ae60;
              color: white;
              border-radius: 8px;
              font-weight: 700;
              cursor: pointer;
              font-size: 1.1em;
            ">
              ⚽ Publier le match
            </button>
          `}
        </div>
      </div>
    </div>
    `;
  },

  getStepLabel(step) {
    const labels = {
      1: 'Équipes',
      2: 'Date & Lieu',
      3: 'Récapitulatif'
    };
    return labels[step];
  },

async loadMyTeams() {
    const token = localStorage.getItem('accessToken');
    
    if (!token) return;

    try {
      const res = await fetch(`/api/teams/my-club`, {  // ✅ BON ENDPOINT
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const json = await res.json();
        this.myTeams = json.data || json || [];
      }
    } catch (error) {
      console.error('Erreur chargement équipes:', error);
      this.myTeams = [];
    }
  },

  renderStep(step) {
    switch (step) {
      case 1: return this.renderStep1();
      case 2: return this.renderStep2();
      case 3: return this.renderStep3();
      default: return '';
    }
  },

  // ================================
  // ÉTAPE 1 : ÉQUIPES
  // ================================
  renderStep1() {
    return `
      <div class="wizard-step-content">
        <h2 style="color: #2c3e50; margin: 0 0 10px 0; font-size: 1.8em;">
          ⚽ Informations du match
        </h2>
        <p style="color: #7f8c8d; margin: 0 0 30px 0;">
          Définissez les équipes qui s'affrontent
        </p>

        <div class="form-group" style="margin-bottom: 25px;">
          <label style="
            display: block;
            font-weight: 600;
            color: #2c3e50;
            margin-bottom: 8px;
            font-size: 1em;
          ">
            Nom du match *
          </label>
          <input 
            id="match-name" 
            type="text"
            placeholder="Ex: Match amical U17 - FC Beausset vs Toulon"
            value="${this.formData.name || ''}"
            maxlength="150"
            style="
              width: 100%;
              padding: 12px;
              border: 2px solid #ddd;
              border-radius: 8px;
              font-size: 1em;
            "
          />
        </div>

        <div class="form-group" style="margin-bottom: 25px;">
          <label style="
            display: block;
            font-weight: 600;
            color: #2c3e50;
            margin-bottom: 8px;
            font-size: 1em;
          ">
            Catégorie *
          </label>
          <select 
            id="match-category"
            style="
              width: 100%;
              padding: 12px;
              border: 2px solid #ddd;
              border-radius: 8px;
              font-size: 1em;
              cursor: pointer;
              background: white;
            "
          >
            <option value="">-- Sélectionner --</option>
            <option value="U11" ${this.formData.category === 'U11' ? 'selected' : ''}>U11</option>
            <option value="U13" ${this.formData.category === 'U13' ? 'selected' : ''}>U13</option>
            <option value="U15" ${this.formData.category === 'U15' ? 'selected' : ''}>U15</option>
            <option value="U17" ${this.formData.category === 'U17' ? 'selected' : ''}>U17</option>
            <option value="U19" ${this.formData.category === 'U19' ? 'selected' : ''}>U19</option>
            <option value="Seniors" ${this.formData.category === 'Seniors' ? 'selected' : ''}>Seniors</option>
            <option value="Veterans" ${this.formData.category === 'Veterans' ? 'selected' : ''}>Vétérans</option>
        </select>
</div>

<!-- 🆕 NIVEAU DE COMPÉTITION -->
<div class="form-group" style="margin-bottom: 25px;">
  <label style="
    display: block;
    font-weight: 600;
    color: #2c3e50;
    margin-bottom: 8px;
    font-size: 1em;
  ">
    Niveau de compétition *
  </label>
 <select 
  id="competition-level"
  style="
    width: 100%;
    padding: 12px;
    border: 2px solid #ddd;
    border-radius: 8px;
    font-size: 1em;
    cursor: pointer;
    background: white;
  "
>
  <option value="">-- Sélectionner --</option>
  <option value="AMICAL" ${this.formData.competitionLevel === 'AMICAL' ? 'selected' : ''}>Match amical</option>
  <option value="NATIONAL_1" ${this.formData.competitionLevel === 'NATIONAL_1' ? 'selected' : ''}>National 1</option>
  <option value="NATIONAL_2" ${this.formData.competitionLevel === 'NATIONAL_2' ? 'selected' : ''}>National 2</option>
  <option value="NATIONAL_3" ${this.formData.competitionLevel === 'NATIONAL_3' ? 'selected' : ''}>National 3</option>
  <option value="REGIONAL_1" ${this.formData.competitionLevel === 'REGIONAL_1' ? 'selected' : ''}>Régional 1</option>
  <option value="REGIONAL_2" ${this.formData.competitionLevel === 'REGIONAL_2' ? 'selected' : ''}>Régional 2</option>
  <option value="REGIONAL_3" ${this.formData.competitionLevel === 'REGIONAL_3' ? 'selected' : ''}>Régional 3</option>
  <option value="DEPARTEMENTAL_1" ${this.formData.competitionLevel === 'DEPARTEMENTAL_1' ? 'selected' : ''}>Départemental 1</option>
  <option value="DEPARTEMENTAL_2" ${this.formData.competitionLevel === 'DEPARTEMENTAL_2' ? 'selected' : ''}>Départemental 2</option>
  <option value="DEPARTEMENTAL_3" ${this.formData.competitionLevel === 'DEPARTEMENTAL_3' ? 'selected' : ''}>Départemental 3</option>
  <option value="DISTRICT_1" ${this.formData.competitionLevel === 'DISTRICT_1' ? 'selected' : ''}>District 1</option>
  <option value="DISTRICT_2" ${this.formData.competitionLevel === 'DISTRICT_2' ? 'selected' : ''}>District 2</option>
  <option value="COUPE_DE_FRANCE" ${this.formData.competitionLevel === 'COUPE_DE_FRANCE' ? 'selected' : ''}>Coupe de France</option>
  <option value="COUPE_REGIONALE" ${this.formData.competitionLevel === 'COUPE_REGIONALE' ? 'selected' : ''}>Coupe Régionale</option>
  <option value="COUPE_DEPARTEMENTALE" ${this.formData.competitionLevel === 'COUPE_DEPARTEMENTALE' ? 'selected' : ''}>Coupe Départementale</option>
  <option value="FUTSAL" ${this.formData.competitionLevel === 'FUTSAL' ? 'selected' : ''}>Futsal</option>
  <option value="VETERANS" ${this.formData.competitionLevel === 'VETERANS' ? 'selected' : ''}>Vétérans</option>
  <option value="LOISIR" ${this.formData.competitionLevel === 'LOISIR' ? 'selected' : ''}>Loisir</option>
</select>
</div>

<!-- 🆕 TYPE DE TERRAIN -->
<div class="form-group" style="margin-bottom: 25px;">
  <label style="
    display: block;
    font-weight: 600;
    color: #2c3e50;
    margin-bottom: 8px;
    font-size: 1em;
  ">
    Type de terrain *
  </label>
<select 
  id="field-type"
  style="
    width: 100%;
    padding: 12px;
    border: 2px solid #ddd;
    border-radius: 8px;
    font-size: 1em;
    cursor: pointer;
    background: white;
  "
>
  <option value="">-- Sélectionner --</option>
  <option value="NATURAL_GRASS" ${this.formData.fieldType === 'NATURAL_GRASS' ? 'selected' : ''}>Herbe naturelle</option>
  <option value="SYNTHETIC_GRASS" ${this.formData.fieldType === 'SYNTHETIC_GRASS' ? 'selected' : ''}>Synthétique</option>
  <option value="HYBRID" ${this.formData.fieldType === 'HYBRID' ? 'selected' : ''}>Hybride</option>
  <option value="INDOOR" ${this.formData.fieldType === 'INDOOR' ? 'selected' : ''}>Salle (Indoor)</option>
  <option value="DIRT" ${this.formData.fieldType === 'DIRT' ? 'selected' : ''}>Terre battue</option>
  <option value="STABILIZED" ${this.formData.fieldType === 'STABILIZED' ? 'selected' : ''}>Stabilisé</option>
  <option value="BEACH" ${this.formData.fieldType === 'BEACH' ? 'selected' : ''}>Beach soccer</option>
</select>
</div>

<div class="form-group" style="margin-bottom: 25px;">
  <label style="...">
    Notre équipe (domicile) *
  </label>
  <select 
    id="home-team"
            style="
              width: 100%;
              padding: 12px;
              border: 2px solid #ddd;
              border-radius: 8px;
              font-size: 1em;
              cursor: pointer;
              background: white;
            "
          >
            <option value="">-- Sélectionner une de vos équipes --</option>
            ${this.myTeams.map(team => `
              <option value="${team.id}" ${this.formData.homeTeamId == team.id ? 'selected' : ''}>
                ${team.name} ${team.category ? '(' + team.category + ')' : ''}
              </option>
            `).join('')}
          </select>
          ${this.myTeams.length === 0 ? `
            <small style="color: #e74c3c; font-size: 0.85em;">
              ⚠️ Vous devez d'abord créer des équipes dans votre club
            </small>
          ` : ''}
        </div>

        <div style="
          background: #fff3cd;
          border: 2px solid #ffc107;
          border-radius: 8px;
          padding: 15px;
          margin-bottom: 25px;
        ">
          <h4 style="margin: 0 0 10px 0; color: #856404;">
            🏟️ Équipe adverse
          </h4>
          <p style="margin: 0 0 10px 0; color: #856404; font-size: 0.95em;">
            L'équipe adverse n'est pas sur la plateforme ? Pas de problème !
          </p>
        </div>

        <div class="form-group" style="margin-bottom: 25px;">
          <label style="
            display: block;
            font-weight: 600;
            color: #2c3e50;
            margin-bottom: 8px;
            font-size: 1em;
          ">
            Nom de l'équipe adverse *
          </label>
          <input 
            id="away-team-name" 
            type="text"
            placeholder="Ex: Toulon FC U17"
            value="${this.formData.awayTeamName || ''}"
            maxlength="100"
            style="
              width: 100%;
              padding: 12px;
              border: 2px solid #ddd;
              border-radius: 8px;
              font-size: 1em;
            "
          />
        </div>

        <div class="form-group" style="margin-bottom: 25px;">
          <label style="
            display: block;
            font-weight: 600;
            color: #2c3e50;
            margin-bottom: 8px;
            font-size: 1em;
          ">
            Ville de l'équipe adverse *
          </label>
          <input 
            id="away-team-city" 
            type="text"
            placeholder="Ex: Toulon"
            value="${this.formData.awayTeamCity || ''}"
            maxlength="100"
            style="
              width: 100%;
              padding: 12px;
              border: 2px solid #ddd;
              border-radius: 8px;
              font-size: 1em;
            "
          />
        </div>

        <div class="form-group" style="margin-bottom: 25px;">
          <label style="
            display: block;
            font-weight: 600;
            color: #2c3e50;
            margin-bottom: 8px;
            font-size: 1em;
          ">
            Description (optionnel)
          </label>
          <textarea 
            id="match-description"
            rows="3"
            placeholder="Ex: Match de préparation avant le tournoi..."
            maxlength="500"
            style="
              width: 100%;
              padding: 12px;
              border: 2px solid #ddd;
              border-radius: 8px;
              font-size: 1em;
              font-family: inherit;
              resize: vertical;
            "
          >${this.formData.description || ''}</textarea>
        </div>
      </div>
    `;
  },

  // ================================
  // ÉTAPE 2 : DATE ET LIEU
  // ================================
  renderStep2() {
    const today = new Date().toISOString().split('T')[0];
    
    return `
      <div class="wizard-step-content">
        <h2 style="color: #2c3e50; margin: 0 0 10px 0; font-size: 1.8em;">
          📅 Date et lieu
        </h2>
        <p style="color: #7f8c8d; margin: 0 0 30px 0;">
          Quand et où se joue le match ?
        </p>

        <div class="form-group" style="margin-bottom: 25px;">
          <label style="
            display: block;
            font-weight: 600;
            color: #2c3e50;
            margin-bottom: 8px;
            font-size: 1em;
          ">
            Date du match *
          </label>
          <input 
            id="match-date"
            type="date"
            min="${today}"
            value="${this.formData.date || ''}"
            style="
              width: 100%;
              padding: 12px;
              border: 2px solid #ddd;
              border-radius: 8px;
              font-size: 1em;
            "
          />
        </div>

        <div class="form-group" style="margin-bottom: 25px;">
          <label style="
            display: block;
            font-weight: 600;
            color: #2c3e50;
            margin-bottom: 8px;
            font-size: 1em;
          ">
            Heure du coup d'envoi *
          </label>
          <input 
            id="match-start-time"
            type="time"
            value="${this.formData.startTime || '15:00'}"
            style="
              width: 100%;
              padding: 12px;
              border: 2px solid #ddd;
              border-radius: 8px;
              font-size: 1em;
            "
          />
        </div>

        <div class="form-group" style="margin-bottom: 25px;">
          <label style="
            display: block;
            font-weight: 600;
            color: #2c3e50;
            margin-bottom: 8px;
            font-size: 1em;
          ">
            Lieu du match *
          </label>
          <input 
            id="match-location"
            type="text"
            placeholder="Ex: Stade Municipal"
            value="${this.formData.location || ''}"
            maxlength="200"
            style="
              width: 100%;
              padding: 12px;
              border: 2px solid #ddd;
              border-radius: 8px;
              font-size: 1em;
            "
          />
        </div>

        <div class="form-group" style="margin-bottom: 25px;">
          <label style="
            display: block;
            font-weight: 600;
            color: #2c3e50;
            margin-bottom: 8px;
            font-size: 1em;
          ">
            Ville *
          </label>
          <input 
            id="match-city"
            type="text"
            placeholder="Ex: Le Beausset"
            value="${this.formData.city || ''}"
            maxlength="100"
            style="
              width: 100%;
              padding: 12px;
              border: 2px solid #ddd;
              border-radius: 8px;
              font-size: 1em;
            "
          />
        </div>

        <div class="form-group" style="margin-bottom: 25px;">
          <label style="
            display: block;
            font-weight: 600;
            color: #2c3e50;
            margin-bottom: 8px;
            font-size: 1em;
          ">
            Adresse (optionnel)
          </label>
          <input 
            id="match-address"
            type="text"
            placeholder="Ex: 118 impasse des Platanes"
            value="${this.formData.address || ''}"
            maxlength="200"
            style="
              width: 100%;
              padding: 12px;
              border: 2px solid #ddd;
              border-radius: 8px;
              font-size: 1em;
            "
          />
        </div>

        <div class="form-group" style="margin-bottom: 25px;">
          <label style="
            display: block;
            font-weight: 600;
            color: #2c3e50;
            margin-bottom: 8px;
            font-size: 1em;
          ">
            Terrain (optionnel)
          </label>
          <input 
            id="match-field"
            type="text"
            placeholder="Ex: Terrain 1"
            value="${this.formData.field || ''}"
            maxlength="50"
            style="
              width: 100%;
              padding: 12px;
              border: 2px solid #ddd;
              border-radius: 8px;
              font-size: 1em;
            "
          />
        </div>
      </div>
    `;
  },

  // ================================
  // ÉTAPE 3 : RÉCAPITULATIF
  // ================================
  renderStep3() {
    const homeTeam = this.myTeams.find(t => t.id == this.formData.homeTeamId);
    
    return `
      <div class="wizard-step-content">
        <h2 style="color: #2c3e50; margin: 0 0 10px 0; font-size: 1.8em;">
          ✅ Récapitulatif
        </h2>
        <p style="color: #7f8c8d; margin: 0 0 30px 0;">
          Vérifiez avant de publier le match
        </p>

        <div style="
          background: #f8f9fa;
          border-radius: 12px;
          padding: 25px;
          margin-bottom: 20px;
        ">
         <div style="margin-bottom: 25px;">
  <h3 style="color: #e74c3c; margin: 0 0 15px 0; font-size: 1.1em; border-bottom: 2px solid #e74c3c; padding-bottom: 8px;">
    ⚽ Match
  </h3>
  <div style="display: grid; gap: 12px;">
    <div style="display: flex; justify-content: space-between;">
      <span style="color: #7f8c8d;">Nom :</span>
      <strong style="color: #2c3e50;">${this.escapeHtml(this.formData.name || '')}</strong>
    </div>
    <div style="display: flex; justify-content: space-between;">
      <span style="color: #7f8c8d;">Catégorie :</span>
      <strong style="color: #2c3e50;">${this.escapeHtml(this.formData.category || '')}</strong>
    </div>
    <div style="display: flex; justify-content: space-between;">
      <span style="color: #7f8c8d;">Niveau :</span>
      <strong style="color: #2c3e50;">${this.escapeHtml(this.formData.competitionLevel || '')}</strong>
    </div>
    <div style="display: flex; justify-content: space-between;">
      <span style="color: #7f8c8d;">Terrain :</span>
      <strong style="color: #2c3e50;">${this.escapeHtml(this.formData.fieldType || '')}</strong>
    </div>
  </div>
</div>

          <div style="margin-bottom: 25px;">
            <h3 style="color: #e74c3c; margin: 0 0 15px 0; font-size: 1.1em; border-bottom: 2px solid #e74c3c; padding-bottom: 8px;">
              🏟️ Équipes
            </h3>
            <div style="
              display: grid;
              grid-template-columns: 1fr auto 1fr;
              align-items: center;
              gap: 15px;
              background: white;
              padding: 20px;
              border-radius: 8px;
            ">
              <div style="text-align: center;">
                <div style="font-size: 1.2em; font-weight: 700; color: #3498db;">
                  ${homeTeam ? this.escapeHtml(homeTeam.name) : 'N/A'}
                </div>
                <small style="color: #7f8c8d;">Domicile</small>
              </div>
              <div style="
                font-size: 1.5em;
                font-weight: 700;
                color: #e74c3c;
              ">
                VS
              </div>
              <div style="text-align: center;">
                <div style="font-size: 1.2em; font-weight: 700; color: #e74c3c;">
                  ${this.escapeHtml(this.formData.awayTeamName || '')}
                </div>
                <small style="color: #7f8c8d;">${this.escapeHtml(this.formData.awayTeamCity || '')}</small>
              </div>
            </div>
          </div>

          <div style="margin-bottom: 25px;">
            <h3 style="color: #e74c3c; margin: 0 0 15px 0; font-size: 1.1em; border-bottom: 2px solid #e74c3c; padding-bottom: 8px;">
              📅 Date et lieu
            </h3>
            <div style="display: grid; gap: 12px;">
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #7f8c8d;">Date :</span>
                <strong style="color: #2c3e50;">${this.formatDate(this.formData.date)}</strong>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #7f8c8d;">Heure :</span>
                <strong style="color: #2c3e50;">${this.formData.startTime}</strong>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #7f8c8d;">Lieu :</span>
                <strong style="color: #2c3e50;">${this.escapeHtml(this.formData.location || '')}</strong>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #7f8c8d;">Ville :</span>
                <strong style="color: #2c3e50;">${this.escapeHtml(this.formData.city || '')}</strong>
              </div>
            </div>
          </div>
        </div>

        <div style="
          background: #d5f4e6;
          border: 2px solid #27ae60;
          border-radius: 8px;
          padding: 15px;
          text-align: center;
        ">
          <p style="margin: 0; color: #27ae60; font-weight: 600;">
            ✅ Le match sera visible dans le feed public
          </p>
        </div>
      </div>
    `;
  },

  // ================================
  // INIT
  // ================================
  async init() {
    const btnNext = document.getElementById('btn-next');
    const btnPrev = document.getElementById('btn-prev');
    const btnCreate = document.getElementById('btn-create');

    if (btnNext) {
      btnNext.addEventListener('click', () => this.nextStep());
    }

    if (btnPrev) {
      btnPrev.addEventListener('click', () => this.previousStep());
    }

    if (btnCreate) {
      btnCreate.addEventListener('click', () => this.createMatch());
    }
  },

  // ================================
  // NAVIGATION
  // ================================
  async nextStep() {
    this.saveStepData(this.currentStep);

    if (!this.validateStep(this.currentStep)) {
      return;
    }

    this.currentStep++;
    await this.refreshView();
  },

  async previousStep() {
    this.saveStepData(this.currentStep);
    this.currentStep--;
    await this.refreshView();
  },

  async refreshView() {
    const container = document.getElementById('wizard-content');
    if (container) {
      container.innerHTML = this.renderStep(this.currentStep);
    }

    const progressLine = document.getElementById('progress-line');
    if (progressLine) {
      progressLine.style.width = `${((this.currentStep - 1) / (this.totalSteps - 1)) * 100}%`;
    }

    const steps = document.querySelectorAll('.wizard-step');
    steps.forEach((stepEl, index) => {
      const stepNumber = index + 1;
      const circle = stepEl.querySelector('div');
      const label = stepEl.querySelectorAll('div')[1];
      
      if (this.currentStep >= stepNumber) {
        circle.style.background = '#e74c3c';
        circle.style.color = 'white';
        circle.innerHTML = this.currentStep > stepNumber ? '✓' : stepNumber;
        label.style.color = '#2c3e50';
      } else {
        circle.style.background = '#ecf0f1';
        circle.style.color = '#95a5a6';
        circle.innerHTML = stepNumber;
        label.style.color = '#95a5a6';
      }
    });

    const actionsContainer = document.querySelector('.wizard-actions');
    if (actionsContainer) {
      actionsContainer.innerHTML = `
        ${this.currentStep > 1 ? `
          <button id="btn-prev" style="
            padding: 12px 30px;
            background: white;
            border: 2px solid #e74c3c;
            color: #e74c3c;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            font-size: 1em;
          ">
            ← Précédent
          </button>
        ` : '<div></div>'}
        
        ${this.currentStep < 3 ? `
          <button id="btn-next" style="
            padding: 12px 30px;
            background: #e74c3c;
            border: 2px solid #e74c3c;
            color: white;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            font-size: 1em;
          ">
            Suivant →
          </button>
        ` : `
          <button id="btn-create" style="
            padding: 12px 40px;
            background: #27ae60;
            border: 2px solid #27ae60;
            color: white;
            border-radius: 8px;
            font-weight: 700;
            cursor: pointer;
            font-size: 1.1em;
          ">
            ⚽ Publier le match
          </button>
        `}
      `;
    }

    await this.init();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  // ================================
  // SAUVEGARDE DES DONNÉES
  // ================================
  saveStepData(step) {
    switch (step) {
     case 1:
  this.formData.name = document.getElementById('match-name')?.value.trim();
  this.formData.category = document.getElementById('match-category')?.value;
  this.formData.competitionLevel = document.getElementById('competition-level')?.value;  // 🆕
  this.formData.fieldType = document.getElementById('field-type')?.value;                // 🆕
  this.formData.homeTeamId = document.getElementById('home-team')?.value;
  this.formData.awayTeamName = document.getElementById('away-team-name')?.value.trim();
  this.formData.awayTeamCity = document.getElementById('away-team-city')?.value.trim();
  this.formData.description = document.getElementById('match-description')?.value.trim();
  break;
      
      case 2:
        this.formData.date = document.getElementById('match-date')?.value;
        this.formData.startTime = document.getElementById('match-start-time')?.value;
        this.formData.location = document.getElementById('match-location')?.value.trim();
        this.formData.city = document.getElementById('match-city')?.value.trim();
        this.formData.address = document.getElementById('match-address')?.value.trim();
        this.formData.field = document.getElementById('match-field')?.value.trim();
        break;
    }
  },

  // ================================
  // VALIDATION
  // ================================
  validateStep(step) {
    this.hideMessage();

    switch (step) {
 case 1:
  if (!this.formData.name) {  // 🆕 AJOUTE ÇA
    this.showMessage('❌ Le nom du match est obligatoire', true);
    return false;
  }
  if (!this.formData.category) {
    this.showMessage('❌ La catégorie est obligatoire', true);
    return false;
  }
if (!this.formData.competitionLevel) {  // 🆕
  this.showMessage('❌ Le niveau de compétition est obligatoire', true);
  return false;
}
if (!this.formData.fieldType) {  // 🆕
  this.showMessage('❌ Le type de terrain est obligatoire', true);
  return false;
}
if (!this.formData.homeTeamId) {
  this.showMessage('❌ Sélectionnez votre équipe', true);
  return false;
}
        if (!this.formData.awayTeamName) {
          this.showMessage('❌ Le nom de l\'équipe adverse est obligatoire', true);
          return false;
        }
        if (!this.formData.awayTeamCity) {
          this.showMessage('❌ La ville de l\'équipe adverse est obligatoire', true);
          return false;
        }
        break;
      
      case 2:
        if (!this.formData.date) {
          this.showMessage('❌ La date est obligatoire', true);
          return false;
        }
        
        const selectedDate = new Date(this.formData.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (selectedDate < today) {
          this.showMessage('❌ La date ne peut pas être dans le passé', true);
          return false;
        }

        if (!this.formData.startTime) {
          this.showMessage('❌ L\'heure est obligatoire', true);
          return false;
        }

        if (!this.formData.location) {
          this.showMessage('❌ Le lieu est obligatoire', true);
          return false;
        }

        if (!this.formData.city) {
          this.showMessage('❌ La ville est obligatoire', true);
          return false;
        }
        break;
    }

    return true;
  },

  // ================================
  // CRÉATION DU MATCH
  // ================================
  async createMatch() {
    const token = localStorage.getItem('accessToken');
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');

    if (!token || !currentUser.clubId) {
      this.showMessage('❌ Vous devez être connecté et membre d\'un club', true);
      return;
    }

    const payload = {
      name: this.formData.name,
      description: this.formData.description,
      category: this.formData.category,
        competitionLevel: this.formData.competitionLevel,  // 🆕
  fieldType: this.formData.fieldType, 
      
      homeTeamId: parseInt(this.formData.homeTeamId),
      awayTeamName: this.formData.awayTeamName,
      awayTeamCity: this.formData.awayTeamCity,

      date: this.formData.date,
      startTime: `${this.formData.date}T${this.formData.startTime}:00`,
      endTime: null,

      location: this.formData.location,
      city: this.formData.city,
      address: this.formData.address,
      field: this.formData.field,

      type: 'CLUB_EVENT',
      visibility: 'PUBLIC',
      clubId: currentUser.clubId
    };

    const btn = document.getElementById('btn-create');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Publication...';

    try {
      const res = await fetch('/api/events/admin/create-match', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        const errorMsg = json?.message || json?.error || `Erreur HTTP ${res.status}`;
        throw new Error(errorMsg);
      }

      const eventId = json?.data?.id || json?.id;

      this.showMessage('✅ Match publié ! Redirection...', false);

      setTimeout(() => {
        Router.go(`/admin/events/${eventId}`);
      }, 1000);

    } catch (error) {
      console.error('Erreur création match:', error);
      this.showMessage(`❌ ${error.message}`, true);

      btn.disabled = false;
      btn.innerHTML = '⚽ Publier le match';
    }
  },

  // ================================
  // UTILITAIRES
  // ================================
  showMessage(msg, isError = false) {
    const el = document.getElementById('wizard-message');
    if (!el) return;

    el.textContent = msg;
    el.style.color = isError ? '#e74c3c' : '#27ae60';
    el.style.background = isError ? '#fadbd8' : '#d5f4e6';
    el.style.padding = '15px';
    el.style.borderRadius = '8px';
    el.style.fontWeight = '500';
    el.style.display = 'block';
    el.style.border = isError ? '2px solid #e74c3c' : '2px solid #27ae60';
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  },

  hideMessage() {
    const el = document.getElementById('wizard-message');
    if (el) el.style.display = 'none';
  },

  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
};

export default AdminCreateMatchWizardPage;