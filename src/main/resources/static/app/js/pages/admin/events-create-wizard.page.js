// /static/app/js/pages/admin/events-create-wizard.page.js
// ✅ VERSION WIZARD MULTI-ÉTAPES - INTERFACE SIMPLIFIÉE

import { Router } from "../../router.js";

export const AdminCreateEventWizardPage = {
  currentStep: 1,
  totalSteps: 4,
  formData: {},

  async render() {
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
          <!-- Ligne de connexion -->
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
            background: #3498db;
            transition: width 0.3s;
            z-index: 1;
            width: ${((this.currentStep - 1) / (this.totalSteps - 1)) * 100}%;
          "></div>

          ${[1, 2, 3, 4].map(step => `
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
                background: ${this.currentStep >= step ? '#3498db' : '#ecf0f1'};
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

        <!-- MESSAGE D'ERREUR GLOBAL -->
        <div id="wizard-message" style="display: none; margin-bottom: 20px;"></div>

        <!-- CONTENU DE L'ÉTAPE -->
        <div id="wizard-content" style="min-height: 400px;">
          ${this.renderStep(this.currentStep)}
        </div>

        <!-- BOUTONS DE NAVIGATION -->
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
              border: 2px solid #3498db;
              color: #3498db;
              border-radius: 8px;
              font-weight: 600;
              cursor: pointer;
              transition: all 0.3s;
              font-size: 1em;
            ">
              ← Précédent
            </button>
          ` : '<div></div>'}
          
          ${this.currentStep < 4 ? `
            <button id="btn-next" style="
              padding: 12px 30px;
              background: #3498db;
              border: 2px solid #3498db;
              color: white;
              border-radius: 8px;
              font-weight: 600;
              cursor: pointer;
              transition: all 0.3s;
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
              transition: all 0.3s;
              font-size: 1.1em;
            ">
              ✨ Créer le tournoi
            </button>
          `}
        </div>
      </div>
    </div>
    `;
  },

  getStepLabel(step) {
    const labels = {
      1: 'Informations',
      2: 'Date & Lieu',
      3: 'Capacités',
      4: 'Récapitulatif'
    };
    return labels[step];
  },

  renderStep(step) {
    switch (step) {
      case 1: return this.renderStep1();
      case 2: return this.renderStep2();
      case 3: return this.renderStep3();
      case 4: return this.renderStep4();
      default: return '';
    }
  },

  // ================================
  // ÉTAPE 1 : INFORMATIONS GÉNÉRALES
  // ================================
  renderStep1() {
    return `
      <div class="wizard-step-content">
        <h2 style="color: #2c3e50; margin: 0 0 10px 0; font-size: 1.8em;">
          📋 Informations générales
        </h2>
        <p style="color: #7f8c8d; margin: 0 0 30px 0;">
          Commencez par les informations de base de votre tournoi
        </p>

        <div class="form-group" style="margin-bottom: 25px;">
          <label style="
            display: block;
            font-weight: 600;
            color: #2c3e50;
            margin-bottom: 8px;
            font-size: 1em;
          ">
            Nom du tournoi *
          </label>
          <input 
            id="tournament-name" 
            type="text"
            placeholder="Ex: Tournoi U13 - Printemps 2025"
            value="${this.formData.name || ''}"
            maxlength="100"
            style="
              width: 100%;
              padding: 12px;
              border: 2px solid #ddd;
              border-radius: 8px;
              font-size: 1em;
              transition: border 0.3s;
            "
          />
          <small style="color: #7f8c8d; font-size: 0.85em;">
            Maximum 100 caractères
          </small>
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
            id="tournament-category"
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
            <option value="U11" ${this.formData.category === 'U11' ? 'selected' : ''}>U11 (moins de 11 ans)</option>
            <option value="U13" ${this.formData.category === 'U13' ? 'selected' : ''}>U13 (moins de 13 ans)</option>
            <option value="U15" ${this.formData.category === 'U15' ? 'selected' : ''}>U15 (moins de 15 ans)</option>
            <option value="U17" ${this.formData.category === 'U17' ? 'selected' : ''}>U17 (moins de 17 ans)</option>
            <option value="U19" ${this.formData.category === 'U19' ? 'selected' : ''}>U19 (moins de 19 ans)</option>
            <option value="Seniors" ${this.formData.category === 'Seniors' ? 'selected' : ''}>Seniors</option>
            <option value="Veterans" ${this.formData.category === 'Veterans' ? 'selected' : ''}>Vétérans</option>
          </select>
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
            id="tournament-description"
            rows="4"
            placeholder="Décrivez votre tournoi..."
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
          <small style="color: #7f8c8d; font-size: 0.85em;">
            Maximum 500 caractères
          </small>
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
          Quand et où se déroulera le tournoi ?
        </p>

        <div class="form-group" style="margin-bottom: 25px;">
          <label style="
            display: block;
            font-weight: 600;
            color: #2c3e50;
            margin-bottom: 8px;
            font-size: 1em;
          ">
            Date du tournoi *
          </label>
          <input 
            id="tournament-date"
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

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 25px;">
          <div class="form-group">
            <label style="
              display: block;
              font-weight: 600;
              color: #2c3e50;
              margin-bottom: 8px;
              font-size: 1em;
            ">
              Heure de début
            </label>
            <input 
              id="tournament-start-time"
              type="time"
              value="${this.formData.startTime || '09:00'}"
              style="
                width: 100%;
                padding: 12px;
                border: 2px solid #ddd;
                border-radius: 8px;
                font-size: 1em;
              "
            />
          </div>
          <div class="form-group">
            <label style="
              display: block;
              font-weight: 600;
              color: #2c3e50;
              margin-bottom: 8px;
              font-size: 1em;
            ">
              Heure de fin
            </label>
            <input 
              id="tournament-end-time"
              type="time"
              value="${this.formData.endTime || '18:00'}"
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
            id="tournament-city"
            type="text"
            placeholder="Ex: Toulon"
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
            Adresse complète (optionnel)
          </label>
          <input 
            id="tournament-address"
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
            Code postal (optionnel)
          </label>
          <input 
            id="tournament-zipcode"
            type="text"
            placeholder="Ex: 83000"
            value="${this.formData.zipCode || ''}"
            maxlength="5"
            pattern="[0-9]{5}"
            style="
              width: 100%;
              padding: 12px;
              border: 2px solid #ddd;
              border-radius: 8px;
              font-size: 1em;
            "
          />
          <small style="color: #7f8c8d; font-size: 0.85em;">
            5 chiffres
          </small>
        </div>
      </div>
    `;
  },

  // ================================
  // ÉTAPE 3 : CAPACITÉS
  // ================================
  renderStep3() {
    return `
      <div class="wizard-step-content">
        <h2 style="color: #2c3e50; margin: 0 0 10px 0; font-size: 1.8em;">
          👥 Capacités
        </h2>
        <p style="color: #7f8c8d; margin: 0 0 30px 0;">
          Définissez les capacités de votre tournoi
        </p>

        <div class="form-group" style="margin-bottom: 25px;">
          <label style="
            display: block;
            font-weight: 600;
            color: #2c3e50;
            margin-bottom: 8px;
            font-size: 1em;
          ">
            Nombre maximum d'équipes *
          </label>
          <input 
            id="tournament-max-participants"
            type="number"
            value="${this.formData.maxParticipants || 16}"
            min="4"
            max="64"
            style="
              width: 100%;
              padding: 12px;
              border: 2px solid #ddd;
              border-radius: 8px;
              font-size: 1em;
            "
          />
          <small style="color: #7f8c8d; font-size: 0.85em;">
            Entre 4 et 64 équipes
          </small>
        </div>

        <div class="form-group" style="margin-bottom: 25px;">
          <label style="
            display: block;
            font-weight: 600;
            color: #2c3e50;
            margin-bottom: 8px;
            font-size: 1em;
          ">
            Nombre maximum d'équipes par club (optionnel)
          </label>
          <input 
            id="tournament-max-teams-per-club"
            type="number"
            value="${this.formData.maxTeamsPerClub || 2}"  
            min="1"
            max="32"
            placeholder="Laisser vide pour illimité"
            style="
              width: 100%;
              padding: 12px;
              border: 2px solid #ddd;
              border-radius: 8px;
              font-size: 1em;
            "
          />
          <small style="color: #7f8c8d; font-size: 0.85em;">
            Si défini, limite le nombre d'équipes qu'un même club peut inscrire
          </small>
        </div>

        <div style="
          background: #e8f4fd;
          padding: 20px;
          border-radius: 8px;
          border-left: 4px solid #3498db;
        ">
          <h4 style="color: #2c3e50; margin: 0 0 10px 0; font-size: 1em;">
            💡 Conseil
          </h4>
          <p style="color: #34495e; margin: 0; font-size: 0.95em; line-height: 1.5;">
            Pour un tournoi équilibré, nous recommandons :
            <br>• <strong>8 à 16 équipes</strong> pour un tournoi d'une journée
            <br>• <strong>Maximum 2-3 équipes par club</strong> pour favoriser la diversité
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
    Prix d'inscription (€)
  </label>

  <input 
    id="tournament-fee-eur"
    type="number"
    value="${(this.formData.registrationFeeCents != null ? (this.formData.registrationFeeCents / 100) : 0)}"
    min="0"
    step="0.5"
    style="
      width: 100%;
      padding: 12px;
      border: 2px solid #ddd;
      border-radius: 8px;
      font-size: 1em;
    "
  />

  <small style="color: #7f8c8d; font-size: 0.85em;">
    0 = gratuit
  </small>
</div>

      </div>
    `;
  },

  // ================================
  // ÉTAPE 4 : RÉCAPITULATIF
  // ================================
  renderStep4() {
    return `
      <div class="wizard-step-content">
        <h2 style="color: #2c3e50; margin: 0 0 10px 0; font-size: 1.8em;">
          ✅ Récapitulatif
        </h2>
        <p style="color: #7f8c8d; margin: 0 0 30px 0;">
          Vérifiez les informations avant de créer votre tournoi
        </p>

        <div style="
          background: #f8f9fa;
          border-radius: 12px;
          padding: 25px;
          margin-bottom: 20px;
        ">
          <div style="margin-bottom: 25px;">
            <h3 style="color: #3498db; margin: 0 0 15px 0; font-size: 1.1em; border-bottom: 2px solid #3498db; padding-bottom: 8px;">
              📋 Informations générales
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
              ${this.formData.description ? `
                <div style="padding-top: 10px; border-top: 1px solid #ddd;">
                  <span style="color: #7f8c8d; display: block; margin-bottom: 5px;">Description :</span>
                  <p style="color: #2c3e50; margin: 0; font-style: italic;">
                    ${this.escapeHtml(this.formData.description)}
                  </p>
                </div>
              ` : ''}
            </div>
          </div>

          <div style="margin-bottom: 25px;">
            <h3 style="color: #3498db; margin: 0 0 15px 0; font-size: 1.1em; border-bottom: 2px solid #3498db; padding-bottom: 8px;">
              📅 Date et lieu
            </h3>
            <div style="display: grid; gap: 12px;">
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #7f8c8d;">Date :</span>
                <strong style="color: #2c3e50;">${this.formatDate(this.formData.date)}</strong>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #7f8c8d;">Horaires :</span>
                <strong style="color: #2c3e50;">${this.formData.startTime} - ${this.formData.endTime}</strong>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #7f8c8d;">Ville :</span>
                <strong style="color: #2c3e50;">${this.escapeHtml(this.formData.city || '')}</strong>
              </div>
              ${this.formData.address ? `
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: #7f8c8d;">Adresse :</span>
                  <strong style="color: #2c3e50;">${this.escapeHtml(this.formData.address)}</strong>
                </div>
              ` : ''}
              ${this.formData.zipCode ? `
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: #7f8c8d;">Code postal :</span>
                  <strong style="color: #2c3e50;">${this.escapeHtml(this.formData.zipCode)}</strong>
                </div>
              ` : ''}
            </div>
          </div>

          <div>
            <h3 style="color: #3498db; margin: 0 0 15px 0; font-size: 1.1em; border-bottom: 2px solid #3498db; padding-bottom: 8px;">
              👥 Capacités
            </h3>
            <div style="display: grid; gap: 12px;">
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #7f8c8d;">Équipes maximum :</span>
                <strong style="color: #2c3e50;">${this.formData.maxParticipants}</strong>
              </div>
              ${this.formData.maxTeamsPerClub ? `
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: #7f8c8d;">Équipes par club :</span>
                  <strong style="color: #2c3e50;">${this.formData.maxTeamsPerClub}</strong>
                </div>
              ` : `
              
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: #7f8c8d;">Équipes par club :</span>
                  <strong style="color: #2c3e50;">Illimité</strong>
                </div>
              `}

              <div style="display: flex; justify-content: space-between;">
  <span style="color: #7f8c8d;">Prix :</span>
  <strong style="color: #2c3e50;">
    ${this.formData.registrationFeeCents && this.formData.registrationFeeCents > 0
      ? (this.formData.registrationFeeCents / 100).toFixed(2).replace('.00','') + '€'
      : 'Gratuit'}
  </strong>
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
            ✅ Tout est prêt ! Vous pouvez créer votre tournoi.
          </p>
        </div>
      </div>
    `;
  },

  // ================================
  // INIT
  // ================================
  async init() {
    // Boutons de navigation
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
      btnCreate.addEventListener('click', () => this.createEvent());
    }

    // Focus sur premier champ
    setTimeout(() => {
      const firstInput = document.querySelector('input, select, textarea');
      if (firstInput) firstInput.focus();
    }, 100);
  },

  // ================================
  // NAVIGATION
  // ================================
  async nextStep() {
    // Sauvegarder les données de l'étape actuelle
    this.saveStepData(this.currentStep);

    // Valider l'étape
    if (!this.validateStep(this.currentStep)) {
      return;
    }

    // Passer à l'étape suivante
    this.currentStep++;
    await this.refreshView();
  },

  async previousStep() {
    // Sauvegarder sans valider
    this.saveStepData(this.currentStep);
    
    this.currentStep--;
    await this.refreshView();
  },

  async refreshView() {
    const container = document.getElementById('wizard-content');
    if (container) {
      container.innerHTML = this.renderStep(this.currentStep);
    }

    // Mettre à jour la barre de progression
    const progressLine = document.getElementById('progress-line');
    if (progressLine) {
      progressLine.style.width = `${((this.currentStep - 1) / (this.totalSteps - 1)) * 100}%`;
    }
           // Mettre à jour les boules de progression
  const steps = document.querySelectorAll('.wizard-step');
  steps.forEach((stepEl, index) => {
    const stepNumber = index + 1;
    const circle = stepEl.querySelector('div');
    const label = stepEl.querySelectorAll('div')[1];
    
    if (this.currentStep >= stepNumber) {
      circle.style.background = '#3498db';
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

    // Mettre à jour les boutons
    const actionsContainer = document.querySelector('.wizard-actions');
    if (actionsContainer) {
      actionsContainer.innerHTML = `
        ${this.currentStep > 1 ? `
          <button id="btn-prev" style="
            padding: 12px 30px;
            background: white;
            border: 2px solid #3498db;
            color: #3498db;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            font-size: 1em;
          ">
            ← Précédent
          </button>
        ` : '<div></div>'}
        
        ${this.currentStep < 4 ? `
          <button id="btn-next" style="
            padding: 12px 30px;
            background: #3498db;
            border: 2px solid #3498db;
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
            ✨ Créer le tournoi
          </button>
        `}
      `;
    }

    // Re-bind les événements
    await this.init();

    // Scroll en haut
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  // ================================
  // SAUVEGARDE DES DONNÉES
  // ================================
  saveStepData(step) {
    switch (step) {
      case 1:
        this.formData.name = document.getElementById('tournament-name')?.value.trim();
        this.formData.category = document.getElementById('tournament-category')?.value;
        this.formData.description = document.getElementById('tournament-description')?.value.trim();
        break;
      
      case 2:
        this.formData.date = document.getElementById('tournament-date')?.value;
        this.formData.startTime = document.getElementById('tournament-start-time')?.value;
        this.formData.endTime = document.getElementById('tournament-end-time')?.value;
        this.formData.city = document.getElementById('tournament-city')?.value.trim();
        this.formData.address = document.getElementById('tournament-address')?.value.trim();
        this.formData.zipCode = document.getElementById('tournament-zipcode')?.value.trim();
        break;
      
      case 3:
        this.formData.maxParticipants = parseInt(document.getElementById('tournament-max-participants')?.value, 10);
        const maxTeamsValue = document.getElementById('tournament-max-teams-per-club')?.value.trim();
        this.formData.maxTeamsPerClub = maxTeamsValue ? parseInt(maxTeamsValue, 10) : null;
        const feeEurRaw = document.getElementById('tournament-fee-eur')?.value;
        const feeEur = Number(feeEurRaw ?? 0);
        this.formData.registrationFeeCents = Math.max(0, Math.round(feeEur * 100));

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
        if (!this.formData.name) {
          this.showMessage('❌ Le nom du tournoi est obligatoire', true);
          return false;
        }
        if (this.formData.name.length > 100) {
          this.showMessage('❌ Le nom ne peut pas dépasser 100 caractères', true);
          return false;
        }
        if (!this.formData.category) {
          this.showMessage('❌ La catégorie est obligatoire', true);
          return false;
        }
        if (this.formData.description && this.formData.description.length > 500) {
          this.showMessage('❌ La description ne peut pas dépasser 500 caractères', true);
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

        if (this.formData.startTime && this.formData.endTime && this.formData.startTime >= this.formData.endTime) {
          this.showMessage('❌ L\'heure de début doit être avant l\'heure de fin', true);
          return false;
        }

        if (!this.formData.city) {
          this.showMessage('❌ La ville est obligatoire', true);
          return false;
        }

        if (this.formData.zipCode && !/^\d{5}$/.test(this.formData.zipCode)) {
          this.showMessage('❌ Le code postal doit contenir 5 chiffres', true);
          return false;
        }
        break;
      
      case 3:
        if (!this.formData.maxParticipants || this.formData.maxParticipants < 4 || this.formData.maxParticipants > 64) {
          this.showMessage('❌ Le nombre d\'équipes doit être entre 4 et 64', true);
          return false;
        }

         if (!this.formData.maxTeamsPerClub || this.formData.maxTeamsPerClub < 1) {
    this.showMessage('❌ Le quota par club est obligatoire (minimum 1)', true);
    return false;
  }

        if (this.formData.maxTeamsPerClub !== null) {
          if (this.formData.maxTeamsPerClub < 1) {
            this.showMessage('❌ Le quota par club doit être au minimum de 1', true);
            return false;
          }
          if (this.formData.maxTeamsPerClub > this.formData.maxParticipants) {
            this.showMessage('❌ Le quota par club ne peut pas dépasser le nombre total d\'équipes', true);
            return false;
          }
        }
        break;
    }

    return true;
  },

  // ================================
  // CRÉATION DE L'ÉVÉNEMENT
  // ================================
  async createEvent() {
    const token = localStorage.getItem('accessToken');
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');

    if (!token || !currentUser.clubId) {
      this.showMessage('❌ Vous devez être connecté et membre d\'un club', true);
      return;
    }

    const location = `${this.formData.city}${this.formData.address ? ', ' + this.formData.address : ''}`.trim();

    const payload = {
      name: this.formData.name,
      description: this.formData.description,
      category: this.formData.category,
      type: 'CLUB_EVENT',
      registrationType: 'CLUB_ONLY',
      visibility: 'PUBLIC',
      clubId: currentUser.clubId,

      date: this.formData.date,
      startTime: this.formData.startTime ? `${this.formData.date}T${this.formData.startTime}:00` : null,
      endTime: this.formData.endTime ? `${this.formData.date}T${this.formData.endTime}:00` : null,

      city: this.formData.city,
      address: this.formData.address,
      zipCode: this.formData.zipCode,
      location,

      maxParticipants: this.formData.maxParticipants,
      maxTeamsPerClub: this.formData.maxTeamsPerClub,
      registrationFeeCents: Number(this.formData.registrationFeeCents ?? 0),

    };

    const btn = document.getElementById('btn-create');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Création en cours...';

    try {
      const res = await fetch('/api/events/manage', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        const errorMsg =
          json?.message ||
          json?.error ||
          json?.details ||
          (json?.errors && JSON.stringify(json.errors)) ||
          `Erreur HTTP ${res.status}`;

        throw new Error(errorMsg);
      }

      const eventId = json?.data?.id || json?.id;

      if (!eventId) {
        throw new Error('L\'ID de l\'événement n\'a pas été retourné par le serveur');
      }

      this.showMessage('✅ Tournoi créé avec succès ! Redirection...', false);

      setTimeout(() => {
        Router.go(`/admin/events/${eventId}`);
      }, 1000);

    } catch (error) {
      console.error('Erreur création tournoi:', error);
      this.showMessage(`❌ ${error.message}`, true);

      btn.disabled = false;
      btn.innerHTML = '✨ Créer le tournoi';
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
    el.style.marginBottom = '20px';

    // Scroll vers le message
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  },

  hideMessage() {
    const el = document.getElementById('wizard-message');
    if (el) {
      el.style.display = 'none';
    }
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

export default AdminCreateEventWizardPage;