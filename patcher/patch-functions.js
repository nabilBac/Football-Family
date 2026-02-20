    // ================================
    // SYSTÈME D'ACCORDIONS (remplace initTabs)
    // ================================
    initAccordions() {
        const accordions = document.querySelectorAll('.ed-accordion');
        accordions.forEach(acc => {
            const header = acc.querySelector('.ed-accordion-header');
            if (!header) return;
            header.addEventListener('click', () => {
                const wasOpen = acc.classList.contains('open');
                acc.classList.toggle('open');
                const target = header.dataset.target;
                if (target && !wasOpen) {
                    this.setActiveStep(target);
                    this.onAccordionOpen(target);
                }
            });
        });
    },

    // ================================
    // STEPPER NAVIGATION
    // ================================
    initStepper() {
        const steps = document.querySelectorAll('.stepper-step');
        steps.forEach(step => {
            step.addEventListener('click', () => {
                const targetId = step.dataset.step;
                const accordion = document.getElementById(`accordion-${targetId}`);
                if (accordion) {
                    accordion.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    if (!accordion.classList.contains('open')) {
                        accordion.classList.add('open');
                        this.onAccordionOpen(targetId);
                    }
                }
                this.setActiveStep(targetId);
            });
        });
    },

    setActiveStep(stepId) {
        document.querySelectorAll('.stepper-step').forEach(s => s.classList.remove('active'));
        const target = document.querySelector(`.stepper-step[data-step="${stepId}"]`);
        if (target) target.classList.add('active');
        this.currentTab = stepId;
    },

    onAccordionOpen(target) {
        const eventId = this.extractEventIdFromPath();
        const token = Auth.accessToken;
        if (!eventId || !token) return;
        switch (target) {
            case 'planning': this.loadPlanningMatches(eventId, token); break;
            case 'matches': this.loadMatches(eventId, token); break;
            case 'rankings': this.loadGroups(eventId, token); break;
            case 'bracket':
                this.loadBracket(eventId, token);
                this.loadConsolante(eventId, token);
                break;
            case 'archived': this.loadArchivedEvents && this.loadArchivedEvents(eventId, token); break;
        }
    },

    // ================================
    // CTA BANNER DYNAMIQUE
    // ================================
    updateCTABanner() {
        const cta = document.getElementById('next-step-cta');
        const ctaDesc = document.getElementById('cta-description');
        const ctaBtn = document.getElementById('cta-action-btn');
        if (!cta || !ctaDesc || !ctaBtn) return;

        let nextAction = null;
        let targetAccordion = null;

        if (this.cachedMatchesCount === 0) {
            nextAction = "Générer les poules et les matchs";
            targetAccordion = "overview";
        } else if (this.cachedRemainingScores > 0) {
            nextAction = `${this.cachedRemainingScores} match(s) restent à scorer`;
            targetAccordion = "matches";
        } else if (!this.cachedHasBracket && this.cachedMatchesCount > 0) {
            nextAction = "Générer le bracket de phase finale";
            targetAccordion = "overview";
        }

        if (nextAction) {
            cta.style.display = 'flex';
            ctaDesc.textContent = nextAction;
            ctaBtn.onclick = () => {
                const acc = document.getElementById(`accordion-${targetAccordion}`);
                if (acc) {
                    acc.classList.add('open');
                    acc.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    this.setActiveStep(targetAccordion);
                    this.onAccordionOpen(targetAccordion);
                }
            };
        } else {
            cta.style.display = 'none';
        }
    },