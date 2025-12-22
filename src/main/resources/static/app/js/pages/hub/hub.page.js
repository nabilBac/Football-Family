// /app/js/pages/hub/hub.page.js
import { Auth } from "../../auth.js";

export function render() {
    return `
    <header>
        <div class="header-logo">
            <i class="fas fa-futbol"></i>
            <span>GOAL CLIPS</span>
        </div>
        <div class="header-icons">
            <img id="profile-avatar" src="https://i.pravatar.cc/150?img=33" alt="Profile">
            <button id="burger-btn"><i class="fa-solid fa-bars"></i></button>
        </div>
    </header>

    <div class="menu-overlay" id="menu-overlay">
        <span class="close-btn" id="menu-close"><i class="fa-solid fa-xmark"></i></span>
        <a href="/" data-link>Feed</a>
        <a href="/events" data-link>Events</a>
        <a href="/profile" data-link>Profile</a>
    </div>

    <div class="hub-container">
        <h1>🎥 Espace Live</h1>

        <div class="grid">
            <a href="/videos" class="card" data-link>
                <i class="fa-solid fa-eye"></i>
                <h2>Voir les lives en cours</h2>
                <p>Découvre les diffusions en direct</p>
            </a>

            <a href="/videos/go-live" class="card" data-link>
                <i class="fa-solid fa-video"></i>
                <h2>Démarrer un live</h2>
                <p>Lance ton propre stream</p>
            </a>

            <a href="/videos/archives" class="card" data-link>
                <i class="fa-solid fa-film"></i>
                <h2>Replays</h2>
                <p>Regarde les lives passés</p>
            </a>
        </div>

        <p id="live-indicator" style="display:none">🔴 Un live vient de démarrer !</p>
    </div>
    `;
}

export function init() {
    // AJOUTER LA CLASSE POUR ACTIVER LE CSS
    document.getElementById('app').classList.add('is-live-page');
    
    Auth.requireAuth();

    // Avatar
    if (Auth.currentUser?.avatarUrl) {
        document.getElementById("profile-avatar").src = Auth.currentUser.avatarUrl;
    }

    // MENU BURGER
    const burgerBtn = document.getElementById("burger-btn");
    const menuOverlay = document.getElementById("menu-overlay");
    const menuClose = document.getElementById("menu-close");

    burgerBtn.addEventListener("click", () => menuOverlay.classList.add("active"));
    menuClose.addEventListener("click", () => menuOverlay.classList.remove("active"));
    menuOverlay.addEventListener("click", (e) => {
        if (e.target === menuOverlay) menuOverlay.classList.remove("active");
    });

    // WEBSOCKET LIVE INDICATOR
    const indicator = document.getElementById("live-indicator");

    const socket = new SockJS('/ws');
    const stomp = Stomp.over(socket);
    stomp.debug = null;

    stomp.connect({}, () => {
        stomp.subscribe('/topic/lives', (msg) => {
            const data = JSON.parse(msg.body);
            if (data.action === "STARTED") {
                indicator.style.display = "block";
                indicator.textContent = `🔴 ${data.streamer} vient de lancer un live !`;
            } else if (data.action === "ENDED") {
                indicator.textContent = `🟢 ${data.streamer} a terminé son live.`;
                setTimeout(() => indicator.style.display = "none", 4000);
            }
        });
    });

    // METTRE L'ONGLET ACTIVE DANS LA NAVBAR
    document.querySelectorAll(".mobile-navbar .nav-item").forEach(i => i.classList.remove("active"));
    const item = document.querySelector('.mobile-navbar a[href="/hub"]');
    if (item) item.classList.add("active");
}
export function cleanup() {
    // ENLEVER LA CLASSE QUAND ON QUITTE LA PAGE
    document.getElementById('app').classList.remove('is-live-page');
}