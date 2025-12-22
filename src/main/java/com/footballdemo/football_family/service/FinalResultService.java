package com.footballdemo.football_family.service;

import com.footballdemo.football_family.dto.FinalResultsDTO;
import com.footballdemo.football_family.model.Match;
import com.footballdemo.football_family.repository.MatchRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class FinalResultService {

    private final MatchRepository matchRepository;

    public FinalResultsDTO getFinalResults(Long eventId) {

        // 🏆 Finale principale
        Match finalMatch = matchRepository.findFirstByEventIdAndRoundOrderByIdDesc(eventId, "FINAL").orElse(null);
        String champion = null;
        String finalist = null;

        if (finalMatch != null && finalMatch.getScoreTeamA() != null) {
            // ✅ AJOUT DU NOM DU CLUB
            boolean teamAWins = finalMatch.getScoreTeamA() > finalMatch.getScoreTeamB();
            
            champion = teamAWins
                    ? finalMatch.getTeamA().getClub().getName() + " - " + finalMatch.getTeamA().getName()
                    : finalMatch.getTeamB().getClub().getName() + " - " + finalMatch.getTeamB().getName();

            finalist = teamAWins
                    ? finalMatch.getTeamB().getClub().getName() + " - " + finalMatch.getTeamB().getName()
                    : finalMatch.getTeamA().getClub().getName() + " - " + finalMatch.getTeamA().getName();
        }

        // 🥉 Petite finale
        Match thirdMatch = matchRepository.findFirstByEventIdAndRoundOrderByIdDesc(eventId, "3RD_PLACE").orElse(null);
        String third = null;
        String fourth = null;

        if (thirdMatch != null && thirdMatch.getScoreTeamA() != null) {
            // ✅ AJOUT DU NOM DU CLUB
            boolean teamAWins = thirdMatch.getScoreTeamA() > thirdMatch.getScoreTeamB();
            
            third = teamAWins
                    ? thirdMatch.getTeamA().getClub().getName() + " - " + thirdMatch.getTeamA().getName()
                    : thirdMatch.getTeamB().getClub().getName() + " - " + thirdMatch.getTeamB().getName();

            fourth = teamAWins
                    ? thirdMatch.getTeamB().getClub().getName() + " - " + thirdMatch.getTeamB().getName()
                    : thirdMatch.getTeamA().getClub().getName() + " - " + thirdMatch.getTeamA().getName();
        }

        // 🟨 Consolante finale
        Match cfinal = matchRepository.findFirstByEventIdAndRoundOrderByIdDesc(eventId, "CFINAL").orElse(null);
        String cwinner = null;
        String cfinalist = null;

        if (cfinal != null && cfinal.getScoreTeamA() != null) {
            // ✅ AJOUT DU NOM DU CLUB
            boolean teamAWins = cfinal.getScoreTeamA() > cfinal.getScoreTeamB();
            
            cwinner = teamAWins
                    ? cfinal.getTeamA().getClub().getName() + " - " + cfinal.getTeamA().getName()
                    : cfinal.getTeamB().getClub().getName() + " - " + cfinal.getTeamB().getName();

            cfinalist = teamAWins
                    ? cfinal.getTeamB().getClub().getName() + " - " + cfinal.getTeamB().getName()
                    : cfinal.getTeamA().getClub().getName() + " - " + cfinal.getTeamA().getName();
        }

        // 🟧 Match 3e place consolante
        Match cthirdMatch = matchRepository.findFirstByEventIdAndRoundOrderByIdDesc(eventId, "C3RD_PLACE").orElse(null);
        String cthird = null;
        String cfourth = null;

        if (cthirdMatch != null && cthirdMatch.getScoreTeamA() != null) {
            // ✅ AJOUT DU NOM DU CLUB
            boolean teamAWins = cthirdMatch.getScoreTeamA() > cthirdMatch.getScoreTeamB();
            
            cthird = teamAWins
                    ? cthirdMatch.getTeamA().getClub().getName() + " - " + cthirdMatch.getTeamA().getName()
                    : cthirdMatch.getTeamB().getClub().getName() + " - " + cthirdMatch.getTeamB().getName();

            cfourth = teamAWins
                    ? cthirdMatch.getTeamB().getClub().getName() + " - " + cthirdMatch.getTeamB().getName()
                    : cthirdMatch.getTeamA().getClub().getName() + " - " + cthirdMatch.getTeamA().getName();
        }

        return new FinalResultsDTO(
                champion,
                finalist,
                third,
                fourth,
                cwinner,
                cfinalist,
                cthird,
                cfourth
        );
    }
}