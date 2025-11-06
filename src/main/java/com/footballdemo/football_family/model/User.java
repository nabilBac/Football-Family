package com.footballdemo.football_family.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "users", uniqueConstraints = {
        @UniqueConstraint(columnNames = "username"),
        @UniqueConstraint(columnNames = "email")
}, indexes = {
        @Index(name = "idx_username", columnList = "username"),
        @Index(name = "idx_email", columnList = "email")
})
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String username;

    @JsonIgnore
    private String password;

    private String email;

    @Column(length = 255) // Assurez-vous d'avoir une taille appropriée
    private String avatarUrl;

    // 🎭 RÔLES
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "user_roles", joinColumns = @JoinColumn(name = "user_id"))
    @Enumerated(EnumType.STRING)
    @Column(name = "role")
    private Set<UserRole> roles = new HashSet<>();

    // 🏢 RELATION AVEC CLUB
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "club_id")
    private Club club;

    // 📋 CHAMPS POUR LES ORGANISATEURS
    @Column(length = 14)
    private String siret;

    @Column(length = 100)
    private String organizationName;

    @Column(nullable = false)
    private Boolean verified = false;

    private LocalDate verifiedAt;

    // 🔹 ÉVÉNEMENTS ORGANISÉS
    @OneToMany(mappedBy = "organizer")
    private List<Event> eventsOrganized = new ArrayList<>();

    // 🔹 INSCRIPTIONS AUX ÉVÉNEMENTS
    @OneToMany(mappedBy = "player")
    private List<EventRegistration> registrations = new ArrayList<>();

    // 🔹 ÉQUIPES ENTRAÎNÉES
    @OneToMany(mappedBy = "coach")
    private List<Team> teamsCoached = new ArrayList<>();

    // 🔹 ÉQUIPE DU JOUEUR
    @ManyToOne
    @JoinColumn(name = "team_id")
    @JsonBackReference
    private Team team;

    // 👤 CONSTRUCTEURS
    public User() {
        this.roles.add(UserRole.USER); // Rôle par défaut
    }

    public User(String username, String email, String password) {
        this.username = username;
        this.email = email;
        this.password = password;
        this.roles = new HashSet<>();
        this.roles.add(UserRole.USER); // Rôle par défaut
    }

    // 🔧 GETTERS & SETTERS DE BASE

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    // 🎭 GETTERS & SETTERS RÔLES

    public Set<UserRole> getRoles() {
        return roles;
    }

    public void setRoles(Set<UserRole> roles) {
        this.roles = roles;
    }

    // 🏢 GETTERS & SETTERS CLUB

    public Club getClub() {
        return club;
    }

    public void setClub(Club club) {
        this.club = club;
    }

    // 📋 GETTERS & SETTERS ORGANISATEUR

    public String getSiret() {
        return siret;
    }

    public void setSiret(String siret) {
        this.siret = siret;
    }

    public String getOrganizationName() {
        return organizationName;
    }

    public void setOrganizationName(String organizationName) {
        this.organizationName = organizationName;
    }

    public boolean isVerified() {
        // Si 'verified' est NULL dans la DB, on retourne FALSE par défaut.
        return verified != null ? verified : false;
    }

    public void setVerified(Boolean verified) {
        this.verified = verified;
    }

    public LocalDate getVerifiedAt() {
        return verifiedAt;
    }

    public void setVerifiedAt(LocalDate verifiedAt) {
        this.verifiedAt = verifiedAt;
    }

    // 🔹 GETTERS RELATIONS

    public Team getTeam() {
        return team;
    }

    public void setTeam(Team team) {
        this.team = team;
    }

    public List<Event> getEventsOrganized() {
        return eventsOrganized;
    }

    public void setEventsOrganized(List<Event> eventsOrganized) {
        this.eventsOrganized = eventsOrganized;
    }

    public List<EventRegistration> getRegistrations() {
        return registrations;
    }

    public void setRegistrations(List<EventRegistration> registrations) {
        this.registrations = registrations;
    }

    public List<Team> getTeamsCoached() {
        return teamsCoached;
    }

    public void setTeamsCoached(List<Team> teamsCoached) {
        this.teamsCoached = teamsCoached;
    }

    // 🔹 MÉTHODES HELPER POUR LES RÔLES

    public boolean hasRole(UserRole role) {
        return roles != null && roles.contains(role);
    }

    public boolean hasAnyRole(UserRole... rolesToCheck) {
        return roles != null && roles.stream().anyMatch(Set.of(rolesToCheck)::contains);
    }

    public void addRole(UserRole role) {
        if (this.roles == null) {
            this.roles = new HashSet<>();
        }
        this.roles.add(role);
    }

    public void removeRole(UserRole role) {
        if (this.roles != null) {
            this.roles.remove(role);
        }
    }

    public boolean canCreateEvent() {
        return roles != null && roles.stream().anyMatch(UserRole::canCreateEvent);
    }

    public boolean canManageTeam() {
        return roles != null && roles.stream().anyMatch(UserRole::canManageTeam);
    }

    public boolean canValidateRegistration() {
        return roles != null && roles.stream().anyMatch(UserRole::canValidateRegistration);
    }

    public boolean canModerate() {
        return roles != null && roles.stream().anyMatch(UserRole::canModerate);
    }

    // 🔹 MÉTHODES UTILITAIRES SUPPLÉMENTAIRES

    public boolean isClubAdmin() {
        return hasRole(UserRole.CLUB_ADMIN);
    }

    public boolean isCoach() {
        return hasRole(UserRole.COACH);
    }

    public boolean isSuperAdmin() {
        return hasRole(UserRole.SUPER_ADMIN);
    }

    // 🔹 SPRING SECURITY - Conversion en GrantedAuthority

    public Collection<? extends GrantedAuthority> getAuthorities() {
        if (roles == null || roles.isEmpty()) {
            return List.of(new SimpleGrantedAuthority("ROLE_USER"));
        }
        return roles.stream()
                .map(role -> new SimpleGrantedAuthority("ROLE_" + role.name()))
                .collect(Collectors.toList());
    }

    @Override
    public String toString() {
        return "User{" +
                "id=" + id +
                ", username='" + username + '\'' +
                ", email='" + email + '\'' +
                ", roles=" + roles +
                ", club=" + (club != null ? club.getName() : "null") +
                ", verified=" + verified +
                '}';
    }

    public String getAvatarUrl() {
        // 🎯 CRITIQUE : Retourne une image par défaut si le champ est null ou vide
        if (avatarUrl == null || avatarUrl.isEmpty()) {
            return "/assets/default-avatar.png"; // Utilisez le chemin vers votre avatar par défaut
        }
        return avatarUrl;
    }

    public void setAvatarUrl(String avatarUrl) {
        this.avatarUrl = avatarUrl;
    }
}