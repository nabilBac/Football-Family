// /static/app/js/pages/live/live-matches.page.js

import { Auth } from "../../auth.js";

export const LiveMatchesPage = {

    websocket: null,
    stompClient: null,

    render: async () => {
        return `
            <div class="live-matches-page">
                
                <!-- Header -->
                <header class="live-header">
                    <h1>🔴 Matchs en direct</h1>
                    <div class="live-count" id="liveCount">Chargement...</div>
                </header>

                <!-- Liste des matchs -->
                <div class="live-matches-container" id="liveMatchesContainer">
                    <div class="loader">⚽ Chargement des matchs en direct...</div>
                </div>

                <!-- Message si aucun match -->
                <div class="no-matches" id="noMatches" style="display: none;">
                    <div class="empty-state">
                        <i class="fas fa-futbol"></i>
                        <h3>Aucun match en direct</h3>
                        <p>Revenez plus tard pour suivre les matchs en temps réel !</p>
                    </div>
                </div>

            </div>
        `;
    },

    init: async () => {
        console.log("🔴 Initialisation page Live Matches");

        await LiveMatchesPage.loadLiveMatches();
        LiveMatchesPage.connectWebSocket();

        // Auto-refresh toutes les 30 secondes (backup si WebSocket échoue)
        setInterval(() => {
            LiveMatchesPage.loadLiveMatches();
        }, 30000);
    },

    loadLiveMatches: async () => {
        try {
            const response = await fetch("/api/public/live/matches", {
                headers: {
                    "Authorization": Auth.getAuthHeader()
                }
            });

            if (!response.ok) {
                throw new Error("Erreur lors du chargement des matchs");
            }

            const result = await response.json();
            const matches = result.data || [];

            const container = document.getElementById("liveMatchesContainer");
            const noMatches = document.getElementById("noMatches");
            const liveCount = document.getElementById("liveCount");

            if (!container) return;

            // Mise à jour du compteur
            if (liveCount) {
                liveCount.textContent = matches.length > 0 
                    ? `${matches.length} match${matches.length > 1 ? 's' : ''} en cours`
                    : "Aucun match";
            }

            // Si aucun match
            if (matches.length === 0) {
                container.style.display = "none";
                if (noMatches) noMatches.style.display = "flex";
                return;
            }

            // Afficher les matchs
            container.style.display = "grid";
            if (noMatches) noMatches.style.display = "none";

            container.innerHTML = matches.map(match => LiveMatchesPage.renderMatchCard(match)).join("");

            // Event listeners pour cliquer sur les cartes
            document.querySelectorAll(".live-match-card").forEach(card => {
                card.addEventListener("click", () => {
                    const eventId = card.dataset.eventId;
                    window.Router.go(`/events/${eventId}`);
                });
            });

        } catch (error) {
            console.error("❌ Erreur chargement matchs live:", error);
            const container = document.getElementById("liveMatchesContainer");
            if (container) {
                container.innerHTML = `
                    <div class="error-message">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p>Erreur lors du chargement des matchs</p>
                    </div>
                `;
            }
        }
    },

    renderMatchCard: (match) => {
        const scoreA = match.scoreA !== null ? match.scoreA : 0;
        const scoreB = match.scoreB !== null ? match.scoreB : 0;
        const minute = match.minute || "EN COURS";
        const lastEvent = match.lastEvent || "";

        return `
            <div class="live-match-card" data-event-id="${match.eventId}" data-match-id="${match.id}">
                
                <!-- Badge LIVE -->
                <div class="live-badge">🔴 EN DIRECT ${typeof minute === 'number' ? '• ' + minute + "'" : ''}</div>

                <!-- Nom du tournoi -->
                <div class="match-event-name">${match.eventName || 'Tournoi'}</div>

                <!-- Scores -->
                <div class="match-score-container">
                    
                    <div class="team-row">
                        <div class="team-name">${match.teamAName || 'Équipe A'}</div>
                        <div class="team-score">${scoreA}</div>
                    </div>

                    <div class="score-separator">-</div>

                    <div class="team-row">
                        <div class="team-name">${match.teamBName || 'Équipe B'}</div>
                        <div class="team-score">${scoreB}</div>
                    </div>

                </div>

                <!-- Dernier événement -->
                ${lastEvent ? `
                    <div class="match-last-event">
                        ${lastEvent}
                    </div>
                ` : ''}

                <!-- Info terrain -->
                ${match.field ? `
                    <div class="match-field">
                        <i class="fas fa-map-marker-alt"></i> ${match.field}
                    </div>
                ` : ''}

            </div>
        `;
    },

    connectWebSocket: () => {
        try {
            const socket = new SockJS('/ws');
            LiveMatchesPage.stompClient = Stomp.over(socket);

            LiveMatchesPage.stompClient.connect({}, () => {
                console.log("✅ WebSocket connecté pour Live Matches");

                // S'abonner au topic global des matchs live
                LiveMatchesPage.stompClient.subscribe('/topic/live-matches', (message) => {
                    console.log("📡 Nouvel événement reçu:", message.body);
                    
                    // Recharger la liste des matchs
                    LiveMatchesPage.loadLiveMatches();
                });

            }, (error) => {
                console.error("❌ Erreur WebSocket:", error);
            });

        } catch (error) {
            console.error("❌ Impossible de se connecter au WebSocket:", error);
        }
    },

    cleanup: () => {
        console.log("🧹 Nettoyage Live Matches page");
        
        if (LiveMatchesPage.stompClient && LiveMatchesPage.stompClient.connected) {
            LiveMatchesPage.stompClient.disconnect();
        }
    }
};

export default LiveMatchesPage;