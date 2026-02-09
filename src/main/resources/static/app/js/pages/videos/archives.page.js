import { Auth } from "../../auth.js";

export const Page = {
    render() {
        return `
        <div class="live-archives-page">
            <header class="live-header">
                <h1>🎬 Replays</h1>
                <button class="live-back-btn" data-link href="/hub">⬅ Retour au hub</button>
            </header>

            <main class="live-list-main">
                <p class="no-live">
                    Les replays arrivent bientôt !<br>
                    Tu pourras revoir les meilleurs lives ici.
                </p>
            </main>
        </div>
        `;
    },

    init() {
        Auth.requireAuth();
    }
};

