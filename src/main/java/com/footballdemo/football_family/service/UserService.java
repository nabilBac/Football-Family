package com.footballdemo.football_family.service;

import com.footballdemo.football_family.dto.RegisterRequest;
import com.footballdemo.football_family.exception.BadRequestException;
import com.footballdemo.football_family.exception.UserNotFoundException;
import com.footballdemo.football_family.model.Club;
import com.footballdemo.football_family.model.ClubRole;
import com.footballdemo.football_family.model.ClubType;
import com.footballdemo.football_family.model.ClubUser;
import com.footballdemo.football_family.model.Follow;
import com.footballdemo.football_family.model.User;
import com.footballdemo.football_family.model.UserRole;
import com.footballdemo.football_family.repository.ClubRepository;
import com.footballdemo.football_family.repository.ClubUserRepository;
import com.footballdemo.football_family.repository.FollowRepository;
import com.footballdemo.football_family.repository.UserRepository;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.beans.factory.annotation.Value;


import java.util.List;
import java.util.Optional;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final FollowRepository followRepository;
    private final PasswordEncoder passwordEncoder;
    private final ClubRepository clubRepository;
private final ClubUserRepository clubUserRepository;


@Value("${app.mode-dev:true}")
private boolean modeDev;



  public UserService(
        UserRepository userRepository,
        FollowRepository followRepository,
        PasswordEncoder passwordEncoder,
        ClubRepository clubRepository,
        ClubUserRepository clubUserRepository
) {
    this.userRepository = userRepository;
    this.followRepository = followRepository;
    this.passwordEncoder = passwordEncoder;
    this.clubRepository = clubRepository;
    this.clubUserRepository = clubUserRepository;
}


    // =======================================================
    // 🔐 1. UTILISATEUR COURANT
    // =======================================================

    public User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null ||
                !authentication.isAuthenticated() ||
                "anonymousUser".equals(authentication.getPrincipal())) {
            return null;
        }

        String username = authentication.getName();
        return userRepository.findByUsername(username).orElse(null);
    }

    // =======================================================
    // 🔍 2. RÉCUPÉRATION / CACHE
    // =======================================================

    // ❗ CORRECTION IMPORTANTE :
    // On NE cache PAS un Optional -> on stocke un User ou null
  public User findUserByUsernameCached(String username) {
    return userRepository.findByUsername(username).orElse(null);
}

    public Optional<User> getUserByUsername(String username) {
        return Optional.ofNullable(findUserByUsernameCached(username));
    }

    public User getUserByIdCached(Long id) {
    return userRepository.findById(id).orElse(null);
}


    public Optional<User> getUserById(Long id) {
        return Optional.ofNullable(getUserByIdCached(id));
    }

    public User saveUser(User user) {
        return userRepository.save(user);
    }

    // =======================================================
    // 📊 3. STATISTIQUES PROFIL : followers / following
    // =======================================================

    public int getFollowersCount(User user) {
        return (int) followRepository.countByFollowing(user);
    }

    public int getFollowingCount(User user) {
        return (int) followRepository.countByFollower(user);
    }

    public List<Long> getFollowedUserIds(Long userId) {
        User follower = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));
        return followRepository.findFollowingIdsByFollower(follower);
    }

    public Page<User> getUsersPaged(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return userRepository.findAll(pageable);
    }

    // =======================================================
    // 🔄 4. FOLLOW / UNFOLLOW
    // =======================================================

    @Transactional
    public boolean toggleFollow(User follower, User targetUser) {

        if (follower == null || targetUser == null) {
            throw new BadRequestException("Utilisateur invalide.");
        }

        if (follower.equals(targetUser)) {
            throw new BadRequestException("Un utilisateur ne peut pas se suivre lui-même.");
        }

        Optional<Follow> existing = followRepository.findByFollowerAndFollowing(follower, targetUser);

        if (existing.isPresent()) {
            followRepository.delete(existing.get());
            return false; // Unfollow
        }

        Follow newFollow = new Follow();
        newFollow.setFollower(follower);
        newFollow.setFollowing(targetUser);
        followRepository.save(newFollow);

        return true; // Follow
    }

    public boolean isFollowing(User follower, User targetUser) {
        if (follower == null || targetUser == null) {
            return false;
        }
        return followRepository.findByFollowerAndFollowing(follower, targetUser).isPresent();
    }

    // =======================================================
    // 🆕 5. INSCRIPTION
    // =======================================================

