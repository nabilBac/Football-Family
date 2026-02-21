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

// ✅ Single active video (évite audio fantôme)
let activeVideo = null;

// ⭐ Feed type: "foryou" ou "following"
let currentFeedType = "foryou";

// ✅ mémoire globale du choix son (persiste pendant la session)
window.__ffSoundEnabled = window.__ffSoundEnabled ?? false;



function stopVideo(video) {
  if (!video) return;
  try { video.pause(); } catch (_) {}
}



async function playVideo(video) {
  if (!video) return;
  try { await video.play(); } catch (e) {}
}


function activateVideoSource(video) {
  if (!video) return;
  if (!video.getAttribute("src")) {
    const url = video.dataset?.src;
    if (url) video.setAttribute("src", url);
  }
  video.preload = "metadata";
}

function deactivateVideoSource(video) {
  if (!video) return;
  try { video.pause(); } catch (_) {}
  try { video.removeAttribute("src"); } catch (_) {}
  try { video.load(); } catch (_) {}
}



function setActiveVideo(video) {
  if (!video || video === activeVideo) return;

  if (activeVideo) {
    deactivateVideoSource(activeVideo);
  }

  const all = videoContainer?.querySelectorAll("video") || [];
  all.forEach(v => { if (v !== video) deactivateVideoSource(v); });

  activateVideoSource(video);

  activeVideo = video;
}



// Flags
let isLoadingMore = false;
let hasMoreVideos = true;

// ✅ LIMITE DE VIDÉOS EN DOM
const MAX_VIDEOS_IN_DOM = 50;
let totalVideosLoaded = 0;

// ⭐ Page tracking par type de feed
let feedPages = { foryou: 0, following: 0 };

export async function initFeed() {

    await Auth.requireAuth();

    scrollContainer = document.querySelector(".main-content-scrollable");
    videoContainer = document.getElementById("video-container");
    loader = document.getElementById("loader");

    if (loader) loader.style.display = "none";

    if (!scrollContainer || !videoContainer) {
        console.error("Feed: conteneurs manquants");
        return;
    }

    // ✅ iOS: unlock autoplay after first user gesture
    let iosUnlocked = false;

    function unlockIOSOnce() {
      if (iosUnlocked) return;
      iosUnlocked = true;

      const v = videoContainer?.querySelector("video");
      if (!v) return;

      if (!v.getAttribute("src")) {
        const url = v.dataset?.src;
        if (url) v.setAttribute("src", url);
      }

      v.muted = true;
      const p = v.play();
      if (p && p.catch) p.catch(() => {});
      v.pause();
      v.currentTime = 0;

      v.removeAttribute("src");
      v.load();
    }

    scrollContainer.addEventListener("touchstart", unlockIOSOnce, { once: true, passive: true });
    scrollContainer.addEventListener("click", unlockIOSOnce, { once: true });


    setupMenu();
    setupNavActiveState();
    setProfileAvatar();

    // ✅ WebSocket
    if (!WebSocketService.isConnected()) {
        WebSocketService.init();
        await WebSocketService.connect();
    }

    // Reset
    FeedService.reset();
    hasMoreVideos = true;
    totalVideosLoaded = 0;
    currentFeedType = "foryou";
    feedPages = { foryou: 0, following: 0 };
    videoContainer.innerHTML = "";

    setupVideoAutoplayObserver();

    // ✅ CHARGEMENT INITIAL
    await loadNextPage();

    FeedRender.setupEventDelegation(videoContainer);

    setupIntersectionObserver();
    setupScrollFallback();

    // ⭐ ÉCOUTE DU CHANGEMENT D'ONGLET (depuis navbar.js topbar)
    window.__feedTabHandler = (e) => {
        const type = e.detail?.type;
        if (type && type !== currentFeedType) {
            switchFeedType(type);
        }
    };
    window.addEventListener('feed-tab-change', window.__feedTabHandler);
}

/**
 * ⭐ SWITCH ENTRE "Pour toi" ET "Suivis"
 */
async function switchFeedType(type) {
    currentFeedType = type;

    // Pause toutes les vidéos
    const videos = videoContainer?.querySelectorAll("video") || [];
    videos.forEach(v => {
        stopVideo(v);
        v.removeAttribute("src");
        v.load();
    });
    activeVideo = null;

    // Reset
    videoContainer.innerHTML = "";
    totalVideosLoaded = 0;
    hasMoreVideos = true;
    isLoadingMore = false;

    if (type === "foryou") {
        FeedService.reset();
    }

    feedPages[type] = 0;

    // Recharger
    await loadNextPage();

    // Re-observer les vidéos
    setupVideoAutoplayObserver();
}


/**
 * ✅ OBSERVER POUR AUTOPLAY/PAUSE VIDÉOS
 */
function setupVideoAutoplayObserver() {
    if (videoObserver) videoObserver.disconnect();

    videoObserver = new IntersectionObserver(
        async (entries) => {
            let bestEntry = null;

            for (const entry of entries) {
                if (!entry.isIntersecting) continue;
                if (!bestEntry || entry.intersectionRatio > bestEntry.intersectionRatio) {
                    bestEntry = entry;
                }
            }

            entries.forEach(entry => {
                const video = entry.target;
                if (!entry.isIntersecting) {
                    stopVideo(video);
                }
            });

            if (bestEntry && bestEntry.intersectionRatio >= 0.6) {
                const video = bestEntry.target;
                setActiveVideo(video);
                
                video.muted = !(window.__ffSoundEnabled === true);
                
                // ✅ SYNC ICÔNE
                const card = video.closest('.video-card');
                if (card) {
                    const muteBtn = card.querySelector('.mute-btn i');
                    if (muteBtn) {
                        if (video.muted) {
                            muteBtn.classList.remove('fa-volume-high');
                            muteBtn.classList.add('fa-volume-xmark');
                        } else {
                            muteBtn.classList.remove('fa-volume-xmark');
                            muteBtn.classList.add('fa-volume-high');
                        }
                    }
                }
                
                await playVideo(video);
            }
        },
        {
            root: scrollContainer,
            threshold: [0, 0.25, 0.5, 0.6, 0.75, 1.0]
        }
    );

    observeAllVideos();
}


