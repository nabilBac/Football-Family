import { initFeed, cleanupFeed } from "../../feed.js";

export function render() {
    return `
        <main class="main-content-scrollable">
            <div id="video-container"></div>
            <div id="loader" class="loader"></div>
        </main>
    `;
}

export function init() {
    initFeed();
}

// ✅ NOUVEAU : Export de la fonction cleanup
export function cleanup() {
    cleanupFeed();
}