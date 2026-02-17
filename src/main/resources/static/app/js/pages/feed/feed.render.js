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
     * Create video card - VERSION SIMPLE
     */
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
  v.preload = "none"; // ✅ ne charge rien tant qu’elle n’est pas active
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
            }
        });
    },

  toggleMute(btn, videoId) {
  const card = document.querySelector(`[data-video-id="${videoId}"]`);
  if (!card) return;

  const video = card.querySelector("video");
  if (!video) return;

  video.muted = !video.muted;

  // ✅ MÉMORISE LE CHOIX UTILISATEUR (utilisé par feed.js quand il active une nouvelle vidéo)
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