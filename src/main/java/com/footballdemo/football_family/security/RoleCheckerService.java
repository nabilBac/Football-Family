package com.footballdemo.football_family.security;

import com.footballdemo.football_family.dto.CreateEventDTO;
import com.footballdemo.football_family.model.User;
import com.footballdemo.football_family.model.UserRole;
import com.footballdemo.football_family.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.security.core.Authentication;
import com.footballdemo.football_family.model.EventType;


@Component("roleChecker")
@RequiredArgsConstructor
public class RoleCheckerService {

    private final UserService userService;

     private User getCurrentUser() {
        return userService.getCurrentUser();
    }

  public boolean canCreateEvent(Authentication authentication, CreateEventDTO dto) {
        User user = getCurrentUser();
        if (user == null) {
            return false;
        }

        // 🌍 Open event : UTF public → tout utilisateur connecté
        if (dto.getType() == EventType.OPEN_EVENT) {
            return true;
        }

        // 🔒 Club event : réservé aux rôles forts
        if (dto.getType() == EventType.CLUB_EVENT) {
            return user.getRoles()
                    .stream()
                    .anyMatch(role -> role.canCreateClubEvent());
        }

        return false;
    }

    public boolean canManageTeam(Authentication authentication) {
        User user = getCurrentUser();
        if (user == null)
            return false;

        return user.getRoles()
                .stream()
                .anyMatch(UserRole::canManageTeam);
    }

    public boolean canAccessAdminPanel(Authentication authentication) {
        User user = getCurrentUser();
        if (user == null)
            return false;

        return user.getRoles()
                .stream()
                .anyMatch(UserRole::canAccessAdminPanel);
    }

    public boolean isSuperAdmin(Authentication authentication) {
        User user = getCurrentUser();
        return user != null && user.getRoles().contains(UserRole.SUPER_ADMIN);
    }

    public boolean canValidateRegistration(Authentication authentication) {
        User user = getCurrentUser();
        if (user == null)
            return false;

        return user.getRoles()
                .stream()
                .anyMatch(UserRole::canValidateRegistration);
    }
}


