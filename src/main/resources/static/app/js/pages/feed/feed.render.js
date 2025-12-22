// /static/app/js/pages/feed/feed.render.js
import { Comments } from "./feed.comments.js";
import { Auth } from "../../auth.js";
import { Router } from "../../router.js";
import { WebSocketService } from "../../services/websocket.service.js";

export const FeedRender = {

    // 🔥 Injecte la liste de vidéos dans le DOM
    renderVideos(container, videos) {
        for (const video of videos) {
            const card = this.createVideoCard(video);
            container.appendChild(card);
        }
        this.setupAutoPlay();
    },

    // 🔥 Carte vidéo + WebSocket
    createVideoCard(video) {
        const id = video.id;
        const videoUrl = `/videos/${video.filename}`;
        const title = video.title || "";
        const author = video.uploaderUsername || "Unknown";
        const likeCount = video.likesCount ?? 0;
        const commentCount = video.commentsCount ?? 0;
        const liked = video.likedByCurrentUser === true;

        const card = document.createElement("article");
        card.className = "video-card";
        card.dataset.videoId = id;

        card.innerHTML = `
            <video class="video-element"
                src="${videoUrl}"
                playsinline
                muted
                loop>
            </video>

            <div class="overlay">
                <div class="video-info">
                    <span class="video-author-link"
                        data-username="${author}"
                        style="cursor:pointer;">@${author}</span>

                    <div class="video-title">${this.escapeHtml(title)}</div>
                </div>

                <div class="video-actions">
                    <button class="like-btn ${liked ? "active" : ""}" data-video-id="${id}">
                        <i class="fa-solid fa-heart"></i>
                        <div class="like-count">${likeCount}</div>
                    </button>

                    <button class="comment-btn" data-video-id="${id}">
                        <i class="fa-regular fa-comment"></i>
                        <div class="comment-count">${commentCount}</div>
                    </button>

                    <button class="share-btn" data-video-id="${id}">
                        <i class="fa-solid fa-share"></i>
                    </button>

                    <button class="mute-btn" data-video-id="${id}">
                        <i class="fa-solid fa-volume-xmark"></i>
                    </button>
                </div>
            </div>
        `;

        const videoEl = card.querySelector("video");

        // ▶️ Play / Pause
        videoEl.addEventListener("click", () => {
            if (videoEl.paused) videoEl.play();
            else videoEl.pause();
        });

        // ❤️ Like
        const likeBtn = card.querySelector(".like-btn");
        likeBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            this.toggleLike(likeBtn, id);
        });

        // 💬 Commentaires
        const commentBtn = card.querySelector(".comment-btn");
        commentBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            Comments.initModal(id);
        });

        // 📤 Partage
        const shareBtn = card.querySelector(".share-btn");
        shareBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            this.shareVideo(id);
        });

        // 🔇 Mute / Unmute
        const muteBtn = card.querySelector(".mute-btn");
        muteBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            videoEl.muted = !videoEl.muted;

            const icon = muteBtn.querySelector("i");
            if (videoEl.muted) {
                icon.classList.remove("fa-volume-high");
                icon.classList.add("fa-volume-xmark");
            } else {
                icon.classList.remove("fa-volume-xmark");
                icon.classList.add("fa-volume-high");
            }
        });

        // 🔗 Profil
        const authorEl = card.querySelector(".video-author-link");
        if (authorEl) {
            authorEl.addEventListener("click", (e) => {
                e.stopPropagation();
                Router.go(`/profile/${authorEl.dataset.username}`);
            });
        }

        // 🔥 WebSocket sync
        this.subscribeToLikeUpdates(id);

        this.subscribeToCommentUpdates(id);

        this.subscribeToCommentCountUpdates(id);



        return card;
    },

    // ======================================================
    // 🔵 WebSocket – Sync live des likes
    // ======================================================
  subscribeToLikeUpdates(videoId) {
    WebSocketService.subscribeLikes(videoId, (data) => {

        const card = document.querySelector(`[data-video-id="${data.videoId}"]`);
        if (!card) return;

        const likeBtn = card.querySelector(".like-btn");
        const countEl = likeBtn.querySelector(".like-count");

        // 🔥 correction N°2 : jamais vide même si null
        countEl.textContent = data.likesCount ?? 0;

        likeBtn.classList.toggle("active", data.liked === true);
    });
},


        subscribeToCommentUpdates(videoId) {
    WebSocketService.subscribeComments(videoId, (data) => {
        const card = document.querySelector(`[data-video-id="${data.videoId}"]`);
        if (!card) return;

        const commentBtn = card.querySelector(".comment-btn");
        const countEl = commentBtn.querySelector(".comment-count");

        // Mise à jour compteur
        if (data.newCommentsCount !== undefined && data.newCommentsCount !== null) {
            countEl.textContent = data.newCommentsCount;
        }
    });
},

subscribeToCommentCountUpdates(videoId) {
    WebSocketService.subscribeStats(videoId, (data) => {

        // Le backend envoie VideoStatsUpdateDto :
        // { videoId, newCommentsCount, newLikesCount, isLiked, lastActionBy }

        if (!data || data.videoId == null) return;

        const card = document.querySelector(`[data-video-id="${data.videoId}"]`);
        if (!card) return;

        const commentBtn = card.querySelector(".comment-btn");
        if (!commentBtn) return;

        const countEl = commentBtn.querySelector(".comment-count");
        if (!countEl) return;

        // Mise à jour compteur commentaires
        if (data.newCommentsCount !== undefined && data.newCommentsCount !== null) {
            countEl.textContent = data.newCommentsCount;
        }
    });
},




    // ❤️ Gestion du like
   async toggleLike(btn, videoId) {

    console.log("🔥 toggleLike exécuté pour vidéo :", videoId);

    if (btn.classList.contains("processing")) return;
    btn.classList.add("processing");

    const countEl = btn.querySelector(".like-count");
    const wasLiked = btn.classList.contains("active");

    // 💨 UI instantané (optimiste)
    const current = parseInt(countEl.textContent) || 0;
    const newCount = wasLiked ? current - 1 : current + 1;

    btn.classList.toggle("active");
    countEl.textContent = Math.max(0, newCount); // jamais vide

    try {
        const res = await Auth.secureFetch(`/api/videos/${videoId}/like`, {
            method: "POST"
        });

        const json = await res.json();

        // ❤️ MISE À JOUR FIABLE
      btn.classList.toggle("active", json.data.liked);
countEl.textContent = json.data.likesCount ?? 0;
// 🔥 correction N°1

    } catch (err) {
        // ❌ rollback
        btn.classList.toggle("active", wasLiked);
        countEl.textContent = current;
    }

    setTimeout(() => btn.classList.remove("processing"), 300);
},


    // 🔗 Partage
    shareVideo(videoId) {
        const url = `${window.location.origin}/watch?video=${videoId}`;

        if (navigator.share) {
            navigator.share({ title: "Regarde cette vidéo", url })
                .catch(() => {});
        } else {
            navigator.clipboard.writeText(url)
                .then(() => alert("Lien copié !"))
                .catch(() => alert("Copie impossible"));
        }
    },

    // 🔁 Auto-play
    setupAutoPlay() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const video = entry.target;
                if (entry.isIntersecting) video.play().catch(() => {});
                else video.pause();
            });
        }, { threshold: 0.6 });

        document.querySelectorAll(".video-element").forEach(video => observer.observe(video));
    },

    escapeHtml(str) {
        if (!str) return "";
        return str.replace(/&/g, "&amp;")
                  .replace(/</g, "&lt;")
                  .replace(/>/g, "&gt;");
    }
};
