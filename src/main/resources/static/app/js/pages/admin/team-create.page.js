import { Router } from "../../router.js";

export const AdminTeamCreatePage = {

    async render() {
        return `
            <div class="admin-main" style="padding: 20px; margin-top: 40px;">
                <h1 class="admin-title">Créer une équipe</h1>

                <div id="team-message" class="admin-message"></div>

                <div class="admin-card">

                    <div class="admin-form-group">
                        <label>Nom de l'équipe *</label>
                        <input id="team-name" class="admin-input" placeholder="Ex : U13 A" />
                    </div>

                    <div class="admin-form-group">
                        <label>Catégorie *</label>
                        <select id="team-category" class="admin-input">
                            <option value="">-- Sélectionner --</option>
                            <option value="U7">U7</option>
                            <option value="U9">U9</option>
                            <option value="U11">U11</option>
                            <option value="U13">U13</option>
                            <option value="U15">U15</option>
                            <option value="U17">U17</option>
                            <option value="U19">U19</option>
                            <option value="Seniors">Seniors</option>
                        </select>
                    </div>

                    <div class="admin-form-group">
                        <label>Couleur de l'équipe *</label>
                        <input id="team-color" class="admin-input" placeholder="Ex : Bleu, Rouge..." />
                    </div>

                    <button id="btn-create-team" class="admin-btn-primary admin-btn-full">
                        ✔️ Créer l'équipe
                    </button>
                </div>
            </div>
        `;
    },

    async init() {
        const btn = document.getElementById("btn-create-team");
        btn.addEventListener("click", () => this.createTeam());
    },

    async createTeam() {
        const token = localStorage.getItem("accessToken");
        const user = JSON.parse(localStorage.getItem("currentUser") || "{}");

        const name = document.getElementById("team-name").value.trim();
        const category = document.getElementById("team-category").value;
        const color = document.getElementById("team-color").value.trim();

        if (!name || !category || !color) {
            return this.showMessage("❌ Tous les champs sont obligatoires", true);
        }

        try {
            const res = await fetch(`/api/teams/club/${user.clubId}/create`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ 
                    name, 
                    category,
                    color, 
                    coachId: user.id  // ✅ Automatique
                })
            });

            if (!res.ok) {
                throw new Error("Erreur API");
            }

            this.showMessage("✔️ Équipe créée avec succès !", false);

            setTimeout(() => Router.go("/admin/teams"), 1000);

        } catch (err) {
            this.showMessage("❌ Impossible de créer l'équipe", true);
        }
    },

    showMessage(msg, error = false) {
        const el = document.getElementById("team-message");
        el.textContent = msg;
        el.style.color = error ? "#e74c3c" : "#27ae60";
        el.style.padding = "12px";
    }
};

export default AdminTeamCreatePage;