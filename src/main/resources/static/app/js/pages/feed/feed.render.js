// /static/app/js/pages/feed/feed.render.js
import { Comments } from "./feed.comments.js";
import { Auth } from "../../auth.js";
import { Router } from "../../router.js";
import { WebSocketService } from "../../services/websocket.service.js";

export const FeedRender = {

    /**
     * Render videos - VERSION SIMPLE
     */
    renderVideos(container, videos) {
        console.log("🔍 RENDER:", videos.length, "vidéos");

        for (const video of videos) {
            const card = this.createVideoCard(video);
            container.appendChild(card);
        }

        console.log("🔍 DOM après render:", container.children.length, "cartes");
    },

    /**
     * Create video card - VERSION TIKTOK
     */
    createVideoCard(video) {
        const id = video.id;
        const videoUrl = `/videos/${video.filename}`;
        const title = video.title || "";
        const author = video.uploaderUsername || "Unknown";
        const authorId = video.uploaderId || null;
        const avatarUrl = video.uploaderAvatarUrl || null;
        const likeCount = video.likesCount ?? 0;
        const commentCount = video.commentsCount ?? 0;
        const liked = video.likedByCurrentUser === true;
        const isFollowing = video.isFollowingUploader === true;

        // Avatar : initiale si pas d'image
        const avatarContent = avatarUrl
            ? `<img src="${avatarUrl}" alt="${author}" class="action-avatar-img">`
            : `<span class="action-avatar-initial">${author.charAt(0).toUpperCase()}</span>`;

        const card = document.createElement("article");
        card.className = "video-card";
        card.dataset.videoId = id;

        // Bouton follow : masqué si c'est notre propre vidéo
        const currentUser = Auth.currentUser;
        const isOwnVideo = currentUser && currentUser.username === author;

        const followBtnHtml = !isOwnVideo ? `
            <button class="follow-mini-btn ${isFollowing ? 'following' : ''}" 
                    data-target-id="${authorId}"
                    data-action="follow"
                    aria-label="Suivre ${author}">
                <i class="fa-solid ${isFollowing ? 'fa-check' : 'fa-plus'}"></i>
            </button>
        ` : '';

        card.innerHTML = `
            <video class="video-element"
                data-src="${videoUrl}"
                playsinline
                webkit-playsinline
                muted
                loop
                preload="none">
            </video>

            <div class="overlay">
                <div class="video-info">
                    <span class="video-author-link"
                        data-username="${author}"
                        style="cursor:pointer;">@${author}</span>

                    <div class="video-title">${this.escapeHtml(title)}</div>
                </div>

                <div class="video-actions">

                    <!-- ⭐ AVATAR CRÉATEUR + FOLLOW (style TikTok) -->
                    <div class="action-avatar-wrapper">
                        <div class="action-avatar" 
                             data-username="${author}" 
                             data-action="go-profile">
                            ${avatarContent}
                        </div>
                        ${followBtnHtml}
                    </div>

                    <button class="like-btn ${liked ? "active" : ""}" 
                            data-video-id="${id}"
                            data-action="like">
                        <i class="fa-solid fa-heart"></i>
                        <div class="like-count">${likeCount}</div>
                    </button>

                    <button class="comment-btn" 
                            data-video-id="${id}"
                            data-action="comment">
                        <i class="fa-regular fa-comment"></i>
                        <div class="comment-count">${commentCount}</div>
                    </button>

                    <button class="share-btn" 
                            data-video-id="${id}"
                            data-action="share">
                        <i class="fa-solid fa-share"></i>
                    </button>

                    <button class="mute-btn" 
                            data-video-id="${id}"
                            data-action="mute">
                        <i class="fa-solid ${window.__ffSoundEnabled ? 'fa-volume-high' : 'fa-volume-xmark'}"></i>
                    </button>
                </div>
            </div>
        `;

        const v = card.querySelector("video");
        if (v) {
            v.playsInline = true;
            v.setAttribute("playsinline", "");
            v.setAttribute("webkit-playsinline", "");
            v.preload = "none";
        }

        // WebSocket
        this.subscribeToLikeUpdates(id);
        this.subscribeToStatsUpdates(id);

        return card;
    },

    subscribeToLikeUpdates(videoId) {
        WebSocketService.subscribeLikes(videoId, (data) => {
            const card = document.querySelector(`[data-video-id="${data.videoId}"]`);
            if (!card) return;

            const likeBtn = card.querySelector(".like-btn");
            const countEl = likeBtn.querySelector(".like-count");

            countEl.textContent = data.likesCount ?? 0;
            likeBtn.classList.toggle("active", data.liked === true);
        });
    },

    subscribeToStatsUpdates(videoId) {
        WebSocketService.subscribeStats(videoId, (data) => {
            console.log(`📊 STATS WS reçu videoId=${data.videoId}`, JSON.stringify(data));
            if (!data || data.videoId == null) return;

            const card = document.querySelector(`[data-video-id="${data.videoId}"]`);
            if (!card) return;

            if (data.newCommentsCount !== undefined) {
                const commentBtn = card.querySelector(".comment-btn");
                const countEl = commentBtn?.querySelector(".comment-count");
                if (countEl) {
                    countEl.textContent = data.newCommentsCount ?? 0;
                }
            }

            if (data.newLikesCount !== undefined) {
                const likeBtn = card.querySelector(".like-btn");
                const countEl = likeBtn?.querySelector(".like-count");
                if (countEl) {
                    countEl.textContent = data.newLikesCount ?? 0;
                }
            }
        });
    },

    async toggleLike(btn, videoId) {
        if (btn.classList.contains("processing")) return;
        btn.classList.add("processing");

        const countEl = btn.querySelector(".like-count");
        const wasLiked = btn.classList.contains("active");

        const current = parseInt(countEl.textContent) || 0;
        const newCount = wasLiked ? current - 1 : current + 1;

        btn.classList.toggle("active");
        countEl.textContent = Math.max(0, newCount);

        try {
            const res = await Auth.secureFetch(`/api/videos/${videoId}/like`, {
                method: "POST"
            });

            const json = await res.json();

            btn.classList.toggle("active", json.data.liked);
            countEl.textContent = json.data.likesCount ?? 0;

        } catch (err) {
            btn.classList.toggle("active", wasLiked);
            countEl.textContent = current;
            console.error("❌ Erreur like:", err);
        }

        setTimeout(() => btn.classList.remove("processing"), 300);
    },

    /**
     * ⭐ Toggle follow depuis la sidebar
     */
    async toggleFollow(btn) {
        if (btn.classList.contains("processing")) return;
        btn.classList.add("processing");

        const targetId = btn.dataset.targetId;
        if (!targetId) return;

        const wasFollowing = btn.classList.contains("following");
        const icon = btn.querySelector("i");

        // Optimistic UI
        btn.classList.toggle("following");
        if (icon) {
            icon.className = wasFollowing 
                ? "fa-solid fa-plus" 
                : "fa-solid fa-check";
        }

        try {
            const res = await Auth.secureFetch(`/api/follow/${targetId}`, {
                method: "POST"
            });
            const json = await res.json();

            if (json.success) {
                const isNowFollowing = json.data.isFollowing;
                btn.classList.toggle("following", isNowFollowing);
                if (icon) {
                    icon.className = isNowFollowing 
                        ? "fa-solid fa-check" 
                        : "fa-solid fa-plus";
                }

                // Met à jour tous les boutons follow du même user sur d'autres cartes
                document.querySelectorAll(`.follow-mini-btn[data-target-id="${targetId}"]`).forEach(b => {
                    b.classList.toggle("following", isNowFollowing);
                    const i = b.querySelector("i");
                    if (i) i.className = isNowFollowing ? "fa-solid fa-check" : "fa-solid fa-plus";
                });
            }
        } catch (err) {
            // Rollback
            btn.classList.toggle("following", wasFollowing);
            if (icon) {
                icon.className = wasFollowing 
                    ? "fa-solid fa-check" 
                    : "fa-solid fa-plus";
            }
            console.error("❌ Erreur follow:", err);
        }

        setTimeout(() => btn.classList.remove("processing"), 300);
    },

    shareVideo(videoId) {
        const url = `${window.location.origin}/watch?video=${videoId}`;

        if (navigator.share) {
            navigator.share({ title: "Regarde cette vidéo", url }).catch(() => {});
        } else {
            navigator.clipboard.writeText(url)
                .then(() => alert("Lien copié !"))
                .catch(() => alert("Copie impossible"));
        }
    },

    setupEventDelegation(container) {
        container.addEventListener("click", (e) => {
            const btn = e.target.closest("[data-action]");
            if (!btn) return;

            e.stopPropagation();
            const action = btn.dataset.action;
            const videoId = btn.dataset.videoId;

            switch (action) {
                case "like":
                    this.toggleLike(btn, videoId);
                    break;
                case "comment":
                    Comments.initModal(videoId);
                    break;
                case "share":
                    this.shareVideo(videoId);
                    break;
                case "mute":
                    this.toggleMute(btn, videoId);
                    break;
                case "follow":
                    this.toggleFollow(btn);
                    break;
                case "go-profile":
                    const username = btn.dataset.username;
                    if (username) {
                        Router.navigate(`/profile/${username}`);
                    }
                    break;
            }
        });
    },

    toggleMute(btn, videoId) {
        const card = document.querySelector(`[data-video-id="${videoId}"]`);
        if (!card) return;

        const video = card.querySelector("video");
        if (!video) return;

        video.muted = !video.muted;
        window.__ffSoundEnabled = !video.muted;

        console.log("TOGGLE MUTE OK", { muted: video.muted, ff: window.__ffSoundEnabled });

        const icon = btn.querySelector("i");
        if (video.muted) {
            icon.classList.remove("fa-volume-high");
            icon.classList.add("fa-volume-xmark");
        } else {
            icon.classList.remove("fa-volume-xmark");
            icon.classList.add("fa-volume-high");
        }
    },

    cleanup() {
        console.log("🧹 Cleanup feed render");
    },

    escapeHtml(str) {
        if (!str) return "";
        return str.replace(/&/g, "&amp;")
                  .replace(/</g, "&lt;")
                  .replace(/>/g, "&gt;");
    }
};