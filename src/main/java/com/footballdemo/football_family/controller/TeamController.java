package com.footballdemo.football_family.controller;

import com.footballdemo.football_family.dto.CreateTeamDTO;
import com.footballdemo.football_family.dto.CreateClubTeamDTO;
import com.footballdemo.football_family.dto.TeamResponseDTO;
import com.footballdemo.football_family.mapper.TeamMapper;
import com.footballdemo.football_family.model.Club;
import com.footballdemo.football_family.model.Team;
import com.footballdemo.football_family.model.User;
import com.footballdemo.football_family.service.ClubService;
import com.footballdemo.football_family.service.TeamService;
import com.footballdemo.football_family.service.UserService;
import com.footballdemo.football_family.dto.ApiResponse;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/teams")
@RequiredArgsConstructor
public class TeamController {

    private final TeamService teamService;
    private final UserService userService;
    private final ClubService clubService;

    // ============================================================
    // 1️⃣ CRÉATION D’UNE ÉQUIPE (Club ou Event UTF)
    // ============================================================
    @PostMapping("/create")
    public ResponseEntity<ApiResponse<?>> createTeam(@RequestBody CreateTeamDTO dto) {

        Team newTeam = teamService.createTeam(dto);
        TeamResponseDTO response = TeamMapper.toDTO(newTeam);

        return ResponseEntity.ok(
                new ApiResponse<>(true, "Équipe créée avec succès", response)
        );
    }

    // ============================================================
    // 2️⃣ CRÉATION D’UNE ÉQUIPE DE CLUB
    // ============================================================
    @PostMapping("/club/{clubId}/create")
    public ResponseEntity<ApiResponse<?>> createTeamForClub(
            @PathVariable Long clubId,
            @RequestBody CreateClubTeamDTO dto,
            Principal principal) {

        User creator = userService.findByUsername(principal.getName());
        Club club = clubService.getClubById(clubId);

        Team newTeam = teamService.createTeamForClub(dto, club);
        TeamResponseDTO response = TeamMapper.toDTO(newTeam);

        return ResponseEntity.ok(
                new ApiResponse<>(true, "Équipe de club créée", response)
        );
    }

    // ============================================================
    // 3️⃣ LISTE DES ÉQUIPES D’UN CLUB
    // ============================================================
    @GetMapping("/club/{clubId}")
    public ResponseEntity<ApiResponse<?>> getTeamsByClub(@PathVariable Long clubId) {

        List<TeamResponseDTO> teams = teamService.getTeamsByClub(clubId)
                .stream().map(TeamMapper::toDTO).toList();

        return ResponseEntity.ok(
                new ApiResponse<>(true, "Équipes du club", teams)
        );
    }

    // ============================================================
    // 4️⃣ LISTE DES ÉQUIPES D’UN EVENT UTF
    // ============================================================
    @GetMapping("/event/{eventId}")
    public ResponseEntity<ApiResponse<?>> getTeamsByEvent(@PathVariable Long eventId) {

        List<TeamResponseDTO> teams = teamService.getAllTeams()
                .stream()
                .filter(t -> t.getEvent() != null && eventId.equals(t.getEvent().getId()))
                .map(TeamMapper::toDTO)
                .toList();

        return ResponseEntity.ok(
                new ApiResponse<>(true, "Équipes de l’événement", teams)
        );
    }

    // ============================================================
    // 5️⃣ LISTE DE TOUTES LES ÉQUIPES
    // ============================================================
    @GetMapping
    public ResponseEntity<ApiResponse<?>> getAllTeams() {

        List<TeamResponseDTO> teams = teamService.getAllTeams()
                .stream().map(TeamMapper::toDTO).toList();

        return ResponseEntity.ok(
                new ApiResponse<>(true, "Toutes les équipes", teams)
        );
    }

    // ============================================================
    // 6️⃣ AJOUT D’UN JOUEUR DANS UNE ÉQUIPE
    // ============================================================
    @PostMapping("/{teamId}/add-player/{playerId}")
    public ResponseEntity<ApiResponse<?>> addPlayerToTeam(
            @PathVariable Long teamId,
            @PathVariable Long playerId) {

        Team updated = teamService.addPlayer(teamId, playerId);
        TeamResponseDTO response = TeamMapper.toDTO(updated);

        return ResponseEntity.ok(
                new ApiResponse<>(true, "Joueur ajouté à l’équipe", response)
        );
    }

    // ============================================================
    // 7️⃣ SUPPRESSION D’UNE ÉQUIPE
    // ============================================================
    @DeleteMapping("/{teamId}")
    public ResponseEntity<ApiResponse<?>> deleteTeam(@PathVariable Long teamId) {

        teamService.deleteTeam(teamId);

        return ResponseEntity.ok(
                new ApiResponse<>(true, "Équipe supprimée", null)
        );
    }


    // ============================================================
// 8️⃣ MES ÉQUIPES (club de l'utilisateur connecté)
// ============================================================
@GetMapping("/my-club")
public ResponseEntity<ApiResponse<?>> getMyClubTeams(Principal principal) {

    User user = userService.findByUsername(principal.getName());

    Long clubId = user.getPrimaryClubId();
    if (clubId == null) {
        return ResponseEntity.ok(
            new ApiResponse<>(true, "Aucun club associé", List.of())
        );
    }

    List<TeamResponseDTO> teams = teamService.getTeamsByClub(clubId)
            .stream()
            .map(TeamMapper::toDTO)
            .toList();

    return ResponseEntity.ok(
        new ApiResponse<>(true, "Mes équipes", teams)
    );
}

}
