// /static/app/js/pages/clubs/group-matches.page.js

import { Auth } from "../../auth.js";
import { Router } from "../../router.js";

/* ============================================================================
   RENDER
   ============================================================================ */
export async function render(params) {

    const { clubId, eventId, groupId } = params;

    // Charger CSS (optionnel)
    if (!document.querySelector('link[href="/css/group-matches.css"]')) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "/css/group-matches.css";
        document.head.appendChild(link);
    }

    // Appel API : récupérer les matchs
    let matches = [];
    try {
        const res = await Auth.secureFetch(
            `/api/clubs/${clubId}/events/${eventId}/groups/${groupId}/matches`
        );
        const data = await res.json();
        matches = data.data || [];
    } catch (e) {
        console.error(e);
    }

    // Card simple
    const cardsHtml = matches.length === 0
        ? `<p style="padding:20px;opacity:0.6;">Aucun match pour ce groupe</p>`
        : matches.map(match => `
            <div class="match-card">
                <div class="match-teams">
                    <span>${match.teamA.name}</span>
                    <span>vs</span>
                    <span>${match.teamB.name}</span>
                </div>
                <div class="match-info">
                    <span>📅 ${match.date}</span>
                    <span>⏰ ${match.startTime || "--:--"}</span>
                    <span>📍 ${match.location || "?"}</span>
                </div>
            </div>
        `).join("");

    return `
    <div class="group-matches-page">
        <header class="page-header">
            <button id="backBtn" class="back-btn"><i class="fas fa-arrow-left"></i></button>
            <h2>Matchs</h2>
        </header>

        <div class="matches-container">
            ${cardsHtml}
        </div>
    </div>
    `;
}

/* ============================================================================
   INIT
   ============================================================================ */
export function init(params) {

    // Bouton retour
    const backBtn = document.getElementById("backBtn");
    if (backBtn) {
        backBtn.addEventListener("click", () => history.back());
    }

}
