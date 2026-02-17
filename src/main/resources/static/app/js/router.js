// /static/app/js/router.js
// ✅ VERSION CORRIGÉE - Routes tournament supprimées

import { Auth } from "./auth.js";
import { Navbar } from "./components/navbar.js";

function updateNavbarButtonVisibility() {
    const app = document.getElementById("app");
    const postBtn = document.querySelector(".gc-post-btn");

    if (!app || !postBtn) return;

    if (app.classList.contains("is-hub-page")) {
        postBtn.style.display = "none";
    } else {
        postBtn.style.display = "flex";
    }
}

export const Router = {

    currentModule: null,
      navToken: 0,

routes: {
    "/events": "/app/js/pages/events/events.page.js",
    "/feed": "/app/js/pages/feed/feed.page.js",
     "/live/matches": "/app/js/pages/live/live-matches.page.js",
    "/login": "/app/js/pages/login/login.page.js",
    "/register": "/app/js/pages/register/register.page.js",
    "/upload": "/app/js/pages/upload/upload.js",
    "/hub": "/app/js/pages/hub/hub.page.js",
    "/profile": "/app/js/pages/profile/profile.page.js",
    "/videos": "/app/js/pages/videos/list.page.js",
    "/videos/go-live": "/app/js/pages/videos/go-live.page.js",
    "/videos/archives": "/app/js/pages/videos/archives.page.js",
    "/account": "/app/js/pages/account/account.page.js",

    /* ✨ AJOUTER ICI ✨ */
   
    "/account/club/create": "/app/js/pages/account/account-club-create.page.js",

    /* --- ADMIN --- */
    "/club-admin": "/app/js/pages/admin/dashboard.page.js",
    "/admin": "/app/js/pages/admin/dashboard.page.js",
      "/admin/dashboard": "/app/js/pages/admin/dashboard.page.js",
    "/admin/teams": "/app/js/pages/admin/teams.page.js",
    "/admin/events": "/app/js/pages/admin/events.page.js",
    "/admin/events/deleted": "/app/js/pages/admin/events-deleted.page.js", 
    "/admin/matches/deleted": "/app/js/pages/admin/matches-deleted.page.js", 
"/admin/events/create": "/app/js/pages/admin/events-create-unified-wizard.page.js",
   "/admin/events/create-match": "/app/js/pages/admin/match-create-wizard.page.js",
    "/admin/teams/create": "/app/js/pages/admin/team-create.page.js",
},


    dynamicRoutes: [
        {
            pattern: /^\/videos\/watch\/([^/]+)$/,
            modulePath: "/app/js/pages/videos/watch.page.js",
            paramKey: "id"
        },
        {
            pattern: /^\/profile\/([^/]+)$/,
            modulePath: "/app/js/pages/profile/profile.page.js",
            paramKey: "username"
        },
        {
            pattern: /^\/videos\/feed\/profile\/([^/]+)$/,
            modulePath: "/app/js/pages/videos/profile-feed.page.js",
            paramKey: "id"
        },
        {
            pattern: /^\/events\/(\d+)$/,
            modulePath: "/app/js/pages/events/event-detail.page.js",
            paramKey: "id"
        },
        {
            pattern: /^\/clubs\/(\d+)\/events\/(\d+)\/groups\/(\d+)\/matches$/,
            modulePath: "/app/js/pages/clubs/group-matches.page.js",
            paramKey: ["clubId", "eventId", "groupId"]
        },
        {
            pattern: /^\/clubs\/(\d+)\/events\/(\d+)\/groups$/,
            modulePath: "/app/js/pages/clubs/event-groups.page.js",
            paramKey: ["clubId", "eventId"]
        },
        // ✅ NOUVELLE ROUTE ADMIN POUR LE DASHBOARD D'UN ÉVÉNEMENT
        {
            pattern: /^\/admin\/events\/(\d+)$/,
            modulePath: "/app/js/pages/admin/event.dashboard.page.js",
            paramKey: "id"
        },
    ],

    async init() {
        this.root = document.getElementById("app");
        if (!this.root) {
            document.body.innerHTML = `<div id="app"></div>`;
            this.root = document.getElementById("app");
        }

        this.bindLinks();
        await this.navigate(location.pathname);

        window.onpopstate = () => this.navigate(location.pathname);
    },

    bindLinks() {
        document.body.addEventListener("click", (e) => {
            const link = e.target.closest("[data-link]");
            if (!link) return;

            e.preventDefault();
            this.go(link.getAttribute("href"));
        });
    },

async go(url) {
  // ✅ Empêche l'admin de "flasher" vers l'accueil/feed
  const fromAdmin =
    location.pathname.startsWith("/admin") ||
    location.pathname.startsWith("/club-admin");

  const toHomeLike = (url === "/feed" || url === "/" || url === "/index.html");

  if (fromAdmin && toHomeLike) {
    console.error("🚫 REDIRECT BLOQUÉ depuis admin ->", url);
    console.trace("STACK REDIRECT");
    // Stocke la stack même si la console se nettoie
    localStorage.setItem("FF_LAST_REDIRECT_URL", url);
    localStorage.setItem("FF_LAST_REDIRECT_STACK", new Error("redirect").stack);
    return; // <-- on bloque la redirection
  }

  console.trace("[Router.go] ->", url);
  history.pushState(null, "", url);
  await this.navigate(url);
},




    resolveRoute(url) {
        // ⭐ Redirection racine vers feed
     if (url === "/" || url === "/index.html") {
    history.replaceState(null, "", "/feed"); // ✅ met l'URL à jour
    url = "/feed";
}


        // Routes simples
        if (this.routes[url]) {
            return { modulePath: this.routes[url], params: {} };
        }

        // Routes dynamiques
        for (const r of this.dynamicRoutes) {
            const match = url.match(r.pattern);
            if (match) {
                let params = {};
                if (Array.isArray(r.paramKey)) {
                    r.paramKey.forEach((key, index) => {
                        params[key] = match[index + 1];
                    });
                } else {
                    params[r.paramKey] = match[1];
                }
                return { modulePath: r.modulePath, params };
            }
        }

        return null;
    },

async navigate(url) {
    try {
               const token = ++this.navToken; 

                 const prev = this.currentModule;
if (prev) {
  try {
    if (typeof prev.unmount === "function") await prev.unmount();
 else if (typeof prev.cleanup === "function") await prev.cleanup();

  } catch (e) {
    console.warn("cleanup/unmount error:", e);
  }
}

if (token !== this.navToken) return;
this.root.classList.remove("is-hub-page", "is-live-page", "fade-in", "fade-out", "ready");

        // 🟣 START TRANSITION (fade-out)
        this.root.classList.add("fade-out");


  // ⏳ Attendre que le fade-out soit visible (100ms)
await new Promise(resolve => setTimeout(resolve, 100));

if (token !== this.navToken) return;



            // 🧹 RESET GLOBAL DES CLASSES
            document.body.classList.remove(
                "is-feed-page",
                "is-hub-page",
                "is-live-page",
                "is-tournament-page",
                "is-admin-page",
                  "is-event-detail-page"   
            );

            // 🛠️ Mode ADMIN
           if (url.startsWith("/club-admin")) {

                document.body.classList.add("is-admin-page");
            }

            // 🎯 Mode FEED
            if (url === "/feed") {
                document.body.classList.add("is-feed-page");
            }

  // Route flags BEFORE render
if (url === "/hub") {
    this.root.classList.add("is-hub-page");
    document.body.classList.add("is-live-page");
}
if (url === "/videos/go-live" || url.startsWith("/videos/watch/")) {
    this.root.classList.add("is-live-page");
    document.body.classList.add("is-live-page");
}

                    if (url === "/live/matches") this.root.classList.add("is-live-page");


            // Resolve route
            const resolved = this.resolveRoute(url);

         
// 🚨 PROTECTION ADMIN
if (url.startsWith("/club-admin") || url.startsWith("/admin")) {
    console.log("🔥 ADMIN GUARD : Vérification accès...");

    await Auth.loadUser();

    if (token !== this.navToken) return;

    const user = Auth.currentUser;

    if (!user) {
        console.log("🔥 ADMIN GUARD : Pas d'user, redirect login");
        return this.go("/login");
    }

    const userRole = user.highestRole || "";
    const allowed = userRole === "CLUB_ADMIN" || userRole === "SUPER_ADMIN";

    console.log("🔥 ADMIN GUARD : Role =", userRole, "Allowed =", allowed);

    if (!allowed) {
        console.log("❌ ADMIN GUARD : Accès refusé !");
        alert("⛔ Accès refusé. Vous devez être administrateur.");
        return this.go("/feed");
    }

    console.log("✅ ADMIN GUARD : Accès autorisé !");
}

            if (!resolved) {
                this.root.innerHTML = "<h2>Erreur : page introuvable</h2>";
                return;
            }

            // ✅ DEBUG + SAFE IMPORT (mobile/render)
const moduleUrl = resolved.modulePath;
console.log("[Router] importing:", moduleUrl, "for url=", url);

try {
  const r = await fetch(moduleUrl, { cache: "no-store" });

  if (token !== this.navToken) return;

  const ct = (r.headers.get("content-type") || "").toLowerCase();

  console.log("[Router] module fetch:", moduleUrl, "status=", r.status, "ct=", ct);

  if (!r.ok) {
    throw new Error(`Module introuvable: ${moduleUrl} (HTTP ${r.status})`);
  }

  // Si Render renvoie index.html au lieu du JS => fallback SPA trop large
if (ct.includes("text/html")) {
  const txt = await r.text();
  if (token !== this.navToken) return; // ✅ AJOUT ICI

  console.error("⚠️ HTML renvoyé au lieu de JS pour", moduleUrl);
  console.log("HTML head:", txt.slice(0, 150));
  throw new Error(`Module ${moduleUrl} renvoie HTML (fallback SPA).`);
}

} catch (e) {
  console.error("❌ Précheck import échoué:", e);
  throw e;
}

const module = await import(moduleUrl);
if (token !== this.navToken) return;


      const Page =
  module.default ||
  module.Page ||
  module.ProfilePage ||
  module.FeedPage ||
  module.UploadPage ||
  module.WatchPage ||
  module.AdminEventDashboardPage ||
  module;

this.currentModule = Page;

const hideNavbar =
  url === "/login" ||
  url === "/register" ||
  url.startsWith("/videos/go-live") ||
  url.startsWith("/videos/watch/");

const hidePostButton = (url === "/hub");
const isAdminPage = url.startsWith("/club-admin") || url.startsWith("/admin");

const pageHtml =
  Page.render.length > 0
    ? await Page.render(resolved.params)
    : await Page.render();

if (token !== this.navToken) return; // ✅ F

this.root.innerHTML = (hideNavbar || isAdminPage)
  ? pageHtml
  : `${pageHtml}${Navbar({ hidePostButton })}`;

if (token !== this.navToken) return; // ✅ G

// ... tes animations/classes etc. (tu peux laisser comme tu as)

if (Page.init) await Page.init(resolved.params);

if (token !== this.navToken) return; // ✅ H

         // 🔥 FIX du bouton + qui devient ovale après quitter un live
if (url !== "/hub") {
    document.body.classList.remove("is-live-page");
}

            const navbar = document.querySelector(".mobile-navbar");
            if (navbar) navbar.removeAttribute("style");

         
this.root.classList.remove("fade-out");

setTimeout(() => {
    this.root.classList.add("ready");
}, 50);

setTimeout(() => {
    this.root.classList.remove("fade-in");
}, 150);

            // Reload post buttons only if not admin
            if (!isAdminPage) {
                updateNavbarButtonVisibility();
            }

        } catch (err) {
            console.error("Router error:", err);
            this.root.innerHTML = "<h2>Erreur de chargement</h2>";
        }
    }
};
window.Router = Router;

Router.init();