function observeAllVideos() {
    if (!videoObserver) return;

    const videos = videoContainer.querySelectorAll("video");
    videos.forEach(video => {
        videoObserver.observe(video);
    });
}


export function invalidateAndReload() {
    console.log("🔄 Invalidation et rechargement du feed...");
    
    FeedService.invalidateCache();
    
    if (videoContainer) {
        videoContainer.innerHTML = "";
    }
    
    hasMoreVideos = true;
    totalVideosLoaded = 0;
    isLoadingMore = false;
    feedPages = { foryou: 0, following: 0 };
    
    loadNextPage();
}

function setupIntersectionObserver() {
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
            rootMargin: "200px",
            threshold: 0.1
        }
    );

    if (loader) {
        intersectionObserver.observe(loader);
    }
}

function setupScrollFallback() {
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
        }, 200);
    };

    scrollContainer.addEventListener("scroll", scrollListener, { passive: true });
}

/**
 * ✅ CHARGEMENT PAGE SUIVANTE — avec support onglet "Suivis"
 */
async function loadNextPage() {
    if (isLoadingMore || !hasMoreVideos) return;
    isLoadingMore = true;
    
    showLoader(true);

    try {
        let videos;

        if (currentFeedType === "following") {
            // ⭐ Feed des suivis — appel direct à l'API
            const page = feedPages.following;
            const res = await Auth.secureFetch(`/api/videos/feed/following?page=${page}`);
            const json = await res.json();
            videos = json.data || [];
            feedPages.following++;
        } else {
            // Feed "Pour toi" — utilise FeedService existant
            videos = await FeedService.loadNextPage();
        }

        console.log("✅ Vidéos reçues:", videos.length, "type:", currentFeedType);

        if (videos.length > 0) {
            if (totalVideosLoaded >= MAX_VIDEOS_IN_DOM) {
                removeOldestVideos(videos.length);
            }

            totalVideosLoaded += videos.length;
            FeedRender.renderVideos(videoContainer, videos);

            // ✅ Observer les nouvelles vidéos
            observeAllVideos();

            console.log(`📹 ${videos.length} vidéos ajoutées (total: ${totalVideosLoaded})`);

        } else {
            hasMoreVideos = false;

            if (currentFeedType === "following" && totalVideosLoaded === 0) {
                appendEmptyFollowingMessage();
            } else {
                appendEndMessage();
            }
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

function removeOldestVideos(countToAdd) {
    const videoItems = videoContainer.querySelectorAll(".video-card");
    const toRemove = Math.min(countToAdd, videoItems.length);

    for (let i = 0; i < toRemove; i++) {
        const oldVideo = videoItems[i];
        
        const video = oldVideo.querySelector("video");
        if (video) {
            stopVideo(video);
            if (video === activeVideo) activeVideo = null;
            video.removeAttribute("src");
            video.load();
        }

        oldVideo.remove();
    }

    totalVideosLoaded -= toRemove;
    console.log(`🗑️ ${toRemove} anciennes vidéos supprimées`);
}

function appendEndMessage() {
    const endDiv = document.createElement("div");
    endDiv.style.cssText = "text-align:center;padding:40px;color:#888;font-size:18px;";
    endDiv.innerHTML = "🎬 Vous avez tout vu !";
    videoContainer.appendChild(endDiv);
}

/**
 * ⭐ Message quand l'onglet "Suivis" est vide
 */
function appendEmptyFollowingMessage() {
    const div = document.createElement("div");
    div.style.cssText = "text-align:center;padding:60px 20px;color:#888;";
    div.innerHTML = `
        <div style="font-size:48px;margin-bottom:16px;">👥</div>
        <div style="font-size:16px;font-weight:600;margin-bottom:8px;">Aucune vidéo de vos abonnements</div>
        <div style="font-size:14px;color:#666;">Suivez des créateurs pour voir leurs vidéos ici</div>
    `;
    videoContainer.appendChild(div);
}

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



let loaderTimer = null;

function showLoader(show) {
  if (!loader) return;

  if (show) {
    clearTimeout(loaderTimer);
    loaderTimer = setTimeout(() => {
      loader.style.display = "block";
    }, 200);
  } else {
    clearTimeout(loaderTimer);
    loader.style.display = "none";
  }
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

    if (intersectionObserver) {
        intersectionObserver.disconnect();
        intersectionObserver = null;
    }

    if (videoObserver) {
        videoObserver.disconnect();
        videoObserver = null;
    }

    if (scrollListener && scrollContainer) {
        scrollContainer.removeEventListener("scroll", scrollListener);
        scrollListener = null;
    }

    // ⭐ Retirer le listener d'onglet
    if (window.__feedTabHandler) {
        window.removeEventListener('feed-tab-change', window.__feedTabHandler);
        window.__feedTabHandler = null;
    }

    const videos = videoContainer?.querySelectorAll("video");
    videos?.forEach(video => {
        stopVideo(video);
        video.removeAttribute("src");
        video.load();
    });

    isLoadingMore = false;
    hasMoreVideos = true;
    totalVideosLoaded = 0;
    currentFeedType = "foryou";

    activeVideo = null;
}