// /app/js/pages/feed/feed.comments.js
import { Auth } from "../../auth.js";

export const Comments = {

    // -----------------------------------------------------
    // 🔵 STATE LOCAL
    // -----------------------------------------------------
    state: {
        page: 0,
        loading: false,
        lastPage: false,
        videoId: null
    },

    // -----------------------------------------------------
    // 🔵 OUVERTURE DE LA MODALE
    // -----------------------------------------------------
    initModal(videoId) {
        const modal = document.getElementById("comments-modal");
        const list = document.getElementById("comments-list");
        const input = document.getElementById("comments-input-field");
        const sendBtn = document.getElementById("comments-send-btn");
        const backdrop = modal.querySelector(".comments-backdrop");
        const closeBtn = document.getElementById("comments-close-btn");
        const panel = modal.querySelector(".comments-panel");

        // Reset de la modale
        list.innerHTML = "";
        input.value = "";

        this.state = {
            page: 0,
            loading: false,
            lastPage: false,
            videoId
        };

        modal.classList.add("open");

        // 🔵 Activation WebSocket Live
        this.initWebSocket(videoId);

        // 🔵 Chargement page initiale
        this.loadPage(0);

        // -----------------------------------------------------
        // 🔵 Scroll infini
        // -----------------------------------------------------
        list.onscroll = async () => {
            if (this.state.loading || this.state.lastPage) return;
            const bottom = list.scrollTop + list.clientHeight >= list.scrollHeight - 80;
            if (bottom) this.loadPage(this.state.page + 1);
        };

        // -----------------------------------------------------
        // 🔵 Fermeture animée
        // -----------------------------------------------------
        const closeModal = () => {
            panel.style.animation = "none";
            panel.offsetHeight; 
            panel.style.animation = "";
            panel.classList.add("close-animation");

            setTimeout(() => {
                panel.classList.remove("close-animation");
                modal.classList.remove("open");
                panel.style.transform = "";
            }, 250);
        };

        backdrop.onclick = closeModal;
        closeBtn.onclick = closeModal;

        // Swipe pour fermer
        this.enableSwipeToClose(panel, modal, closeModal);

        sendBtn.onclick = () => this.sendComment();
    },

    // -----------------------------------------------------
    // 🔵 ENVOYER UN COMMENTAIRE - ✅ CORRIGÉ
    // -----------------------------------------------------
    async sendComment() {
        const input = document.getElementById("comments-input-field");
        const text = input.value.trim();
        if (!text) return;

        const res = await Auth.secureFetch(
            `/api/videos/${this.state.videoId}/comments`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"  // ✅ AJOUTÉ
                },
                body: JSON.stringify({ content: text })
            }
        );

        if (!res.ok) {
            alert("Erreur d'envoi");
            return;
        }

        input.value = "";

        // Pas besoin de rafraîchir — WebSocket s'en charge ✔
        const list = document.getElementById("comments-list");
        list.innerHTML = "";

        this.state = {
            page: 0,
            loading: false,
            lastPage: false,
            videoId: this.state.videoId
        };

        await this.loadPage(0);
        list.scrollTop = list.scrollHeight;
    },

    // -----------------------------------------------------
    // 🔵 CHARGER UNE PAGE DE COMMENTAIRES
    // -----------------------------------------------------
    async loadPage(page) {
        this.state.loading = true;
        const list = document.getElementById("comments-list");

        const res = await Auth.secureFetch(
            `/api/videos/${this.state.videoId}/comments?page=${page}&size=5`
        );

        if (!res.ok) {
            this.state.loading = false;
            return;
        }

        const json = await res.json();
        const comments = json.data?.comments || [];
        const total = json.data?.totalCount || 0;

        if (comments.length === 0) {
            this.state.lastPage = true;
            this.state.loading = false;
            return;
        }

        const html = comments.map(c => `
            <div class="comment" data-id="${c.id}">
                <div class="comment-header">
                    <i class="fa-regular fa-user"></i>
                    <span class="comment-username">@${c.authorUsername}</span>
                    <span class="comment-date">${new Date(c.createdAt).toLocaleString()}</span>
                </div>
                <div class="comment-content">${c.content}</div>
            </div>
        `).join("");

        if (page === 0) {
            list.innerHTML = html;
            list.scrollTop = list.scrollHeight;
        } else {
            list.insertAdjacentHTML("beforeend", html);
        }

        this.state.page = page;

        if ((page + 1) * 5 >= total) {
            this.state.lastPage = true;
        }

        if (list.scrollHeight <= list.clientHeight && !this.state.lastPage) {
            this.loadPage(this.state.page + 1);
        }

        this.state.loading = false;
    },

    // -----------------------------------------------------
    // 🔵 SWIPE POUR FERMER LA MODALE
    // -----------------------------------------------------
    enableSwipeToClose(panel, modal, closeModal) {
        let startY = 0;
        let isDragging = false;

        const start = (e) => {
            isDragging = true;
            startY = e.touches ? e.touches[0].clientY : e.clientY;
            panel.style.transition = "none";
        };

        const move = (e) => {
            if (!isDragging) return;
            const currentY = e.touches ? e.touches[0].clientY : e.clientY;
            const diff = currentY - startY;
            if (diff > 0) panel.style.transform = `translateY(${diff}px)`;
        };

        const end = (e) => {
            if (!isDragging) return;
            isDragging = false;

            const currentY = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;
            const diff = currentY - startY;

            panel.style.transition = "transform 0.25s ease";

            if (diff > 120) {
                panel.style.transform = "translateY(100%)";
                setTimeout(() => closeModal(), 200);
            } else {
                panel.style.transform = "translateY(0)";
            }
        };

        panel.addEventListener("mousedown", start);
        panel.addEventListener("mousemove", move);
        panel.addEventListener("mouseup", end);

        panel.addEventListener("touchstart", start);
        panel.addEventListener("touchmove", move);
        panel.addEventListener("touchend", end);
    },

    // =====================================================================
    // 🔵 WEBSOCKET : ABONNEMENT AU LIVE COMMENTAIRE
    // =====================================================================
    initWebSocket(videoId) {

        if (!window.stompClient) {
            console.warn("⚠️ stompClient introuvable → Live comments désactivé.");
            return;
        }

        const topic = `/topic/video/${videoId}/comments`;
        console.log("🟦 WebSocket Sub:", topic);

        window.stompClient.subscribe(topic, (msg) => {
            const payload = JSON.parse(msg.body);

            switch (payload.action) {
                case "CREATED":
                    this.addCommentLive(payload.comment);
                    break;

                case "UPDATED":
                    this.updateCommentLive(payload.comment);
                    break;

                case "DELETED":
                    this.removeCommentLive(payload.commentId);
                    break;
            }
        });
    },

    // =====================================================================
    // 🔵 INSÉRER UN COMMENTAIRE EN LIVE
    // =====================================================================
    addCommentLive(comment) {
        const list = document.getElementById("comments-list");
        if (!list) return;

        const html = `
            <div class="comment" data-id="${comment.id}">
                <div class="comment-header">
                    <i class="fa-regular fa-user"></i>
                    <span class="comment-username">@${comment.authorUsername}</span>
                    <span class="comment-date">${new Date(comment.createdAt).toLocaleString()}</span>
                </div>
                <div class="comment-content">${comment.content}</div>
            </div>
        `;

        list.insertAdjacentHTML("beforeend", html);
        list.scrollTop = list.scrollHeight;
    },

    // =====================================================================
    // 🔵 MODIFIER UN COMMENTAIRE EN LIVE
    // =====================================================================
    updateCommentLive(comment) {
        const node = document.querySelector(`.comment[data-id="${comment.id}"]`);
        if (!node) return;

        node.querySelector(".comment-content").textContent = comment.content;

        if (comment.updatedAt) {
            node.querySelector(".comment-date").textContent =
                new Date(comment.updatedAt).toLocaleString();
        }
    },

    // =====================================================================
    // 🔵 SUPPRIMER UN COMMENTAIRE EN LIVE
    // =====================================================================
    removeCommentLive(commentId) {
        const node = document.querySelector(`.comment[data-id="${commentId}"]`);
        if (node) node.remove();
    }

};