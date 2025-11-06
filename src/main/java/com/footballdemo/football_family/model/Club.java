package com.footballdemo.football_family.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "club", indexes = {
        @Index(name = "idx_club_siret", columnList = "siret"),
        @Index(name = "idx_club_verified", columnList = "verified")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Club {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(unique = true, length = 14)
    private String siret; // Numéro SIRET (14 chiffres)

    @Column(length = 200)
    private String address;

    @Column(length = 100)
    private String city;

    @Column(length = 5)
    private String zipCode;

    @Column(length = 20)
    private String phone;

    @Column(length = 100)
    private String email;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ClubType type;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String logo; // URL ou chemin du logo

    @OneToMany(mappedBy = "club", cascade = CascadeType.ALL)
    private List<User> members = new ArrayList<>();

    @OneToMany(mappedBy = "club", cascade = CascadeType.ALL)
    private List<Team> teams = new ArrayList<>();

    @OneToMany(mappedBy = "club")
    private List<Event> events = new ArrayList<>();

    @Enumerated(EnumType.STRING)

    @Column(nullable = false)

    private ClubStatus status = ClubStatus.PENDING;

    @Column(nullable = false)
    private LocalDate createdAt;

    private LocalDate verifiedAt; // Date de vérification

    @ManyToOne
    @JoinColumn(name = "verified_by")
    private User verifiedBy; // Admin qui a vérifié

    // Documents de vérification
    private String kbisDocument; // Chemin vers le document Kbis
    private String insuranceDocument; // Chemin vers l'assurance

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDate.now();
    }

    // Méthodes helper
    public void addMember(User user) {
        if (!members.contains(user)) {
            members.add(user);
            user.setClub(this);
        }
    }

    public void removeMember(User user) {
        if (members.contains(user)) {
            members.remove(user);
            user.setClub(null);
        }
    }

    public void addTeam(Team team) {
        if (!teams.contains(team)) {
            teams.add(team);
            team.setClub(this);
        }
    }

    public boolean isClubAdmin(User user) {
        if (user == null)
            return false;

        // Si c’est un super admin global → accès complet
        if (user.isSuperAdmin()) {
            return true;
        }

        // Si l'utilisateur est le validateur officiel du club
        if (verifiedBy != null && verifiedBy.getId().equals(user.getId())) {
            return true;
        }

        // Si c’est un membre du club avec le rôle CLUB_ADMIN
        if (members != null && members.stream()
                .anyMatch(m -> m.getId().equals(user.getId()) && m.isClubAdmin())) {
            return true;
        }

        return false;
    }

}
