package com.footballdemo.football_family.model;



import jakarta.persistence.*;

@Entity
@Table(name = "user_follows", uniqueConstraints = {
@UniqueConstraint(columnNames = {"follower_id", "following_id"}) // 🚨 AJOUT DE LA CONTRAINTE
}) 
public class Follow {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Utilisateur qui suit (l'Abonné)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "follower_id", nullable = false)
    private User follower;

    // Utilisateur qui est suivi (l'Abonné cible)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "following_id", nullable = false)
    private User following;

    // --- Constructeurs, Getters, Setters ---

    public Follow() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getFollower() { return follower; }
    public void setFollower(User follower) { this.follower = follower; }

    public User getFollowing() { return following; }
    public void setFollowing(User following) { this.following = following; }

    // Note : Il est souvent recommandé d'ajouter des méthodes equals/hashCode et une contrainte UNIQUE
    // sur (follower_id, following_id) au niveau du schéma pour éviter les doublons.
}