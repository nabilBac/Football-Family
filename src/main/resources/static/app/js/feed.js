// /static/app/js/feed.js
import { Auth } from "./auth.js";
import { Router } from "./router.js";
import { Comments } from "./pages/feed/feed.comments.js";
import { FeedRender } from "./pages/feed/feed.render.js";
import { FeedService } from "./services/feed.service.js";
import { WebSocketService } from "./services/websocket.service.js";  // ✅ NOUVEAU

let scrollContainer;
let videoContainer;
let loader;

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

    // ✅ WebSocket unique pour likes + commentaires
    await WebSocketService.connect();

    // Reset du service et vider le feed
    FeedService.reset();
    videoContainer.innerHTML = "";

    await loadNextPage();

    // Scroll infini
    scrollContainer.addEventListener("scroll", async () => {
        const scrollPos = scrollContainer.scrollTop + scrollContainer.clientHeight;
        const threshold = scrollContainer.scrollHeight - 350;

        if (scrollPos >= threshold) {
            await loadNextPage();
        }
    });
}

async function loadNextPage() {
    showLoader(true);

    const videos = await FeedService.loadNextPage();

    if (videos.length > 0) {
        FeedRender.renderVideos(videoContainer, videos);
    }

    showLoader(false);
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

// 🧹 Déconnexion WebSocket quand on quitte le feed
export function cleanupFeed() {
    console.log("🧹 Nettoyage du feed...");
    WebSocketService.disconnect();  // ✅ corrige la déconnexion
}
