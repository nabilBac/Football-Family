// /static/js/components/registration-modal.js

export class RegistrationModal {
    constructor() {
        this.modal = null;
        this.teams = [];
        this.selectedTeams = [];
    }

    async show(eventId, clubId, maxTeamsPerClub) {
        // Charger les équipes du club
        this.teams = await this.loadClubTeams(clubId);
        
        if (this.teams.length === 0) {
            alert('Aucune équipe disponible dans votre club');
            return;
        }

        // Charger les inscriptions existantes
        const registrations = await this.loadExistingRegistrations(eventId, clubId);
        const registeredTeamIds = registrations.map(r => r.teamId);

        // Créer la modale
        this.createModal(eventId, maxTeamsPerClub, registeredTeamIds);
        this.attachListeners(eventId);
    }

    async loadClubTeams(clubId) {
        try {
            const token = localStorage.getItem('accessToken');
           const response = await fetch(`/api/teams/club/${clubId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) throw new Error('Erreur chargement équipes');
            
            const result = await response.json();
            return result.data || result;
        } catch (error) {
            console.error('Erreur:', error);
            return [];
        }
    }

    async loadExistingRegistrations(eventId, clubId) {
        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch(`/api/events/registration/${eventId}/registrations/club/${clubId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) return [];
            
            const result = await response.json();
            return result.data || result;
        } catch (error) {
            console.error('Erreur:', error);
            return [];
        }
    }

    createModal(eventId, maxTeamsPerClub, registeredTeamIds) {
        const availableTeams = this.teams.filter(t => !registeredTeamIds.includes(t.id));
        
        const html = `
            <div class="modal-overlay" id="registrationModal">
                <div class="modal-content-registration">
                    <div class="modal-header-registration">
                        <h2>Inscrire mes équipes</h2>
                        <button class="modal-close" id="closeModal">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <div class="modal-body-registration">
                        ${maxTeamsPerClub ? `
                            <div class="quota-info">
                                <i class="fas fa-info-circle"></i>
                                Maximum ${maxTeamsPerClub} équipe(s) par club
                            </div>
                        ` : ''}
                        
                        ${availableTeams.length === 0 ? `
                            <div class="no-teams">
                                <i class="fas fa-check-circle"></i>
                                <p>Toutes vos équipes sont déjà inscrites</p>
                            </div>
                        ` : `
                            <div class="teams-list">
                                ${availableTeams.map(team => `
                                    <label class="team-checkbox-item">
                                        <input type="checkbox" 
                                               value="${team.id}" 
                                               data-team-name="${team.name}"
                                               class="team-checkbox">
                                        <div class="team-info">
                                            <div class="team-name">${team.name}</div>
                                            <div class="team-category">${team.category || 'Catégorie non définie'}</div>
                                        </div>
                                        <i class="fas fa-check-circle checkbox-icon"></i>
                                    </label>
                                `).join('')}
                            </div>
                        `}
                    </div>
                    
                    ${availableTeams.length > 0 ? `
                        <div class="modal-footer-registration">
                            <button class="btn-cancel" id="cancelBtn">Annuler</button>
                            <button class="btn-validate" id="validateBtn" disabled>
                                Valider l'inscription
                            </button>
                        </div>
                    ` : `
                        <div class="modal-footer-registration">
                            <button class="btn-cancel" id="cancelBtn">Fermer</button>
                        </div>
                    `}
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', html);
        this.modal = document.getElementById('registrationModal');
        
        // Animation d'entrée
        setTimeout(() => this.modal.classList.add('active'), 10);
    }

    attachListeners(eventId) {
        const closeBtn = document.getElementById('closeModal');
        const cancelBtn = document.getElementById('cancelBtn');
        const validateBtn = document.getElementById('validateBtn');
        const checkboxes = document.querySelectorAll('.team-checkbox');

        // Fermeture
        [closeBtn, cancelBtn].forEach(btn => {
            if (btn) {
                btn.addEventListener('click', () => this.close());
            }
        });

        // Clic sur l'overlay
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) this.close();
        });

        // Gestion des checkboxes
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                this.updateSelection();
                this.updateValidateButton();
            });
        });

        // Validation
        if (validateBtn) {
            validateBtn.addEventListener('click', () => {
                this.submitRegistrations(eventId);
            });
        }
    }

    updateSelection() {
        const checkboxes = document.querySelectorAll('.team-checkbox:checked');
        this.selectedTeams = Array.from(checkboxes).map(cb => ({
            id: parseInt(cb.value),
            name: cb.dataset.teamName
        }));
    }

    updateValidateButton() {
        const validateBtn = document.getElementById('validateBtn');
        if (validateBtn) {
            validateBtn.disabled = this.selectedTeams.length === 0;
            validateBtn.textContent = this.selectedTeams.length > 0
                ? `Inscrire ${this.selectedTeams.length} équipe(s)`
                : 'Valider l\'inscription';
        }
    }

    async submitRegistrations(eventId) {
        const validateBtn = document.getElementById('validateBtn');
        validateBtn.disabled = true;
        validateBtn.textContent = 'Inscription en cours...';

        const token = localStorage.getItem('accessToken');
        const results = [];

        for (const team of this.selectedTeams) {
            try {
                const response = await fetch(`/api/events/registration/${eventId}/register-team`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ teamId: team.id })
                });

                const result = await response.json();
                
                if (response.ok) {
                    results.push({ success: true, team: team.name });
                } else {
                    results.push({ success: false, team: team.name, error: result.message });
                }
            } catch (error) {
                results.push({ success: false, team: team.name, error: 'Erreur réseau' });
            }
        }

        this.showResults(results);
    }

    showResults(results) {
        const successCount = results.filter(r => r.success).length;
        const failCount = results.filter(r => !r.success).length;

        let message = '';
        
        if (successCount > 0) {
            message += `✅ ${successCount} équipe(s) inscrite(s) avec succès\n\n`;
            results.filter(r => r.success).forEach(r => {
                message += `• ${r.team}\n`;
            });
        }

        if (failCount > 0) {
            message += `\n❌ ${failCount} erreur(s)\n\n`;
            results.filter(r => !r.success).forEach(r => {
                message += `• ${r.team}: ${r.error}\n`;
            });
        }

        alert(message);
        this.close();
        
        // Recharger la page pour voir les nouveaux statuts
        if (successCount > 0) {
            window.location.reload();
        }
    }

    close() {
        if (this.modal) {
            this.modal.classList.remove('active');
            setTimeout(() => {
                this.modal.remove();
                this.modal = null;
            }, 300);
        }
    }
}