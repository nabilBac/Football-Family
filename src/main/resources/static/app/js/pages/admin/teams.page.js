
import { AdminNav } from '../../components/admin-nav.js';

export const AdminTeamsPage = {
  async render() {
    return `
        ${AdminNav.render('teams')}
        <div class="admin-main" style="padding: 20px; margin-top: 60px;">
            <h1 class="admin-title">Mes équipes</h1>

            <!-- Bouton pour créer une équipe -->
            <div style="margin:20px 0;">
                <a href="/admin/teams/create" data-link class="admin-btn admin-btn-primary">
                    ➕ Créer une équipe
                </a>
            </div>

            <div id="admin-teams-content">
                <p>Chargement des équipes...</p>
            </div>
        </div>
    `;
},

  async init() {
    // ⏳ Attendre que le DOM soit prêt
    await new Promise(resolve => requestAnimationFrame(resolve));
    
    const container = document.getElementById("admin-teams-content");
    const token = localStorage.getItem("accessToken");
    const currentUserRaw = localStorage.getItem("currentUser");

    if (!currentUserRaw) {
        container.innerHTML = `<p>Utilisateur non connecté.</p>`;
        return;
    }

    const clubId = JSON.parse(currentUserRaw).clubId;

    try {
        const response = await fetch(`/api/teams/club/${clubId}`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        const result = await response.json();
        const teams = Array.isArray(result) ? result : (result.data || []);

        if (teams.length === 0) {
            container.innerHTML = `<p>Aucune équipe trouvée.</p>`;
            return;
        }

        container.innerHTML = teams.map(team => `
            <div class="admin-card" style="padding: 20px; margin-bottom: 15px; background: white; border-radius: 8px;">
                <h2 style="margin: 0 0 10px 0; color: #2c3e50;">${team.name}</h2>
                <p style="margin: 5px 0; color: #7f8c8d;"><strong>Catégorie :</strong> ${team.category || 'N/A'}</p>
                <p style="margin: 5px 0; color: #7f8c8d;"><strong>Couleur :</strong> ${team.color || 'N/A'}</p>
                <p style="margin: 5px 0; color: #7f8c8d;"><strong>Joueurs :</strong> ${team.players?.length || 0}</p>
            </div>
        `).join("");

    } catch (err) {
        console.error(err);
        container.innerHTML = `<p>Erreur lors du chargement des équipes.</p>`;
    }
    
    // 🔥 Attacher les liens de navigation AdminNav
    document.querySelectorAll('a[data-link]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const href = link.getAttribute('href');
            window.location.href = href;
        });
    });
}
};

export default AdminTeamsPage;