// /app/js/pages/hub/hub.page.js
import { Auth } from "../../auth.js";

let socket = null;
let stomp = null;

// refs listeners (pour cleanup)
let onBurgerClick = null;
let onMenuCloseClick = null;
let onOverlayClick = null;

export function render() {
  return `
    <header>
      <div class="header-logo">
        <i class="fas fa-futbol"></i>
        <span>GOAL CLIPS</span>
      </div>

      <div class="header-icons">
        <div class="profile-avatar" id="profile-avatar" aria-label="Profil">
          <i class="fa-solid fa-user"></i>
        </div>
        <button id="burger-btn" aria-label="Menu"><i class="fa-solid fa-bars"></i></button>
      </div>
    </header>

    <div class="menu-overlay" id="menu-overlay">
      <span class="close-btn" id="menu-close" aria-label="Fermer"><i class="fa-solid fa-xmark"></i></span>
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
    console.log("[HUB] init");

  document.getElementById("app")?.classList.add("is-live-page");
  document.body.classList.add("is-live-page");

  Auth.requireAuth();

  // MENU BURGER (listeners clean)
  const burgerBtn = document.getElementById("burger-btn");
  const menuOverlay = document.getElementById("menu-overlay");
  const menuClose = document.getElementById("menu-close");

  onBurgerClick = () => menuOverlay?.classList.add("active");
  onMenuCloseClick = () => menuOverlay?.classList.remove("active");
  onOverlayClick = (e) => { if (e.target === menuOverlay) menuOverlay.classList.remove("active"); };

  burgerBtn?.addEventListener("click", onBurgerClick);
  menuClose?.addEventListener("click", onMenuCloseClick);
  menuOverlay?.addEventListener("click", onOverlayClick);

  // WEBSOCKET LIVE INDICATOR
  const indicator = document.getElementById("live-indicator");

  socket = new SockJS("/ws");
  stomp = Stomp.over(socket);
  stomp.debug = null;

  stomp.connect({}, () => {
    stomp.subscribe("/topic/lives", (msg) => {
      if (!indicator) return;
      const data = JSON.parse(msg.body);

      if (data.action === "STARTED") {
        indicator.style.display = "block";
        indicator.textContent = `🔴 ${data.streamer} vient de lancer un live !`;
      } else if (data.action === "ENDED") {
        indicator.textContent = `🟢 ${data.streamer} a terminé son live.`;
        setTimeout(() => { indicator.style.display = "none"; }, 4000);
      }
    });
  });

  // NAVBAR active
  document.querySelectorAll(".mobile-navbar .nav-item").forEach(i => i.classList.remove("active"));
  const item = document.querySelector('.mobile-navbar a[href="/hub"]');
  if (item) item.classList.add("active");
}

export function cleanup() {
        console.log("[HUB] cleanup");
  document.getElementById("app")?.classList.remove("is-live-page");
  document.body.classList.remove("is-live-page");

  // remove listeners
  const burgerBtn = document.getElementById("burger-btn");
  const menuOverlay = document.getElementById("menu-overlay");
  const menuClose = document.getElementById("menu-close");

  if (burgerBtn && onBurgerClick) burgerBtn.removeEventListener("click", onBurgerClick);
  if (menuClose && onMenuCloseClick) menuClose.removeEventListener("click", onMenuCloseClick);
  if (menuOverlay && onOverlayClick) menuOverlay.removeEventListener("click", onOverlayClick);

  onBurgerClick = onMenuCloseClick = onOverlayClick = null;

  // disconnect websocket
  try { stomp?.disconnect?.(); } catch(e) {}
  stomp = null;

  try { socket?.close?.(); } catch(e) {}
  socket = null;
}
