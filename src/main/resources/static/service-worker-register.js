// service-worker-register.js

// ✅ Désactive le Service Worker en DEV (localhost)
if (location.hostname === "localhost" || location.hostname === "127.0.0.1") {
  console.log("SW disabled on localhost");
} else if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/service-worker.js", { scope: "/" })
      .then(registration => {
        console.log("ServiceWorker registration successful with scope:", registration.scope);

        // Vérifie s'il y a une mise à jour disponible
        registration.onupdatefound = () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.onstatechange = () => {
            if (newWorker.state === "installed") {
              if (navigator.serviceWorker.controller) {
                // ⚠️ En PROD seulement: évite les reloads en boucle
                console.log("Nouvelle version du Service Worker installée.");
                // window.location.reload();  // ❌ on désactive le reload auto
              }
            }
          };
        };
      })
      .catch(error => {
        console.log("ServiceWorker registration failed:", error);
      });
  });

  // Nettoyage automatique des anciens caches
  navigator.serviceWorker.ready.then(registration => {
    registration.active?.postMessage({ action: "cleanOldCaches" });
  });
}
