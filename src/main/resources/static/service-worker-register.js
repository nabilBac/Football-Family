// service-worker-register.js

// service-worker-register.js

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js', { scope: '/' })
      .then(registration => {
        console.log('ServiceWorker registration successful with scope:', registration.scope);

        // Vérifie s'il y a une mise à jour disponible
        registration.onupdatefound = () => {
          const newWorker = registration.installing;
          newWorker.onstatechange = () => {
            if (newWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                // Nouvelle version installée, recharge la page pour appliquer le SW
                console.log('Nouvelle version du Service Worker installée, rechargement...');
                window.location.reload();
              }
            }
          };
        };
      })
      .catch(error => {
        console.log('ServiceWorker registration failed:', error);
      });
  });

  // Nettoyage automatique des anciens caches
  navigator.serviceWorker.ready.then(registration => {
    registration.active?.postMessage({ action: 'cleanOldCaches' });
  });
}

