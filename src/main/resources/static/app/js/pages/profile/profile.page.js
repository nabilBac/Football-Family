// /static/app/js/pages/profile/profile.page.js
// ✅ VERSION PRO — Design social inspiré de la démo HTML "Profile Social"
// Conserve toute la logique existante (Auth, follow, vidéos, delete)

import { Auth } from "../../auth.js";
import { Router } from "../../router.js";

// =====================================================
// 🎨 CSS INJECTION (une seule fois)
// =====================================================
function injectProfileStyles() {
    if (document.getElementById('profile-pro-css')) return;
    const style = document.createElement('style');
    style.id = 'profile-pro-css';
    style.textContent = `
    /* ════════════════════════════════════════
       PROFILE SOCIAL PRO — LIGHT THEME
    ════════════════════════════════════════ */
    @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800;900&family=Unbounded:wght@700;900&display=swap');

    :root {
        --pp-bg: #f5f5f0;
        --pp-white: #ffffff;
        --pp-dark: #0d0d0d;
        --pp-dark2: #1a1a1a;
        --pp-border: #e8e4de;
        --pp-border2: #d4cfc8;
        --pp-accent: #16c060;
        --pp-accent-d: #0fa050;
        --pp-accent-light: #e8faf0;
        --pp-orange: #ff6b2b;
        --pp-orange-light: #fff2ec;
        --pp-blue: #2563eb;
        --pp-blue-light: #eff6ff;
        --pp-muted: #8a8580;
        --pp-muted2: #b5b0aa;
        --pp-text: #1a1a1a;
        --pp-red: #e53e3e;
    }

    .pp-profile-page {
        font-family: 'Nunito', sans-serif;
        background: var(--pp-bg);
        color: var(--pp-text);
        min-height: 100vh;
        padding-bottom: 40px;
    }

    /* ── COVER ── */
    .pp-cover {
        height: 180px;
        background: linear-gradient(135deg, #0d0d0d 0%, #1a2e1a 50%, #0d1a2e 100%);
        border-radius: 0 0 20px 20px;
        position: relative;
        overflow: hidden;
    }
    .pp-cover-pitch {
        position: absolute; inset: 0; opacity: .08;
        background-image:
            repeating-linear-gradient(0deg, transparent, transparent 40px, #fff 40px, #fff 41px),
            repeating-linear-gradient(90deg, transparent, transparent 40px, #fff 40px, #fff 41px);
    }
    .pp-cover-arc {
        position: absolute; left: 50%; bottom: -30px; transform: translateX(-50%);
        width: 120px; height: 120px; border: 2px solid rgba(255,255,255,.15); border-radius: 50%;
    }

    /* ── HERO ── */
    .pp-hero-wrap {
        max-width: 900px;
        margin: 0 auto;
        padding: 0 20px;
    }
    .pp-hero {
        background: var(--pp-white);
        border-radius: 20px;
        border: 1.5px solid var(--pp-border);
        margin-top: -24px;
        padding: 20px 24px;
        position: relative;
        animation: ppFadeIn 0.4s ease;
    }
    @keyframes ppFadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
    }
    .pp-hero-top {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 16px;
    }
    .pp-av-zone {
        display: flex;
        align-items: flex-end;
        gap: 14px;
    }
    .pp-avatar {
        width: 88px; height: 88px; border-radius: 50%;
        background: linear-gradient(135deg, #16c060, #2563eb);
        border: 4px solid var(--pp-white);
        display: flex; align-items: center; justify-content: center;
        font-family: 'Unbounded', sans-serif;
        font-size: 26px; font-weight: 900; color: #fff;
        margin-top: -40px;
        box-shadow: 0 4px 20px rgba(0,0,0,.12);
        flex-shrink: 0;
        overflow: hidden;
    }
    .pp-avatar img {
        width: 100%; height: 100%; object-fit: cover; border-radius: 50%;
    }
    .pp-name {
        font-family: 'Unbounded', sans-serif;
        font-size: 18px; font-weight: 900; letter-spacing: -.5px;
    }
    .pp-handle {
        font-size: 13px; color: var(--pp-muted); margin-top: 3px;
    }
    .pp-hero-actions {
        display: flex; gap: 8px; align-items: center;
        flex-shrink: 0; padding-top: 4px; flex-wrap: wrap;
    }

    /* BOUTONS */
    .pp-btn {
        display: inline-flex; align-items: center; gap: 7px;
        padding: 9px 18px; border-radius: 99px; border: none;
        cursor: pointer; font-family: 'Nunito', sans-serif;
        font-size: 13px; font-weight: 700; transition: .15s;
        text-decoration: none;
    }
    .pp-btn-dark { background: var(--pp-dark); color: #fff; }
    .pp-btn-dark:hover { background: var(--pp-dark2); }
    .pp-btn-outline {
        background: transparent; color: var(--pp-dark);
        border: 1.5px solid var(--pp-border2);
    }
    .pp-btn-outline:hover { background: var(--pp-bg); }
    .pp-btn-green { background: var(--pp-accent); color: #fff; }
    .pp-btn-green:hover { background: var(--pp-accent-d); }
    .pp-btn-danger { background: var(--pp-red); color: #fff; }
    .pp-btn-danger:hover { background: #c53030; }
    .pp-btn-sm { padding: 6px 14px; font-size: 12px; }
    .pp-btn.following { background: var(--pp-accent-light); color: var(--pp-accent-d); border: 1.5px solid #b2e8cc; }

    /* BIO */
    .pp-hero-bio {
        font-size: 14px; color: #444; line-height: 1.6;
        margin-top: 14px; max-width: 520px;
    }

    /* TAGS */
    .pp-hero-tags {
        display: flex; gap: 8px; flex-wrap: wrap; margin-top: 10px;
    }
    .pp-htag {
        display: inline-flex; align-items: center; gap: 5px;
        padding: 5px 12px; border-radius: 99px;
        font-size: 12px; font-weight: 700;
        background: var(--pp-bg); border: 1.5px solid var(--pp-border);
    }
    .pp-htag.green { background: var(--pp-accent-light); color: var(--pp-accent-d); border-color: #b2e8cc; }
    .pp-htag.orange { background: var(--pp-orange-light); color: var(--pp-orange); border-color: #ffd4bc; }
    .pp-htag.blue { background: var(--pp-blue-light); color: var(--pp-blue); border-color: #bdd4f8; }

    /* META */
    .pp-hero-meta {
        display: flex; gap: 20px; margin-top: 14px; flex-wrap: wrap;
    }
    .pp-hm {
        font-size: 13px; color: var(--pp-muted);
        display: flex; align-items: center; gap: 5px;
    }
    .pp-hm strong { color: var(--pp-text); }

    /* STATS PILLS */
    .pp-stats-pills {
        display: flex; gap: 10px; flex-wrap: wrap; margin-top: 16px;
        padding-top: 16px; border-top: 1.5px solid var(--pp-border);
    }
    .pp-stat-pill {
        flex: 1; min-width: 80px; text-align: center;
        background: var(--pp-bg); border-radius: 14px; padding: 12px 8px;
        border: 1.5px solid var(--pp-border);
    }
    .pp-sp-val {
        font-family: 'Unbounded', sans-serif;
        font-size: 20px; font-weight: 900;
    }
    .pp-sp-val.green { color: var(--pp-accent-d); }
    .pp-sp-val.orange { color: var(--pp-orange); }
    .pp-sp-val.blue { color: var(--pp-blue); }
    .pp-sp-val.red { color: var(--pp-red); }
    .pp-sp-lbl {
        font-size: 11px; color: var(--pp-muted); margin-top: 4px; font-weight: 700;
    }

    /* ── TABS ── */
    .pp-tabs {
        max-width: 900px; margin: 20px auto 0; padding: 0 20px;
    }
    .pp-tabs-bar {
        background: var(--pp-white); border: 1.5px solid var(--pp-border);
        border-radius: 14px; padding: 4px;
        display: flex; gap: 0; overflow-x: auto;
    }
    .pp-tab {
        flex: 1; padding: 10px 16px; border: none; background: none;
        font-family: 'Nunito', sans-serif; font-size: 13px; font-weight: 700;
        color: var(--pp-muted); cursor: pointer;
        border-radius: 10px; transition: .2s; white-space: nowrap;
        text-align: center;
    }
    .pp-tab.active {
        background: var(--pp-dark); color: #fff;
    }
    .pp-tab:hover:not(.active) { color: var(--pp-text); background: var(--pp-bg); }

    /* ── CONTENT ── */
    .pp-content {
        max-width: 900px; margin: 20px auto 0; padding: 0 20px;
    }

    /* VIDEO GRID */
    .pp-video-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 3px;
        border-radius: 14px;
        overflow: hidden;
    }
    .pp-video-item {
        position: relative; cursor: pointer; overflow: hidden;
        background: linear-gradient(160deg, #0a1a0d, #091830);
        aspect-ratio: 1;
    }
    .pp-video-item img {
        width: 100%; height: 100%; object-fit: cover;
        transition: .2s;
    }
    .pp-video-item:hover img { transform: scale(1.05); filter: brightness(.85); }
    .pp-video-overlay {
        position: absolute; inset: 0;
        background: rgba(0,0,0,.45);
        display: flex; flex-direction: column;
        align-items: center; justify-content: center;
        gap: 6px; opacity: 0; transition: .2s;
    }
    .pp-video-item:hover .pp-video-overlay { opacity: 1; }
    .pp-video-stats {
        display: flex; gap: 14px;
    }
    .pp-video-stat {
        display: flex; align-items: center; gap: 4px;
        color: #fff; font-size: 13px; font-weight: 700;
    }
    .pp-delete-btn {
        position: absolute; top: 8px; right: 8px;
        width: 32px; height: 32px; border-radius: 50%;
        background: rgba(229,62,62,.85); color: #fff;
        border: none; cursor: pointer; font-size: 14px;
        display: flex; align-items: center; justify-content: center;
        opacity: 0; transition: .2s; z-index: 2;
    }
    .pp-video-item:hover .pp-delete-btn { opacity: 1; }
    .pp-delete-btn:hover { background: var(--pp-red); transform: scale(1.1); }

    /* EMPTY STATE */
    .pp-empty {
        text-align: center; padding: 60px 20px;
        background: var(--pp-white); border: 1.5px solid var(--pp-border);
        border-radius: 18px;
    }
    .pp-empty-icon { font-size: 48px; margin-bottom: 12px; }
    .pp-empty-text { font-size: 15px; color: var(--pp-muted); font-weight: 600; }

    /* ── RESPONSIVE ── */
    @media (max-width: 768px) {
        .pp-hero-top { flex-direction: column; }
        .pp-hero-actions { width: 100%; }
        .pp-hero-actions .pp-btn { flex: 1; justify-content: center; }
        .pp-stats-pills { gap: 6px; }
        .pp-stat-pill { min-width: 60px; padding: 10px 4px; }
        .pp-sp-val { font-size: 16px; }
        .pp-video-grid { grid-template-columns: repeat(3, 1fr); gap: 2px; }
        .pp-cover { height: 140px; }
        .pp-name { font-size: 16px; }
        .pp-tab { font-size: 12px; padding: 8px 10px; }
    }
    @media (max-width: 480px) {
        .pp-video-grid { grid-template-columns: repeat(2, 1fr); }
        .pp-hero { padding: 16px; }
        .pp-hero-meta { gap: 12px; }
        .pp-stats-pills { flex-wrap: wrap; }
        .pp-stat-pill { min-width: calc(33% - 6px); }
    }
    `;
    document.head.appendChild(style);
}


