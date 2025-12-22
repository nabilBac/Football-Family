package com.footballdemo.football_family.service;

import com.footballdemo.football_family.exception.ForbiddenException;
import com.footballdemo.football_family.model.Event;
import com.footballdemo.football_family.model.EventVisibility;
import com.footballdemo.football_family.model.RegistrationType;
import com.footballdemo.football_family.model.User;
import com.footballdemo.football_family.model.UserRole;
import org.springframework.stereotype.Service;

@Service
public class EventAccessService {



    private final AppModeService appModeService;

    public EventAccessService(AppModeService appModeService) {
        this.appModeService = appModeService;
    }

    // ==========================================================
    // 🔍 Vérifier si un user peut VOIR un event
    // ==========================================================
    public void assertCanView(Event event, User user) {

        // 1️⃣ Organisateur
        if (event.getOrganizer() != null &&
                event.getOrganizer().getId().equals(user.getId())) {
            return;
        }

        // 2️⃣ PUBLIC
        if (event.getVisibility() == EventVisibility.PUBLIC) {
            return;
        }

        // 3️⃣ CLUB_ONLY → même club
     if (event.getRegistrationType() == RegistrationType.CLUB_ONLY) {

    Long eventClubId = event.getClub() != null ? event.getClub().getId() : null;

    if (eventClubId == null) {
        throw new ForbiddenException("Événement réservé au club mais aucun club défini.");
    }

    // ✅ DEV MODE — on laisse passer pour tester le workflow
    if (appModeService.isDev() &&
        (user.hasRole(UserRole.CLUB_ADMIN) || user.hasRole(UserRole.SUPER_ADMIN))) {
        return;
    }

    // ✅ MODE NORMAL — même club uniquement
    if (user.getClubIds() != null && user.getClubIds().contains(eventClubId)) {
        return;
    }

    throw new ForbiddenException("Accès refusé : réservé au club.");
}



        // 4️⃣ Privé
        throw new ForbiddenException("Événement privé, accès refusé.");
    }


    // ==========================================================
    // 🛠 Vérifier si un user peut GÉRER un event
    // ==========================================================
    public void assertCanManage(Event event, User user) {

        // SUPER ADMIN → accès total
        if (user.hasRole(UserRole.SUPER_ADMIN)) return;

        // Organisateur
        if (event.getOrganizer() != null &&
                event.getOrganizer().getId().equals(user.getId())) {
            return;
        }

        // CLUB_EVENT → ADMIN / MANAGER / COACH DU CLUB
       if (event.getRegistrationType() == RegistrationType.CLUB_ONLY &&
    event.getClub() != null &&
    user.getClubIds() != null &&
    user.getClubIds().contains(event.getClub().getId())) {


            if (user.hasRole(UserRole.CLUB_ADMIN) ||
                user.hasRole(UserRole.COACH)) {

                return;
            }
        }

        throw new ForbiddenException("Vous n'avez pas les droits pour gérer cet événement.");
    }


    // ==========================================================
    // ⚽ Vérifier si un user peut SCORER un match
    // ==========================================================
    public void assertCanScore(Event event, User user) {

        // SUPER_ADMIN
        if (user.hasRole(UserRole.SUPER_ADMIN)) return;

        // Organisateur
        if (event.getOrganizer() != null &&
                event.getOrganizer().getId().equals(user.getId())) {
            return;
        }

        // CLUB staff
     if (event.getClub() != null &&
    user.getClubIds() != null &&
    user.getClubIds().contains(event.getClub().getId()) &&
    (user.hasRole(UserRole.COACH) || user.hasRole(UserRole.CLUB_ADMIN))) {


            return;
        }

        throw new ForbiddenException("Vous n'avez pas les permissions pour saisir un score.");
    }


    public void assertCanViewRankings(Event event, User user) {

    // 🔓 PUBLIC → tout le monde
    if (event.getVisibility() == EventVisibility.PUBLIC) return;

    // 👑 organisateur
    if (event.getOrganizer() != null &&
        event.getOrganizer().getId().equals(user.getId())) return;

    // 🏟️ tout utilisateur connecté peut voir les classements
    if (user != null) return;

    throw new ForbiddenException("Accès refusé aux classements");
}

}
