import { Auth } from "../../auth.js";
import { FeedService } from "../../services/feed.service.js";

export const UploadPage = {
render() {

        // ✅ Reset le flag à chaque nouveau rendu de la page
    this._initialized = false;
    // Charger CSS proprement
    if (!document.querySelector('link[href="/css/upload.css"]')) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "/css/upload.css";
        document.head.appendChild(link);
    }

    return `
        <div class="upload-page-modern">
            <!-- HEADER -->
            <div class="upload-header">
                <button class="btn-back" data-link href="/profile">
                    <i class="fas fa-arrow-left"></i>
                </button>
                <h1 class="upload-title">Nouveau clip</h1>
                <div></div>
            </div>

            <!-- CONTAINER -->
            <div class="upload-container">
                <form id="uploadForm" class="upload-form">
                    
                    <!-- VIDEO PREVIEW ZONE -->
                    <div id="dropZone" class="drop-zone">
                        <div id="dropPlaceholder" class="drop-placeholder">
                            <div class="upload-icon">
                                <i class="fas fa-cloud-upload-alt"></i>
                            </div>
                            <h3>Ajoute ta vidéo</h3>
                            <p>Glisse-dépose ou clique pour sélectionner</p>
                            <button type="button" class="btn-select-file">
                                <i class="fas fa-folder-open"></i>
                                Parcourir
                            </button>
                            <span class="file-hint">MP4, MOV, AVI • Max 500MB</span>
                        </div>

                        <!-- VIDEO PREVIEW (caché par défaut) -->
                        <div id="videoPreview" class="video-preview" style="display: none;">
                            <video id="previewVideo" controls></video>
                            <button type="button" class="btn-change-video">
                                <i class="fas fa-sync-alt"></i>
                                Changer de vidéo
                            </button>
                        </div>

                        <input type="file" id="fileInput" name="file" accept="video/*" style="display: none;" required>
                    </div>

                    <!-- FORM FIELDS -->
                    <div class="upload-fields">
                        <!-- Titre -->
                        <div class="form-field">
                            <label>
                                <i class="fas fa-heading"></i>
                                Titre de ton clip
                            </label>
                          <input 
    type="text" 
    name="title" 
    placeholder="Décris ton meilleur moment..."
    maxlength="100"
>
                            <span class="char-count">0/100</span>
                        </div>

                        <!-- Catégorie -->
                        <div class="form-field">
                            <label>
                                <i class="fas fa-tag"></i>
                                Catégorie
                            </label>
                            <div class="category-pills">
                                <label class="category-pill">
                                    <input type="radio" name="category" value="Match" checked>
                                    <span>⚽ Match</span>
                                </label>
                                <label class="category-pill">
                                    <input type="radio" name="category" value="Technique">
                                    <span>🎯 Technique</span>
                                </label>
                                <label class="category-pill">
                                    <input type="radio" name="category" value="Freestyle">
                                    <span>🤹 Freestyle</span>
                                </label>
                            </div>
                        </div>

                        <!-- Description (optionnel) -->
                        <div class="form-field">
                            <label>
                                <i class="fas fa-align-left"></i>
                                Description (optionnel)
                            </label>
                            <textarea 
                                name="description" 
                                placeholder="Ajoute des détails, hashtags..."
                                maxlength="300"
                                rows="3"
                            ></textarea>
                            <span class="char-count">0/300</span>
                        </div>
                    </div>

                    <!-- UPLOAD BUTTON -->
                    <button type="submit" class="btn-upload" disabled>
                        <i class="fas fa-rocket"></i>
                        Publier
                    </button>

                    <!-- PROGRESS BAR -->
                    <div id="uploadProgress" class="upload-progress" style="display: none;">
                        <div class="progress-info">
                            <span id="progressText">Upload en cours...</span>
                            <span id="progressPercent">0%</span>
                        </div>
                        <div class="progress-bar">
                            <div id="progressFill" class="progress-fill"></div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    `;
},
async init() {
    // 🔥 ANTI-DOUBLON : Empêche les initialisations multiples
    if (this._initialized) {
        console.warn('⚠️ UploadPage déjà initialisé, skip');
        return;
    }
    this._initialized = true;

    const ok = await Auth.requireAuth();
    if (!ok) {
        this._initialized = false; // Reset si auth échoue
        return;
    }

    const form = document.getElementById("uploadForm");
    const fileInput = document.getElementById("fileInput");
    const dropZone = document.getElementById("dropZone");
    const dropPlaceholder = document.getElementById("dropPlaceholder");
    const videoPreview = document.getElementById("videoPreview");
    const previewVideo = document.getElementById("previewVideo");
    const btnSelectFile = document.querySelector(".btn-select-file");
    const btnChangeVideo = document.querySelector(".btn-change-video");
    const btnUpload = document.querySelector(".btn-upload");
    const uploadProgress = document.getElementById("uploadProgress");
    const progressFill = document.getElementById("progressFill");
    const progressPercent = document.getElementById("progressPercent");
    const progressText = document.getElementById("progressText");

    // Character counters
    const titleInput = document.querySelector('input[name="title"]');
    const descriptionInput = document.querySelector('textarea[name="description"]');
    
    titleInput.addEventListener('input', (e) => {
        const count = e.target.value.length;
        e.target.parentElement.querySelector('.char-count').textContent = `${count}/100`;
    });

    if (descriptionInput) {
        descriptionInput.addEventListener('input', (e) => {
            const count = e.target.value.length;
            e.target.parentElement.querySelector('.char-count').textContent = `${count}/300`;
        });
    }

    // 🔥 FIX : stopPropagation pour éviter le double déclenchement
    btnSelectFile.addEventListener('click', (e) => {
        e.stopPropagation();
        fileInput.click();
    });
    
    dropZone.addEventListener('click', (e) => {
        // Ignorer si click sur un bouton
        if (e.target.closest('button')) return;
        
        if (e.target === dropZone || e.target === dropPlaceholder || e.target.closest('.drop-placeholder')) {
            fileInput.click();
        }
    });

    // Drag & drop
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0 && files[0].type.startsWith('video/')) {
            fileInput.files = files;
            handleFileSelect(files[0]);
        }
    });

    // File selected
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFileSelect(e.target.files[0]);
        }
    });

    // 🔥 FIX : stopPropagation aussi ici
  btnChangeVideo.addEventListener('click', (e) => {
    e.stopPropagation();
    fileInput.value = '';
    dropPlaceholder.style.display = 'flex';
    videoPreview.style.display = 'none';
    btnUpload.disabled = true; // ← était false, doit être true (pas de vidéo = bouton désactivé)
});

    function handleFileSelect(file) {
        const url = URL.createObjectURL(file);
        previewVideo.src = url;
        dropPlaceholder.style.display = 'none';
        videoPreview.style.display = 'block';
        btnUpload.disabled = false;
    }

    // Form submit
    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        btnUpload.disabled = true;
        uploadProgress.style.display = 'block';

        const formData = new FormData(form);