// =====================================================
// 🎨 RENDER
// =====================================================
export async function render(params) {

    injectProfileStyles();

    // Charger l'utilisateur courant
    const token =
        Auth.accessToken ||
        localStorage.getItem("token") ||
        localStorage.getItem("accessToken") ||
        sessionStorage.getItem("token");

    if (!Auth.currentUser && token) {
        Auth.accessToken = token;
        try { await Auth.loadUser(); } catch(e) { console.warn(e); }
    }

    const username = params?.id || params?.username || Auth.currentUser?.username;

    if (!username) {
        return `
            <div class="pp-profile-page">
                <div class="pp-empty" style="margin:40px auto;max-width:400px">
                    <div class="pp-empty-icon">👤</div>
                    <p class="pp-empty-text">Utilisateur non identifié.</p>
                </div>
            </div>
        `;
    }

    // ✅ CHARGER LE PROFIL API
    let data;
    try {
        const res = await fetch(`/api/profile/${encodeURIComponent(username)}?t=${Date.now()}`, {
            headers: {
                "Authorization": Auth.getAuthHeader(),
                "Cache-Control": "no-cache, no-store, must-revalidate",
                "Pragma": "no-cache"
            }
        });
        if (!res.ok) throw new Error("Profil introuvable");
        data = await res.json();
    } catch (e) {
        return `
            <div class="pp-profile-page">
                <div class="pp-empty" style="margin:40px auto;max-width:400px">
                    <div class="pp-empty-icon">😕</div>
                    <p class="pp-empty-text">Impossible de charger le profil.</p>
                </div>
            </div>
        `;
    }

    const user = data.user;
    const videos = data.videos || [];
    let isCurrentUser = data.isCurrentUser === true;

    if (!isCurrentUser && Auth.currentUser?.id && user?.id && Number(Auth.currentUser.id) === Number(user.id)) {
        isCurrentUser = true;
    }

    const followersCount = user.followersCount ?? user.followers ?? 0;
    const followingCount = user.followingCount ?? user.following ?? 0;

    const avatarUrl = user.avatarUrl ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}&background=16c060&color=fff&size=200`;

    // Initiales pour le fallback
    const initials = (user.username || 'U').substring(0, 2).toUpperCase();

    // =====================================================
    // 🎨 HTML TEMPLATE
    // =====================================================
    return `
    <div class="pp-profile-page">

        <!-- ══ COVER ══ -->
        <div class="pp-cover">
            <div class="pp-cover-pitch"></div>
            <div class="pp-cover-arc"></div>
        </div>

        <!-- ══ HERO ══ -->
        <div class="pp-hero-wrap">
            <div class="pp-hero" data-profile-id="${user.id}">
                <div class="pp-hero-top">
                    <div class="pp-av-zone">
                        <div class="pp-avatar">
                            <img src="${avatarUrl}"
                                 alt="${user.username}"
                                 onerror="this.style.display='none';this.parentElement.textContent='${initials}';">
                        </div>
                        <div>
                            <div class="pp-name">${escapeHtml(user.firstName && user.lastName ? user.firstName + ' ' + user.lastName : user.username)}</div>
                            <div class="pp-handle">@${escapeHtml(user.username)}${user.city ? ' · ' + escapeHtml(user.city) : ''}</div>
                        </div>
                    </div>

                    <div class="pp-hero-actions">
                        ${isCurrentUser ? `
                            ${Auth.currentUser?.clubId != null ? `
                                <a href="/club-admin" data-link class="pp-btn pp-btn-green pp-btn-sm">
                                    <i class="fas fa-users-gear"></i> Mon Club
                                </a>
                            ` : `
                                <a href="/account/club/create" data-link class="pp-btn pp-btn-green pp-btn-sm">
                                    <i class="fas fa-trophy"></i> Créer mon club
                                </a>
                            `}
                            <button class="pp-btn pp-btn-outline pp-btn-sm" id="editProfileBtn">
                                <i class="fas fa-pen"></i> Éditer
                            </button>
                            <a href="/account" data-link class="pp-btn pp-btn-outline pp-btn-sm">
                                <i class="fas fa-user-cog"></i> Compte
                            </a>
                            <button class="pp-btn pp-btn-outline pp-btn-sm" id="logoutBtn" style="color:var(--pp-red);border-color:var(--pp-red)">
                                <i class="fas fa-sign-out-alt"></i>
                            </button>
                        ` : `
                            <button class="pp-btn pp-btn-outline pp-btn-sm">
                                💬 Message
                            </button>
                            <button class="pp-btn pp-btn-dark" id="followBtn" data-target-id="${user.id}">
                                ➕ S'abonner
                            </button>
                        `}
                    </div>
                </div>

                ${user.bio ? `
                    <div class="pp-hero-bio">${escapeHtml(user.bio)}</div>
                ` : ''}

                <!-- TAGS -->
                <div class="pp-hero-tags">
                    ${user.position ? `<span class="pp-htag green">⚽ ${escapeHtml(user.position)}</span>` : ''}
                    ${user.clubName ? `<span class="pp-htag orange">🏟️ ${escapeHtml(user.clubName)}</span>` : ''}
                    ${user.age ? `<span class="pp-htag blue">🎂 ${user.age} ans</span>` : ''}
                    ${user.city ? `<span class="pp-htag">📍 ${escapeHtml(user.city)}</span>` : ''}
                </div>

                <!-- META -->
                <div class="pp-hero-meta">
                    <span class="pp-hm">👥 <strong>${followersCount}</strong> abonnés</span>
                    <span class="pp-hm">👤 <strong>${followingCount}</strong> abonnements</span>
                    ${user.createdAt ? `
                        <span class="pp-hm">📅 Membre depuis <strong>${new Date(user.createdAt).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}</strong></span>
                    ` : ''}
                </div>

                <!-- STATS PILLS -->
                <div class="pp-stats-pills">
                    <div class="pp-stat-pill">
                        <div class="pp-sp-val green">${videos.length}</div>
                        <div class="pp-sp-lbl">Vidéos</div>
                    </div>
                    <div class="pp-stat-pill">
                        <div class="pp-sp-val orange">${followersCount}</div>
                        <div class="pp-sp-lbl">Abonnés</div>
                    </div>
                    <div class="pp-stat-pill">
                        <div class="pp-sp-val blue">${followingCount}</div>
                        <div class="pp-sp-lbl">Abonnements</div>
                    </div>
                    <div class="pp-stat-pill">
                        <div class="pp-sp-val">${videos.reduce((s, v) => s + (v.viewsCount || 0), 0).toLocaleString('fr-FR')}</div>
                        <div class="pp-sp-lbl">Vues totales</div>
                    </div>
                    <div class="pp-stat-pill">
                        <div class="pp-sp-val red">${videos.reduce((s, v) => s + (v.likesCount || 0), 0).toLocaleString('fr-FR')}</div>
                        <div class="pp-sp-lbl">Likes reçus</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- ══ TABS ══ -->
        <div class="pp-tabs">
            <div class="pp-tabs-bar">
                <button class="pp-tab active" data-tab="grid">📸 Publications</button>
                <button class="pp-tab" data-tab="likes">❤️ Likes</button>
                ${isCurrentUser ? `<button class="pp-tab" data-tab="saved">🔖 Enregistrés</button>` : ''}
            </div>
        </div>

        <!-- ══ VIDEO GRID ══ -->
        <div class="pp-content">
            ${videos.length === 0 ? `
                <div class="pp-empty">
                    <div class="pp-empty-icon">🎬</div>
                    <p class="pp-empty-text">Aucune vidéo pour le moment</p>
                </div>
            ` : `
                <div class="pp-video-grid" data-user-id="${user.id}">
                    ${videos.map(v => `
                        <div class="pp-video-item" data-id="${v.id}">
                            <img src="/videos/${v.thumbnailUrl || v.filename}"
                                 onerror="this.src='https://picsum.photos/400/400?random=${v.id}'"
                                 alt="">
                            <div class="pp-video-overlay">
                                <div class="pp-video-stats">
                                    <span class="pp-video-stat">❤️ ${v.likesCount ?? 0}</span>
                                    <span class="pp-video-stat">💬 ${v.commentsCount ?? 0}</span>
                                </div>
                            </div>
                            ${isCurrentUser ? `
                                <button class="pp-delete-btn delete-video-btn" data-video-id="${v.id}" title="Supprimer">
                                    <i class="fas fa-trash"></i>
                                </button>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>
            `}
        </div>

        <div style="height:40px"></div>
    </div>
    `;
}


// =====================================================
// ⚡ INIT — Event listeners
// =====================================================
export function init(params) {

    // 🗑️ SUPPRESSION VIDÉO
    document.querySelectorAll(".delete-video-btn").forEach((btn) => {
        btn.addEventListener("click", async (e) => {
            e.stopPropagation();
            const videoId = btn.dataset.videoId;
            if (!confirm("Supprimer cette vidéo définitivement ?")) return;

            try {
                const res = await Auth.secureFetch(`/api/videos/${videoId}`, {
                    method: "DELETE"
                });
                if (!res.ok) throw new Error();
                btn.closest(".pp-video-item").remove();
            } catch (e) {
                alert("Erreur lors de la suppression.");
            }
        });
    });

    // Navigation vers feed immersif
    document.querySelectorAll(".pp-video-item").forEach((item) => {
        item.addEventListener("click", (e) => {
            if (e.target.closest('.delete-video-btn')) return;
            const id = item.dataset.id;
            Router.go(`/videos/feed/profile/${id}`);
        });
    });

    // Tabs (local switching)
    document.querySelectorAll(".pp-tab").forEach(tab => {
        tab.addEventListener("click", () => {
            document.querySelectorAll(".pp-tab").forEach(t => t.classList.remove("active"));
            tab.classList.add("active");
            // Future: switch content based on data-tab
        });
    });

    // Edit profil
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

                if (!res.ok) return;

                const result = await res.json();
                const data = result.data;

                followBtn.classList.toggle("following", data.isFollowing);
                followBtn.innerHTML = data.isFollowing ? "✓ Abonné" : "➕ S'abonner";
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


// =====================================================
// 🔐 UTILITAIRE
// =====================================================
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}