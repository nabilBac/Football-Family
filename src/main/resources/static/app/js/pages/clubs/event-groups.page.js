// /static/app/js/pages/clubs/event-groups.page.js

import { Auth } from "../../auth.js";
import { Router } from "../../router.js";

export async function render(params) {

    const { clubId, eventId } = params;

    // Charger CSS
    if (!document.querySelector('link[href="/css/event-groups.css"]')) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "/css/event-groups.css";
        document.head.appendChild(link);
    }

    // Charger les groupes
    let groups = [];
try {
    const res = await Auth.secureFetch(
        `/api/clubs/${clubId}/events/${eventId}/groups`
    );
    const data = await res.json();

    console.log("GROUPS API →", data);   // <── AJOUTER ICI
    console.log("GROUPS ARRAY →", data.data);

    groups = data.data || [];

} catch (err) {
    console.error(err);
}


    const groupsHtml = groups.length === 0
        ? `<p class="empty">Aucun groupe pour cet événement.</p>`
        : groups.map(g => `
            <div class="group-card" data-id="${g.id}">
                <h3>${g.name}</h3>

                <button class="btn-view" data-group="${g.id}">
                    Voir les matchs →
                </button>
            </div>
        `).join("");

    return `
    <div class="event-groups-page">
        <header class="page-header">
            <button id="backBtn" class="back-btn">
                <i class="fas fa-arrow-left"></i>
            </button>
            <h2>Groupes</h2>
        </header>

        <div class="groups-container">
            ${groupsHtml}
        </div>
    </div>
    `;
}

export function init(params) {

    const { clubId, eventId } = params;

    document.getElementById("backBtn")?.addEventListener("click", () => history.back());

    // Navigation vers les matchs
    document.querySelectorAll(".btn-view").forEach(btn => {
        btn.addEventListener("click", () => {
            const groupId = btn.dataset.group;
            Router.go(`/clubs/${clubId}/events/${eventId}/groups/${groupId}/matches`);
        });
    });
}
