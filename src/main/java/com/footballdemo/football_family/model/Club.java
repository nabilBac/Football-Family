package com.footballdemo.football_family.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnore;

// ... (imports, annotations, etc.)

@Entity
@Table(name = "club", indexes = {
        @Index(name = "idx_club_siret", columnList = "siret")
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
    private String siret;

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

    @Column(columnDefinition = "TEXT")
    private String description;

    private String logo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ClubType type;

    @ManyToOne
    @JoinColumn(name = "admin_id", nullable = false)
    private User admin;

    @OneToMany(mappedBy = "club")
    @JsonIgnore
    private List<Event> events = new ArrayList<>();

  
@Enumerated(EnumType.STRING)
private ClubVerificationStatus verificationStatus = ClubVerificationStatus.APPROVED; // auto-approved pour MVP


    private LocalDate createdAt;
    private LocalDate verifiedAt;

    @ManyToOne
    @JoinColumn(name = "verified_by")
    private User verifiedBy;

    private String kbisDocument;
    private String insuranceDocument;

    // =======================================
    // 👥 CLUB USERS AVEC ROLES
    // =======================================
    @OneToMany(mappedBy = "club", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<ClubUser> clubUsers = new ArrayList<>();

    public void addClubUser(ClubUser clubUser) {
        clubUsers.add(clubUser);
        clubUser.setClub(this);
    }

    public void removeClubUser(ClubUser clubUser) {
        clubUsers.remove(clubUser);
        clubUser.setClub(null);
    }

    public boolean isClubAdmin(User user) {
        if (user == null || this.admin == null) return false;
        return this.admin.getId().equals(user.getId());
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDate.now();
    }
}
