document.addEventListener('DOMContentLoaded', () => {
    // 1. Cible le conteneur principal de toutes les vidéos
    const videoContainer = document.getElementById('video-container');

    if (!videoContainer) return; // Arrête si le conteneur n'est pas trouvé

    // 2. Gestion des clics par délégation d'événements
    videoContainer.addEventListener('click', (event) => {
        
        // Trouver la carte vidéo parente la plus proche du clic
        const videoCard = event.target.closest('.video-card');
        if (!videoCard) return;

        // --- A. Gérer l'ouverture des commentaires ---
        // Vérifie si le clic provient du bouton 'Commentaires' (fa-comment ou son parent <button>)
        const isCommentButton = event.target.closest('.actions button.comment-btn');

        if (isCommentButton) {
            event.preventDefault(); // Empêche le comportement par défaut (si c'est un lien)
            
            // 🚨 Action clé : Ajoute la classe 'comments-open'
            videoCard.classList.add('comments-open');
            
            // OPTIONNEL: Mettre en pause la vidéo parente lors de l'ouverture des commentaires
            const videoElement = videoCard.querySelector('video');
            if (videoElement) {
                videoElement.pause();
            }
            
            // Empêche de propager le clic à d'autres éléments
            return; 
        }

        // --- B. Gérer la fermeture des commentaires ---
        // Vérifie si le clic provient du bouton 'Fermer (X)'
        const isCloseButton = event.target.closest('.comments-section .close-comments');

        if (isCloseButton) {
            event.preventDefault();
            
            // 🚨 Action clé : Retire la classe 'comments-open'
            videoCard.classList.remove('comments-open');
            
            // OPTIONNEL: Reprendre la vidéo parente lors de la fermeture
            const videoElement = videoCard.querySelector('video');
            // Reprendre la lecture seulement si la vidéo était en pause
            if (videoElement && videoElement.paused) { 
                videoElement.play(); 
            }
            return;
        }
    });
});