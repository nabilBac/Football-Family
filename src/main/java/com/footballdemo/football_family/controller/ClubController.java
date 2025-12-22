package com.footballdemo.football_family.controller;



import com.footballdemo.football_family.dto.*;
import com.footballdemo.football_family.model.User;
import com.footballdemo.football_family.model.Club;
import com.footballdemo.football_family.service.ClubService;
import com.footballdemo.football_family.service.UserService;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/clubs")
@RequiredArgsConstructor
public class ClubController {

    private final ClubService clubService;
    private final UserService userService;

    // ============================================
    // 1️⃣ CRÉATION D’UN CLUB
    // ============================================
    @PostMapping("/create")
    public ResponseEntity<ApiResponse<?>> createClub(
            @RequestBody ClubRegistrationDTO dto,
            Principal principal) {

        User creator = userService.findByUsername(principal.getName());

        Club club = clubService.createClub(dto, creator.getId());

        return ResponseEntity.ok(
                new ApiResponse<>(true, "Club créé avec succès", club)
        );
    }

    // ============================================
    // 2️⃣ LISTER Clubs validés
    // ============================================
    @GetMapping("/verified")
    public ResponseEntity<ApiResponse<?>> getVerifiedClubs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Page<Club> clubs = clubService.getVerifiedClubs(PageRequest.of(page, size));

        return ResponseEntity.ok(
                new ApiResponse<>(true, "Liste des clubs vérifiés", clubs)
        );
    }

    // ============================================
    // 3️⃣ LISTER Clubs en attente (ADMIN UTF)
    // ============================================
    @GetMapping("/pending")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<?>> getPendingClubs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Page<Club> clubs = clubService.getPendingClubs(PageRequest.of(page, size));

        return ResponseEntity.ok(
                new ApiResponse<>(true, "Liste des clubs en attente", clubs)
        );
    }

    // ============================================
    // 4️⃣ APPROUVER UN CLUB
    // ============================================
    @PatchMapping("/{clubId}/approve")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<?>> approveClub(
            @PathVariable Long clubId,
            Principal principal) {

        User admin = userService.findByUsername(principal.getName());

        Club club = clubService.approveClub(clubId, admin.getId());

        return ResponseEntity.ok(
                new ApiResponse<>(true, "Club approuvé", club)
        );
    }

    // ============================================
    // 5️⃣ REJETER UN CLUB
    // ============================================
    @PatchMapping("/{clubId}/reject")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<?>> rejectClub(
            @PathVariable Long clubId,
            @RequestBody RejectClubDTO dto,
            Principal principal) {

        User admin = userService.findByUsername(principal.getName());

        Club club = clubService.rejectClub(clubId, admin.getId(), dto.getReason());

        return ResponseEntity.ok(
                new ApiResponse<>(true, "Club rejeté", club)
        );
    }


    // ============================================
// 📌 RÉCUPÉRER UN CLUB PAR SON ID
// ============================================
@GetMapping("/{clubId}")
public ResponseEntity<ApiResponse<?>> getClub(@PathVariable Long clubId) {
    Club club = clubService.getClubById(clubId);
    
    return ResponseEntity.ok(
        new ApiResponse<>(true, "Club récupéré", club)
    );
}
}

