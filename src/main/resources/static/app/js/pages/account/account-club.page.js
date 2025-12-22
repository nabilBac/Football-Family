// /static/app/js/pages/account/account-club.page.js

export const AccountClubPage = {
    async render() {
        const user = JSON.parse(localStorage.getItem("currentUser") || "{}");

        return `
            <div class="account-container">
                <h1 class="account-title">Mon club</h1>

                <div id="club-content">
                    Chargement...
                </div>
            </div>
        `;
    },

    async init() {
        const user = JSON.parse(localStorage.getItem("currentUser") || "{}");
        const container = document.getElementById("club-content");

        if (!user || !user.clubId) {
            container.innerHTML = `
                <p>Vous n'avez pas encore de club.</p>
                <a href="/account/club/create" data-link class="admin-btn admin-btn-primary">
                    ➕ Créer mon club
                </a>
            `;
            return;
        }

        const token = localStorage.getItem("accessToken");

        try {
            const res = await fetch(`/api/clubs/${user.clubId}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });

            const result = await res.json();
            const club = result.data;

            container.innerHTML = `
                <div class="admin-card">
                    <h2>${club.name}</h2>
                    <p><strong>Ville :</strong> ${club.city || 'N/A'}</p>
                    <p><strong>Email :</strong> ${club.email || 'N/A'}</p>

                    <a href="/admin" data-link class="admin-btn admin-btn-primary">
                        ⚙️ Gérer mon club
                    </a>
                </div>
            `;

        } catch (err) {
            container.innerHTML = `<p>Impossible de charger le club.</p>`;
        }
    }
};

export default AccountClubPage;