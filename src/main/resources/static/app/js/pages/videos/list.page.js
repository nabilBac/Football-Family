// /static/app/js/pages/videos/list.page.js
import { Auth } from "../../auth.js";

export const Page = {

    render() {
        return `
        <div class="live-list-page">
            <header class="live-header">
                <h1>🔴 Lives en cours</h1>
                <button class="live-back-btn" data-link href="/hub">⬅ Retour au hub</button>
            </header>

            <main class="live-list-main">
                <div id="live-list" class="live-grid">
                    <p class="no-live">
                        🎥 Aucun live n'est en cours pour le moment.<br>
                        Reviens bientôt pour voir les prochains matchs en direct !
                    </p>
                </div>
            </main>
        </div>
        `;
    },

    init() {
        Auth.requireAuth();
        initLivesList();
    }
};


function createLiveCard(live) {
    const card = document.createElement("div");
    card.className = "live-card";
    card.id = `live-${live.id}`;

    const title = live.titre || "Live en direct";
    const description = live.description || "";
    const streamer = live.streamer || (live.user && live.user.username) || "Streamer";
    const avatar = live.user?.avatarUrl || "/images/streamer.jpg";

    card.innerHTML = `
        <h2>${title}</h2>
        <p>${description}</p>

        <div class="streamer-info">
            <img src="${avatar}" alt="avatar streamer">
            <p>🎥 <strong>${streamer}</strong></p>
        </div>

        <a href="/videos/watch/${live.id}" data-link class="live-watch-link">
            ▶️ Regarder le live
        </a>
    `;

    return card;
}

async function initLivesList() {
    const grid = document.getElementById("live-list");
    if (!grid) return;

    try {
    const res = await Auth.secureFetch("/api/live/all");
    if (res.ok) {
        const api = await res.json();
        const lives = api.data; 
        renderLives(grid, lives);
    }
} catch (e) {
    console.warn("Erreur chargement lives:", e);
}


    // 2️⃣ WebSocket pour suivre les lives en temps réel
    const socket = new SockJS('/ws');
    const stomp = Stomp.over(socket);
    stomp.debug = null;

    stomp.connect({}, () => {
        console.log("✅ Connecté à /topic/lives");

        stomp.subscribe('/topic/lives', (msg) => {
            const data = JSON.parse(msg.body);
            console.log("🎥 Mise à jour live :", data);

           if (data.action === "STARTED") {
    reloadLives(grid);  // recharge complètement la liste
} else if (data.action === "ENDED") {
    removeLiveCard(grid, data.id);
            }
        });
    });
}

async function reloadLives(grid) {
    try {
        const res = await Auth.secureFetch("/api/live/all");
        if (!res.ok) return;

        const api = await res.json();
        const lives = api.data;

        renderLives(grid, lives);
    } catch (e) {
        console.error("Erreur reload lives:", e);
    }
}


function renderLives(grid, lives) {
    grid.innerHTML = "";

    if (!lives || lives.length === 0) {
        grid.innerHTML = `
            <p class="no-live">
                🎥 Aucun live n'est en cours pour le moment.<br>
                Reviens bientôt pour voir les prochains matchs en direct !
            </p>
        `;
        return;
    }

    lives.forEach(l => {
        grid.appendChild(createLiveCard(l));
    });
}

function addLiveCard(grid, live) {
    // si message "aucun live", on le retire
    const noLiveMsg = grid.querySelector(".no-live");
    if (noLiveMsg) noLiveMsg.remove();

    const existing = document.getElementById(`live-${live.id}`);
    if (existing) existing.remove();

    grid.appendChild(createLiveCard(live));
}

function removeLiveCard(grid, id) {
    const card = document.getElementById(`live-${id}`);
    if (card) card.remove();

    if (grid.children.length === 0) {
        grid.innerHTML = `
            <p class="no-live">
                🎥 Aucun live n'est en cours pour le moment.<br>
                Reviens bientôt pour voir les prochains matchs en direct !
            </p>
        `;
    }
}
