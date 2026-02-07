// /static/app/js/services/feed.service.js
import { Auth } from "../auth.js";

export const FeedService = {

    state: {
        page: 0,
        lastPage: false,
        loading: false,
        cache: new Map(),
        currentRequest: null,
        abortController: null
    },

    reset(clearCache = false) {
        this.state.page = 0;
        this.state.lastPage = false;
        this.state.loading = false;

        if (this.state.abortController) {
            this.state.abortController.abort();
            this.state.abortController = null;
        }

        this.state.currentRequest = null;

        if (clearCache) {
            this.state.cache.clear();
        }
    },

    async loadNextPage() {
        if (this.state.currentRequest) {
            console.log("⏳ Requête déjà en cours");
            return this.state.currentRequest;
        }

        if (this.state.lastPage) {
            console.log("✋ Plus de vidéos");
            return [];
        }

        const pageToLoad = this.state.page;

        // Cache
        if (this.state.cache.has(pageToLoad)) {
            console.log(`💾 Cache: page ${pageToLoad}`);
            this.state.page++;
            return this.state.cache.get(pageToLoad);
        }

        // Fetch
        this.state.currentRequest = this._fetchPage(pageToLoad);

        try {
            const videos = await this.state.currentRequest;
            
            if (videos.length > 0) {
                this.state.page++;
            } else {
                this.state.lastPage = true;
            }
            
            return videos;
        } finally {
            this.state.currentRequest = null;
        }
    },

    async _fetchPage(pageNum, retries = 3) {
        this.state.loading = true;

        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                this.state.abortController = new AbortController();
                const signal = this.state.abortController.signal;

                const timeoutId = setTimeout(() => {
                    if (this.state.abortController) {
                        this.state.abortController.abort();
                    }
                }, 10000);

                const res = await Auth.secureFetch(
                    `/api/videos/feed?page=${pageNum}`,
                    { method: "GET", signal }
                );

                clearTimeout(timeoutId);

                if (!res.ok) {
                    if (res.status >= 500 && attempt < retries) {
                        await this._delay(1000 * attempt);
                        continue;
                    }
                    console.error("❌ Erreur API:", res.status);
                    this.state.loading = false;
                    return [];
                }

                const json = await res.json();
                const videos = json.data || [];

                if (videos.length === 0) {
                    this.state.lastPage = true;
                    this.state.loading = false;
                    return [];
                }

                // Cache
                this.state.cache.set(pageNum, videos);

                if (this.state.cache.size > 10) {
                    const oldestKey = this.state.cache.keys().next().value;
                    this.state.cache.delete(oldestKey);
                }

                this.state.loading = false;

                console.log(`✅ Page ${pageNum}: ${videos.length} vidéos`);
                return videos;

            } catch (err) {
                if (err.name === 'AbortError') {
                    console.log("🛑 Annulé");
                    this.state.loading = false;
                    return [];
                }

                if (attempt < retries) {
                    await this._delay(1000 * attempt);
                    continue;
                }

                console.error("❌ Erreur finale:", err);
                this.state.loading = false;
                return [];
            }
        }

        this.state.loading = false;
        return [];
    },

    _delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    async prefetchNextPage() {
        const nextPage = this.state.page;
        if (this.state.cache.has(nextPage) || this.state.lastPage) return;

        console.log(`🔮 Prefetch: ${nextPage}`);
        try {
            const videos = await this._fetchPage(nextPage, 1);
            if (videos.length > 0) {
                this.state.cache.set(nextPage, videos);
            }
        } catch (err) {
            console.warn("⚠️ Prefetch fail:", err);
        }
    },

    invalidateCache() {
        console.log("🔄 Cache invalidé");
        this.state.cache.clear();
        this.reset();
    }
};