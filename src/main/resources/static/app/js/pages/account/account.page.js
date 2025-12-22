console.log("🟦 RENDER FROM ACCOUNT PAGE");

export const AccountPage = {

    async render() {
        const userRaw = localStorage.getItem("currentUser");
        const user = userRaw ? JSON.parse(userRaw) : null;

        if (!user) {
            return `
                <div class="center" style="padding: 40px;">
                    <h2>Vous devez être connecté pour accéder à cette page.</h2>
                    <a href="/login" data-link class="btn-primary">Se connecter</a>
                </div>
            `;
        }

        return `
            <div class="admin-main" style="padding: 20px; margin-top: 40px;">

                <h1 class="admin-title">Mon espace</h1>

                <div class="admin-card" style="margin-bottom: 25px;">
                    <h2>Mes informations</h2>

                    <p style="color: #333; margin: 10px 0;">
                        <strong>Nom d'utilisateur :</strong> ${user.username}
                    </p>
                    <p style="color: #333; margin: 10px 0;">
                        <strong>Email :</strong> ${user.email}
                    </p>
                    <p style="color: #333; margin: 10px 0;">
                        <strong>Rôle :</strong> ${user.highestRole}
                    </p>

                    ${user.clubId 
                        ? `<p style="color: #333; margin: 10px 0;">
                            <strong>ID du club :</strong> ${user.clubId}
                        </p>`
                        : `<p style="color: #333; margin: 10px 0;">
                            <strong>Vous n'appartenez à aucun club.</strong>
                        </p>`
                    }
                </div>

                <div class="admin-card" style="text-align: center; padding: 25px;">
                    ${
                       user.clubId
                        ? `
                            <a href="/admin" data-link class="admin-btn-primary admin-btn-full">
                                ⚙️ Gérer mon club
                            </a>
                        `
                        : `
                            <a href="/account/club/create" data-link class="admin-btn-primary admin-btn-full">
                                🏆 Créer mon club
                            </a>
                        `
                    }
                </div>

            </div>
        `;
    },

    init() {}
};

export default AccountPage;