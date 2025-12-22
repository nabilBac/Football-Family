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
    "/admin": "/app/js/pages/admin/dashboard.page.js",
    "/admin/teams": "/app/js/pages/admin/teams.page.js",
    "/admin/events": "/app/js/pages/admin/events.page.js",
    "/admin/events/create": "/app/js/pages/admin/events-create.page.js",
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
        history.pushState(null, "", url);
        await this.navigate(url);
    },

    resolveRoute(url) {
        // ⭐ Redirection racine vers feed
        if (url === "/" || url === "/index.html") {
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
            // 🟣 START TRANSITION (fade-out)
            this.root.classList.add("fade-out");

            if (this.currentModule && this.currentModule.cleanup) {
                this.currentModule.cleanup();
            }

            // 🧹 RESET GLOBAL DES CLASSES
            document.body.classList.remove(
                "is-feed-page",
                "is-hub-page",
                "is-live-page",
                "is-tournament-page",
                "is-admin-page"
            );

            // 🛠️ Mode ADMIN
            if (url.startsWith("/admin")) {
                document.body.classList.add("is-admin-page");
            }

            // 🎯 Mode FEED
            if (url === "/feed") {
                document.body.classList.add("is-feed-page");
            }

            // Route flags BEFORE render
            if (url === "/hub") this.root.classList.add("is-hub-page");
            if (url === "/videos/go-live" || url.startsWith("/videos/watch/"))
                this.root.classList.add("is-live-page");

            // Resolve route
            const resolved = this.resolveRoute(url);

            // 🚨 PROTECTION ADMIN
            if (url.startsWith("/admin")) {
                const user = await Auth.getCurrentUser();

                if (!user) {
                    return this.go("/login");
                }

                // Autorise SUPER_ADMIN ET CLUB_ADMIN
                if (user.highestRole !== "SUPER_ADMIN" && user.highestRole !== "CLUB_ADMIN") {
                    console.warn("Accès refusé : rôle insuffisant");
                    return this.go("/feed");
                }
            }

            if (!resolved) {
                this.root.innerHTML = "<h2>Erreur : page introuvable</h2>";
                return;
            }

            const module = await import(resolved.modulePath);
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

            const pageHtml =
                Page.render.length > 0
                    ? await Page.render(resolved.params)
                    : await Page.render();

            const hidePostButton = (url === "/hub");
            const isAdminPage = url.startsWith("/admin");

            this.root.innerHTML = (hideNavbar || isAdminPage)
                ? pageHtml
                : `${pageHtml}${Navbar({ hidePostButton })}`;

            // 🔥 FIX du bouton + qui devient ovale après quitter un live
            document.body.classList.remove("is-live-page");

            const navbar = document.querySelector(".mobile-navbar");
            if (navbar) navbar.removeAttribute("style");

            // 🟢 END TRANSITION (fade-in)
            setTimeout(() => {
                this.root.classList.remove("fade-out");
                this.root.classList.add("fade-in");

                setTimeout(() => {
                    this.root.classList.remove("fade-in");
                }, 250);
            }, 10);

            // Re-apply classes AFTER html reset
            if (url === "/hub") this.root.classList.add("is-hub-page");
            if (url === "/videos/go-live" || url.startsWith("/videos/watch/"))
                this.root.classList.add("is-live-page");

            // Reload post buttons only if not admin
            if (!isAdminPage) {
                updateNavbarButtonVisibility();
            }

            if (Page.init) Page.init(resolved.params);

        } catch (err) {
            console.error("Router error:", err);
            this.root.innerHTML = "<h2>Erreur de chargement</h2>";
        }
    }
};
window.Router = Router;

Router.init();
