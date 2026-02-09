// /static/app/js/pages/videos/watch.page.js - SOLUTION NUCLÉAIRE
import { Auth } from "../../auth.js";

export function render({ id }) {
    return `
    <style>
        /* ✅ STYLE INLINE DANS LE HTML - PRIORITÉ ABSOLUE */
        #chatOverlay {
            position: fixed !important;
            bottom: 150px !important;
            left: 50% !important;
            transform: translateX(-50%) !important;
            width: 90% !important;
            max-width: 600px !important;
            display: flex !important;
            flex-direction: column !important;
            gap: 14px !important;
            pointer-events: none !important;
            z-index: 99999 !important;
            max-height: 550px !important;
            overflow: visible !important;
            background: transparent !important;
            right: auto !important;
            top: auto !important;
            margin: 0 !important;
            padding: 0 !important;
        }
        
      #chatOverlay .chat-message {
    padding: 8px 12px !important;    /* 🔥 plus petit */
    border-radius: 14px !important;  /* 🔥 moins arrondi */
    font-size: 14px !important;      /* 🔥 plus petit */
    max-width: 65% !important;       /* 🔥 moins large */
    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.4) !important;
    margin-bottom: 8px !important;
}
        
        #chatOverlay .chat-message.viewer-msg {
            background: rgba(37, 99, 235, 0.98) !important;
        }
        
        #chatOverlay .chat-message.streamer-msg {
            background: rgba(16, 185, 129, 0.98) !important;
        }
        
        @keyframes slideInUp {
            from {
                opacity: 0;
                transform: translateY(50px) scale(0.8);
            }
            to {
                opacity: 1;
                transform: translateY(0) scale(1);
            }
        }
    </style>
    
    <div class="live-watch-root">
        <div id="liveBanner" class="live-banner">
            <div id="liveAvatar" class="live-avatar">
                <img src="/images/streamer.jpg" alt="profil streamer">
                <span id="connectionDot" class="connection-dot offline"></span>
            </div>
            <span id="liveText" class="live-text">🔴 LIVE – 0 spectateur</span>
        </div>

        <div class="live-video-wrapper">
            <video id="remoteVideo" autoplay playsinline controls></video>
            <div id="chatOverlay"></div>
        </div>

        <form id="chatForm" class="chat-form">
            <input id="chatInput" class="chat-input" placeholder="💬 Ton message..." />
            <button id="sendBtn" class="chat-send-btn">Envoyer</button>
        </form>

        <button id="backToHubBtn" class="live-back-btn">⬅ Retour au hub</button>
    </div>
    `;
}

export function init({ id }) {
    Auth.requireAuth();

    setTimeout(() => {
        const navbar = document.querySelector('.mobile-navbar');
        if (navbar) navbar.style.display = 'none';

        const postGoalBtn = document.querySelector('.gc-post-btn');
        if (postGoalBtn) postGoalBtn.remove();
    }, 300);

    initViewer(id);
}

