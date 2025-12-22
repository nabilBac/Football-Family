// /static/app/js/services/feed.service.js
import { Auth } from "../auth.js";

export const FeedService = {

    state: {
        page: 0,
        lastPage: false,
        loading: false
    },

    reset() {
        this.state.page = 0;
        this.state.lastPage = false;
        this.state.loading = false;
    },

    async loadNextPage() {
        if (this.state.loading || this.state.lastPage) return [];

        this.state.loading = true;

        try {
            const res = await Auth.secureFetch(`/api/videos/feed?page=${this.state.page}`, {
                method: "GET"
            });

            if (!res.ok) {
                console.error("Erreur API feed:", res.status);
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

            this.state.page++;
            this.state.loading = false;

            return videos;

        } catch (err) {
            console.error("Erreur loadNextPage:", err);
            this.state.loading = false;
            return [];
        }
    }
};
