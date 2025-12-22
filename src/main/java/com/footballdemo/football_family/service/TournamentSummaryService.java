package com.footballdemo.football_family.service;

import com.footballdemo.football_family.dto.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TournamentSummaryService {

    private final ClassementService classementService;
    private final BracketService bracketService;
    private final ConsolanteService consolanteService;
    private final FinalResultService finalResultService;

    public TournamentSummaryDTO getSummary(Long eventId) {

        TournamentSummaryDTO dto = new TournamentSummaryDTO();

        // 1️⃣ Classements → conversion TeamStats -> TeamLightDTO
        Map<Long, List<TeamStats>> rankings = classementService.computeRankingsForEvent(eventId);

        Map<Long, List<TeamLightDTO>> cleanedRankings =
                rankings.entrySet().stream()
                        .collect(Collectors.toMap(
                                Map.Entry::getKey,
                                e -> e.getValue()
                                        .stream()
                                        .map(TeamStats::toLightDTO)  // 🔥 conversion ici
                                        .toList()
                        ));

        dto.setRankings(cleanedRankings);

        // 2️⃣ Bracket principal
        dto.setBracket(
                bracketService.getBracket(eventId)
                        .stream()
                        .map(BracketMatchDTO::from)
                        .toList()
        );

        // 3️⃣ Consolante
        dto.setConsolante(
                consolanteService.getConsolanteBracket(eventId)
                        .stream()
                        .map(BracketMatchDTO::from)
                        .toList()
        );

        // 4️⃣ Résultats finaux
        dto.setFinalResults(finalResultService.getFinalResults(eventId));

        return dto;
    }
}
