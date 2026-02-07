// /static/app/js/components/ScoreUpdater.js
// 🎯 COMPOSANT RÉUTILISABLE POUR METTRE À JOUR LES SCORES

export class ScoreUpdater {
    constructor(token) {
        this.token = token;
    }

    // =============================================
    // 🎨 GÉNÉRER L'UI POUR UN MATCH
    // =============================================
    renderScoreInputs(match) {
        const matchId = match.id;
        const homeScore = match.homeScore ?? 0;
        const awayScore = match.awayScore ?? 0;
        const status = match.status || "PENDING";
        const isFinished = status === "COMPLETED";

        return `
            <div class="score-updater" data-match-id="${matchId}">
                <div class="score-inputs" style="display: flex; align-items: center; gap: 10px;">
                    <!-- Score domicile -->
                    <input 
                        type="number" 
                        class="score-input score-home" 
                        data-match-id="${matchId}"
                        data-team="home"
                        value="${homeScore}" 
                        min="0"
                        ${isFinished ? 'disabled' : ''}
                        style="width: 60px; padding: 8px; text-align: center; font-size: 16px; font-weight: bold; border: 2px solid #3498db; border-radius: 6px;"
                    />

                    <span style="font-weight: bold; font-size: 18px;">-</span>

                    <!-- Score extérieur -->
                    <input 
                        type="number" 
                        class="score-input score-away" 
                        data-match-id="${matchId}"
                        data-team="away"
                        value="${awayScore}" 
                        min="0"
                        ${isFinished ? 'disabled' : ''}
                        style="width: 60px; padding: 8px; text-align: center; font-size: 16px; font-weight: bold; border: 2px solid #e74c3c; border-radius: 6px;"
                    />

                    <!-- Bouton de validation -->
                    ${!isFinished ? `
                        <button 
                            class="btn-update-score admin-btn admin-btn-primary" 
                            data-match-id="${matchId}"
                            style="padding: 8px 16px; font-size: 14px;"
                        >
                            ✅ Valider
                        </button>
                    ` : `
                        <span style="color: #27ae60; font-weight: 500;">✅ Terminé</span>
                    `}
                </div>

                <!-- Message de feedback -->
                <div class="score-message" data-match-id="${matchId}" style="margin-top: 8px; font-size: 13px;"></div>
            </div>
        `;
    }

    // =============================================
    // 🚀 INITIALISER LES LISTENERS
    // =============================================
    initListeners(container) {
        if (!container) return;

        // Écouter les clics sur les boutons "Valider"
        container.querySelectorAll(".btn-update-score").forEach(btn => {
            btn.addEventListener("click", async (e) => {
                const matchId = e.target.getAttribute("data-match-id");
                await this.updateScore(matchId);
            });
        });

        // ✅ BONUS : Valider avec la touche "Entrée"
        container.querySelectorAll(".score-input").forEach(input => {
            input.addEventListener("keypress", async (e) => {
                if (e.key === "Enter") {
                    const matchId = e.target.getAttribute("data-match-id");
                    await this.updateScore(matchId);
                }
            });
        });
    }

    // =============================================
    // 📤 ENVOYER LE SCORE À L'API
    // =============================================
    async updateScore(matchId) {
        const homeInput = document.querySelector(`.score-home[data-match-id="${matchId}"]`);
        const awayInput = document.querySelector(`.score-away[data-match-id="${matchId}"]`);
        const messageEl = document.querySelector(`.score-message[data-match-id="${matchId}"]`);
        const btn = document.querySelector(`.btn-update-score[data-match-id="${matchId}"]`);

        if (!homeInput || !awayInput) return;

        const homeScore = parseInt(homeInput.value) || 0;
        const awayScore = parseInt(awayInput.value) || 0;

        // ✅ VALIDATION
        if (homeScore < 0 || awayScore < 0) {
            this.showMessage(messageEl, "❌ Les scores ne peuvent pas être négatifs", true);
            return;
        }

        // Désactiver le bouton pendant l'envoi
        if (btn) {
            btn.disabled = true;
            btn.textContent = "⏳ Envoi...";
        }

        try {
            // ✅ APPEL API : POST /api/tournament/admin/matches/{matchId}/score
            const res = await fetch(`/api/tournament/admin/matches/${matchId}/score`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${this.token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    homeScore,
                    awayScore
                })
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.message || `Erreur HTTP ${res.status}`);
            }

            // ✅ SUCCÈS
            this.showMessage(messageEl, "✅ Score mis à jour avec succès", false);

            // Réactiver le bouton
            if (btn) {
                btn.disabled = false;
                btn.textContent = "✅ Valider";
            }

        } catch (err) {
            console.error("Erreur lors de la mise à jour du score :", err);
            this.showMessage(messageEl, `❌ Erreur : ${err.message}`, true);

            // Réactiver le bouton
            if (btn) {
                btn.disabled = false;
                btn.textContent = "✅ Valider";
            }
        }
    }

    // =============================================
    // 🎨 AFFICHER UN MESSAGE
    // =============================================
    showMessage(element, msg, isError = false) {
        if (!element) return;

        element.textContent = msg;
        element.style.color = isError ? "#e74c3c" : "#27ae60";
        element.style.fontWeight = "500";

        // Auto-hide après 3 secondes
        setTimeout(() => {
            element.textContent = "";
        }, 3000);
    }
}

export default ScoreUpdater;