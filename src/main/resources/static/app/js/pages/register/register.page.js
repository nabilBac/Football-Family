// /static/app/js/pages/register/register.page.js
console.log("🔥🔥 VERSION DU REGISTER >>> V28");

import { Auth, initRegister } from "../../auth.js";
import { Router } from "../../router.js";

export function render() {
    // Charger CSS si nécessaire
    if (!document.querySelector('link[href="/css/auth.css"]')) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "/css/auth.css";
        document.head.appendChild(link);
    }

return `
<div class="login-page">

    <div class="login-container">

        <h1 class="login-title">Créer un compte</h1>

        <div id="errorMsg"></div>
        <div id="successMsg" class="auth-success" style="display:none;"></div>

        <form id="registerForm">

            <!-- USERNAME -->
            <input type="text" id="username" class="login-input" placeholder="Nom d'utilisateur" required />

            <!-- EMAIL -->
            <input type="email" id="email" class="login-input" placeholder="Email" required />

            <!-- PASSWORD -->
            <input type="password" id="password" class="login-input" placeholder="Mot de passe" required minlength="6"/>

            <!-- CONFIRM PASSWORD -->
            <input type="password" id="password2" class="login-input" placeholder="Confirmer le mot de passe" required minlength="6"/>

            <!-- TYPE INSCRIPTION -->
            <select id="typeInscription" class="login-input">
                <option value="USER">Utilisateur</option>
                <option value="PLAYER">Joueur</option>
                <option value="COACH">Coach</option>
                <option value="ORGANIZER">Organisateur</option>
                <option value="CLUB_ADMIN">Admin Club</option>
            </select>

            <!-- EXTRA FIELDS FOR CLUB ADMIN -->
            <div id="extraFields" style="display:none; margin-top:10px;">
                <input type="text" id="siret" class="login-input" placeholder="SIRET (clubs)" />
                <input type="text" id="organizationName" class="login-input" placeholder="Nom du club" />
            </div>

            <button type="submit" class="login-btn">S'inscrire</button>
        </form>

        <div class="login-register">
            <p>Déjà inscrit ? <a href="/login" data-link>Se connecter</a></p>
        </div>

    </div>

</div>
`;


}

export function init() {
    console.log("Page register initialisée");
    initRegister();

    // Gestion affichage extraFields si CLUB_ADMIN
    const typeInput = document.getElementById("typeInscription");
    const extraFields = document.getElementById("extraFields");

    typeInput.addEventListener("change", () => {
        if (typeInput.value === "CLUB_ADMIN") {
            extraFields.style.display = "block";
        } else {
            extraFields.style.display = "none";
        }
    });
}
