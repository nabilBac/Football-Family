// /static/app/js/services/websocket.service.js

export const WebSocketService = {
    stompClient: null,
    connected: false, // ✅ RENOMMÉ (était "isConnected")
    reconnectAttempts: 0,
    maxReconnectAttempts: 5,
    reconnectDelay: 3000,

    subscriptions: new Map(),
    pendingSubscriptions: [],
    activeCallbacks: new Map(),

    // ✅ NOUVELLE MÉTHODE (fonction au lieu de propriété)
    isConnected() {
        return this.connected && this.stompClient?.connected;
    },

    // ✅ INITIALISATION (à appeler une fois dans feed.js)
    init() {
        // Écouter visibilité page
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                console.log("👁️ Page cachée, maintien connexion");
            } else {
                console.log("👁️ Page visible, vérification connexion");
                if (!this.connected) { // ✅ CHANGÉ
                    this.connect();
                }
            }
        });
    },

    connect() {
        if (this.connected) { // ✅ CHANGÉ
            console.log("✅ WebSocket déjà connecté");
            return Promise.resolve();
        }

        return new Promise((resolve, reject) => {
            try {
                const socket = new SockJS('/ws');
                this.stompClient = Stomp.over(socket);
                this.stompClient.debug = null;

                // ✅ HEARTBEAT pour détecter déconnexion
                this.stompClient.heartbeat.outgoing = 20000; // 20s
                this.stompClient.heartbeat.incoming = 20000; // 20s

                window.stompClient = this.stompClient;

                this.stompClient.connect({}, () => {
                    console.log("✅ WebSocket connecté (likes + commentaires)");
                    this.connected = true; // ✅ CHANGÉ
                    this.reconnectAttempts = 0;

                    // ✅ RÉABONNER tous les callbacks sauvegardés (après reconnexion)
                    this.activeCallbacks.forEach((callback, topic) => {
                        if (!this.subscriptions.has(topic)) {
                            this._performSubscription(topic, callback);
                        }
                    });

                    // ✅ ABONNER tout ce qui était en attente
                    this.pendingSubscriptions.forEach(sub => {
                        this._performSubscription(sub.topic, sub.callback);
                    });
                    this.pendingSubscriptions = [];

                    resolve();
                }, (error) => {
                    console.error("❌ Erreur WebSocket:", error);
                    this.connected = false; // ✅ CHANGÉ
                    
                    // ✅ RECONNEXION AUTOMATIQUE
                    this._attemptReconnect();
                    
                    reject(error);
                });

            } catch (err) {
                console.error("❌ Impossible de créer WebSocket:", err);
                reject(err);
            }
        });
    },

    // ✅ RECONNEXION AUTOMATIQUE avec backoff exponentiel
    _attemptReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error("❌ WebSocket: nombre max de reconnexions atteint");
            return;
        }

        this.reconnectAttempts++;
        const delay = this.reconnectDelay * this.reconnectAttempts;
        
        console.log(`🔄 Tentative de reconnexion ${this.reconnectAttempts}/${this.maxReconnectAttempts} dans ${delay/1000}s...`);

        setTimeout(() => {
            this.connect().catch(() => {
                // Retry handled by _attemptReconnect if needed
            });
        }, delay);
    },

    subscribeLikes(videoId, callback) {
        const topic = `/topic/video/${videoId}/likes`;

        // ✅ SAUVEGARDER callback pour reconnexion
        this.activeCallbacks.set(topic, callback);

        // Déjà abonné ? On skip
        if (this.subscriptions.has(topic)) return;

        if (!this.connected) { // ✅ CHANGÉ
            console.warn(`⏳ WebSocket pas prêt → mise en attente: ${topic}`);
            this.pendingSubscriptions.push({ topic, callback });
            return;
        }

        this._performSubscription(topic, callback);
    },

    subscribeComments(videoId, callback) {
        const topic = `/topic/video/${videoId}/comments`;

        // ✅ SAUVEGARDER callback pour reconnexion
        this.activeCallbacks.set(topic, callback);

        if (this.subscriptions.has(topic)) return;

        if (!this.connected) { // ✅ CHANGÉ
            console.warn(`⏳ WebSocket pas prêt → mise en attente: ${topic}`);
            this.pendingSubscriptions.push({ topic, callback });
            return;
        }

        this._performSubscription(topic, callback);
    },

    subscribeStats(videoId, callback) {
        const topic = `/topic/video/${videoId}`;

        // ✅ SAUVEGARDER callback pour reconnexion
        this.activeCallbacks.set(topic, callback);

        if (this.subscriptions.has(topic)) return;

        if (!this.connected) { // ✅ CHANGÉ
            console.warn(`⏳ WebSocket pas prêt → mise en attente: ${topic}`);
            this.pendingSubscriptions.push({ topic, callback });
            return;
        }

        this._performSubscription(topic, callback);
    },

    // 🔥 Fonction interne réelle de souscription
    _performSubscription(topic, callback) {
        try {
            const sub = this.stompClient.subscribe(topic, (message) => {
                try {
                    const data = JSON.parse(message.body);
                    callback(data);
                } catch (err) {
                    console.error("❌ Erreur parsing WebSocket message:", err);
                }
            });

            this.subscriptions.set(topic, sub);
            console.log(`🟦 Abonné à ${topic}`);
        } catch (err) {
            console.error("❌ Erreur souscription:", err);
        }
    },

    disconnect() {
        this.subscriptions.forEach(sub => sub.unsubscribe());
        this.subscriptions.clear();
        this.pendingSubscriptions = [];
        // ✅ NE PAS clear activeCallbacks (permet reconnexion)

        if (this.stompClient && this.connected) { // ✅ CHANGÉ
            this.stompClient.disconnect();
            this.connected = false; // ✅ CHANGÉ
            window.stompClient = null;
            console.log("🔌 WebSocket déconnecté");
        }
    },

    // ✅ DÉCONNEXION COMPLÈTE (quitter l'app définitivement)
    disconnectFull() {
        this.disconnect();
        this.activeCallbacks.clear();
        this.reconnectAttempts = this.maxReconnectAttempts;
        console.log("🔌 WebSocket déconnecté définitivement");
    }
};