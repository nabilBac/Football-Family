// /static/app/js/pages/admin/events-create-unified-wizard.page.js
// 🎯 WIZARD UNIFIÉ - FootballFamily
// Intelligent, adaptatif, pro

import { Router } from "../../router.js";

export const UnifiedEventWizardPage = {
    currentStep: 1,
    totalSteps: 6,
    formData: {},
    userType: null, // 'CLUB' ou 'PUBLIC'
    autoSaveKey: 'ff_event_draft',

    async render() {
        // Détection automatique du type d'utilisateur
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
this.userType = currentUser.clubId ? 'CLUB' : 'PUBLIC';

        
        // Récupération draft si existe
        this.loadDraft();

        return `
        <div class="unified-wizard-page">
            <div class="wizard-header">
                <button id="btn-close-wizard" class="btn-close-wizard">
                    <i class="fas fa-times"></i>
                </button>
                <h1 class="wizard-title">
                    ${this.userType === 'CLUB' ? '🏛️ Créer un tournoi club' : '⚽ Créer un événement'}
                </h1>
                <p class="wizard-subtitle">
                    ${this.userType === 'CLUB' 
                        ? 'Tournoi officiel pour votre club' 
                        : 'Organisez votre tournoi amateur'}
                </p>
            </div>

            <div class="wizard-container">
                <!-- BARRE DE PROGRESSION PRO -->
                <div class="progress-bar-container">
                    <div class="progress-bar-track">
                        <div class="progress-bar-fill" id="progress-fill" 
                             style="width: ${((this.currentStep - 1) / (this.totalSteps - 1)) * 100}%">
                        </div>
                    </div>
                    <div class="progress-steps">
                        ${[1, 2, 3, 4, 5, 6].map(step => `
                            <div class="progress-step ${this.currentStep >= step ? 'active' : ''} ${this.currentStep === step ? 'current' : ''}">
                                <div class="step-circle">
                                    ${this.currentStep > step ? '<i class="fas fa-check"></i>' : step}
                                </div>
                                <div class="step-label">${this.getStepLabel(step)}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- MESSAGES -->
                <div id="wizard-alert" class="wizard-alert" style="display: none;"></div>

                <!-- CONTENU ÉTAPE -->
                <div class="wizard-content" id="wizard-content">
                    ${this.renderStep(this.currentStep)}
                </div>

                <!-- NAVIGATION -->
                <div class="wizard-navigation">
                    ${this.currentStep > 1 ? `
                        <button id="btn-prev" class="btn-wizard btn-secondary">
                            <i class="fas fa-arrow-left"></i>
                            Précédent
                        </button>
                    ` : '<div></div>'}

                    <div class="nav-info">
                        <span class="step-counter">Étape ${this.currentStep}/${this.totalSteps}</span>
                        ${this.currentStep === 5 ? `
                            <button id="btn-skip" class="btn-skip">
                                Passer cette étape →
                            </button>
                        ` : ''}
                    </div>

                    ${this.currentStep < this.totalSteps ? `
                        <button id="btn-next" class="btn-wizard btn-primary">
                            Suivant
                            <i class="fas fa-arrow-right"></i>
                        </button>
                    ` : `
                        <button id="btn-create" class="btn-wizard btn-success">
                            <i class="fas fa-rocket"></i>
                            Créer le tournoi
                        </button>
                    `}
                </div>
            </div>
        </div>
        `;
    },

    getStepLabel(step) {
        const labels = {
            1: 'Infos',
            2: 'Date & Lieu',
            3: 'Capacités',
            4: 'Config',
            5: 'Extras',
            6: 'Récap'
        };
        return labels[step];
    },
    renderStep(step) {
  switch (Number(step)) {
    case 1: return this.renderStep1();
    case 2: return this.renderStep2();
    case 3: return this.renderStep3();
    case 4: return this.renderStep4();
    case 5: return this.renderStep5();
    case 6: return this.renderStep6();
    default: return this.renderStep1();
  }
},


    // ===================================
    // ÉTAPE 1 : INFORMATIONS DE BASE
    // ===================================
    renderStep1() {
        return `
            <div class="step-container">
                <div class="step-header">
                    <h2>📋 Informations de base</h2>
                    <p>Commencez par les informations essentielles</p>
                </div>

                <div class="form-grid">
                    <!-- Nom -->
                    <div class="form-group full-width">
                        <label class="required">Nom du tournoi</label>
                        <input 
                            type="text" 
                            id="name"
                            placeholder="Ex: Tournoi U13 - Printemps 2025"
                            value="${this.formData.name || ''}"
                            maxlength="100"
                            class="form-control"
                        />
                        <small class="form-hint">Maximum 100 caractères</small>
                    </div>

                    <!-- Catégorie -->
                    <div class="form-group">
                        <label class="required">Catégorie d'âge</label>
                        <select id="category" class="form-control">
                            <option value="">-- Sélectionner --</option>
                            <option value="U7" ${this.formData.category === 'U7' ? 'selected' : ''}>U7 (moins de 7 ans)</option>
                            <option value="U9" ${this.formData.category === 'U9' ? 'selected' : ''}>U9 (moins de 9 ans)</option>
                            <option value="U11" ${this.formData.category === 'U11' ? 'selected' : ''}>U11 (moins de 11 ans)</option>
                            <option value="U13" ${this.formData.category === 'U13' ? 'selected' : ''}>U13 (moins de 13 ans)</option>
                            <option value="U15" ${this.formData.category === 'U15' ? 'selected' : ''}>U15 (moins de 15 ans)</option>
                            <option value="U17" ${this.formData.category === 'U17' ? 'selected' : ''}>U17 (moins de 17 ans)</option>
                            <option value="U19" ${this.formData.category === 'U19' ? 'selected' : ''}>U19 (moins de 19 ans)</option>
                            <option value="SENIOR" ${this.formData.category === 'SENIOR' ? 'selected' : ''}>Seniors</option>
                            <option value="VETERAN" ${this.formData.category === 'VETERAN' ? 'selected' : ''}>Vétérans (+35 ans)</option>
                        </select>
                    </div>

                    <!-- Niveau -->
                    <div class="form-group">
                        <label class="required">Niveau</label>
                        <select id="level" class="form-control">
                            <option value="">-- Sélectionner --</option>
                            <option value="LOISIR" ${this.formData.level === 'LOISIR' ? 'selected' : ''}>🎯 Loisir / Détente</option>
                            <option value="AMATEUR" ${this.formData.level === 'AMATEUR' ? 'selected' : ''}>⚽ Amateur / Club</option>
                            <option value="COMPETITION" ${this.formData.level === 'COMPETITION' ? 'selected' : ''}>🏆 Compétition</option>
                            <option value="ELITE" ${this.formData.level === 'ELITE' ? 'selected' : ''}>⭐ Élite / Haut niveau</option>
                        </select>
                    </div>

                    <!-- Format -->
                    <div class="form-group">
                        <label class="required">Format</label>
                        <select id="format" class="form-control">
                            <option value="">-- Sélectionner --</option>
                            <option value="TOURNAMENT" ${this.formData.format === 'TOURNAMENT' ? 'selected' : ''}>🏆 Tournoi complet (poules + phases finales)</option>
                            <option value="SINGLE_MATCH" ${this.formData.format === 'SINGLE_MATCH' ? 'selected' : ''}>⚽ Match unique</option>
                        </select>
                    </div>

                    <!-- Description -->
                    <div class="form-group full-width">
                        <label>Description (optionnel)</label>
                        <textarea 
                            id="description"
                            rows="4"
                            placeholder="Décrivez votre tournoi, règles spéciales, ambiance..."
                            maxlength="500"
                            class="form-control"
                        >${this.formData.description || ''}</textarea>
                        <small class="form-hint">Maximum 500 caractères</small>
                    </div>

                    <!-- Photo de couverture -->
                    <div class="form-group full-width">
                        <label>Photo de couverture</label>
                        <div class="photo-upload-zone" id="photo-upload-zone">
                            <input type="file" id="cover-photo" accept="image/*" style="display: none;">
                            <div class="upload-placeholder" id="upload-placeholder">
                                <i class="fas fa-cloud-upload-alt"></i>
                                <p><strong>Cliquez</strong> ou glissez une image</p>
                                <small>JPG, PNG - Max 5MB - Recommandé: 1200x600px</small>
                            </div>
                            <div class="photo-preview" id="photo-preview" style="display: none;">
                                <img id="preview-img" src="" alt="Preview">
                                <button type="button" class="btn-remove-photo" id="btn-remove-photo">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    // ===================================
    // ÉTAPE 2 : DATE & LIEU
    // ===================================
    renderStep2() {
        const today = new Date().toISOString().split('T')[0];
        
        return `
            <div class="step-container">
                <div class="step-header">
                    <h2>📅 Date et lieu</h2>
                    <p>Quand et où se déroulera votre événement ?</p>
                </div>

                <div class="form-grid">
                    <!-- Date -->
                    <div class="form-group">
                        <label class="required">Date du tournoi</label>
                        <input 
                            type="date"
                            id="date"
                            min="${today}"
                            value="${this.formData.date || ''}"
                            class="form-control"
                        />
                    </div>

                    <!-- Heure début -->
                    <div class="form-group">
                        <label class="required">Heure de début</label>
                        <input 
                            type="time"
                            id="start-time"
                            value="${this.formData.startTime || '09:00'}"
                            class="form-control"
                        />
                    </div>

                    <!-- Heure fin -->
                    <div class="form-group">
                        <label>Heure de fin (estimée)</label>
                        <input 
                            type="time"
                            id="end-time"
                            value="${this.formData.endTime || '18:00'}"
                            class="form-control"
                        />
                    </div>

                    <!-- Ville -->
                    <div class="form-group">
                        <label class="required">Ville</label>
                        <input 
                            type="text"
                            id="city"
                            placeholder="Ex: Toulon"
                            value="${this.formData.city || ''}"
                            maxlength="100"
                            class="form-control"
                        />
                    </div>

                    <!-- Adresse -->
                    <div class="form-group full-width">
                        <label>Adresse complète</label>
                        <input 
                            type="text"
                            id="address"
                            placeholder="Ex: 118 impasse des Platanes"
                            value="${this.formData.address || ''}"
                            maxlength="200"
                            class="form-control"
                        />
                    </div>

                    <!-- Code postal -->
                    <div class="form-group">
                        <label>Code postal</label>
                        <input 
                            type="text"
                            id="zipcode"
                            placeholder="Ex: 83000"
                            value="${this.formData.zipCode || ''}"
                            maxlength="5"
                            pattern="[0-9]{5}"
                            class="form-control"
                        />
                        <small class="form-hint">5 chiffres</small>
                    </div>

                    <!-- Nombre de terrains -->
                    <div class="form-group">
                        <label>Nombre de terrains</label>
                        <input 
                            type="number"
                            id="num-fields"
                            min="1"
                            max="20"
                            value="${this.formData.numFields || 1}"
                            class="form-control"
                        />
                    </div>

                    <!-- Type de surface -->
                    <div class="form-group">
                        <label>Type de surface</label>
                        <select id="surface" class="form-control">
                            <option value="SYNTHETIC" ${this.formData.surface === 'SYNTHETIC' ? 'selected' : ''}>Synthétique</option>
                            <option value="NATURAL" ${this.formData.surface === 'NATURAL' ? 'selected' : ''}>Herbe naturelle</option>
                            <option value="INDOOR" ${this.formData.surface === 'INDOOR' ? 'selected' : ''}>Salle (indoor)</option>
                            <option value="BEACH" ${this.formData.surface === 'BEACH' ? 'selected' : ''}>Beach soccer</option>
                        </select>
                    </div>
                </div>

                <div class="info-box info">
                    <i class="fas fa-info-circle"></i>
                    <div>
                        <strong>Conseil</strong>
                        <p>Plus votre adresse est précise, plus il sera facile pour les participants de vous trouver !</p>
                    </div>
                </div>
            </div>
        `;
    },

    // ===================================
    // ÉTAPE 3 : CAPACITÉS
    // ===================================
    renderStep3() {
        const showClubQuota = this.userType === 'CLUB';
        
        return `
            <div class="step-container">
                <div class="step-header">
                    <h2>👥 Capacités et tarifs</h2>
                    <p>Définissez les limites de participation</p>
                </div>

                <div class="form-grid">
                    <!-- Max participants -->
                    <div class="form-group">
                        <label class="required">Nombre maximum d'équipes</label>
                        <input 
                            type="number"
                            id="max-participants"
                            min="4"
                            max="64"
                            value="${this.formData.maxParticipants || 16}"
                            class="form-control"
                        />
                        <small class="form-hint">Entre 4 et 64 équipes</small>
                    </div>

                    <!-- Suggestions rapides -->
                    <div class="form-group">
                        <label>Suggestions rapides</label>
                        <div class="quick-buttons">
                            <button type="button" class="btn-quick" data-value="8">8 équipes</button>
                            <button type="button" class="btn-quick" data-value="16">16 équipes</button>
                            <button type="button" class="btn-quick" data-value="32">32 équipes</button>
                        </div>
                    </div>

                    ${showClubQuota ? `
                        <!-- Quota par club -->
                        <div class="form-group">
                            <label class="required">Équipes par club (quota)</label>
                            <input 
                                type="number"
                                id="max-teams-per-club"
                                min="1"
                                max="32"
                                value="${this.formData.maxTeamsPerClub || 2}"
                                class="form-control"
                            />
                            <small class="form-hint">Limite d'équipes qu'un club peut inscrire</small>
                        </div>
                    ` : ''}

                    <!-- Prix -->
                    <div class="form-group">
                        <label>Prix d'inscription (€)</label>
                        <input 
                            type="number"
                            id="price"
                            min="0"
                            step="0.50"
                            value="${this.formData.registrationFeeCents ? (this.formData.registrationFeeCents / 100) : 0}"
                            class="form-control"
                            placeholder="0 = gratuit"
                        />
                        <small class="form-hint">0 € = Gratuit</small>
                    </div>

                    <!-- Date limite inscription -->
                    <div class="form-group">
                        <label>Date limite d'inscription</label>
                        <input 
                            type="datetime-local"
                            id="deadline"
                            value="${this.formData.registrationDeadline || ''}"
                            class="form-control"
                        />
                        <small class="form-hint">Optionnel - fermeture automatique</small>
                    </div>
                </div>

                <div class="info-box success">
                    <i class="fas fa-lightbulb"></i>
                    <div>
                        <strong>Recommandations</strong>
                        <ul>
                            <li><strong>8-16 équipes</strong> : Idéal pour un tournoi d'une journée</li>
                            <li><strong>2-3 équipes/club</strong> : Favorise la diversité</li>
                            <li><strong>Prix modéré</strong> : 10-20€ couvre les frais basiques</li>
                        </ul>
                    </div>
                </div>
            </div>
        `;
    },

    // ===================================
    // ÉTAPE 4 : CONFIGURATION
    // ===================================
    renderStep4() {
        const isClub = this.userType === 'CLUB';
        
        return `
            <div class="step-container">
                <div class="step-header">
                    <h2>⚙️ Configuration</h2>
                    <p>Paramètres d'inscription et visibilité</p>
                </div>

                <div class="form-grid">
                    <!-- Type événement -->
                    <div class="form-group full-width">
                        <label class="required">Type d'événement</label>
                        <div class="radio-cards">
                            <label class="radio-card ${isClub ? 'checked' : ''}">
                                <input 
                                    type="radio" 
                                    name="event-type" 
                                    value="CLUB_EVENT"
                                    ${isClub ? 'checked' : ''}
                                    ${!isClub ? 'disabled' : ''}
                                />
                                <div class="radio-content">
                                    <i class="fas fa-shield-alt"></i>
                                    <strong>Tournoi Club</strong>
                                    <small>Réservé aux clubs avec SIRET</small>
                                </div>
                            </label>
                            <label class="radio-card ${!isClub ? 'checked' : ''}">
                                <input 
                                    type="radio" 
                                    name="event-type" 
                                    value="OPEN_EVENT"
                                    ${!isClub ? 'checked' : ''}
                                />
                                <div class="radio-content">
                                    <i class="fas fa-users"></i>
                                    <strong>Événement Ouvert</strong>
                                    <small>Accessible à tous</small>
                                </div>
                            </label>
                        </div>
                    </div>

                    <!-- Mode inscription -->
                    <div class="form-group full-width">
                        <label class="required">Mode d'inscription</label>
                        <div class="radio-cards">
                            <label class="radio-card ${isClub ? 'checked' : ''}">
                                <input 
                                    type="radio" 
                                    name="registration-type" 
                                    value="CLUB_ONLY"
                                    ${isClub ? 'checked' : ''}
                                />
                                <div class="radio-content">
                                    <i class="fas fa-building"></i>
                                    <strong>Clubs uniquement</strong>
                                    <small>Inscription par équipes de clubs</small>
                                </div>
                            </label>
                            <label class="radio-card ${!isClub ? 'checked' : ''}">
                                <input 
                                    type="radio" 
                                    name="registration-type" 
                                    value="INDIVIDUAL"
                                />
                                <div class="radio-content">
                                    <i class="fas fa-user"></i>
                                    <strong>Individuelle (UTF)</strong>
                                    <small>Joueurs seuls, équipes formées auto</small>
                                </div>
                            </label>
                            <label class="radio-card">
                                <input 
                                    type="radio" 
                                    name="registration-type" 
                                    value="OPEN"
                                />
                                <div class="radio-content">
                                    <i class="fas fa-unlock"></i>
                                    <strong>Ouverte</strong>
                                    <small>Clubs ET individuels</small>
                                </div>
                            </label>
                        </div>
                    </div>

                    <!-- UTF Options (si INDIVIDUAL sélectionné) -->
                    <div id="utf-options" style="display: none;" class="form-group full-width">
                        <div class="subsection">
                            <h4>⚽ Configuration UTF (Équipes automatiques)</h4>
                            <div class="form-grid">
                                <div class="form-group">
                                    <label>Nombre d'équipes</label>
                                    <input 
                                        type="number"
                                        id="utf-num-teams"
                                        min="2"
                                        max="32"
                                        value="${this.formData.utfNumTeams || 8}"
                                        class="form-control"
                                    />
                                </div>
                                <div class="form-group">
                                    <label>Taille des équipes</label>
                                    <select id="utf-team-size" class="form-control">
                                        <option value="5" ${this.formData.utfTeamSize === 5 ? 'selected' : ''}>5v5</option>
                                        <option value="7" ${this.formData.utfTeamSize === 7 ? 'selected' : ''}>7v7</option>
                                        <option value="11" ${this.formData.utfTeamSize === 11 ? 'selected' : ''}>11v11</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Visibilité -->
                    <div class="form-group full-width">
                        <label class="required">Visibilité</label>
                        <div class="radio-cards">
                            <label class="radio-card checked">
                                <input 
                                    type="radio" 
                                    name="visibility" 
                                    value="PUBLIC"
                                    checked
                                />
                                <div class="radio-content">
                                    <i class="fas fa-globe"></i>
                                    <strong>Public</strong>
                                    <small>Visible par tous</small>
                                </div>
                            </label>
                            <label class="radio-card">
                                <input 
                                    type="radio" 
                                    name="visibility" 
                                    value="CLUB"
                                />
                                <div class="radio-content">
                                    <i class="fas fa-lock"></i>
                                    <strong>Clubs uniquement</strong>
                                    <small>Réservé aux membres de clubs</small>
                                </div>
                            </label>
                            <label class="radio-card">
                                <input 
                                    type="radio" 
                                    name="visibility" 
                                    value="PRIVATE"
                                />
                                <div class="radio-content">
                                    <i class="fas fa-eye-slash"></i>
                                    <strong>Privé</strong>
                                    <small>Sur invitation uniquement</small>
                                </div>
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    // ===================================
    // ÉTAPE 5 : EXTRAS (OPTIONNEL)
    // ===================================
    renderStep5() {
        return `
            <div class="step-container">
                <div class="step-header">
                    <h2>✨ Informations complémentaires</h2>
                    <p>Optionnel - Vous pouvez passer cette étape</p>
                </div>

                <div class="form-grid">
                    <!-- Règlement -->
                    <div class="form-group full-width">
                        <label>Règlement du tournoi</label>
                        <textarea 
                            id="rules"
                            rows="6"
                            placeholder="Règles spécifiques, format des matchs, durée, gestion cartons..."
                            maxlength="1000"
                            class="form-control"
                        >${this.formData.rules || ''}</textarea>
                        <small class="form-hint">Maximum 1000 caractères</small>
                    </div>

                    <!-- Services disponibles -->
                    <div class="form-group full-width">
                        <label>Services disponibles</label>
                        <div class="checkbox-grid">
                            <label class="checkbox-card">
                                <input type="checkbox" id="service-parking" ${this.formData.hasParking ? 'checked' : ''}>
                                <div class="checkbox-content">
                                    <i class="fas fa-parking"></i>
                                    <span>Parking</span>
                                </div>
                            </label>
                            <label class="checkbox-card">
                                <input type="checkbox" id="service-vestiaires" ${this.formData.hasVestiaires ? 'checked' : ''}>
                                <div class="checkbox-content">
                                    <i class="fas fa-door-open"></i>
                                    <span>Vestiaires</span>
                                </div>
                            </label>
                            <label class="checkbox-card">
                                <input type="checkbox" id="service-douches" ${this.formData.hasDouches ? 'checked' : ''}>
                                <div class="checkbox-content">
                                    <i class="fas fa-shower"></i>
                                    <span>Douches</span>
                                </div>
                            </label>
                            <label class="checkbox-card">
                                <input type="checkbox" id="service-buvette" ${this.formData.hasBuvette ? 'checked' : ''}>
                                <div class="checkbox-content">
                                    <i class="fas fa-coffee"></i>
                                    <span>Buvette</span>
                                </div>
                            </label>
                            <label class="checkbox-card">
                                <input type="checkbox" id="service-wifi" ${this.formData.hasWifi ? 'checked' : ''}>
                                <div class="checkbox-content">
                                    <i class="fas fa-wifi"></i>
                                    <span>Wi-Fi</span>
                                </div>
                            </label>
                            <label class="checkbox-card">
                                <input type="checkbox" id="service-first-aid" ${this.formData.hasFirstAid ? 'checked' : ''}>
                                <div class="checkbox-content">
                                    <i class="fas fa-medkit"></i>
                                    <span>Secourisme</span>
                                </div>
                            </label>
                        </div>
                    </div>

                    <!-- Contact organisateur -->
                    <div class="form-group">
                        <label>Email contact</label>
                        <input 
                            type="email"
                            id="contact-email"
                            placeholder="contact@exemple.fr"
                            value="${this.formData.contactEmail || ''}"
                            class="form-control"
                        />
                    </div>

                    <div class="form-group">
                        <label>Téléphone contact</label>
                        <input 
                            type="tel"
                            id="contact-phone"
                            placeholder="06 12 34 56 78"
                            value="${this.formData.contactPhone || ''}"
                            class="form-control"
                        />
                    </div>
                </div>

                <div class="info-box">
                    <i class="fas fa-info-circle"></i>
                    <div>
                        <strong>Ces informations sont optionnelles</strong>
                        <p>Elles aideront les participants à mieux se préparer et à vous contacter si besoin.</p>
                    </div>
                </div>
            </div>
        `;
    },

    // ===================================
    // ÉTAPE 6 : RÉCAPITULATIF
    // ===================================
    renderStep6() {
        const price = this.formData.registrationFeeCents 
            ? (this.formData.registrationFeeCents / 100).toFixed(2).replace('.00', '') + '€'
            : 'Gratuit';

        return `
            <div class="step-container">
                <div class="step-header">
                    <h2>✅ Récapitulatif</h2>
                    <p>Vérifiez toutes les informations avant de créer</p>
                </div>

                <!-- PREVIEW CARD -->
                <div class="event-preview-card">
                    ${this.formData.coverPhotoData ? `
                        <div class="preview-cover" style="background-image: url('${this.formData.coverPhotoData}')"></div>
                    ` : `
                        <div class="preview-cover preview-cover-placeholder">
                            <i class="fas fa-image"></i>
                        </div>
                    `}
                    <div class="preview-content">
                        <div class="preview-header">
                            <span class="preview-badge">${this.formData.category || 'CATÉGORIE'}</span>
                            <span class="preview-badge">${this.formData.level || 'NIVEAU'}</span>
                        </div>
                        <h3>${this.formData.name || 'Nom du tournoi'}</h3>
                        <div class="preview-meta">
                            <span><i class="fas fa-calendar"></i> ${this.formatDate(this.formData.date)}</span>
                            <span><i class="fas fa-clock"></i> ${this.formData.startTime || '09:00'}</span>
                            <span><i class="fas fa-map-marker-alt"></i> ${this.formData.city || 'Ville'}</span>
                        </div>
                        <div class="preview-stats">
                            <div class="stat">
                                <strong>${this.formData.maxParticipants || 0}</strong>
                                <small>places</small>
                            </div>
                            <div class="stat">
                                <strong>${price}</strong>
                                <small>inscription</small>
                            </div>
                            <div class="stat">
                                <strong>${this.formData.format === 'TOURNAMENT' ? 'Tournoi' : 'Match'}</strong>
                                <small>format</small>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- DÉTAILS COMPLETS -->
                <div class="recap-sections">
                    <div class="recap-section">
                        <h4><i class="fas fa-info-circle"></i> Informations générales</h4>
                        <dl>
                            <dt>Nom :</dt>
                            <dd>${this.escapeHtml(this.formData.name || '')}</dd>
                            
                            <dt>Catégorie :</dt>
                            <dd>${this.escapeHtml(this.formData.category || '')}</dd>
                            
                            <dt>Niveau :</dt>
                            <dd>${this.escapeHtml(this.formData.level || '')}</dd>
                            
                            <dt>Format :</dt>
                            <dd>${this.formData.format === 'TOURNAMENT' ? 'Tournoi complet' : 'Match unique'}</dd>
                            
                            ${this.formData.description ? `
                                <dt>Description :</dt>
                                <dd>${this.escapeHtml(this.formData.description)}</dd>
                            ` : ''}
                        </dl>
                    </div>

                    <div class="recap-section">
                        <h4><i class="fas fa-calendar"></i> Date et lieu</h4>
                        <dl>
                            <dt>Date :</dt>
                            <dd>${this.formatDate(this.formData.date)}</dd>
                            
                            <dt>Horaires :</dt>
                            <dd>${this.formData.startTime || '09:00'} - ${this.formData.endTime || '18:00'}</dd>
                            
                            <dt>Ville :</dt>
                            <dd>${this.escapeHtml(this.formData.city || '')}</dd>
                            
                            ${this.formData.address ? `
                                <dt>Adresse :</dt>
                                <dd>${this.escapeHtml(this.formData.address)}</dd>
                            ` : ''}
                            
                            ${this.formData.zipCode ? `
                                <dt>Code postal :</dt>
                                <dd>${this.escapeHtml(this.formData.zipCode)}</dd>
                            ` : ''}
                            
                            <dt>Terrains :</dt>
                            <dd>${this.formData.numFields || 1} terrain(s) - ${this.formData.surface || 'Synthétique'}</dd>
                        </dl>
                    </div>

                    <div class="recap-section">
                        <h4><i class="fas fa-users"></i> Capacités et tarifs</h4>
                        <dl>
                            <dt>Places totales :</dt>
                            <dd>${this.formData.maxParticipants || 0} équipes</dd>
                            
                            ${this.formData.maxTeamsPerClub ? `
                                <dt>Quota par club :</dt>
                                <dd>${this.formData.maxTeamsPerClub} équipes maximum</dd>
                            ` : ''}
                            
                            <dt>Prix d'inscription :</dt>
                            <dd>${price}</dd>
                            
                            ${this.formData.registrationDeadline ? `
                                <dt>Date limite :</dt>
                                <dd>${this.formatDateTime(this.formData.registrationDeadline)}</dd>
                            ` : ''}
                        </dl>
                    </div>

                    ${this.formData.rules || this.hasServices() ? `
                        <div class="recap-section">
                            <h4><i class="fas fa-plus-circle"></i> Informations complémentaires</h4>
                            <dl>
                                ${this.formData.rules ? `
                                    <dt>Règlement :</dt>
                                    <dd>${this.escapeHtml(this.formData.rules)}</dd>
                                ` : ''}
                                
                                ${this.hasServices() ? `
                                    <dt>Services :</dt>
                                    <dd>${this.getServicesText()}</dd>
                                ` : ''}
                            </dl>
                        </div>
                    ` : ''}
                </div>

                <div class="final-check">
                    <i class="fas fa-check-circle"></i>
                    <p><strong>Tout est prêt !</strong> Vous pouvez maintenant créer votre tournoi.</p>
                </div>
            </div>
        `;
    },

    // ===================================
    // INITIALISATION
    // ===================================
    async init() {
        // Gestion photo upload
        this.initPhotoUpload();
        
        // Navigation
        const btnNext = document.getElementById('btn-next');
        const btnPrev = document.getElementById('btn-prev');
        const btnCreate = document.getElementById('btn-create');
        const btnClose = document.getElementById('btn-close-wizard');
        const btnSkip = document.getElementById('btn-skip');

        if (btnNext) {
            btnNext.addEventListener('click', () => this.nextStep());
        }

        if (btnPrev) {
            btnPrev.addEventListener('click', () => this.previousStep());
        }

        if (btnCreate) {
            btnCreate.addEventListener('click', () => this.createEvent());
        }

        if (btnClose) {
            btnClose.addEventListener('click', () => {
                if (confirm('Êtes-vous sûr de vouloir quitter ? Vos modifications seront sauvegardées.')) {
                    this.saveDraft();
                    Router.go('/admin/events');
                }
            });
        }

        if (btnSkip) {
            btnSkip.addEventListener('click', () => this.nextStep());
        }

        // Suggestions rapides
        document.querySelectorAll('.btn-quick').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const value = e.target.dataset.value;
                document.getElementById('max-participants').value = value;
            });
        });

        // UTF options toggle
        const registrationRadios = document.querySelectorAll('input[name="registration-type"]');
        registrationRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                const utfOptions = document.getElementById('utf-options');
                if (utfOptions) {
                    utfOptions.style.display = e.target.value === 'INDIVIDUAL' ? 'block' : 'none';
                }
            });
        });

        // Focus premier champ
        setTimeout(() => {
            const firstInput = document.querySelector('input:not([type="radio"]):not([type="checkbox"]), select, textarea');
            if (firstInput) firstInput.focus();
        }, 100);

        // Auto-save toutes les 30s
        this.autoSaveInterval = setInterval(() => {
            this.saveDraft();
        }, 30000);
    },

    // ===================================
    // NAVIGATION
    // ===================================
    async nextStep() {
        this.saveStepData(this.currentStep);
        
        if (!this.validateStep(this.currentStep)) {
            return;
        }

        this.saveDraft();
        this.currentStep++;
        await this.refreshView();
    },

    async previousStep() {
        this.saveStepData(this.currentStep);
        this.saveDraft();
        this.currentStep--;
        await this.refreshView();
    },

    async refreshView() {
        const content = document.getElementById('wizard-content');
        if (content) {
            content.innerHTML = this.renderStep(this.currentStep);
        }

        // Mise à jour progress bar
        const progressFill = document.getElementById('progress-fill');
        if (progressFill) {
            progressFill.style.width = `${((this.currentStep - 1) / (this.totalSteps - 1)) * 100}%`;
        }

        // Mise à jour steps
        const steps = document.querySelectorAll('.progress-step');
        steps.forEach((step, index) => {
            const stepNum = index + 1;
            if (this.currentStep >= stepNum) {
                step.classList.add('active');
            } else {
                step.classList.remove('active');
            }
            
            if (this.currentStep === stepNum) {
                step.classList.add('current');
            } else {
                step.classList.remove('current');
            }

            const circle = step.querySelector('.step-circle');
            if (circle) {
                circle.innerHTML = this.currentStep > stepNum ? '<i class="fas fa-check"></i>' : stepNum;
            }
        });

        // Re-render navigation
        const nav = document.querySelector('.wizard-navigation');
        if (nav) {
            nav.innerHTML = `
                ${this.currentStep > 1 ? `
                    <button id="btn-prev" class="btn-wizard btn-secondary">
                        <i class="fas fa-arrow-left"></i>
                        Précédent
                    </button>
                ` : '<div></div>'}

                <div class="nav-info">
                    <span class="step-counter">Étape ${this.currentStep}/${this.totalSteps}</span>
                    ${this.currentStep === 5 ? `
                        <button id="btn-skip" class="btn-skip">
                            Passer cette étape →
                        </button>
                    ` : ''}
                </div>

                ${this.currentStep < this.totalSteps ? `
                    <button id="btn-next" class="btn-wizard btn-primary">
                        Suivant
                        <i class="fas fa-arrow-right"></i>
                    </button>
                ` : `
                    <button id="btn-create" class="btn-wizard btn-success">
                        <i class="fas fa-rocket"></i>
                        Créer le tournoi
                    </button>
                `}
            `;
        }

        // Re-init
        await this.init();

        // Scroll top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    // ===================================
    // SAUVEGARDE DONNÉES
    // ===================================
    saveStepData(step) {
        switch (step) {
            case 1:
                this.formData.name = document.getElementById('name')?.value.trim();
                this.formData.category = document.getElementById('category')?.value;
                this.formData.level = document.getElementById('level')?.value;
                this.formData.format = document.getElementById('format')?.value;
                this.formData.description = document.getElementById('description')?.value.trim();
                break;

            case 2:
                this.formData.date = document.getElementById('date')?.value;
                this.formData.startTime = document.getElementById('start-time')?.value;
                this.formData.endTime = document.getElementById('end-time')?.value;
                this.formData.city = document.getElementById('city')?.value.trim();
                this.formData.address = document.getElementById('address')?.value.trim();
                this.formData.zipCode = document.getElementById('zipcode')?.value.trim();
                this.formData.numFields = parseInt(document.getElementById('num-fields')?.value, 10) || 1;
                this.formData.surface = document.getElementById('surface')?.value;
                break;

            case 3:
                this.formData.maxParticipants = parseInt(document.getElementById('max-participants')?.value, 10);
                const maxTeams = document.getElementById('max-teams-per-club')?.value.trim();
                this.formData.maxTeamsPerClub = maxTeams ? parseInt(maxTeams, 10) : null;
                const priceEur = Number(document.getElementById('price')?.value || 0);
                this.formData.registrationFeeCents = Math.max(0, Math.round(priceEur * 100));
                this.formData.registrationDeadline = document.getElementById('deadline')?.value;
                break;

            case 4:
                this.formData.eventType = document.querySelector('input[name="event-type"]:checked')?.value;
                this.formData.registrationType = document.querySelector('input[name="registration-type"]:checked')?.value;
                this.formData.visibility = document.querySelector('input[name="visibility"]:checked')?.value;
                
                if (this.formData.registrationType === 'INDIVIDUAL') {
                    this.formData.utfNumTeams = parseInt(document.getElementById('utf-num-teams')?.value, 10);
                    this.formData.utfTeamSize = parseInt(document.getElementById('utf-team-size')?.value, 10);
                }
                break;

            case 5:
                this.formData.rules = document.getElementById('rules')?.value.trim();
                this.formData.hasParking = document.getElementById('service-parking')?.checked || false;
                this.formData.hasVestiaires = document.getElementById('service-vestiaires')?.checked || false;
                this.formData.hasDouches = document.getElementById('service-douches')?.checked || false;
                this.formData.hasBuvette = document.getElementById('service-buvette')?.checked || false;
                this.formData.hasWifi = document.getElementById('service-wifi')?.checked || false;
                this.formData.hasFirstAid = document.getElementById('service-first-aid')?.checked || false;
                this.formData.contactEmail = document.getElementById('contact-email')?.value.trim();
                this.formData.contactPhone = document.getElementById('contact-phone')?.value.trim();
                break;
        }
    },

    // ===================================
    // VALIDATION
    // ===================================
    validateStep(step) {
        this.hideAlert();

        switch (step) {
            case 1:
                if (!this.formData.name) {
                    this.showAlert('Le nom du tournoi est obligatoire', 'error');
                    return false;
                }
                if (!this.formData.category) {
                    this.showAlert('La catégorie d\'âge est obligatoire', 'error');
                    return false;
                }
                if (!this.formData.level) {
                    this.showAlert('Le niveau est obligatoire', 'error');
                    return false;
                }
                if (!this.formData.format) {
                    this.showAlert('Le format est obligatoire', 'error');
                    return false;
                }
                break;

            case 2:
                if (!this.formData.date) {
                    this.showAlert('La date est obligatoire', 'error');
                    return false;
                }
                
                const selectedDate = new Date(this.formData.date);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                
                if (selectedDate < today) {
                    this.showAlert('La date ne peut pas être dans le passé', 'error');
                    return false;
                }

                if (!this.formData.city) {
                    this.showAlert('La ville est obligatoire', 'error');
                    return false;
                }

                if (this.formData.zipCode && !/^\d{5}$/.test(this.formData.zipCode)) {
                    this.showAlert('Le code postal doit contenir 5 chiffres', 'error');
                    return false;
                }
                break;

            case 3:
                if (!this.formData.maxParticipants || this.formData.maxParticipants < 4 || this.formData.maxParticipants > 64) {
                    this.showAlert('Le nombre d\'équipes doit être entre 4 et 64', 'error');
                    return false;
                }

                if (this.userType === 'CLUB') {
                    if (!this.formData.maxTeamsPerClub || this.formData.maxTeamsPerClub < 1) {
                        this.showAlert('Le quota par club doit être au minimum de 1', 'error');
                        return false;
                    }
                    if (this.formData.maxTeamsPerClub > this.formData.maxParticipants) {
                        this.showAlert('Le quota par club ne peut pas dépasser le nombre total d\'équipes', 'error');
                        return false;
                    }
                }
                break;

            case 4:
                if (!this.formData.eventType) {
                    this.showAlert('Le type d\'événement est obligatoire', 'error');
                    return false;
                }
                if (!this.formData.registrationType) {
                    this.showAlert('Le mode d\'inscription est obligatoire', 'error');
                    return false;
                }
                if (!this.formData.visibility) {
                    this.showAlert('La visibilité est obligatoire', 'error');
                    return false;
                }
                break;
        }

        return true;
    },

    // ===================================
    // CRÉATION ÉVÉNEMENT
    // ===================================
    async createEvent() {
        const token = localStorage.getItem('accessToken');
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');

        if (!token) {
            this.showAlert('Vous devez être connecté', 'error');
            return;
        }

        if (this.userType === 'CLUB' && !currentUser.clubId) {
            this.showAlert('Vous devez être membre d\'un club pour créer un tournoi club', 'error');
            return;
        }

        const location = `${this.formData.city}${this.formData.address ? ', ' + this.formData.address : ''}`.trim();

        const payload = {
            name: this.formData.name,
            description: this.formData.description,
            category: this.formData.category,
            level: this.formData.level,
            format: this.formData.format,
            
          type: 'CLUB_EVENT',  // Toujours CLUB_EVENT pour les clubs
            registrationType: this.formData.registrationType || (this.userType === 'CLUB' ? 'CLUB_ONLY' : 'INDIVIDUAL'),
            visibility: this.formData.visibility || 'PUBLIC',
            
            date: this.formData.date,
            startTime: this.formData.startTime ? `${this.formData.date}T${this.formData.startTime}:00` : null,
            endTime: this.formData.endTime ? `${this.formData.date}T${this.formData.endTime}:00` : null,
            
            city: this.formData.city,
            address: this.formData.address,
            zipCode: this.formData.zipCode,
            location,
            
            maxParticipants: this.formData.maxParticipants,
          maxTeamsPerClub: this.formData.maxTeamsPerClub || 2,  // Valeur par défaut
            registrationFeeCents: Number(this.formData.registrationFeeCents || 0),
            registrationDeadline: this.formData.registrationDeadline,
            
            numFields: this.formData.numFields,
            surface: this.formData.surface,
            
            rules: this.formData.rules,
            
            hasParking: this.formData.hasParking,
            hasVestiaires: this.formData.hasVestiaires,
            hasDouches: this.formData.hasDouches,
            hasBuvette: this.formData.hasBuvette,
            hasWifi: this.formData.hasWifi,
            hasFirstAid: this.formData.hasFirstAid,
            
            contactEmail: this.formData.contactEmail,
            contactPhone: this.formData.contactPhone,
        };

        // Si club
        if (currentUser.clubId) {
            payload.clubId = currentUser.clubId;
        }

        // Si UTF
        if (this.formData.registrationType === 'INDIVIDUAL') {
            payload.utfNumTeams = this.formData.utfNumTeams;
            payload.utfTeamSize = this.formData.utfTeamSize;
        }

        // Si photo (optionnel, peut être null)
        if (this.formData.coverPhotoData) {
            payload.coverImage = this.formData.coverPhotoData;
        }

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
                const errorMsg = json?.message || json?.error || `Erreur HTTP ${res.status}`;
                throw new Error(errorMsg);
            }

            const eventId = json?.data?.id || json?.id;

            if (!eventId) {
                throw new Error('L\'ID de l\'événement n\'a pas été retourné');
            }

            // Supprimer le draft
            localStorage.removeItem(this.autoSaveKey);

            this.showAlert('✨ Tournoi créé avec succès ! Redirection...', 'success');

            setTimeout(() => {
                Router.go(`/admin/events/${eventId}`);
            }, 1500);

        } catch (error) {
            console.error('Erreur création:', error);
            this.showAlert(`❌ ${error.message}`, 'error');

            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-rocket"></i> Créer le tournoi';
        }
    },

    // ===================================
    // UPLOAD PHOTO
    // ===================================
    initPhotoUpload() {
        const uploadZone = document.getElementById('photo-upload-zone');
        const fileInput = document.getElementById('cover-photo');
        const placeholder = document.getElementById('upload-placeholder');
        const preview = document.getElementById('photo-preview');
        const previewImg = document.getElementById('preview-img');
        const btnRemove = document.getElementById('btn-remove-photo');

        if (!uploadZone || !fileInput) return;

        // Click to upload
        uploadZone.addEventListener('click', (e) => {
            if (e.target !== btnRemove && !e.target.closest('.btn-remove-photo')) {
                fileInput.click();
            }
        });

        // File selected
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.handlePhotoUpload(file, placeholder, preview, previewImg);
            }
        });

        // Drag & drop
        uploadZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadZone.classList.add('dragover');
        });

        uploadZone.addEventListener('dragleave', () => {
            uploadZone.classList.remove('dragover');
        });

        uploadZone.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadZone.classList.remove('dragover');
            
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('image/')) {
                this.handlePhotoUpload(file, placeholder, preview, previewImg);
            }
        });

        // Remove photo
        if (btnRemove) {
            btnRemove.addEventListener('click', (e) => {
                e.stopPropagation();
                this.formData.coverPhotoData = null;
                fileInput.value = '';
                placeholder.style.display = 'flex';
                preview.style.display = 'none';
            });
        }

        // Restore from draft
        if (this.formData.coverPhotoData) {
            previewImg.src = this.formData.coverPhotoData;
            placeholder.style.display = 'none';
            preview.style.display = 'block';
        }
    },

    handlePhotoUpload(file, placeholder, preview, previewImg) {
        // Validation
        if (!file.type.startsWith('image/')) {
            this.showAlert('Le fichier doit être une image', 'error');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            this.showAlert('L\'image ne doit pas dépasser 5MB', 'error');
            return;
        }

        // Read file
        const reader = new FileReader();
        
        reader.onload = (e) => {
            this.formData.coverPhotoData = e.target.result;
            previewImg.src = e.target.result;
            placeholder.style.display = 'none';
            preview.style.display = 'block';
            this.saveDraft();
        };

        reader.readAsDataURL(file);
    },

    // ===================================
    // AUTO-SAVE
    // ===================================
    saveDraft() {
        try {
            localStorage.setItem(this.autoSaveKey, JSON.stringify({
                step: this.currentStep,
                data: this.formData,
                timestamp: Date.now()
            }));
        } catch (e) {
            console.warn('Impossible de sauvegarder le brouillon:', e);
        }
    },

  loadDraft() {
    try {
        const saved = localStorage.getItem(this.autoSaveKey);
        if (saved) {
            const draft = JSON.parse(saved);
            
            // Draft valide si < 2h (au lieu de 24h)
            const age = Date.now() - draft.timestamp;
            if (age < 2 * 60 * 60 * 1000) {  // 2 heures
                
                // 🔥 DEMANDER CONFIRMATION
                const resume = confirm(
                    '📋 Brouillon détecté\n\n' +
                    'Voulez-vous reprendre où vous en étiez ?\n\n' +
                    '• OUI = Charger le brouillon\n' +
                    '• NON = Nouveau formulaire vide'
                );
                
                if (resume) {
                    this.currentStep = draft.step || 1;
                    this.formData = draft.data || {};
                    console.log('✅ Brouillon restauré');
                } else {
                    // Supprimer le brouillon
                    localStorage.removeItem(this.autoSaveKey);
                    console.log('🗑️ Brouillon supprimé');
                }
            } else {
                // Draft trop vieux → supprimer
                localStorage.removeItem(this.autoSaveKey);
            }
        }
    } catch (e) {
        console.warn('Impossible de charger le brouillon:', e);
    }
},

    // ===================================
    // UTILITAIRES
    // ===================================
    showAlert(message, type = 'error') {
        const alert = document.getElementById('wizard-alert');
        if (!alert) return;

        alert.className = `wizard-alert alert-${type}`;
        alert.textContent = message;
        alert.style.display = 'block';

        alert.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

        if (type === 'success') {
            setTimeout(() => this.hideAlert(), 5000);
        }
    },

    hideAlert() {
        const alert = document.getElementById('wizard-alert');
        if (alert) {
            alert.style.display = 'none';
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
    },

    formatDateTime(dateTimeStr) {
        if (!dateTimeStr) return '';
        const date = new Date(dateTimeStr);
        return date.toLocaleString('fr-FR', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    hasServices() {
        return this.formData.hasParking || 
               this.formData.hasVestiaires || 
               this.formData.hasDouches || 
               this.formData.hasBuvette || 
               this.formData.hasWifi ||
               this.formData.hasFirstAid;
    },

    getServicesText() {
        const services = [];
        if (this.formData.hasParking) services.push('Parking');
        if (this.formData.hasVestiaires) services.push('Vestiaires');
        if (this.formData.hasDouches) services.push('Douches');
        if (this.formData.hasBuvette) services.push('Buvette');
        if (this.formData.hasWifi) services.push('Wi-Fi');
        if (this.formData.hasFirstAid) services.push('Secourisme');
        return services.join(', ');
    }
};

export default UnifiedEventWizardPage;