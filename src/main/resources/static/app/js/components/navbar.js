import { Auth } from "../auth.js";

export function Navbar({ hidePostButton = false } = {}) {

    const user = Auth.currentUser;

    return `
    <div class="navbar-wrapper">

        <!-- ⭐ TOP BAR flottante (visible uniquement sur le feed) -->
        <header class="feed-topbar" id="feed-topbar">
            <div class="topbar-left">
                <button class="topbar-icon-btn" id="topbar-search-btn" aria-label="Rechercher">
                    <i class="fa-solid fa-magnifying-glass"></i>
                </button>
            </div>
            <div class="topbar-tabs">
                <button class="topbar-tab active" data-feed-tab="foryou">Pour toi</button>
                <button class="topbar-tab" data-feed-tab="following">Suivis</button>
            </div>
            <div class="topbar-right">
                <button class="topbar-icon-btn" id="topbar-live-btn" aria-label="Live">
                    <i class="fa-solid fa-tower-broadcast"></i>
                </button>
            </div>
        </header>

        <!-- ⭐ Barre du bas -->
        <nav class="mobile-navbar">
            
            <a href="/feed" class="nav-item" data-link>
                <i class="fa-solid fa-house"></i>
                <span>Home</span>
            </a>

            <a href="/events" class="nav-item" data-link>
                <i class="fa-regular fa-calendar-days"></i>
                <span>Events</span>
            </a>

            <!-- ⭐ Bouton Upload CENTRÉ CORRECTEMENT -->
            <a href="/upload" class="nav-upload" data-link>
                <i class="fa-solid fa-plus"></i>
            </a>

            <a href="/hub" class="nav-item" data-link>
                <i class="fa-solid fa-tower-broadcast"></i>
                <span>Live</span>
            </a>

            <a href="/profile" class="nav-item" data-link>
                <i class="fa-regular fa-user"></i>
                <span>Profile</span>
            </a>

        </nav>

    </div>
`;
}

/**
 * ⭐ Initialise le comportement de la top bar (onglets + visibilité)
 * Appeler cette fonction depuis feed.page.js init()
 */
export function initTopbar() {
    const topbar = document.getElementById('feed-topbar');
    if (!topbar) return;

    // Afficher la topbar sur le feed
    topbar.classList.add('visible');

    // Gestion des onglets
    const tabs = topbar.querySelectorAll('.topbar-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            const feedType = tab.dataset.feedTab;
            // Dispatch un custom event que feed.js peut écouter
            window.dispatchEvent(new CustomEvent('feed-tab-change', { 
                detail: { type: feedType } 
            }));
        });
    });

    // Recherche
    const searchBtn = document.getElementById('topbar-search-btn');
    if (searchBtn) {
        searchBtn.addEventListener('click', () => {
            // TODO: ouvrir modal recherche ou naviguer
            console.log('🔍 Recherche cliquée');
        });
    }
}

/**
 * ⭐ Cache la topbar (appeler quand on quitte le feed)
 */
export function hideTopbar() {
    const topbar = document.getElementById('feed-topbar');
    if (topbar) topbar.classList.remove('visible');
}