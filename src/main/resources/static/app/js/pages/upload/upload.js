import { Auth } from "../../auth.js";
import { FeedService } from "../../services/feed.service.js";

export const UploadPage = {
    render() {
        // Charger CSS proprement
        if (!document.querySelector('link[href="/css/upload.css"]')) {
            const link = document.createElement("link");
            link.rel = "stylesheet";
            link.href = "/css/upload.css";
            document.head.appendChild(link);
        }

        return `
            <div class="upload-page">
                <h1 class="upload-title">
                    <i class="fa-solid fa-cloud-arrow-up"></i>
                    Upload Your Goal
                </h1>

                <form id="uploadForm">

                    <div class="upload-group">
                        <label>Titre</label>
                        <input type="text" name="title" class="upload-input" required>
                    </div>

                    <div class="upload-group">
                        <label>Catégorie</label>
                        <select name="category" class="upload-select" required>
                            <option value="Match">⚽ Match</option>
                            <option value="Technique">🎯 Technique</option>
                            <option value="Freestyle">🤹 Freestyle</option>
                        </select>
                    </div>

                    <div class="upload-group">
                        <label>Vidéo</label>
                        <input type="file" name="file" class="upload-input" accept="video/*" required>
                    </div>

                    <button type="submit" class="upload-btn">Uploader</button>

                    <div id="uploadLoader" class="upload-loader">
                        ⏳ Upload en cours...
                    </div>
                </form>
            </div>

            <div id="toast" class="toast">Vidéo uploadée 🎉</div>
        `;
    },

   async init() {

               const ok = await Auth.requireAuth();
            if (!ok) return;



        const form = document.getElementById("uploadForm");
        const loader = document.getElementById("uploadLoader");
        const toast = document.getElementById("toast");

        form.addEventListener("submit", async (e) => {
            e.preventDefault();

            loader.style.display = "block";

            const formData = new FormData(form);
            const res = await Auth.secureFetch("/api/videos/upload", {
                method: "POST",
                body: formData
            });

            loader.style.display = "none";

            if (!res.ok) {
                toast.textContent = "❌ Erreur upload";
                toast.style.background = "#ff4444";
                showToast();
                return;
            }

            // ✅ 1. INVALIDER LE CACHE FEEDSERVICE
            console.log("🧹 Invalidation FeedService...");
            FeedService.invalidateCache();

            // ✅ 2. INVALIDER TOUS LES CACHES SERVICE WORKER
            console.log("🧹 Invalidation Service Worker...");
            if ('caches' in window) {
                caches.keys().then(cacheNames => {
                    cacheNames.forEach(cacheName => {
                        caches.delete(cacheName);
                        console.log(`🗑️ Cache supprimé: ${cacheName}`);
                    });
                });
            }

            // ✅ 3. FORCER LE SERVICE WORKER À SE RÉACTIVER
            if (navigator.serviceWorker && navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage({
                    action: 'cleanOldCaches'
                });
            }

            form.reset();
            
            toast.textContent = "✅ Vidéo uploadée ! Redirection vers ton profil...";
            toast.style.background = "#10B981";
            showToast();

            // ✅ 4. REDIRECTION VERS PROFIL AVEC TIMESTAMP (force refresh)
            setTimeout(() => {
                window.location.href = '/profile?refresh=' + Date.now();
            }, 1500);
        });

        function showToast() {
            toast.classList.add("show");
            setTimeout(() => toast.classList.remove("show"), 3000);
        }
    }
};