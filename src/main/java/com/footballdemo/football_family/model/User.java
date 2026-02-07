package com.footballdemo.football_family.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.util.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(
        name = "users",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = "username"),
                @UniqueConstraint(columnNames = "email")
        },
        indexes = {
                @Index(name = "idx_username", columnList = "username"),
                @Index(name = "idx_email", columnList = "email")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String username;

    @JsonIgnore
    private String password;

    private String email;

    private String avatarUrl;

    // ==========================================================
    // SIRET / ORGANISATION
    // ==========================================================
    @Column(length = 14)
    private String siret;

    @Column(length = 150)
    private String organizationName;

    // ==========================================================
    // ROLES
    // ==========================================================
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "user_roles", joinColumns = @JoinColumn(name = "user_id"))
    @Enumerated(EnumType.STRING)
    @Column(name = "role")
    private Set<UserRole> roles = new HashSet<>();

    public void addRole(UserRole role) {
        roles.add(role);
    }

    public boolean hasRole(UserRole role) {
        return roles.contains(role);
    }

  public String getHighestRole() {
    if (roles.contains(UserRole.SUPER_ADMIN)) return "SUPER_ADMIN";
    if (roles.contains(UserRole.CLUB_ADMIN)) return "CLUB_ADMIN";
    if (roles.contains(UserRole.ORGANIZER)) return "ORGANIZER";
    if (roles.contains(UserRole.COACH)) return "COACH";
    if (roles.contains(UserRole.PLAYER)) return "PLAYER";
    return "USER";
}


    // ==========================================================
    // VERIFICATION UTF
    // ==========================================================
    @Column(nullable = false)
    private Boolean verified = false;

    public boolean isVerified() {
        return Boolean.TRUE.equals(verified);
    }

    private LocalDate verifiedAt;

    // ==========================================================
    // RELATION AVEC CLUBS (via ClubUser)
    // ==========================================================
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<ClubUser> clubUsers = new ArrayList<>();

    // Retourne LE club principal du user
    public Long getPrimaryClubId() {
        if (clubUsers == null || clubUsers.isEmpty()) return null;
        return clubUsers.get(0).getClub().getId();
    }

    // Retourne TOUS les clubs du user
    public List<Long> getClubIds() {
        return clubUsers.stream()
                .map(cu -> cu.getClub().getId())
                .toList();
    }

    // ==========================================================
    // RELATIONS EVENTS
    // ==========================================================
    @OneToMany(mappedBy = "organizer")
    @JsonIgnore
    private List<Event> eventsOrganized = new ArrayList<>();

    @OneToMany(mappedBy = "player")
    @JsonIgnore
    private List<EventRegistration> registrations = new ArrayList<>();

    // ==========================================================
    // AUTHORITIES
    // ==========================================================
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return roles.stream()
                .map(r -> new SimpleGrantedAuthority("ROLE_" + r.name()))
                .toList();
    }
  public boolean isSuperAdmin() {
    return roles.contains(UserRole.SUPER_ADMIN);
}

public boolean isClubAdmin() {
    return roles.contains(UserRole.CLUB_ADMIN);
}

public boolean isOrganizer() {
    return roles.contains(UserRole.ORGANIZER);
}

public boolean isCoach() {
    return roles.contains(UserRole.COACH);
}


}
