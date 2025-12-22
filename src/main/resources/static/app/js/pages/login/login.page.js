import { initLogin } from "../../auth.js";

export function render() {
    return `
    <div class="login-page">
        <div class="login-container">

            <h1 class="login-title">Login</h1>

            <div id="errorMsg"></div>

            <form id="loginForm">
                <input type="text" id="username" class="login-input" placeholder="Email ou Username" required>
                <input type="password" id="password" class="login-input" placeholder="Mot de passe" required>

                <button type="submit" class="login-btn">Connexion</button>
            </form>

            <div class="login-register">
                <a href="/register" data-link>Créer un compte</a>
            </div>
        </div>
    </div>
    `;
}

export function init() {
    console.log("Page login stylisée initialisée");
    initLogin();   // 🔥 OBLIGATOIRE !!!
}
