// /app/js/pages/videos/go-live.page.js - STYLES FORCÉS EN JS
import { Auth } from "/app/js/auth.js";
import { Router } from "/app/js/router.js";


export function render() {
    return `
    <div class="live-page">
        <div id="liveBanner">
            <div id="liveAvatar">
                <img src="/images/streamer.jpg" alt="profil streamer">
                <span id="connectionDot" class="online"></span>
            </div>
            <span id="liveText">🔴 LIVE – 0 spectateur</span>
        </div>

        <div class="live-video-wrapper">
            <video id="localVideo" autoplay playsinline muted></video>
            <div id="chatOverlay"></div>
        </div>

        <form id="chatForm">
            <input id="chatInput" placeholder="💬 Écris un message..." />
            <button id="sendBtn" type="button">Envoyer</button>
        </form>

        <button id="startButton">🚀 Démarrer le live</button>
        <button id="endButton">🛑 Terminer le live</button>
        <button id="backButton">⬅️ Retour au hub</button>
    </div>
    `;
}

export function init() {
    Auth.requireAuth();

    setTimeout(() => {
        initWebSocket();

        setTimeout(() => {
            const navbar = document.querySelector('.mobile-navbar');
if (navbar) {
    navbar.style.visibility = 'hidden';
    navbar.style.pointerEvents = 'none';
}


            const postGoalBtn = document.querySelector('.gc-post-btn');
            if (postGoalBtn) postGoalBtn.style.display = 'none';
        }, 300);
    }, 100);
}

function initWebSocket() {
    let socket;
    try {
        socket = new SockJS('/ws');
    } catch (err) {
        alert("Connexion WebSocket impossible !");
        return;
    }

    const stompClient = Stomp.over(socket);
    stompClient.debug = null;

    stompClient.connect(
        {},
        () => {
            console.log("✅ WebSocket connecté (streamer)");
            initLive(stompClient, socket);
        },
        () => alert("Impossible de se connecter au WebSocket.")
    );
}

