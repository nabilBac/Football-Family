package com.footballdemo.football_family.service;



import com.footballdemo.football_family.model.User;
import com.footballdemo.football_family.repository.FollowRepository; // 🎯 NOUVEL IMPORT
import com.footballdemo.football_family.repository.UserRepository;
import org.springframework.security.core.Authentication; 
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import com.footballdemo.football_family.model.Follow; // 🎯 NOUVEL IMPORT
import org.springframework.transaction.annotation.Transactional;
import java.util.Optional;  
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;


@Service
public class UserService {

    private final UserRepository userRepository;
    private final FollowRepository followRepository; // 🎯 INJECTION DU REPOSITORY DE SUIVI

    // 🎯 CONSTRUCTEUR MIS À JOUR : Spring va injecter les deux Repositories
    public UserService(UserRepository userRepository, FollowRepository followRepository) { 
        this.userRepository = userRepository;
        this.followRepository = followRepository;
    }
    
    // =======================================================
    // 1. GESTION DE L'UTILISATEUR COURANT
    // =======================================================

    /**
     * Récupère l'entité User de l'utilisateur actuellement connecté via Spring Security.
     * @return L'objet User ou null si non authentifié.
     */
 public User getCurrentUser() {
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
    if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
        return null;
    }
    
    String username = authentication.getName();  // Cela peut être un identifiant ou un nom d'utilisateur
    System.out.println("Auth name = " + username); // <-- ligne à ajouter
    
    try {
        // Vérifier si l'authentification est un identifiant numérique
        Long userId = Long.parseLong(username);  // Peut causer une exception si ce n'est pas un nombre
        return getUserById(userId).orElse(null);
    } catch (NumberFormatException e) {
        // Si l'ID n'est pas un nombre, on peut loguer ou renvoyer null ou un utilisateur basé sur le nom d'utilisateur
        return userRepository.findByUsername(username).orElse(null); // Utilisez la méthode qui récupère par nom d'utilisateur
    }
}

@Cacheable(value = "users", key = "#username")
public Optional<User> findUserByUsernameCached(String username) {
 // 🛑 CORRECTION : Retournez directement l'Optional du repository
 return userRepository.findByUsername(username); 
}


    
    // =======================================================
    // 2. STATISTIQUES DU PROFIL (ABONNÉS/ABONNEMENTS)
    // =======================================================

    /**
     * Calcule le nombre d'ABONNÉS (Followers) d'un utilisateur donné.
     * Utilise le FollowRepository pour une logique réelle basée sur la base de données.
     */
    public int getFollowersCount(User user) {
        // Renvoie le nombre réel d'utilisateurs qui le suivent
        return (int) followRepository.countByFollowing(user); 
    }
    
    /**
     * Calcule le nombre d'ABONNEMENTS (Following) faits par un utilisateur donné.
     * Utilise le FollowRepository pour une logique réelle basée sur la base de données.
     */
    public int getFollowingCount(User user) {
        // Renvoie le nombre réel d'utilisateurs qu'il suit
        return (int) followRepository.countByFollower(user); 
    }
    
    // =======================================================
    // 3. AUTRES MÉTHODES UTILES (Déjà existantes ou implicites)
    // =======================================================
    
    // Exemple d'une ancienne méthode que vous deviez avoir :
  


    public Page<User> getUsersPaged(int page, int size) {
    Pageable pageable = PageRequest.of(page, size);
    return userRepository.findAll(pageable);
}
    
 public Optional<User> getUserByUsername(String username) {
     return findUserByUsernameCached(username);
    }


    public User saveUser(User user) {
        return userRepository.save(user);
    }

    /**
 * ✅ NOUVELLE MÉTHODE REQUISE PAR FollowController.
 * Récupère un utilisateur par son ID.
 * @param id L'ID de l'utilisateur.
 * @return Un Optional contenant l'utilisateur s'il est trouvé.
 */
@Cacheable(value = "users", key = "#id")
public Optional<User> getUserById(Long id) {
    return userRepository.findById(id);
}


    // =======================================================
    // 4. LOGIQUE D'ABONNEMENT
    // =======================================================

    /**
     * Bascule l'état d'abonnement (Follow/Unfollow) entre l'utilisateur courant et la cible.
     * @param follower L'utilisateur qui clique (l'abonné).
     * @param targetUser L'utilisateur cible (celui que l'on veut suivre/ne plus suivre).
     * @return true si la relation est créée (Follow), false si elle est supprimée (Unfollow).
     */
    @Transactional
    public boolean toggleFollow(User follower, User targetUser) {
        
        // Sécurité : Ne pas laisser un utilisateur se suivre lui-même
        if (follower.equals(targetUser)) {
            throw new IllegalArgumentException("Un utilisateur ne peut pas s'abonner à lui-même.");
        }

        // 1. Chercher si une relation de suivi existe déjà
        Optional<Follow> existingFollow = followRepository.findByFollowerAndFollowing(follower, targetUser);

        if (existingFollow.isPresent()) {
            // CAS 1: La relation existe -> on la supprime (UNFOLLOW)
            followRepository.delete(existingFollow.get());
            return false; // Désabonné
        } else {
            // CAS 2: La relation n'existe pas -> on la crée (FOLLOW)
            Follow newFollow = new Follow();
            newFollow.setFollower(follower);
            newFollow.setFollowing(targetUser);
            followRepository.save(newFollow);
            return true; // Abonné
        }
    }

    /**
     * Vérifie si l'utilisateur courant suit déjà la cible.
     */
    public boolean isFollowing(User follower, User targetUser) {
        if (follower == null || targetUser == null) {
            return false;
        }
        return followRepository.findByFollowerAndFollowing(follower, targetUser).isPresent();
    }
}
    


