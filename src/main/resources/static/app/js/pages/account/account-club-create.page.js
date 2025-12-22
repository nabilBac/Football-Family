import { Router } from "../../router.js";
import { Auth } from "../../auth.js";

export const AccountClubCreatePage = {

    async render() {
        return `
            <div class="admin-main" style="padding: 20px; margin-top: 40px;">
                <h1 class="admin-title">Créer mon club</h1>

                <div id="club-create-message"></div>

                <div class="admin-card" style="padding: 25px;">

                    <div class="admin-form-group">
                        <label>Nom du club *</label>
                        <input id="club-name" class="admin-input" />
                    </div>

                    <div class="admin-form-group">
                        <label>SIRET *</label>
                        <input id="club-siret" class="admin-input" />
                    </div>

                    <div class="admin-form-group">
                        <label>Email *</label>
                        <input id="club-email" class="admin-input" />
                    </div>

                    <div class="admin-form-group">
                        <label>Téléphone</label>
                        <input id="club-phone" class="admin-input" />
                    </div>

                    <div class="admin-form-group">
                        <label>Adresse</label>
                        <input id="club-address" class="admin-input" />
                    </div>

                    <div class="admin-form-group">
                        <label>Ville</label>
                        <input id="club-city" class="admin-input" />
                    </div>

                    <div class="admin-form-group">
                        <label>Code Postal</label>
                        <input id="club-zip" class="admin-input" />
                    </div>

                    <div class="admin-form-group">
                        <label>Type de club *</label>
                        <select id="club-type" class="admin-input">
                            <option value="">-- Choisir --</option>
                            <option value="FOOTBALL">Football</option>
                            <option value="FUTSAL">Futsal</option>
                            <option value="ACADEMY">Académie</option>
                            <option value="ASSOCIATION">Association</option>
                            <option value="OTHER">Autre</option>
                        </select>
                    </div>

                    <button id="btn-create-club" class="admin-btn-primary admin-btn-full">
                        ✔️ Créer le club
                    </button>

                </div>
            </div>
        `;
    },

    init() {
        document
            .getElementById("btn-create-club")
            .addEventListener("click", () => this.createClub());
    },

    async createClub() {
        try {
            const token = localStorage.getItem("accessToken");

            const dto = {
                name: document.getElementById("club-name").value.trim(),
                siret: document.getElementById("club-siret").value.trim(),
                email: document.getElementById("club-email").value.trim(),
                phone: document.getElementById("club-phone").value.trim(),
                address: document.getElementById("club-address").value.trim(),
                city: document.getElementById("club-city").value.trim(),
                zipCode: document.getElementById("club-zip").value.trim(),
                type: document.getElementById("club-type").value
            };

            if (!dto.name || !dto.siret || !dto.email || !dto.type) {
                return this.showMessage("❌ Champs obligatoires manquants", true);
            }

            const res = await fetch("/api/clubs/create", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(dto)
            });

            const result = await res.json();

            if (!result.success) {
                throw new Error(result.message);
            }

            // 🔥 SYNCHRO BACKEND → FRONT
            await Auth.loadUser();

            this.showMessage("✔️ Club créé avec succès !", false);

            setTimeout(() => {
                Router.go("/admin");
            }, 800);

        } catch (err) {
            this.showMessage("❌ " + err.message, true);
        }
    },

    showMessage(msg, error = false) {
        const div = document.getElementById("club-create-message");
        div.innerHTML = msg;
        div.style.color = error ? "#e74c3c" : "#27ae60";
        div.style.marginBottom = "15px";
        div.style.fontWeight = "bold";
    }
};

export default AccountClubCreatePage;
