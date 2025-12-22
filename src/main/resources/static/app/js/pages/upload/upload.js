import { Auth } from "../../auth.js";

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

    init() {
        const form = document.getElementById("uploadForm");
        const loader = document.getElementById("uploadLoader");
        const toast = document.getElementById("toast");

        form.addEventListener("submit", async (e) => {
            e.preventDefault();

            loader.style.display = "block";   // 🔥 Afficher loader

            const formData = new FormData(form);
            const res = await Auth.secureFetch("/api/videos/upload", {
                method: "POST",
                body: formData
            });

            loader.style.display = "none";   // ❌ Cacher loader

            if (!res.ok) {
                toast.textContent = "❌ Erreur upload";
                toast.style.background = "#ff4444";
                showToast();
                return;
            }

            form.reset(); // 🔄 Reset des champs
            toast.textContent = "Vidéo uploadée 🎉";
            showToast();
        });

        function showToast() {
            toast.classList.add("show");
            setTimeout(() => toast.classList.remove("show"), 2000);
        }
    }
};
