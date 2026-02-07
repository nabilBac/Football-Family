import { Router } from "./router.js";

export const Auth = {
    accessToken: localStorage.getItem("accessToken"),
    refreshToken: localStorage.getItem("refreshToken"),
    currentUser: JSON.parse(localStorage.getItem("currentUser") || "null"),


     // 🔧 MODE DEV (temporaire)
    isDev: false,

    getAuthHeader() {
        if (!this.accessToken) return "";
        return "Bearer " + this.accessToken;
    },

    // ✅ MÉTHODE POUR DÉCODER LE JWT
    decodeToken(token) {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(
                atob(base64).split('').map(c => 
                    '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
                ).join('')
            );
            return JSON.parse(jsonPayload);
        } catch (e) {
            //console.error('❌ Erreur décodage JWT:', e);//
            return null;
        }
    },

    saveTokens(access, refresh, user = null) {
        this.accessToken = access;
        this.refreshToken = refresh;

        localStorage.setItem("accessToken", access);
        localStorage.setItem("refreshToken", refresh);

        if (user) {
            this.currentUser = user;
            localStorage.setItem("currentUser", JSON.stringify(user));
        }
    },

    clear() {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("currentUser");
        this.accessToken = null;
        this.refreshToken = null;
        this.currentUser = null;
    },

 async login(username, password) {
    const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
    });

    if (!res.ok) throw new Error("Identifiants incorrects");

    const data = await res.json();

    // ✅ On stocke seulement les tokens
    this.saveTokens(data.accessToken, data.refreshToken);

    // ✅ ON FORCE la source de vérité backend
    const user = await this.loadUser();

    return user;
},


   async register(payload) {
    const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });

    // Lire le JSON UNE SEULE FOIS
    let result = null;
    try {
        result = await res.json();
    } catch (e) {
        // Si le backend renvoie sans body
        result = null;
    }

    if (!res.ok) {
        // Ton backend renvoie ErrorResponse(error="...")
        const msg = result?.error || "Erreur lors de l'inscription";
        throw new Error(msg);
    }

    // Ici result = { accessToken, refreshToken, user }
    this.saveTokens(result.accessToken, result.refreshToken, result.user);

    return result.user;
},


    async loadUser() {
    if (!this.accessToken) return null;

    const res = await this.secureFetch("/api/auth/me");

    if (!res.ok) return null;

    const user = await res.json();

    // ✅ DÉCODER LE TOKEN POUR RÉCUPÉRER clubId
    const payload = this.decodeToken(this.accessToken);

    this.currentUser = {
        id: user.id,
        username: user.username,
        email: user.email,
        avatarUrl: user.avatarUrl,
        highestRole: user.highestRole,
        verified: user.verified,
        clubId: user.clubId 
    };

    localStorage.setItem("currentUser", JSON.stringify(this.currentUser));

    return this.currentUser;
},

    async getCurrentUser() {
    // Si on a un user déjà chargé en mémoire → on le renvoie
    if (this.currentUser) return this.currentUser;

    // Sinon on recharge depuis /api/auth/me
    return await this.loadUser();
},


    async refresh() {
        if (!this.refreshToken) return false;

        const res = await fetch("/api/auth/refresh", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refreshToken: this.refreshToken })
        });

        if (!res.ok) {
            this.clear();
            return false;
        }

        const data = await res.json();
        this.saveTokens(data.accessToken, data.refreshToken);

        return true;
    },

async secureFetch(url, options = {}) {
  // 🔒 relire à chaque appel (mobile/PWA safe)
  const accessToken = localStorage.getItem("accessToken");
  const refreshToken = localStorage.getItem("refreshToken");

  const headers = new Headers(options.headers || {});
  const isFormData = options.body instanceof FormData;
  const method = (options.method || "GET").toUpperCase();

  // ✅ JSON seulement si pas FormData
  if (method !== "GET" && !isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  // ✅ Ajoute Authorization UNIQUEMENT si token valide
  if (accessToken && accessToken !== "null" && accessToken !== "undefined") {
    headers.set("Authorization", "Bearer " + accessToken);
  } else {
    // évite Authorization: Bearer null/undefined
    headers.delete("Authorization");
  }

  const doFetch = () => fetch(url, { ...options, headers });

  let res = await doFetch();

  // 🔁 Retry après refresh si 401
  if (res.status === 401 && refreshToken) {
    const ok = await this.refresh();
    if (ok) {
      const newToken = localStorage.getItem("accessToken");
      if (newToken) headers.set("Authorization", "Bearer " + newToken);
      res = await doFetch();
    }
  }

  return res;
},


    logout() {
        this.clear();
        Router.go("/login");
    },

    async requireAuth() {
        if (!this.accessToken) {
            Router.go("/login");
            return;
        }

        const user = await this.loadUser();
        if (!user) this.logout();
    }
};