function initLive(stompClient, socket) {
    const localVideo = document.getElementById("localVideo");
    const chatOverlay = document.getElementById("chatOverlay");
    const chatInput = document.getElementById("chatInput");
    const startButton = document.getElementById("startButton");
    const endButton = document.getElementById("endButton");
    const backButton = document.getElementById("backButton");
    const liveText = document.getElementById("liveText");

    // ✅ FORCER LES STYLES DE L'OVERLAY
    function applyOverlayStyles() {
        chatOverlay.style.cssText = `
            position: fixed !important;
            bottom: 120px !important;
            left: 50% !important;
            transform: translateX(-50%) !important;
            width: 90% !important;
            max-width: 600px !important;
            display: flex !important;
            flex-direction: column !important;
            gap: 12px !important;
            pointer-events: none !important;
            z-index: 100 !important;
            max-height: 500px !important;
            overflow: visible !important;
            background: transparent !important;
        `;
        console.log("✅ Styles overlay streamer appliqués:", window.getComputedStyle(chatOverlay).bottom);
    }

    applyOverlayStyles();
    setTimeout(applyOverlayStyles, 100);
    setTimeout(applyOverlayStyles, 500);

    const currentUser = Auth.currentUser?.username || "Streamer";

    const pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
    });

    window.pc = pc;

    let currentLiveId = null;
    let destroyed = false;
    let localStream = null;

    const MAX_VISIBLE_MESSAGES = 5;
    const MESSAGE_DURATION = 15000;
    const chatMessages = [];

    function cleanupStreamer() {
        if (destroyed) return;
        destroyed = true;

        console.log("🧹 CLEANUP STREAMER");

        try { pc.close(); } catch {}
        try { stompClient.disconnect(); } catch {}
        try { socket.close(); } catch {}

        if (localStream) {
            localStream.getTracks().forEach(t => t.stop());
            localStream = null;
        }

        if (localVideo.srcObject) {
            localVideo.srcObject = null;
        }

        window.removeEventListener("beforeunload", beforeUnloadHandler);
    }

    function beforeUnloadHandler() {
        if (currentLiveId) {
            try {
                navigator.sendBeacon(`/api/live/end/${currentLiveId}`);
            } catch {}
        }
        cleanupStreamer();
    }

    window.addEventListener("beforeunload", beforeUnloadHandler);

    pc.onicecandidate = (e) => {
        if (e.candidate && currentLiveId) {
            stompClient.send("/app/signal", {}, JSON.stringify({
                from: "streamer",
                liveId: currentLiveId,
                type: "candidate",
                data: e.candidate
            }));
        }
    };

    pc.oniceconnectionstatechange = () => {
        console.log("🔗 ICE State (streamer):", pc.iceConnectionState);
    };

    // ✅ FONCTION D'AFFICHAGE IDENTIQUE AU VIEWER
    function displayChatMessage(user, text) {
        console.log("💬 Nouveau message:", user, text);
        
        const div = document.createElement("div");
        
      div.style.cssText = `
    padding: 8px 12px !important;
    border-radius: 14px !important;
    font-size: 14px !important;
    font-weight: 500 !important;
    max-width: 65% !important;
    word-wrap: break-word !important;
    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.4) !important;
    margin-bottom: 8px !important;
    pointer-events: auto !important;
    opacity: 1 !important;
    transition: all 0.6s ease-out !important;
    transform: translateY(0) scale(1) !important;
    color: white !important;
`;

        
        if (user === currentUser) {
            div.style.background = 'rgba(16, 185, 129, 0.98)';
        } else {
            div.style.background = 'rgba(37, 99, 235, 0.98)';
        }
        
        div.innerHTML = `<strong style="margin-right: 8px;">${user}:</strong><span>${text}</span>`;
        div.style.animation = 'slideInUp 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)';
        
        chatOverlay.appendChild(div);
        chatMessages.push(div);
        
        if (chatMessages.length > MAX_VISIBLE_MESSAGES) {
            const oldestMessage = chatMessages.shift();
            oldestMessage.style.opacity = '0';
            oldestMessage.style.transform = 'translateY(-30px) scale(0.9)';
            setTimeout(() => {
                if (oldestMessage.parentNode) {
                    oldestMessage.remove();
                }
            }, 600);
        }
        
        setTimeout(() => {
            if (div.parentNode && chatMessages.includes(div)) {
                div.style.opacity = '0';
                div.style.transform = 'translateY(-30px) scale(0.9)';
                setTimeout(() => {
                    if (div.parentNode) {
                        div.remove();
                    }
                    const index = chatMessages.indexOf(div);
                    if (index > -1) {
                        chatMessages.splice(index, 1);
                    }
                }, 600);
            }
        }, MESSAGE_DURATION);
    }

    // Ajouter l'animation CSS
    if (!document.getElementById('chat-animations')) {
        const style = document.createElement('style');
        style.id = 'chat-animations';
        style.textContent = `
            @keyframes slideInUp {
                from {
                    opacity: 0;
                    transform: translateY(40px) scale(0.85);
                }
                to {
                    opacity: 1;
                    transform: translateY(0) scale(1);
                }
            }
        `;
        document.head.appendChild(style);
    }

    function subscribeChat(liveId) {
        stompClient.subscribe(`/topic/chat/${liveId}`, (msg) => {
            const data = JSON.parse(msg.body);
            displayChatMessage(data.user, data.text);
        });
    }

    function subscribeSignals(liveId) {
        stompClient.subscribe(`/topic/signal/${liveId}`, async (msg) => {
            const m = JSON.parse(msg.body);

            if (m.from === "viewer" && m.type === "REQUEST_OFFER") {
                console.log("👀 REQUEST_OFFER reçu");
                try {
                    const offer = await pc.createOffer();
                    await pc.setLocalDescription(offer);

                    stompClient.send("/app/signal", {}, JSON.stringify({
                        from: "streamer",
                        liveId,
                        type: "offer",
                        data: offer
                    }));
                    console.log("📤 Nouvelle offre envoyée");
                } catch (err) {
                    console.error("❌ Erreur:", err);
                }
                return;
            }

            if (m.from === "viewer" && m.type === "answer") {
                console.log("📥 Réponse viewer reçue");
                try {
                    await pc.setRemoteDescription(new RTCSessionDescription(m.data));
                } catch (err) {
                    console.error("❌ Erreur:", err);
                }
                return;
            }

            if (m.from === "viewer" && m.type === "candidate") {
                try { 
                    await pc.addIceCandidate(new RTCIceCandidate(m.data)); 
                } catch (err) {
                    console.error("❌ Erreur:", err);
                }
                return;
            }
        });
    }

 startButton.addEventListener("click", async () => {
    try {
        startButton.disabled = true;

        // 🔐 PROTECTION MOBILE OBLIGATOIRE
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            alert("🚫 Le live nécessite HTTPS sur mobile");
            startButton.disabled = false;
            return;
        }

        const response = await Auth.secureFetch("/api/live/start", {
            method: "POST",
            body: JSON.stringify({ title: "Live", description: "Demo Live" })
        });

        const data = await response.json();
        currentLiveId = data.data.id;

        console.log("🎯 Live ID =", currentLiveId);

        liveText.textContent = "🟢 EN DIRECT";
        liveText.style.color = "#22c55e";

        subscribeChat(currentLiveId);
        subscribeSignals(currentLiveId);

        // 🎥 ACCÈS CAMÉRA / MICRO
        localStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
        });

        localVideo.srcObject = localStream;
        localStream.getTracks().forEach(t => pc.addTrack(t, localStream));

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        console.log("✅ Offre initiale créée et prête");

    } catch (err) {
        console.error("❌ Erreur démarrage live :", err);
        alert("Erreur démarrage live : " + err.message);
        startButton.disabled = false;
    }
});


   endButton.addEventListener("click", async () => {
    if (!currentLiveId) return;

    await Auth.secureFetch(`/api/live/end/${currentLiveId}`, { method: "POST" });

    stompClient.send("/app/signal", {}, JSON.stringify({
        from: "streamer",
        liveId: currentLiveId,
        type: "LIVE_ENDED"
    }));

    liveText.textContent = "🛑 LIVE TERMINÉ";
    liveText.style.color = "#f33";

    cleanupStreamer();

    // ⭐️ FIX DU BOUTON + QUI RESTE CASSÉ APRÈS LE LIVE
    document.getElementById("app")?.classList.remove("is-live-page");

    setTimeout(() => (window.location.href = "/hub"), 800);
});


  backButton.addEventListener("click", () => {
    if (currentLiveId && !confirm("Un live est en cours. Quitter ?")) return;

    cleanupStreamer();

    // 🔥 FIX NAVBAR APRES LE LIVE
    const navbar = document.querySelector(".mobile-navbar");
    if (navbar) {
        navbar.style.visibility = "";
        navbar.style.pointerEvents = "";
    }

    document.getElementById("app")?.classList.remove("is-live-page");


    Router.go("/hub");
});


    document.getElementById("sendBtn").addEventListener("click", () => {
        const text = chatInput.value.trim();
        if (!text || !currentLiveId) return;

        stompClient.send("/app/chat", {}, JSON.stringify({
            liveId: currentLiveId,
            user: currentUser,
            text
        }));

        chatInput.value = "";
    });
}