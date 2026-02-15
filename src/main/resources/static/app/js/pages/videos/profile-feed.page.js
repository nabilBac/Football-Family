// /static/app/js/pages/videos/profile-feed.page.js
import { Auth } from "../../auth.js";

export async function render({ id }) {
    // ⭐ id = ID de la vidéo cliquée

    // 1️⃣ Charger la vidéo cliquée pour connaître SON OWNER
    const resVideo = await fetch(`/api/videos/${id}`, {
        headers: { "Authorization": Auth.getAuthHeader() }
    });

    if (!resVideo.ok) {
        return `<h2>Erreur de chargement</h2>`;
    }

    const apiVideo = await resVideo.json();
    const videoData = apiVideo.data ?? apiVideo;

    const ownerId = videoData.uploaderId;
    if (!ownerId) {
        return `<h2>Erreur : userId manquant dans la vidéo</h2>`;
    }

    // 2️⃣ Charger toutes les vidéos de ce user
    const res = await fetch(`/api/videos/user/${ownerId}`, {
        headers: { "Authorization": Auth.getAuthHeader() }
    });

    if (!res.ok) {
        return `<h2>Erreur chargement vidéos utilisateur</h2>`;
    }

    const apiList = await res.json();
    const videos = apiList.data ?? apiList.videos ?? [];

    if (!Array.isArray(videos) || videos.length === 0) {
        return `<h2>Aucune vidéo pour cet utilisateur</h2>`;
    }

    // 3️⃣ Trouver l'index de départ (vidéo cliquée)
    let startIndex = videos.findIndex((v) => v.id == id);
    if (startIndex < 0) startIndex = 0;

    // 4️⃣ Rendu du feed immersif
    return `
    <div class="feed-modal-overlay" id="profileFeed" data-start-index="${startIndex}">
        <button id="closeFeedButton">✕</button>

        ${videos
            .map(
                (v) => `
                <div class="feed-item" data-video-id="${v.id}">
                    <video 
                        class="feed-video-player"
                        src="/videos/${v.filename}"
                        playsinline
                        preload="metadata"
                    ></video>

                    <!-- ✅ NOUVELLE colonne d'actions avec RÉACTIONS -->
                    <div class="feed-actions-floating">
                        
                        <!-- ❤️ Bouton Réactions -->
                        <button class="feed-reaction-btn" data-id="${v.id}">
                            <i class="fas fa-heart"></i>
                            <span class="reaction-count">0</span>
                        </button>

                        <!-- 💬 Commentaires -->
                        <button class="feed-comment-btn" data-id="${v.id}">
                            <i class="fas fa-comment"></i>
                            <span class="comment-count">${v.commentsCount ?? 0}</span>
                        </button>

                        <!-- 🔊 Son -->
                        <button class="feed-sound-btn">
                            <i class="fas fa-volume-xmark"></i>
                        </button>
                    </div>

                    <!-- 🔥 MENU RADIAL DES RÉACTIONS -->
                    <div class="reaction-menu" style="display: none;">
                        <button class="reaction-option" data-emoji="❤️">❤️</button>
                        <button class="reaction-option" data-emoji="😂">😂</button>
                        <button class="reaction-option" data-emoji="🔥">🔥</button>
                        <button class="reaction-option" data-emoji="👏">👏</button>
                        <button class="reaction-option" data-emoji="⚽">⚽</button>
                        <button class="reaction-option" data-emoji="🤯">🤯</button>
                    </div>

                    <!-- 📊 Résumé réactions -->
                    <div class="reactions-summary" style="display: none;"></div>
                </div>
                `
            )
            .join("")}
    </div>
    
    <!-- ✅ NAVBAR -->
    <nav class="mobile-navbar">
        <a href="/feed" class="nav-item" data-link>
            <i class="fa-solid fa-house"></i>
            <span>Home</span>
        </a>
        <a href="/events" class="nav-item" data-link>
            <i class="fa-regular fa-calendar-days"></i>
            <span>Events</span>
        </a>
        <div class="nav-spacer"></div>
        <a href="/hub" class="nav-item" data-link>
            <i class="fa-solid fa-tower-broadcast"></i>
            <span>Live</span>
        </a>
        <a href="/profile" class="nav-item" data-link>
            <i class="fa-regular fa-user"></i>
            <span>Profile</span>
        </a>
    </nav>
`;
}

