package com.footballdemo.football_family.controller.api.social;



import com.footballdemo.football_family.model.User;
import com.footballdemo.football_family.repository.FollowRepository;
import com.footballdemo.football_family.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/friends")
@RequiredArgsConstructor
public class FriendsRestController {

    private final UserService userService;
    private final FollowRepository followRepository;

    /**
     * ⭐ GET /api/friends
     * Retourne les amis mutuels de l'utilisateur connecté
     * Un ami = follow mutuel (A suit B ET B suit A)
     *
     * Réponse :
     * {
     *   "friends": [
     *     { "id": 1, "username": "karim", "avatarUrl": "...", "isLive": false, "isOnline": false },
     *     ...
     *   ],
     *   "totalFriends": 5,
     *   "liveCount": 1
     * }
     */
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getFriends(Principal principal) {

        User currentUser = userService.getUserByUsername(principal.getName())
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));

        // ⭐ Récupérer les amis mutuels
        List<User> mutualFriends = followRepository.findMutualFriends(currentUser.getId());

        // ⭐ TODO: Récupérer les IDs des users actuellement en live
        // Pour l'instant, set vide — à brancher sur ton système WebSocket/live
        Set<Long> liveUserIds = getLiveUserIds();

        // ⭐ Construire la réponse
        List<Map<String, Object>> friendsList = mutualFriends.stream()
                .map(friend -> {
                    Map<String, Object> dto = new LinkedHashMap<>();
                    dto.put("id", friend.getId());
                    dto.put("username", friend.getUsername());
                    dto.put("avatarUrl", friend.getAvatarUrl());
                    dto.put("initial", friend.getUsername().substring(0, 1).toUpperCase());
                    dto.put("isLive", liveUserIds.contains(friend.getId()));
                    dto.put("isOnline", false); // TODO: implémenter présence en ligne
                    return dto;
                })
                // ⭐ Trier : lives en premier, puis alphabétique
                .sorted((a, b) -> {
                    boolean aLive = (boolean) a.get("isLive");
                    boolean bLive = (boolean) b.get("isLive");
                    if (aLive != bLive) return bLive ? 1 : -1;
                    return ((String) a.get("username")).compareToIgnoreCase((String) b.get("username"));
                })
                .collect(Collectors.toList());

        long liveCount = friendsList.stream()
                .filter(f -> (boolean) f.get("isLive"))
                .count();

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("friends", friendsList);
        response.put("totalFriends", friendsList.size());
        response.put("liveCount", liveCount);

        return ResponseEntity.ok(response);
    }

    /**
     * ⭐ GET /api/friends/check/{userId}
     * Vérifie si l'utilisateur connecté est ami avec un autre user
     */
    @GetMapping("/check/{userId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> checkFriendship(@PathVariable Long userId, Principal principal) {

        User currentUser = userService.getUserByUsername(principal.getName())
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));

        boolean areFriends = followRepository.areMutualFriends(currentUser.getId(), userId);

        return ResponseEntity.ok(Map.of(
                "areFriends", areFriends,
                "userId", userId
        ));
    }

    /**
     * ⭐ Récupère les IDs des utilisateurs actuellement en live
     * TODO: À brancher sur ton vrai système de live (WebSocket, base, Redis...)
     *
     * Pour l'instant retourne un set vide.
     * Quand tu auras une table "live_streams" ou un service qui track les lives,
     * tu pourras faire :
     *   return liveStreamService.getActiveLiveUserIds();
     */
    private Set<Long> getLiveUserIds() {
        // TODO: Implémenter avec ton système de live
        // Exemple futur :
        // return liveStreamRepository.findActiveStreams().stream()
        //     .map(LiveStream::getStreamerId)
        //     .collect(Collectors.toSet());
        return Collections.emptySet();
    }
}
