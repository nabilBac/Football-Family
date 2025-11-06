package com.footballdemo.football_family.controller;

import com.footballdemo.football_family.dto.ApiResponse;
import com.footballdemo.football_family.dto.ClubDTO;
import com.footballdemo.football_family.dto.ClubRegistrationDTO;
import com.footballdemo.football_family.model.Club;
import com.footballdemo.football_family.service.ClubService;
import com.footballdemo.football_family.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@Slf4j
@RestController
@RequestMapping("/api/clubs")
@RequiredArgsConstructor
public class ClubController {

    private final ClubService clubService;
    private final UserService userService;

    private Long getCurrentUserId(Principal principal) {
        if (principal == null)
            return null;
        return userService.getUserByUsername(principal.getName())
                .map(com.footballdemo.football_family.model.User::getId)
                .orElse(null);
    }

    @PostMapping("/register")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<ClubDTO>> registerClub(
            @Valid @RequestBody ClubRegistrationDTO dto,
            Principal principal) {
        log.info("Inscription club: {} par {}", dto.getName(), principal.getName());

        Long userId = getCurrentUserId(principal);
        Club club = clubService.createClub(dto, userId);
        ClubDTO clubDTO = ClubDTO.from(club);

        return ResponseEntity.status(201)
                .body(new ApiResponse<>(true, "Club créé avec succès. En attente de vérification.", clubDTO));
    }

    // ⭐ NOUVEAU : Liste des clubs en attente de validation
    @GetMapping("/pending")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Page<ClubDTO>>> getPendingClubs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        log.info("Récupération des clubs en attente");
        Page<Club> clubs = clubService.getPendingClubs(PageRequest.of(page, size));
        Page<ClubDTO> dtos = clubs.map(ClubDTO::from);
        return ResponseEntity.ok(new ApiResponse<>(true, "Clubs en attente", dtos));
    }

    @GetMapping("/all")
    public ResponseEntity<ApiResponse<Page<ClubDTO>>> getAllClubs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<Club> clubs = clubService.getAllClubs(PageRequest.of(page, size));
        Page<ClubDTO> dtos = clubs.map(ClubDTO::from);
        return ResponseEntity.ok(new ApiResponse<>(true, "Clubs récupérés", dtos));
    }

    @GetMapping("/verified")
    public ResponseEntity<ApiResponse<Page<ClubDTO>>> getVerifiedClubs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<Club> clubs = clubService.getVerifiedClubs(PageRequest.of(page, size));
        Page<ClubDTO> dtos = clubs.map(ClubDTO::from);
        return ResponseEntity.ok(new ApiResponse<>(true, "Clubs vérifiés", dtos));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<Page<ClubDTO>>> searchClubs(
            @RequestParam String term,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<Club> clubs = clubService.searchClubs(term, PageRequest.of(page, size));
        Page<ClubDTO> dtos = clubs.map(ClubDTO::from);
        return ResponseEntity.ok(new ApiResponse<>(true, "Résultats de recherche", dtos));
    }

    // ⭐ IMPORTANT : /{clubId} doit être APRÈS les endpoints spécifiques
    @GetMapping("/{clubId}")
    public ResponseEntity<ApiResponse<ClubDTO>> getClub(@PathVariable Long clubId) {
        Club club = clubService.getClubById(clubId);
        ClubDTO dto = ClubDTO.from(club);
        return ResponseEntity.ok(new ApiResponse<>(true, "Club récupéré", dto));
    }

    // ⭐ NOUVEAU : Approuver un club
    @PutMapping("/{clubId}/approve")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<ClubDTO>> approveClub(
            @PathVariable Long clubId,
            Principal principal) {
        log.info("Approbation du club {} par {}", clubId, principal.getName());
        Long adminId = getCurrentUserId(principal);
        Club club = clubService.approveClub(clubId, adminId);
        ClubDTO dto = ClubDTO.from(club);
        return ResponseEntity.ok(new ApiResponse<>(true, "Club approuvé avec succès", dto));
    }

    // ⭐ NOUVEAU : Rejeter un club
    @PutMapping("/{clubId}/reject")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<ClubDTO>> rejectClub(
            @PathVariable Long clubId,
            @RequestParam(required = false) String reason,
            Principal principal) {
        log.info("Rejet du club {} par {}", clubId, principal.getName());
        Long adminId = getCurrentUserId(principal);
        Club club = clubService.rejectClub(clubId, adminId, reason);
        ClubDTO dto = ClubDTO.from(club);
        return ResponseEntity.ok(new ApiResponse<>(true, "Club rejeté", dto));
    }

    // Ancien endpoint verify (garde pour compatibilité)
    @PutMapping("/{clubId}/verify")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<ClubDTO>> verifyClub(
            @PathVariable Long clubId,
            Principal principal) {
        Long adminId = getCurrentUserId(principal);
        Club club = clubService.verifyClub(clubId, adminId);
        ClubDTO dto = ClubDTO.from(club);
        return ResponseEntity.ok(new ApiResponse<>(true, "Club vérifié avec succès", dto));
    }

    @PostMapping("/{clubId}/members/{userId}")
    @PreAuthorize("hasAnyRole('CLUB_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<String>> addMember(
            @PathVariable Long clubId,
            @PathVariable Long userId) {
        clubService.addMemberToClub(clubId, userId);
        return ResponseEntity.ok(new ApiResponse<>(true, "Membre ajouté au club", null));
    }

    @DeleteMapping("/{clubId}/members/{userId}")
    @PreAuthorize("hasAnyRole('CLUB_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<String>> removeMember(
            @PathVariable Long clubId,
            @PathVariable Long userId) {
        clubService.removeMemberFromClub(clubId, userId);
        return ResponseEntity.ok(new ApiResponse<>(true, "Membre retiré du club", null));
    }
}