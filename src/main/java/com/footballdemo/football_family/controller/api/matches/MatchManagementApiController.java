package com.footballdemo.football_family.controller.api.matches;

import com.footballdemo.football_family.dto.ApiResponse;
import com.footballdemo.football_family.dto.MatchDTO;
import com.footballdemo.football_family.model.Match;
import com.footballdemo.football_family.repository.MatchRepository;
import com.footballdemo.football_family.service.MatchService;



import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/matches")
@RequiredArgsConstructor
public class MatchManagementApiController {

    private final MatchRepository matchRepository;
    private final MatchService matchService;

    @GetMapping
    public ResponseEntity<ApiResponse<?>> getAllMatches() {
        List<MatchDTO> matches = matchRepository.findAll()
                .stream()
                .map(MatchDTO::from)
                .toList();

        return ResponseEntity.ok(
                new ApiResponse<>(true, "Liste complète des matchs", matches)
        );
    }

    @GetMapping("/event/{eventId}")
    public ResponseEntity<ApiResponse<?>> getMatchesForEvent(@PathVariable Long eventId) {
        List<MatchDTO> matches = matchRepository.findByEventId(eventId)
                .stream()
                .map(MatchDTO::from)
                .toList();

        return ResponseEntity.ok(
                new ApiResponse<>(true, "Matchs de l’événement " + eventId, matches)
        );
    }

    @PatchMapping("/{id}/finish")
    public ResponseEntity<ApiResponse<MatchDTO>> finishMatch(
            @PathVariable Long id,
            @RequestParam int scoreA,
            @RequestParam int scoreB
    ) {
        Match finished = matchService.finishMatch(id, scoreA, scoreB);

        return ResponseEntity.ok(
                new ApiResponse<>(true, "Match terminé", MatchDTO.from(finished))
        );
    }


    
}