@Transactional
public User registerUser(RegisterRequest req) {

    // --- VALIDATIONS ---
    if (req.getUsername() == null || req.getUsername().isBlank()) {
        throw new BadRequestException("Le nom d'utilisateur est obligatoire.");
    }
    if (req.getEmail() == null || req.getEmail().isBlank()) {
        throw new BadRequestException("L'email est obligatoire.");
    }
    if (req.getPassword() == null || req.getPassword().isBlank()) {
        throw new BadRequestException("Le mot de passe est obligatoire.");
    }
    if (userRepository.existsByUsername(req.getUsername())) {
        throw new BadRequestException("Ce nom d'utilisateur est déjà pris.");
    }
    if (userRepository.existsByEmail(req.getEmail())) {
        throw new BadRequestException("Cet email est déjà utilisé.");
    }

    // --- CRÉATION USER ---
    User user = new User();
    user.setUsername(req.getUsername().trim());
    user.setEmail(req.getEmail().trim().toLowerCase());
    user.setPassword(passwordEncoder.encode(req.getPassword()));
    user.setSiret(req.getSiret());
    user.setOrganizationName(req.getOrganizationName());
    user.setVerified(false);
    user.setVerifiedAt(null);

    user.getRoles().clear();

    // ==========================================================
    // 🔥 LOGIQUE SELON typeInscription
    // ==========================================================
switch (req.getTypeInscription()) {

    // 🏆 CLUB ADMIN
    case CLUB_ADMIN -> {

        if (!modeDev) {
            if (req.getSiret() == null || req.getSiret().isBlank()) {
                throw new BadRequestException("Le SIRET est obligatoire pour un club en mode production.");
            }
        }

        user.addRole(UserRole.CLUB_ADMIN);

        if (req.getOrganizationName() == null || req.getOrganizationName().isBlank()) {
            throw new BadRequestException("Le nom du club est obligatoire pour un compte club.");
        }

        user = userRepository.save(user);

        Club club = new Club();
        club.setName(req.getOrganizationName().trim());
        club.setSiret(req.getSiret());
        club.setType(ClubType.FOOTBALL);
        club.setAdmin(user);
        club = clubRepository.save(club);

        ClubUser cu = new ClubUser();
        cu.setUser(user);
        cu.setClub(club);
        cu.setRole(ClubRole.ADMIN);
        clubUserRepository.save(cu);

        user.getClubUsers().add(cu);
    }

    // 🎮 PLAYER
    case PLAYER -> user.addRole(UserRole.PLAYER);

    // 🎓 COACH
    case COACH -> user.addRole(UserRole.COACH);

    // 🛠️ ORGANIZER
    case ORGANIZER -> user.addRole(UserRole.SUPER_ADMIN);

    // 🧑 STAFF
    case STAFF -> user.addRole(UserRole.USER);

    // 👤 USER normal
    case USER -> user.addRole(UserRole.USER);

    default -> throw new BadRequestException("Type d'inscription non supporté.");
}




    // Sauvegarde finale
    return userRepository.save(user);
}



    // =======================================================
    // 🔎 6. VÉRIFICATION & UTILITAIRES
    // =======================================================

    public void requestVerification(User user) {
        user.setVerified(false);
        user.setVerifiedAt(null);
        userRepository.save(user);
    }

   @Transactional(readOnly = true)
public User findByUsername(String username) {
    return userRepository.findByUsernameWithClubs(username)
            .orElseThrow(() -> new UserNotFoundException("username", username));
}

@Transactional(readOnly = true)
public User findUserForAuth(String username) {
    return userRepository.findByUsernameWithClubs(username)
            .orElseThrow(() -> new UserNotFoundException("username", username));
}



    public User getByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UserNotFoundException("email", email));
    }
}
