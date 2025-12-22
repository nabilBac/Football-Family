// /static/app/js/services/websocket.service.js

export const WebSocketService = {
    stompClient: null,
    isConnected: false,

    subscriptions: new Map(),
    pendingSubscriptions: [],   // 🔥 NOUVEAU

    connect() {
        if (this.isConnected) {
            console.log("✅ WebSocket déjà connecté");
            return Promise.resolve();
        }

        return new Promise((resolve, reject) => {
            try {
                const socket = new SockJS('/ws');
                this.stompClient = Stomp.over(socket);
                this.stompClient.debug = null;

                window.stompClient = this.stompClient;

                this.stompClient.connect({}, () => {
                    console.log("✅ WebSocket connecté (likes + commentaires)");
                    this.isConnected = true;

                    // 🔥 ABONNER TOUT CE QUI ÉTAIT EN ATTENTE
                    this.pendingSubscriptions.forEach(sub => {
                        this._performSubscription(sub.topic, sub.callback);
                    });
                    this.pendingSubscriptions = [];

                    resolve();
                }, (error) => {
                    console.error("❌ Erreur WebSocket:", error);
                    this.isConnected = false;
                    reject(error);
                });

            } catch (err) {
                console.error("❌ Impossible de créer WebSocket:", err);
                reject(err);
            }
        });
    },

    subscribeLikes(videoId, callback) {
        const topic = `/topic/video/${videoId}/likes`;

        // Déjà abonné ? On skip
        if (this.subscriptions.has(topic)) return;

        if (!this.isConnected) {
            console.warn(`⏳ WebSocket pas prêt → mise en attente: ${topic}`);
            this.pendingSubscriptions.push({ topic, callback });
            return;
        }

        this._performSubscription(topic, callback);
    },

    subscribeComments(videoId, callback) {
        const topic = `/topic/video/${videoId}/comments`;

        if (this.subscriptions.has(topic)) return;

        if (!this.isConnected) {
            console.warn(`⏳ WebSocket pas prêt → mise en attente: ${topic}`);
            this.pendingSubscriptions.push({ topic, callback });
            return;
        }

        this._performSubscription(topic, callback);
    },

    // 🔥 Fonction interne réelle de souscription
    _performSubscription(topic, callback) {
        const sub = this.stompClient.subscribe(topic, (message) => {
            const data = JSON.parse(message.body);
            callback(data);
        });

        this.subscriptions.set(topic, sub);
        console.log(`🟦 Abonné à ${topic}`);
    },

    disconnect() {
        this.subscriptions.forEach(sub => sub.unsubscribe());
        this.subscriptions.clear();
        this.pendingSubscriptions = [];

        if (this.stompClient && this.isConnected) {
            this.stompClient.disconnect();
            this.isConnected = false;
            window.stompClient = null;
            console.log("🔌 WebSocket déconnecté");
        }
    },

subscribeStats(videoId, callback) {
    const topic = `/topic/video/${videoId}`;

    if (this.subscriptions.has(topic)) return;

    if (!this.isConnected) {
        console.warn(`⏳ WebSocket pas prêt → mise en attente: ${topic}`);
        this.pendingSubscriptions.push({ topic, callback });
        return;
    }

    this._performSubscription(topic, callback);
}

    
};


