package com.footballdemo.football_family.controller;

import com.footballdemo.football_family.dto.ApiResponse;
import com.footballdemo.football_family.dto.TeamDTO;
import com.footballdemo.football_family.dto.TeamMapper;
import com.footballdemo.football_family.model.Team;
import com.footballdemo.football_family.service.TeamService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/teams")
@RequiredArgsConstructor
public class TeamController {

    private final TeamService teamService;

    @PostMapping("/create")
    public ResponseEntity<ApiResponse<TeamDTO>> createTeam(
            @RequestParam String name,
            @RequestParam String category,
            @RequestParam Long coachId
    ) {
        try {
            Team team = teamService.createTeam(name, category, coachId);
            TeamDTO dto = TeamMapper.toDTO(team);
            return ResponseEntity.ok(new ApiResponse<>(true, "Équipe créée avec succès", dto));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }

    @PostMapping("/{teamId}/add-player")
    public ResponseEntity<ApiResponse<TeamDTO>> addPlayer(
            @PathVariable Long teamId,
            @RequestParam Long playerId
    ) {
        try {
            Team updatedTeam = teamService.addPlayer(teamId, playerId);
            TeamDTO dto = TeamMapper.toDTO(updatedTeam);
            return ResponseEntity.ok(new ApiResponse<>(true, "Joueur ajouté avec succès", dto));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }

    @GetMapping("/all")
    public ResponseEntity<ApiResponse<List<TeamDTO>>> getAllTeams() {
        List<TeamDTO> dtos = teamService.getAllTeams().stream()
                .map(TeamMapper::toDTO)
                .toList();
        return ResponseEntity.ok(new ApiResponse<>(true, "Liste des équipes", dtos));
    }

    @GetMapping("/coach/{coachId}")
    public ResponseEntity<ApiResponse<List<TeamDTO>>> getTeamsByCoach(@PathVariable Long coachId) {
        List<TeamDTO> dtos = teamService.getTeamsByCoach(coachId).stream()
                .map(TeamMapper::toDTO)
                .toList();
        return ResponseEntity.ok(new ApiResponse<>(true, "Équipes du coach", dtos));
    }

    @DeleteMapping("/{teamId}")
    public ResponseEntity<ApiResponse<Void>> deleteTeam(@PathVariable Long teamId) {
        try {
            teamService.deleteTeam(teamId);
            return ResponseEntity.ok(new ApiResponse<>(true, "Équipe supprimée avec succès", null));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }
}