function initViewer(liveId) {
    const remoteVideo = document.getElementById('remoteVideo');
    const chatOverlay = document.getElementById('chatOverlay');
    const chatForm = document.getElementById('chatForm');
    const chatInput = document.getElementById('chatInput');
    const liveText = document.getElementById('liveText');
    const connectionDot = document.getElementById('connectionDot');
    const backBtn = document.getElementById('backToHubBtn');
    const sendBtn = document.getElementById('sendBtn');

    // ✅ VÉRIFIER QUE LE STYLE EST APPLIQUÉ
    setTimeout(() => {
        const bottom = window.getComputedStyle(chatOverlay).bottom;
        console.log("🎨 Position bottom après render:", bottom);
        if (bottom === '0px' || bottom === 'auto') {
            console.error("❌ LES STYLES NE SONT TOUJOURS PAS APPLIQUÉS !");
            console.error("Il y a un CSS externe qui écrase tout. Cherche dans les fichiers CSS.");
        } else {
            console.log("✅ Styles correctement appliqués !");
        }
    }, 1000);

    remoteVideo.muted = false;
    remoteVideo.playsInline = true;

    const socket = new SockJS('/ws');
    const stompClient = Stomp.over(socket);
    stompClient.debug = null;

    let pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    let remoteDescriptionSet = false;
    let queuedCandidates = [];
    let destroyed = false;
    
    const MAX_VISIBLE_MESSAGES = 5;
    const MESSAGE_DURATION = 15000;
    const chatMessages = [];

    function cleanup() {
        if (destroyed) return;
        destroyed = true;

        try { 
            if (pc) {
                pc.close(); 
                pc = null;
            }
        } catch {}
        
        try { 
            if (stompClient && stompClient.connected) {
                stompClient.disconnect(); 
            }
        } catch {}
        
        try { socket.close(); } catch {}

        if (remoteVideo.srcObject) {
            remoteVideo.srcObject.getTracks().forEach(t => t.stop());
            remoteVideo.srcObject = null;
        }

        window.removeEventListener("beforeunload", beforeUnloadHandler);
    }

    function beforeUnloadHandler() {
        try {
            if (stompClient && stompClient.connected) {
                stompClient.send("/app/viewer/leave", {}, JSON.stringify({ liveId }));
            }
        } catch {}
        cleanup();
    }
    window.addEventListener("beforeunload", beforeUnloadHandler);

    backBtn.addEventListener("click", () => {
        try {
            if (stompClient && stompClient.connected) {
                stompClient.send("/app/viewer/leave", {}, JSON.stringify({ liveId }));
            }
        } catch {}
        cleanup();
        location.href = "/hub";
    });

    pc.ontrack = (e) => {
        console.log("🎥 ontrack event");
        if (remoteVideo.srcObject !== e.streams[0]) {
            remoteVideo.srcObject = e.streams[0];
            remoteVideo.play().catch(err => {
                console.error("❌ Erreur play:", err);
            });
        }
    };

    pc.onicecandidate = (e) => {
        if (e.candidate) {
            stompClient.send("/app/signal", {}, JSON.stringify({
                from: "viewer",
                liveId,
                type: "candidate",
                data: e.candidate
            }));
        }
    };

    pc.oniceconnectionstatechange = () => {
        console.log("🔗 ICE State:", pc.iceConnectionState);
        
        if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
            connectionDot.classList.remove('offline');
            connectionDot.classList.add('online');
        } else if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
            connectionDot.classList.remove('online');
            connectionDot.classList.add('offline');
        }
    };

    function addOrQueueCandidate(c) {
        if (!c) return;
        if (remoteDescriptionSet) {
            pc.addIceCandidate(new RTCIceCandidate(c)).catch(err => {
                console.error("❌ Erreur addIceCandidate:", err);
            });
        } else {
            queuedCandidates.push(c);
        }
    }

    socket.onclose = () => {
        connectionDot.classList.add('offline');
        connectionDot.classList.remove('online');
        sendBtn.disabled = true;
    };

    // ✅ AFFICHAGE MESSAGE AVEC CLASSES CSS
    function displayChatMessage(user, text) {
        console.log("💬 Message:", user, text);
        
        const div = document.createElement("div");
        div.className = user.includes("Viewer") ? "chat-message viewer-msg" : "chat-message streamer-msg";
        
        div.innerHTML = `<strong style="margin-right: 10px; font-size: 19px;">${user}:</strong><span style="font-size: 18px;">${text}</span>`;
        
        chatOverlay.appendChild(div);
        chatMessages.push(div);
        
        console.log(`📊 ${chatMessages.length} messages visibles`);
        
        if (chatMessages.length > MAX_VISIBLE_MESSAGES) {
            const oldestMessage = chatMessages.shift();
            oldestMessage.style.opacity = '0';
            oldestMessage.style.transform = 'translateY(-40px) scale(0.9)';
            setTimeout(() => {
                if (oldestMessage.parentNode) {
                    oldestMessage.remove();
                }
            }, 600);
        }
        
        setTimeout(() => {
            if (div.parentNode && chatMessages.includes(div)) {
                div.style.opacity = '0';
                div.style.transform = 'translateY(-40px) scale(0.9)';
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

    stompClient.connect({}, () => {
        console.log("✅ WebSocket connecté (viewer)");
        sendBtn.disabled = false;

        stompClient.send("/app/viewer/join", {}, JSON.stringify({ liveId }));
        stompClient.send("/app/signal", {}, JSON.stringify({
            from: "viewer",
            liveId,
            type: "REQUEST_OFFER"
        }));

        stompClient.subscribe(`/topic/viewers/${liveId}`, (msg) => {
            const count = JSON.parse(msg.body);
            liveText.textContent = `🔴 LIVE – ${count} spectateur${count > 1 ? "s" : ""}`;
        });

        stompClient.subscribe(`/topic/signal/${liveId}`, async (msg) => {
            const m = JSON.parse(msg.body);

            if (m.type === "offer") {
                console.log("📥 Offre reçue");
                try {
                    await pc.setRemoteDescription(new RTCSessionDescription(m.data));
                    remoteDescriptionSet = true;

                    for (const candidate of queuedCandidates) {
                        await pc.addIceCandidate(new RTCIceCandidate(candidate));
                    }
                    queuedCandidates = [];

                    const answer = await pc.createAnswer();
                    await pc.setLocalDescription(answer);

                    stompClient.send("/app/signal", {}, JSON.stringify({
                        from: "viewer",
                        liveId,
                        type: "answer",
                        data: answer
                    }));
                    console.log("📤 Réponse envoyée");
                } catch (err) {
                    console.error("❌ Erreur:", err);
                }
            }

            if (m.type === "candidate") {
                addOrQueueCandidate(m.data);
            }

            if (m.type === "LIVE_ENDED") {
                cleanup();
                alert("Le live est terminé.");
                location.href = "/hub";
            }
        });

        stompClient.subscribe(`/topic/chat/${liveId}`, (msg) => {
            const data = JSON.parse(msg.body);
            displayChatMessage(data.user, data.text);
        });
    });

    chatForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const text = chatInput.value.trim();
        if (!text) return;

        stompClient.send("/app/chat", {}, JSON.stringify({
            liveId,
            user: "Viewer 👀",
            text
        }));

        chatInput.value = "";
    });
}