/* 🌟 Redirection PWA après connexion */
export function autoRedirectAfterLogin(user) {
    Router.go("/feed"); // Tout le monde va sur le feed
}

// ======================================================
// INITLOGIN PREMIUM
// ======================================================
export function initLogin() {

    console.log("INIT LOGIN PREMIUM");

    const form = document.getElementById("loginForm");
    const usernameInput = document.getElementById("username");
    const passwordInput = document.getElementById("password");
    const errorMsg = document.getElementById("errorMsg");
    const submitBtn = form.querySelector("button[type='submit']");

    // Effacer erreur si user retape
    usernameInput.addEventListener("input", () => errorMsg.style.display = "none");
    passwordInput.addEventListener("input", () => errorMsg.style.display = "none");

    // Vérifier si utilisateur déjà loggé → redirection auto
  // Ne redirige PAS automatiquement si l'utilisateur est sur /login
if (Auth.accessToken && location.pathname !== "/login") {

    Auth.loadUser().then(u => {
        if (u) {
            autoRedirectAfterLogin(u);
        }
    });
}


    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        // Empêcher double clic
        if (submitBtn.classList.contains("loading")) return;

        // Désactiver bouton + animation
        submitBtn.classList.add("loading");
        submitBtn.disabled = true;
      submitBtn.textContent = "Connexion...";

        // Haptics (mobile)
        if (navigator.vibrate) navigator.vibrate(20);

        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();

        try {

            // Vérifier offline
            if (!navigator.onLine) {
                throw new Error("Vous êtes hors-ligne");
            }

            // Appel API → Auth.login()
            const user = await Auth.login(username, password);

            // Haptics success
            if (navigator.vibrate) navigator.vibrate([10, 10]);

            // Delay léger pour smooth UX
            setTimeout(() => {
                autoRedirectAfterLogin(user);
            }, 300);

        } catch (err) {

            console.error("Erreur login:", err);

            // Erreur visible
            errorMsg.style.display = "block";
            errorMsg.innerText = err.message || "Erreur de connexion";

            // Haptics error
            if (navigator.vibrate) navigator.vibrate([50, 50, 50]);

        } finally {
            // Réactiver bouton
            submitBtn.classList.remove("loading");
            submitBtn.disabled = false;
            submitBtn.textContent = "Connexion";
        }

        // Nettoyage sécurité
        passwordInput.value = "";
    });
}

// ======================================================
// INITREGISTER CLEAN — VERSION CLUB_ADMIN READY
// ======================================================
export function initRegister() {

    console.log("INIT REGISTER CLEAN");

    const form = document.getElementById("registerForm");
    if (!form) return;

    const usernameInput = document.getElementById("username");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const password2Input = document.getElementById("password2");

    const typeInput = document.getElementById("typeInscription");

    const siretInput = document.getElementById("siret");
    const organizationInput = document.getElementById("organizationName");

    const errorMsg = document.getElementById("errorMsg");
    const successMsg = document.getElementById("successMsg");
    const submitBtn = form.querySelector("button[type='submit']");

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        errorMsg.style.display = "none";
        successMsg.style.display = "none";

        const username = usernameInput.value.trim();
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();
        const password2 = password2Input.value.trim();
        const typeInscription = typeInput.value;

        if (password !== password2) {
            errorMsg.innerText = "Les mots de passe ne correspondent pas.";
            errorMsg.style.display = "block";
            return;
        }

        // PAYLOAD FINAL → ENFIN COMPLET
        const payload = {
            username,
            email,
            password,
            typeInscription,
            siret: siretInput?.value?.trim() || null,
            organizationName: organizationInput?.value?.trim() || null
        };

        try {
            submitBtn.disabled = true;
            submitBtn.innerText = "Inscription...";

            const user = await Auth.register(payload);

            successMsg.innerText = "Compte créé ! Redirection...";
            successMsg.style.display = "block";

            setTimeout(() => Router.go("/feed"), 800);

        } catch (err) {
            errorMsg.innerText = err.message || "Erreur lors de l'inscription.";
            errorMsg.style.display = "block";
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerText = "S'inscrire";
        }
    });
}

window.Auth = Auth;