// ✅ Titre par défaut si non rempli
if (!formData.get('title') || formData.get('title').trim() === '') {
    formData.set('title', 'Mon clip');
}
        
        try {
            // Simuler progression
            let progress = 0;
            const progressInterval = setInterval(() => {
                progress += 5;
                if (progress <= 90) {
                    progressFill.style.width = progress + '%';
                    progressPercent.textContent = progress + '%';
                }
            }, 200);

            const res = await Auth.secureFetch("/api/videos/upload", {
                method: "POST",
                body: formData
            });

            clearInterval(progressInterval);
            progressFill.style.width = '100%';
            progressPercent.textContent = '100%';

            if (!res.ok) {
                throw new Error('Upload failed');
            }

            // Invalidate caches
            console.log("🧹 Invalidation FeedService...");
            FeedService.invalidateCache();

            if ('caches' in window) {
                caches.keys().then(cacheNames => {
                    cacheNames.forEach(cacheName => caches.delete(cacheName));
                });
            }

            if (navigator.serviceWorker && navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage({
                    action: 'cleanOldCaches'
                });
            }

            progressText.textContent = '✅ Vidéo publiée avec succès !';
            progressText.style.color = 'var(--primary)';

            setTimeout(() => {
                window.location.href = '/profile?uploaded=true&t=' + Date.now();
            }, 1500);

        } catch (error) {
            console.error('Upload error:', error);
            progressText.textContent = '❌ Erreur lors de l\'upload';
            progressText.style.color = 'var(--danger)';
            btnUpload.disabled = false;
        }
    });
}
};