// =======================================================
//  JS après injection
// =======================================================
export function init(params) {
    const feed = document.getElementById("profileFeed");
    const videos = document.querySelectorAll(".feed-video-player");
    const closeBtn = document.getElementById("closeFeedButton");

    if (!feed || videos.length === 0) {
        console.error("Feed ou vidéos introuvables");
        return;
    }

    // 👉 Afficher le feed
    document.body.classList.add("feed-active");
    feed.style.display = "block";

    const startIndex = parseInt(feed.dataset.startIndex || "0", 10);
    let currentIndex = isNaN(startIndex) ? 0 : startIndex;

    // ----------------------------
    // 1️⃣ Positionner sur la bonne vidéo
    // ----------------------------
    setTimeout(() => {
        feed.scrollTo({
            top: window.innerHeight * currentIndex,
            behavior: "instant",
        });
        playVisibleVideo();
    }, 20);

  function playVisibleVideo() {
    videos.forEach((v, idx) => {
        if (idx === currentIndex) {
            v.muted = false;
            v.play().catch(() => {});
        } else {
            v.pause();
            v.currentTime = 0;  // ← AJOUTE ÇA : réinitialise la vidéo
            v.muted = true;     // ← AJOUTE ÇA : coupe le son !
        }
    });
}

    // === Auto-Replay ===
    videos.forEach((video, index) => {
        video.addEventListener("ended", () => {
            if (index === currentIndex) {
                video.currentTime = 0;
                video.play().catch(() => {});
            }
        });
    });

    // ----------------------------
    // 2️⃣ ✅ SCROLL VERTICAL AVEC DEBOUNCE (FIX SCROLL RAPIDE)
    // ----------------------------
    let scrollTimeout = null;
    let isScrolling = false;

    feed.addEventListener("wheel", (e) => {
        e.preventDefault();
        
        // Ignore si déjà en train de scroller
        if (isScrolling) return;
        
        isScrolling = true;

        // Déterminer la direction
        if (e.deltaY > 0 && currentIndex < videos.length - 1) {
            currentIndex++;
        } else if (e.deltaY < 0 && currentIndex > 0) {
            currentIndex--;
        } else {
            isScrolling = false;
            return;
        }

        // Scroll vers la nouvelle vidéo
        feed.scrollTo({
            top: window.innerHeight * currentIndex,
            behavior: "smooth",
        });

        playVisibleVideo();

        // Réactiver le scroll après 800ms
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            isScrolling = false;
        }, 800);
    });

    // ----------------------------
    // 3️⃣ Bouton fermer
    // ----------------------------
   // ----------------------------
