// /app/js/components/navbar.js
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

        <!-- ⭐ OVERLAY AMIS (bulles en haut du feed) -->
        <div class="friends-overlay" id="friends-overlay">
            <div class="friends-header">
                <span class="friends-title">Amis</span>
                <button class="friends-close-btn" id="friends-close-btn">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>
            <div class="friends-scroll" id="friends-scroll">
                <div class="friends-placeholder">
                    <span>Chargement...</span>
                </div>
            </div>
        </div>

        <!-- ⭐ BOTTOM SHEET OVERLAY (fond sombre) -->
        <div class="sheet-overlay" id="sheet-overlay"></div>

        <!-- ⭐ BOTTOM SHEET CRÉER (Upload + Live) -->
        <div class="bottom-sheet" id="bottom-sheet">
            <div class="sheet-handle"></div>
            <div class="sheet-title">Créer</div>
            <div class="sheet-options">
                <button class="sheet-option" id="sheet-upload-btn">
                    <div class="sheet-icon upload">
                        <i class="fa-solid fa-cloud-arrow-up"></i>
                    </div>
                    <span class="sheet-option-label">Uploader</span>
                    <span class="sheet-option-desc">Partager une vidéo</span>
                </button>
                <button class="sheet-option" id="sheet-live-btn">
                    <div class="sheet-icon live">
                        <i class="fa-solid fa-video"></i>
                    </div>
                    <span class="sheet-option-label">Live</span>
                    <span class="sheet-option-desc">Démarrer un direct</span>
                </button>
            </div>
        </div>

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

            <!-- ⭐ Bouton "+" ouvre le BOTTOM SHEET -->
            <button class="nav-upload" id="create-btn" aria-label="Créer">
                <i class="fa-solid fa-plus"></i>
            </button>

            <!-- ⭐ AMIS (remplace l'ancien Live /hub) -->
            <button class="nav-item nav-friends-btn" id="friends-btn" aria-label="Amis">
                <i class="fa-solid fa-user-group"></i>
                <span>Amis</span>
                <span class="friends-notif" id="friends-notif" style="display:none;">0</span>
            </button>

            <a href="/profile" class="nav-item" data-link>
                <i class="fa-regular fa-user"></i>
                <span>Profile</span>
            </a>

        </nav>

    </div>
`;
}

/* ============================================
   ⭐ LOGIQUE : Bottom Sheet + Amis Overlay
   ============================================ */

let _sheetOpen = false;
let _friendsOpen = false;
let _listenersAttached = false;

/**
 * ⭐ Initialise les interactions navbar (bottom sheet + amis)
 */
export function initNavbarActions() {
    if (_listenersAttached) cleanupNavbarActions();

    const createBtn = document.getElementById("create-btn");
    const sheetOverlay = document.getElementById("sheet-overlay");
    const sheetUploadBtn = document.getElementById("sheet-upload-btn");
    const sheetLiveBtn = document.getElementById("sheet-live-btn");
    const friendsBtn = document.getElementById("friends-btn");
    const friendsCloseBtn = document.getElementById("friends-close-btn");

    // --- BOTTOM SHEET ---
    createBtn?.addEventListener("click", toggleSheet);
    sheetOverlay?.addEventListener("click", closeSheet);

    sheetUploadBtn?.addEventListener("click", () => {
        closeSheet();
        window.Router?.go("/upload");
    });

    sheetLiveBtn?.addEventListener("click", () => {
        closeSheet();
        window.Router?.go("/videos/go-live");
    });

    // --- AMIS OVERLAY ---
    friendsBtn?.addEventListener("click", toggleFriends);
    friendsCloseBtn?.addEventListener("click", closeFriends);

    _listenersAttached = true;

    // ⭐ Charger les vrais amis depuis l'API
    loadFriendsBubbles();
}

/**
 * Cleanup listeners
 */
export function cleanupNavbarActions() {
    const createBtn = document.getElementById("create-btn");
    const sheetOverlay = document.getElementById("sheet-overlay");
    const friendsBtn = document.getElementById("friends-btn");
    const friendsCloseBtn = document.getElementById("friends-close-btn");

    createBtn?.removeEventListener("click", toggleSheet);
    sheetOverlay?.removeEventListener("click", closeSheet);
    friendsBtn?.removeEventListener("click", toggleFriends);
    friendsCloseBtn?.removeEventListener("click", closeFriends);

    _listenersAttached = false;
    _sheetOpen = false;
    _friendsOpen = false;
}

/* --- BOTTOM SHEET --- */
function toggleSheet() {
    _sheetOpen ? closeSheet() : openSheet();
}

function openSheet() {
    if (_friendsOpen) closeFriends();
    _sheetOpen = true;
    document.getElementById("bottom-sheet")?.classList.add("active");
    document.getElementById("sheet-overlay")?.classList.add("active");
}

function closeSheet() {
    _sheetOpen = false;
    document.getElementById("bottom-sheet")?.classList.remove("active");
    document.getElementById("sheet-overlay")?.classList.remove("active");
}

/* --- AMIS OVERLAY --- */
function toggleFriends() {
    _friendsOpen ? closeFriends() : openFriends();
}

function openFriends() {
    if (_sheetOpen) closeSheet();
    _friendsOpen = true;
    document.getElementById("friends-overlay")?.classList.add("active");
    document.getElementById("friends-btn")?.classList.add("active");
}

function closeFriends() {
    _friendsOpen = false;
    document.getElementById("friends-overlay")?.classList.remove("active");
    document.getElementById("friends-btn")?.classList.remove("active");
}

/* ============================================
   ⭐ CHARGEMENT DES AMIS DEPUIS L'API
   ============================================ */

const AVATAR_COLORS = [
    "#e65100", "#e91e63", "#1565c0", "#2e7d32",
    "#4527a0", "#00695c", "#bf360c", "#f57f17",
    "#283593", "#00838f", "#4e342e", "#37474f"
];

function getAvatarColor(username) {
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
        hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

async function loadFriendsBubbles() {
    const container = document.getElementById("friends-scroll");
    if (!container) return;

    try {
        const res = await fetch("/api/friends", {
            headers: { "Authorization": Auth.getAuthHeader() }
        });

        if (!res.ok) {
            console.warn("[Friends] API error:", res.status);
            container.innerHTML = `<div class="friends-placeholder"><span>Connexion requise</span></div>`;
            return;
        }

        const data = await res.json();
        const friends = data.friends || [];

        // ⭐ Badge notification (nombre de lives)
        const notif = document.getElementById("friends-notif");
        if (notif) {
            const liveCount = data.liveCount || 0;
            if (liveCount > 0) {
                notif.textContent = liveCount;
                notif.style.display = "flex";
            } else {
                notif.style.display = "none";
            }
        }

        // ⭐ Aucun ami
        if (friends.length === 0) {
            container.innerHTML = `
                <div class="friends-placeholder">
                    <span>Aucun ami pour le moment</span>
                </div>
            `;
            return;
        }

        // ⭐ Rendre les bulles d'amis
        container.innerHTML = friends.map(f => {
            const color = getAvatarColor(f.username);
            const initial = f.initial || f.username.charAt(0).toUpperCase();
            const isLive = f.isLive === true;
            const isOnline = f.isOnline === true;

            const avatarContent = f.avatarUrl
                ? `<img class="friend-avatar" src="${f.avatarUrl}" alt="${f.username}" style="border-radius:50%;width:56px;height:56px;object-fit:cover;">`
                : `<div class="friend-avatar" style="background:${color};">${initial}</div>`;

            return `
                <div class="friend-bubble ${isLive ? 'is-live' : ''} ${isOnline ? 'is-online' : ''}"
                     onclick="${isLive
                         ? `window.Router?.go('/videos')`
                         : `window.Router?.go('/profile/${f.username}')`
                     }">
                    <div class="friend-avatar-wrap">
                        ${avatarContent}
                        ${isLive ? '<div class="live-badge">LIVE</div>' : ''}
                        ${isOnline && !isLive ? '<div class="online-dot"></div>' : ''}
                    </div>
                    <span class="friend-name">${f.username}</span>
                </div>
            `;
        }).join("");

    } catch (err) {
        console.error("[Friends] Erreur chargement:", err);
        container.innerHTML = `<div class="friends-placeholder"><span>Erreur de chargement</span></div>`;
    }
}


/* ============================================
   ⭐ TOP BAR (inchangé)
   ============================================ */

export function initTopbar() {
    const topbar = document.getElementById('feed-topbar');
    if (!topbar) return;

    topbar.classList.add('visible');

    const tabs = topbar.querySelectorAll('.topbar-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            const feedType = tab.dataset.feedTab;
            window.dispatchEvent(new CustomEvent('feed-tab-change', { 
                detail: { type: feedType } 
            }));
        });
    });

    const searchBtn = document.getElementById('topbar-search-btn');
    if (searchBtn) {
        searchBtn.addEventListener('click', () => {
            console.log('🔍 Recherche cliquée');
        });
    }
}

export function hideTopbar() {
    const topbar = document.getElementById('feed-topbar');
    if (topbar) topbar.classList.remove('visible');
}