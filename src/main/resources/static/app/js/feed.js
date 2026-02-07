// /static/app/js/feed.js
import { Auth } from "./auth.js";
import { Router } from "./router.js";
import { Comments } from "./pages/feed/feed.comments.js";
import { FeedRender } from "./pages/feed/feed.render.js";
import { FeedService } from "./services/feed.service.js";
import { WebSocketService } from "./services/websocket.service.js";

let scrollContainer;
let videoContainer;
let loader;
let intersectionObserver;
let scrollListener;
let videoObserver;

// Flags
let isLoadingMore = false;
let hasMoreVideos = true;

// ✅ LIMITE DE VIDÉOS EN DOM
const MAX_VIDEOS_IN_DOM = 50;
let totalVideosLoaded = 0;

export async function initFeed() {

    await Auth.requireAuth();

    scrollContainer = document.querySelector(".main-content-scrollable");
    videoContainer = document.getElementById("video-container");
    loader = document.getElementById("loader");

    if (!scrollContainer || !videoContainer) {
        console.error("Feed: conteneurs manquants");
        return;
    }

    setupMenu();
    setupNavActiveState();
    setProfileAvatar();

    // ✅ WebSocket - Ne reconnecte que si déconnecté
    if (!WebSocketService.isConnected()) {
        WebSocketService.init();
        await WebSocketService.connect();
    }

    // Reset
    FeedService.reset();
    hasMoreVideos = true;
    totalVideosLoaded = 0;
    videoContainer.innerHTML = "";


    setupVideoAutoplayObserver();

    // ✅ CHARGEMENT INITIAL
    await loadNextPage();

    FeedRender.setupEventDelegation(videoContainer);

    // ✅ INTERSECTION OBSERVER (méthode moderne)
    setupIntersectionObserver();

    // ✅ SCROLL FALLBACK (throttled)
    setupScrollFallback();

}


/**
 * ✅ NOUVEAU : OBSERVER POUR AUTOPLAY/PAUSE VIDÉOS
 */
function setupVideoAutoplayObserver() {
    // Cleanup ancien observer
    if (videoObserver) {
        videoObserver.disconnect();
    }

    videoObserver = new IntersectionObserver(
        (entries) => {
            entries.forEach(entry => {
                const video = entry.target;
                
                if (entry.isIntersecting) {
                    // ✅ Vidéo visible → Play
                    if (entry.intersectionRatio >= 0.5) {  // Au moins 50% visible
                        video.play().catch(e => {
                            // Ignore les erreurs de play (normal sur mobile)
                        });
                    }
                } else {
                    // ❌ Vidéo hors écran → Pause
                    video.pause();
                }
            });
        },
        {
            root: scrollContainer,
            threshold: [0, 0.5, 1.0]  // Détecte à 0%, 50%, 100% de visibilité
        }
    );

    // ✅ Observer toutes les vidéos existantes
    observeAllVideos();
}

/**
 * ✅ HELPER : Observer toutes les vidéos
 */
function observeAllVideos() {
    if (!videoObserver) {
        return; // 👈 garde-fou CRUCIAL
    }

    const videos = videoContainer.querySelectorAll("video");
    videos.forEach(video => {
        videoObserver.observe(video);
    });
}


/**
 * ✅ NOUVEAU : INVALIDER ET RECHARGER LE FEED (appelé après upload)
 */
export function invalidateAndReload() {
    console.log("🔄 Invalidation et rechargement du feed...");
    
    // 1. Invalider le cache FeedService
    FeedService.invalidateCache();
    
    // 2. Vider le DOM
    if (videoContainer) {
        videoContainer.innerHTML = "";
    }
    
    // 3. Reset les flags
    hasMoreVideos = true;
    totalVideosLoaded = 0;
    isLoadingMore = false;
    
    // 4. Recharger la première page
    loadNextPage();
}

/**
 * ✅ INTERSECTION OBSERVER - Détecte quand loader devient visible
 */
function setupIntersectionObserver() {
    // Cleanup ancien observer
    if (intersectionObserver) {
        intersectionObserver.disconnect();
    }

    intersectionObserver = new IntersectionObserver(
        (entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !isLoadingMore && hasMoreVideos) {
                    loadNextPage();
                }
            });
        },
        {
            root: scrollContainer,
            rootMargin: "200px", // Déclenche 200px avant d'atteindre le bas
            threshold: 0.1
        }
    );

    // Observer le loader
    if (loader) {
        intersectionObserver.observe(loader);
    }
}

/**
 * ✅ SCROLL FALLBACK - Throttled à 200ms (backup si IntersectionObserver fail)
 */
function setupScrollFallback() {
    // Cleanup ancien listener
    if (scrollListener) {
        scrollContainer.removeEventListener("scroll", scrollListener);
    }

    let throttleTimer = null;

    scrollListener = () => {
        if (throttleTimer) return;

        throttleTimer = setTimeout(() => {
            throttleTimer = null;

            if (isLoadingMore || !hasMoreVideos) return;

            const scrollPos = scrollContainer.scrollTop + scrollContainer.clientHeight;
            const threshold = scrollContainer.scrollHeight - 400;

            if (scrollPos >= threshold) {
                loadNextPage();
            }
        }, 200); // ✅ Throttle: max 5 appels/seconde
    };

    scrollContainer.addEventListener("scroll", scrollListener, { passive: true });
}

