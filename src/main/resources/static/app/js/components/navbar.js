import { Auth } from "../auth.js";

export function Navbar({ hidePostButton = false } = {}) {

    const user = Auth.currentUser;

    // Boutons dynamiques selon le rôle
    let adminButton = "";

    if (user?.highestRole === "SUPER_ADMIN") {
        adminButton = `
            <a href="/admin" class="nav-item nav-admin" data-link>
                <i class="fa-solid fa-user-shield"></i>
                <span>Admin UTF</span>
            </a>
        `;
    }

    if (user?.highestRole === "CLUB_ADMIN") {
        adminButton = `
            <a href="/admin" class="nav-item nav-admin" data-link>

                <i class="fa-solid fa-users-gear"></i>
                <span>Mon Club</span>
            </a>
        `;
    }
return `
    <div class="navbar-wrapper">

        <!-- ⭐ Barre du bas -->
        <nav class="mobile-navbar">
            
            <a href="/feed" class="nav-item" data-link>
                <i class="fa-solid fa-house"></i>
                <span>Home</span>
            </a>

            <a href="/events" class="nav-item" data-link>
                <i class="fa-regular fa-calendar-days"></i>
                <span>Events</span>
            </a>

            <!-- ⭐ Bouton Upload CENTRÉ CORRECTEMENT -->
<a href="/upload" class="nav-upload" data-link>
    <i class="fa-solid fa-plus"></i>
</a>




            <a href="/hub" class="nav-item" data-link>
                <i class="fa-solid fa-tower-broadcast"></i>
                <span>Live</span>
            </a>

            <a href="/profile" class="nav-item" data-link>
                <i class="fa-regular fa-user"></i>
                <span>Profile</span>
            </a>

        </nav>

        <!-- ⭐ Bouton Admin EN DEHORS -->
        ${adminButton}

    </div>
`;
}