// 3️⃣ Bouton fermer
// ----------------------------
if (closeBtn) {
    closeBtn.addEventListener("click", () => {
        // ✅ STOPPE TOUTES les vidéos avant de fermer
        videos.forEach(v => {
            v.pause();
            v.currentTime = 0;
            v.muted = true;
        });
        
        document.body.classList.remove("feed-active");
        feed.style.display = "none";
        history.back();
    });
}

    // ----------------------------
    // 4️⃣ Gestion SON
    // ----------------------------
    document.querySelectorAll(".feed-sound-btn").forEach((btn) => {
        btn.addEventListener("click", (e) => {
            e.stopPropagation();

            const item = btn.closest(".feed-item");
            if (!item) return;

            const video = item.querySelector(".feed-video-player");
            if (!video) return;

            video.muted = !video.muted;

            const icon = btn.querySelector("i");
            if (video.muted) {
                icon.classList.remove("fa-volume-high");
                icon.classList.add("fa-volume-xmark");
            } else {
                icon.classList.remove("fa-volume-xmark");
                icon.classList.add("fa-volume-high");
            }
        });
    });

    // ----------------------------
    // 5️⃣ 🔥 Gestion RÉACTIONS
    // ----------------------------

    // Charger les réactions pour toutes les vidéos
    async function loadReactionsForAllVideos() {
        const items = document.querySelectorAll(".feed-item");
        
        for (const item of items) {
            const videoId = item.dataset.videoId;
            await loadReactionsForVideo(videoId, item);
        }
    }

    // Charger les réactions d'une vidéo
    async function loadReactionsForVideo(videoId, itemElement) {
        try {
            const res = await fetch(`/api/videos/${videoId}/reactions`, {
                headers: { "Authorization": Auth.getAuthHeader() }
            });

            if (!res.ok) return;

            const api = await res.json();
            const data = api.data ?? api;

            // Mettre à jour le compteur
            const countSpan = itemElement.querySelector(".reaction-count");
            if (countSpan) {
                countSpan.textContent = data.totalReactions || 0;
            }

            // Afficher le résumé
            if (data.totalReactions > 0) {
                displayReactionsSummary(itemElement, data.reactions);
            }

            // Mettre en surbrillance la réaction de l'utilisateur
            if (data.userReaction) {
                const btn = itemElement.querySelector(".feed-reaction-btn i");
                btn.textContent = data.userReaction;
                btn.style.color = "#FF3366";
            }

        } catch (err) {
            console.error("Erreur chargement réactions:", err);
        }
    }

    // Afficher le résumé des réactions
    function displayReactionsSummary(itemElement, reactions) {
        const summary = itemElement.querySelector(".reactions-summary");
        if (!summary || !reactions) return;

        const html = Object.entries(reactions)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([emoji, count]) => `
                <span class="reaction-badge">
                    <span class="emoji">${emoji}</span>
                    <span class="count">${count}</span>
                </span>
            `)
            .join("");

        summary.innerHTML = html;
        summary.style.display = html ? "flex" : "none";
    }

    // Ouvrir/fermer le menu radial
    document.querySelectorAll(".feed-reaction-btn").forEach((btn) => {
        btn.addEventListener("click", (e) => {
            e.stopPropagation();

            const item = btn.closest(".feed-item");
            const menu = item.querySelector(".reaction-menu");

            // Fermer les autres menus
            document.querySelectorAll(".reaction-menu").forEach(m => {
                if (m !== menu) m.style.display = "none";
            });

            // Toggle ce menu
            const isVisible = menu.style.display === "flex";
            menu.style.display = isVisible ? "none" : "flex";
        });
    });

    // Clic sur un emoji du menu
    document.querySelectorAll(".reaction-option").forEach((option) => {
        option.addEventListener("click", async (e) => {
            e.stopPropagation();

            const emoji = option.dataset.emoji;
            const item = option.closest(".feed-item");
            const videoId = item.dataset.videoId;
            const menu = item.querySelector(".reaction-menu");

            try {
                const res = await fetch(`/api/videos/${videoId}/reactions`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": Auth.getAuthHeader()
                    },
                    body: JSON.stringify({ emoji })
                });

                if (!res.ok) return;

                const api = await res.json();
                const data = api.data ?? api;

                // Mettre à jour l'UI
                const btn = item.querySelector(".feed-reaction-btn i");
                const countSpan = item.querySelector(".reaction-count");

                if (data.userReaction) {
                    btn.textContent = data.userReaction;
                    btn.style.color = "#FF3366";
                } else {
                    btn.textContent = "";
                    btn.className = "fas fa-heart";
                    btn.style.color = "";
                }

                countSpan.textContent = data.totalReactions || 0;

                // Mettre à jour le résumé
                displayReactionsSummary(item, data.reactions);

                // Animation emoji qui monte
                animateEmojiFloat(item, emoji);

                // Fermer le menu
                menu.style.display = "none";

            } catch (err) {
                console.error("Erreur réaction:", err);
            }
        });
    });

    // Animation emoji flottant
    function animateEmojiFloat(item, emoji) {
        const floatingEmoji = document.createElement("div");
        floatingEmoji.className = "floating-emoji";
        floatingEmoji.textContent = emoji;
        item.appendChild(floatingEmoji);

        setTimeout(() => floatingEmoji.remove(), 1000);
    }

    // Fermer menu si clic ailleurs
    feed.addEventListener("click", (e) => {
        if (!e.target.closest(".feed-reaction-btn") && !e.target.closest(".reaction-menu")) {
            document.querySelectorAll(".reaction-menu").forEach(m => {
                m.style.display = "none";
            });
        }
    });

    // Charger les réactions au démarrage
    loadReactionsForAllVideos();

    // ----------------------------
    // 6️⃣ Gestion COMMENTAIRES avec EMOJI PICKER
    // ----------------------------

    const emojiList = [
        '😀', '😂', '🤣', '😍', '🥰', '😎', '🤩', '🥳', 
        '😭', '😤', '🔥', '💯', '👍', '👏', '🙌', '💪',
        '⚽', '🏆', '🎯', '💥', '✨', '❤️', '💚', '💙'
    ];

    feed.addEventListener("click", (e) => {
        const btn = e.target.closest(".feed-comment-btn");
        if (!btn) return;

        e.stopPropagation();
        const videoId = btn.dataset.id;
        openCommentsPanel(videoId);
    });

    async function openCommentsPanel(videoId) {
        const existing = feed.querySelector(".comments-panel");
        const existingBackdrop = feed.querySelector(".comments-backdrop");

        if (existing) existing.remove();
        if (existingBackdrop) existingBackdrop.remove();

        const backdrop = document.createElement("div");
        backdrop.className = "comments-backdrop";
        document.body.appendChild(backdrop);

        const panel = document.createElement("div");
        panel.className = "comments-panel";
        panel.innerHTML = `
            <div class="comments-header">
                <span>Commentaires</span>
                <button id="closeCommentsBtn" style="background:none;border:none;color:#fff;font-size:20px;cursor:pointer;">✕</button>
            </div>
            <div class="comments-list">
                <p style="color:#aaa;font-size:14px;">Chargement...</p>
            </div>

            <!-- 🔥 EMOJI PICKER -->
            <div class="emoji-picker" style="display: none;">
                <div class="emoji-grid">
                    ${emojiList.map(emoji => `
                        <button class="emoji-btn" data-emoji="${emoji}">${emoji}</button>
                    `).join('')}
                </div>
            </div>

            <div class="comments-input-wrapper">
                <button class="emoji-toggle-btn" type="button">
                    <i class="fas fa-smile"></i>
                </button>

                <input type="text" class="comment-input" placeholder="Ajouter un commentaire..." />
                
                <button class="comment-send-btn">
                    <i class="fas fa-paper-plane"></i>
                </button>
            </div>
        `;

        document.body.appendChild(panel);

        const listEl = panel.querySelector(".comments-list");
        const inputEl = panel.querySelector(".comment-input");
        const sendBtn = panel.querySelector(".comment-send-btn");
        const closeCommentsBtn = panel.querySelector("#closeCommentsBtn");
        const emojiToggleBtn = panel.querySelector(".emoji-toggle-btn");
        const emojiPicker = panel.querySelector(".emoji-picker");

        // Toggle emoji picker
        emojiToggleBtn.addEventListener("click", (e) => {
            e.preventDefault();
            const isVisible = emojiPicker.style.display === "block";
            emojiPicker.style.display = isVisible ? "none" : "block";
        });

        // Clic sur un emoji
        panel.querySelectorAll(".emoji-btn").forEach(btn => {
            btn.addEventListener("click", (e) => {
                e.preventDefault();
                const emoji = btn.dataset.emoji;
                inputEl.value += emoji;
                inputEl.focus();
                emojiPicker.style.display = "none";
            });
        });

        // Fermer picker si focus input
        inputEl.addEventListener("focus", () => {
            emojiPicker.style.display = "none";
        });

        // Fermeture panel
        const closeCommentsWithAnimation = () => {
            panel.classList.add("close-animation");
            backdrop.classList.add("close-animation");
            setTimeout(() => {
                panel.remove();
                backdrop.remove();
            }, 250);
        };

        closeCommentsBtn.addEventListener("click", closeCommentsWithAnimation);
        backdrop.addEventListener("click", closeCommentsWithAnimation);

        // Charger commentaires
        try {
            const res = await fetch(`/api/videos/${videoId}/comments?page=0&size=20`, {
                headers: { "Authorization": Auth.getAuthHeader() }
            });

            if (!res.ok) {
                listEl.innerHTML = `<p style="color:#f87171;">Erreur de chargement.</p>`;
            } else {
                const api = await res.json();
                const data = api.data ?? api;
                const comments = data.comments ?? data.items ?? data ?? [];

                if (!Array.isArray(comments) || comments.length === 0) {
                    listEl.innerHTML = `<p style="color:#aaa;font-size:14px;">Aucun commentaire. Soyez le premier !</p>`;
                } else {
                    listEl.innerHTML = comments.map((c) => {
                        const author = c.authorUsername || c.username || c.author || "User";
                        const content = c.content || "";
                        const date = c.createdAt || c.created || "";
                        return `
                        <div class="comment-item">
                            <div class="comment-avatar">
                                <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(author)}&background=10B981&color=fff&size=64" alt="${author}">
                            </div>
                            <div class="comment-content">
                                <div class="comment-header">
                                    <span class="comment-author">${author}</span>
                                    <span class="comment-time">${date || ""}</span>
                                </div>
                                <p class="comment-text">${content}</p>
                            </div>
                        </div>
                        `;
                    }).join("");
                }
            }
        } catch (err) {
            console.error("Erreur commentaires:", err);
            listEl.innerHTML = `<p style="color:#f87171;">Erreur.</p>`;
        }

        // Envoi commentaire
        async function sendComment() {
            const content = inputEl.value.trim();
            if (!content) return;

            try {
                const res = await fetch(`/api/videos/${videoId}/comments`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": Auth.getAuthHeader()
                    },
                    body: JSON.stringify({ content })
                });

                if (!res.ok) return;

                const api = await res.json();
                const c = api.data ?? api;
                const author = c.authorUsername || c.username || c.author || "Vous";
                const text = c.content || content;

                const itemHtml = `
                    <div class="comment-item">
                        <div class="comment-avatar">
                            <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(author)}&background=10B981&color=fff&size=64" alt="${author}">
                        </div>
                        <div class="comment-content">
                            <div class="comment-header">
                                <span class="comment-author">${author}</span>
                                <span class="comment-time">À l'instant</span>
                            </div>
                            <p class="comment-text">${text}</p>
                        </div>
                    </div>
                `;

                listEl.insertAdjacentHTML("afterbegin", itemHtml);
                inputEl.value = "";

                const btn = document.querySelector(`.feed-comment-btn[data-id="${videoId}"] .comment-count`);
                if (btn) {
                    const current = parseInt(btn.textContent || "0", 10);
                    btn.textContent = current + 1;
                }
            } catch (err) {
                console.error("Erreur envoi:", err);
            }
        }

        sendBtn.addEventListener("click", sendComment);
        inputEl.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                sendComment();
            }
        });
    }
}