/**
 * ✅ CHARGEMENT PAGE SUIVANTE - Avec limite DOM
 */
async function loadNextPage() {
    if (isLoadingMore || !hasMoreVideos) return;
    isLoadingMore = true;
    
    showLoader(true);

    try {
        const videos = await FeedService.loadNextPage();
        
        console.log("✅ Vidéos reçues:", videos);
        console.log("✅ FeedRender:", FeedRender);
        console.log("✅ videoContainer:", videoContainer);

        if (videos.length > 0) {
            if (totalVideosLoaded >= MAX_VIDEOS_IN_DOM) {
                removeOldestVideos(videos.length);
            }

            totalVideosLoaded += videos.length;
console.log("🔍 AVANT renderVideos:", videos);
FeedRender.renderVideos(videoContainer, videos);
console.log("🔍 APRÈS renderVideos, DOM count:", videoContainer.children.length);

// ✅ NOUVEAU : Observer les nouvelles vidéos
observeAllVideos();

console.log(`📹 ${videos.length} vidéos ajoutées (total: ${totalVideosLoaded})`);

        } else {
            hasMoreVideos = false;
            appendEndMessage();
        }
    } catch (error) {
        console.error("❌ Erreur chargement feed:", error);
        appendErrorMessage();
        hasMoreVideos = false;
    } finally {
        showLoader(false);
        isLoadingMore = false;
    }
}

/**
 * ✅ SUPPRIME LES VIDÉOS LES PLUS ANCIENNES (virtualization basique)
 */
function removeOldestVideos(countToAdd) {
    const videoItems = videoContainer.querySelectorAll(".video-item");
    const toRemove = Math.min(countToAdd, videoItems.length);

    for (let i = 0; i < toRemove; i++) {
        const oldVideo = videoItems[i];
        
        // ✅ Pause vidéo avant suppression
        const video = oldVideo.querySelector("video");
        if (video) {
            video.pause();
            video.src = ""; // Libère mémoire
        }

        oldVideo.remove();
    }

    totalVideosLoaded -= toRemove;
    console.log(`🗑️ ${toRemove} anciennes vidéos supprimées`);
}

/**
 * ✅ MESSAGE FIN DE FEED
 */
function appendEndMessage() {
    const endDiv = document.createElement("div");
    endDiv.style.cssText = "text-align:center;padding:40px;color:#888;font-size:18px;";
    endDiv.innerHTML = "🎬 Vous avez tout vu !";
    videoContainer.appendChild(endDiv);
}

/**
 * ✅ MESSAGE ERREUR
 */
function appendErrorMessage() {
    const errorDiv = document.createElement("div");
    errorDiv.style.cssText = "text-align:center;padding:40px;color:#ff4444;";
    errorDiv.innerHTML = `
        ❌ Erreur de chargement
        <button onclick="location.reload()" 
                style="display:block;margin:10px auto;padding:10px 20px;
                       background:#007bff;color:white;border:none;border-radius:5px;
                       cursor:pointer;">
            🔄 Réessayer
        </button>
    `;
    videoContainer.appendChild(errorDiv);
}

function openCommentsModal(videoId) {
    Comments.initModal(videoId);
}

function showLoader(show) {
    if (!loader) return;
    loader.style.display = show ? "block" : "none";
}

function setupMenu() {
    const burgerBtn = document.getElementById("burger-btn");
    const menuOverlay = document.getElementById("menu-overlay");
    const menuClose = document.getElementById("menu-close");

    if (!burgerBtn || !menuOverlay) return;

    burgerBtn.addEventListener("click", () => {
        menuOverlay.classList.add("active");
    });

    menuClose?.addEventListener("click", () => {
        menuOverlay.classList.remove("active");
    });

    menuOverlay.addEventListener("click", (e) => {
        if (e.target === menuOverlay) {
            menuOverlay.classList.remove("active");
        }
    });
}

function setupNavActiveState() {
    const navItems = document.querySelectorAll(".mobile-navbar .nav-item");
    navItems.forEach(item => {
        item.classList.remove("active");
        if (item.getAttribute("href") === "/feed") {
            item.classList.add("active");
        }
    });
}

function setProfileAvatar() {
    const img = document.getElementById("profile-avatar");
    if (!img) return;

    if (Auth.currentUser && Auth.currentUser.avatarUrl) {
        img.src = Auth.currentUser.avatarUrl;
    } else {
        img.src = "/assets/default-avatar.png";
    }
}

/**
 * 🧹 CLEANUP
 */
export function cleanupFeed() {
    console.log("🧹 Nettoyage du feed...");

    FeedRender.cleanup();

    // ✅ Disconnect IntersectionObserver
 
if (intersectionObserver) {
    intersectionObserver.disconnect();
    intersectionObserver = null;
}

// ✅ NOUVEAU : Disconnect VideoObserver
if (videoObserver) {
    videoObserver.disconnect();
    videoObserver = null;
}

// ✅ Remove scroll listener

    // ✅ Remove scroll listener
    if (scrollListener && scrollContainer) {
        scrollContainer.removeEventListener("scroll", scrollListener);
        scrollListener = null;
    }

    // ✅ Pause toutes les vidéos
    const videos = videoContainer?.querySelectorAll("video");
    videos?.forEach(video => {
        video.pause();
        video.src = "";
    });

    isLoadingMore = false;
    hasMoreVideos = true;
    totalVideosLoaded = 0;
}