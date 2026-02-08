// /static/app/js/pages/profile/profile.page.js

import { Auth } from "../../auth.js";
import { Router } from "../../router.js";

export async function render(params) {

    // Charger l'utilisateur courant si non présent
   const token =
  Auth.accessToken ||
  localStorage.getItem("token") ||
  localStorage.getItem("accessToken") ||
  sessionStorage.getItem("token");

if (!Auth.currentUser && token) {
  Auth.accessToken = token; // si ton Auth s’appuie dessus
  try { await Auth.loadUser(); } catch(e) { console.warn(e); }
}


    // Qui afficher ?
    const username = params?.id || params?.username || Auth.currentUser?.username;

    if (!username) {
        return `
            <div class="profile-page">
                <div class="main-content-scrollable">
                    <div class="empty-state">
                        <p class="empty-text">Utilisateur non identifié.</p>
                    </div>
                </div>
            </div>
        `;
    }

    // ✅ CHARGER LE PROFIL API AVEC CACHE-BUSTING
    let data;
    try {
        // ✅ Ajoute timestamp pour forcer refresh + Cache-Control
        const res = await fetch(`/api/profile/${encodeURIComponent(username)}?t=${Date.now()}`, {
            headers: {
                "Authorization": Auth.getAuthHeader(),
                "Cache-Control": "no-cache, no-store, must-revalidate",
                "Pragma": "no-cache"
            }
        });

        if (!res.ok) throw new Error("Profil introuvable");
        data = await res.json();

        console.log("DEBUG PROFILE", {
  viewedUsername: username,
  apiUserId: data.user?.id,
  apiUsername: data.user?.username,
  isCurrentUser: data.isCurrentUser,
  authUser: Auth.currentUser?.username,
  authUserId: Auth.currentUser?.id
});

    } catch (e) {
        return `
            <div class="profile-page">
                <div class="main-content-scrollable">
                    <div class="empty-state">
                        <p class="empty-text">Impossible de charger le profil.</p>
                    </div>
                </div>
            </div>
        `;
    }

    const user = data.user;
    const videos = data.videos || [];
let isCurrentUser = data.isCurrentUser === true;

// ✅ Fallback : si l'API se trompe, on compare les ids
if (!isCurrentUser && Auth.currentUser?.id && user?.id && Number(Auth.currentUser.id) === Number(user.id)) {
  isCurrentUser = true;
}


    const followersCount = user.followersCount ?? user.followers ?? 0;
    const followingCount = user.followingCount ?? user.following ?? 0;

    const avatarUrl =
        user.avatarUrl ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}&background=10B981&color=fff&size=200`;

    // Rendu complet
    return `
    <div class="profile-page">
      <div class="main-content-scrollable">

        <!-- HEADER -->
        <div class="profile-header" data-profile-id="${user.id}">

          <div class="avatar-container">
            <div class="avatar-ring"></div>
            <div class="avatar">
              <img src="${avatarUrl}" alt="Avatar de ${user.username}">
            </div>
          </div>

          <div class="profile-identity">
            <div class="username-group">
              <h1 class="username">${user.username}</h1>
              ${user.verified ? `<i class="fas fa-circle-check verified-badge"></i>` : ""}
            </div>
            <p class="user-handle">@${user.username}</p>
          </div>

          <div class="stats-container">
            <div class="stat-card">
              <span class="stat-value">${videos.length}</span>
              <span class="stat-label">Vidéos</span>
            </div>
            <div class="stat-card">
              <span class="stat-value">${followersCount}</span>
              <span class="stat-label">Abonnés</span>
            </div>
            <div class="stat-card">
              <span class="stat-value">${followingCount}</span>
              <span class="stat-label">Suivis</span>
            </div>
          </div>

          <!-- ACTIONS -->
          <div class="action-buttons">
            ${
              isCurrentUser
                ? `
                  <!-- ✅ BOUTONS GESTION CLUB (conditionnel) -->
                  ${
                  Auth.currentUser?.clubId != null

                      ? `
 <a href="/club-admin" data-link class="btn btn-primary" style="padding:10px 20px; margin-bottom: 10px;">
  <i class="fas fa-users-gear"></i> Mon Club
</a>

                      `
                      : `
                        <a href="/account/club/create" data-link class="btn btn-primary" style="padding:10px 20px; margin-bottom: 10px;">
                            <i class="fas fa-trophy"></i> Créer mon club
                        </a>
                      `
                  }

                  <!-- ✅ BOUTONS PROFIL -->
                  <button class="btn btn-secondary" id="editProfileBtn" style="margin-bottom: 10px;">
                    <i class="fas fa-pen"></i> Éditer
                  </button>

                  <a href="/account" data-link class="btn btn-secondary" style="padding:10px 20px; margin-bottom: 10px;">
                      <i class="fas fa-user-cog"></i> Mon compte
                  </a>

                  <button class="btn btn-danger" id="logoutBtn">
                    <i class="fas fa-sign-out-alt"></i> Déconnexion
                  </button>
                `
                : `
                 <button class="btn btn-primary" id="followBtn" data-target-id="${user.id}">
                    S'abonner
                 </button>
                `
            }
          </div>
        </div>

        <!-- TABS -->
        <div class="content-tabs">
          <button class="tab active"><i class="fas fa-grid-2"></i> Publications</button>
          <button class="tab"><i class="fas fa-heart"></i> Likes</button>
          ${
            isCurrentUser
              ? `<button class="tab"><i class="fas fa-bookmark"></i> Enregistrés</button>`
              : ""
          }
        </div>

        <!-- VIDEOS -->
        ${
          videos.length === 0
            ? `
            <div class="empty-state">
              <div class="empty-icon"><i class="fas fa-video-slash"></i></div>
              <p class="empty-text">Aucune vidéo pour le moment</p>
            </div>
          `
            : `
          <div class="video-grid" data-user-id="${user.id}">
            ${videos
              .map(
                (v) => `
              <div class="video-item" data-id="${v.id}">
                <div class="thumbnail-wrapper">
                  <img src="/videos/${v.thumbnailUrl || v.filename}"
                       onerror="this.src='https://picsum.photos/400/600?random=${v.id}'"/>

                  <div class="video-overlay">
                    <div class="video-stats">
                      <div class="video-stat"><i class="fas fa-heart"></i><span>${v.likesCount ?? 0}</span></div>
                      <div class="video-stat"><i class="fas fa-comment"></i><span>${v.commentsCount ?? 0}</span></div>
                    </div>
                  </div>
                </div>
              </div>
            `
              )
              .join("")}
          </div>
          `
        }

        <div style="height: 40px;"></div>
      </div>
    </div>
    `;
}

export function init(params) {
    // Navigation vers feed immersif depuis une vidéo
    document.querySelectorAll(".video-item").forEach((item) => {
        item.addEventListener("click", () => {
            const id = item.dataset.id;
            Router.go(`/videos/feed/${id}`);
        });
    });

    const editBtn = document.getElementById("editProfileBtn");
    if (editBtn) {
        editBtn.addEventListener("click", () => {
            alert("Édition du profil à implémenter");
        });
    }

    // Déconnexion
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            if (confirm("Voulez-vous vous déconnecter ?")) {
                Auth.logout();
            }
        });
    }

    // Bouton Mon Club
    const goToAdminBtn = document.getElementById("goToAdminBtn");
    if (goToAdminBtn) {
       goToAdminBtn.addEventListener("click", () => {
           Router.go("/admin");
       });
    }

    // FOLLOW SYSTEM
    const followBtn = document.getElementById("followBtn");
    if (followBtn) {
        const targetId = followBtn.dataset.targetId;

        async function refreshFollowStatus() {
            try {
                const res = await fetch(`/api/follow/check/${targetId}`, {
                    headers: { "Authorization": Auth.getAuthHeader() }
                });

                if (res.status === 401 || res.status === 403) {
                    followBtn.style.display = "none";
                    return;
                }

                if (!res.ok) {
                    console.warn("follow check failed:", res.status);
                    return;
                }

                const result = await res.json();
                const data = result.data;

                followBtn.classList.toggle("following", data.isFollowing);
                followBtn.textContent = data.isFollowing ? "Abonné" : "S'abonner";

            } catch (e) {
                console.warn("refreshFollowStatus error:", e);
            }
        }

        refreshFollowStatus();

        followBtn.addEventListener("click", async () => {
            followBtn.disabled = true;
            await fetch(`/api/follow/${targetId}`, {
                method: "POST",
                headers: { "Authorization": Auth.getAuthHeader() }
            });
            followBtn.disabled = false;
            refreshFollowStatus();
        });
    }
}