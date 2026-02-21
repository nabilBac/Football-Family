import { initFeed, cleanupFeed } from "../../feed.js";
import { initTopbar, hideTopbar } from "../../components/navbar.js";

export function render() {
    return `
        <main class="main-content-scrollable">
            <div id="video-container"></div>
            <div id="loader" class="loader"></div>
        </main>
    `;
}

export function init() {
    // Active la classe feed sur le body pour la navbar transparente
    document.body.classList.add('is-feed-page');

    initFeed();
    initTopbar();
}

export function cleanup() {
    document.body.classList.remove('is-feed-page');
    hideTopbar();
    cleanupFeed();
}