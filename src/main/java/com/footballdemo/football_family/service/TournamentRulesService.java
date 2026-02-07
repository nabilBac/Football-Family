package com.footballdemo.football_family.service;



import com.footballdemo.football_family.model.Event;
import com.footballdemo.football_family.model.Match;
import com.footballdemo.football_family.model.MatchStatus;
import com.footballdemo.football_family.repository.MatchRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import com.footballdemo.football_family.model.TournamentPhase;
import com.footballdemo.football_family.model.EventFormat;


@Service
@RequiredArgsConstructor
public class TournamentRulesService {

    private final MatchRepository matchRepository;

    // ========= GÉNÉRATION (poules / matchs) =========
    public void assertNoMatchesAlreadyGenerated(Long eventId) {
        if (matchRepository.existsByEventId(eventId)) {
            throw new IllegalStateException("Action impossible : des matchs existent déjà pour cet événement.");
        }
    }

    public void assertNoScoresExist(Long eventId) {
        if (matchRepository.existsAnyScoreByEventId(eventId)) {
            throw new IllegalStateException("Action interdite : des scores existent déjà (incohérence possible).");
        }
    }

    // ========= SCORE =========
public void assertCanScore(Match match) {

    // 🆕 EXCEPTION : MATCH UNIQUE (pas de règles de tournoi)
  if (match.getEvent().getFormat() == EventFormat.SINGLE_MATCH) {
        // Pour un match unique, on vérifie juste qu'il n'est pas terminé
        if (match.getStatus() == MatchStatus.COMPLETED) {
            throw new IllegalStateException("Impossible de modifier un match déjà terminé.");
        }
        return; // ✅ Autoriser le scoring direct
    }

    // 🔒 Match déjà terminé (pour les tournois)
    if (match.getStatus() == MatchStatus.COMPLETED) {
        throw new IllegalStateException(
            "Impossible de modifier un match déjà terminé."
        );
    }

    // 🔒 Équipes pas encore connues
    if (match.getTeamA() == null || match.getTeamB() == null) {
        throw new IllegalStateException(
            "Les équipes ne sont pas encore connues."
        );
    }

    // 🔒 Match de poule figé après génération du bracket principal
    TournamentPhase phase = match.getEvent().getTournamentPhase();
    if (match.getGroup() != null &&
        phase.ordinal() >= TournamentPhase.KNOCKOUT_STAGE.ordinal()) {

        throw new IllegalStateException(
            "Scores de poule figés après génération du bracket."
        );
    }
}

    // ========= BRACKET =========
    public void assertAllGroupMatchesFinished(Long eventId) {
        boolean hasUnfinished =
                matchRepository.existsByEventIdAndGroupIsNotNullAndStatusNot(eventId, MatchStatus.COMPLETED);

        if (hasUnfinished) {
            throw new IllegalStateException("Impossible : tous les matchs de poule ne sont pas terminés.");
        }
    }

    public void assertBracketNotAlreadyGenerated(Long eventId) {
        if (matchRepository.existsByEventIdAndGroupIsNull(eventId)) {
            throw new IllegalStateException("Bracket déjà généré : action interdite.");
        }
    }

    public void assertCanGenerateBracket(Event event) {
    if (event.getTournamentPhase() != TournamentPhase.GROUP_STAGE_FINISHED) {
        throw new IllegalStateException(
            "Le bracket ne peut être généré que lorsque la phase de poules est terminée."
        );
    }
}

            public void assertMinimumQualifiedTeams(int totalQualified) {
    if (totalQualified < 2) {
        throw new IllegalStateException(
            "Impossible de générer un bracket avec moins de 2 équipes."
        );
    }
}


}

