package com.footballdemo.football_family.service;

import com.footballdemo.football_family.dto.ScoreUpdateDTO;
import com.footballdemo.football_family.model.Match;
import com.footballdemo.football_family.model.MatchStatus;
import com.footballdemo.football_family.model.Team;
import com.footballdemo.football_family.repository.MatchRepository;
import lombok.RequiredArgsConstructor;
import com.footballdemo.football_family.security.EventSecurityService;
import com.footballdemo.football_family.model.User;
import com.footballdemo.football_family.model.Event;
import com.footballdemo.football_family.model.TournamentPhase;
import com.footballdemo.football_family.repository.EventRepository;
import org.springframework.transaction.annotation.Transactional;




import java.util.List;

import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class MatchService {

    private final MatchRepository repo;
    private final BracketService bracketService;
    private final ConsolanteService consolanteService;
    private final MatchEventService matchEventService; 
    private final EventSecurityService eventSecurityService;
    private final TournamentRulesService tournamentRulesService;
    private final EventRepository eventRepository;
    private final DynamicBracketGenerator dynamicBracketGenerator;




@Transactional
public Match finishMatch(Long matchId, int scoreA, int scoreB) {
    Match match = repo.findById(matchId)
            .orElseThrow(() -> new RuntimeException("Match introuvable"));

    if (match.getStatus() == MatchStatus.FINISHED) {
        throw new IllegalStateException("Ce match est déjà terminé");
    }

    if (match.getTeamA() == null || match.getTeamB() == null) {
        throw new IllegalStateException("Impossible de jouer ce match : les équipes ne sont pas encore connues.");
    }

    // ❌ Égalité interdite pour l’instant
if (scoreA == scoreB) {
    throw new IllegalStateException(
        "Égalité non gérée : ajouter prolongations ou tirs au but."
    );
}


    // ✅ Mettre à jour les scores et terminer le match
    match.setScoreTeamA(scoreA);
    match.setScoreTeamB(scoreB);
    match.setStatus(MatchStatus.FINISHED);
    Match savedMatch = repo.save(match);  // ✅ Variable locale finale

    

    // 🔹 TRANSITION MÉTIER : fin des matchs de poule
if (savedMatch.getGroup() != null) { // match de poule

    boolean hasUnfinishedGroupMatches =
        repo.existsByEventIdAndGroupIsNotNullAndStatusNot(
            savedMatch.getEvent().getId(),
            MatchStatus.FINISHED
        );

    if (!hasUnfinishedGroupMatches) {
        Event event = savedMatch.getEvent();

        // Sécurité : éviter double transition
        if (event.getTournamentPhase() == TournamentPhase.GROUP_STAGE) {
            event.setTournamentPhase(TournamentPhase.GROUP_STAGE_FINISHED);
            eventRepository.save(event);
        }
    }
}



    // ✅ Calculer le vainqueur et le perdant
    final Team winner = scoreA > scoreB ? savedMatch.getTeamA() : savedMatch.getTeamB();
final Team loser  = scoreA > scoreB ? savedMatch.getTeamB() : savedMatch.getTeamA();


    
 // ✅ PROPAGATION GÉNÉRIQUE (NOUVEAU MOTEUR)
dynamicBracketGenerator.propagateWinner(savedMatch, winner);

// Sauvegarde du match suivant si besoin
if (savedMatch.getNextMatch() != null) {
    repo.save(savedMatch.getNextMatch());
}


    // ✅ GESTION DE LA PETITE FINALE (3e place)
    if (savedMatch.getRound() != null && savedMatch.getRound().startsWith("SF")) {
        final String currentRound = savedMatch.getRound();
        
        repo.findByEventIdAndRound(savedMatch.getEvent().getId(), "3RD_PLACE")
                .ifPresent(thirdPlace -> {
                    if ("SF1".equals(currentRound)) {
                        thirdPlace.setTeamA(loser);
                    } else if ("SF2".equals(currentRound)) {
                        thirdPlace.setTeamB(loser);
                    }
                    repo.save(thirdPlace);
                });
    }

    // ✅ GESTION DE LA CONSOLANTE
    if (savedMatch.getRound() != null && savedMatch.getRound().startsWith("CSF")) {
        final String currentRound = savedMatch.getRound();
        
        repo.findByEventIdAndRound(savedMatch.getEvent().getId(), "C3RD_PLACE")
                .ifPresent(consolanteThirdPlace -> {
                    if ("CSF1".equals(currentRound)) {
                        consolanteThirdPlace.setTeamA(loser);
                    } else if ("CSF2".equals(currentRound)) {
                        consolanteThirdPlace.setTeamB(loser);
                    }
                    repo.save(consolanteThirdPlace);
                });
    }

    // 🔹 TRANSITION MÉTIER : finale terminée
if ("FINAL".equals(savedMatch.getRound())) {
    Event event = savedMatch.getEvent();

    // Sécurité : éviter double transition
    if (event.getTournamentPhase() == TournamentPhase.KNOCKOUT_STAGE) {
        event.setTournamentPhase(TournamentPhase.FINAL_PLAYED);
        eventRepository.save(event);
    }
}


    return savedMatch;
}

    // 🔥 Voici ta méthode CORRECTE
    public List<Match> getMatchesByEvent(Long eventId) {
        return repo.findByEventId(eventId);
    }


    // 🔥 Récupérer un match par ID
public Match getMatchById(Long matchId) {
    return repo.findById(matchId)
            .orElseThrow(() -> new RuntimeException("Match introuvable"));
}

@Transactional
public Match updateScore(Long matchId, ScoreUpdateDTO dto, User currentUser) {

    // 🔒 LA LIGNE QUI CHANGE TOUT
    eventSecurityService.assertMatchAdminOrOrganizer(matchId, currentUser);

    Match match = repo.findById(matchId)
            .orElseThrow(() -> new RuntimeException("Match introuvable"));

    tournamentRulesService.assertCanScore(match);


    // 🆕 Si le match vient de commencer
    if (match.getStatus() == MatchStatus.SCHEDULED) {
        match.setStatus(MatchStatus.IN_PROGRESS);
        matchEventService.createMatchStartedEvent(match); // 🆕 EVENT
    }

    // 🆕 Détection de but
    Integer oldScoreA = match.getScoreTeamA() != null ? match.getScoreTeamA() : 0;
    Integer oldScoreB = match.getScoreTeamB() != null ? match.getScoreTeamB() : 0;
    Integer newScoreA = dto.scoreA();
    Integer newScoreB = dto.scoreB();

    // 2. Mise à jour des scores
    match.setScoreTeamA(newScoreA);
    match.setScoreTeamB(newScoreB);

    // 🆕 Si un but a été marqué par l'équipe A
    if (newScoreA > oldScoreA && match.getTeamA() != null) {
        matchEventService.createGoalEvent(
            match, 
            "Joueur",
            match.getTeamA().getId()
        );
    }

    // 🆕 Si un but a été marqué par l'équipe B
    if (newScoreB > oldScoreB && match.getTeamB() != null) {
        matchEventService.createGoalEvent(
            match, 
            "Joueur", 
            match.getTeamB().getId()
        );
    }

    // 3. Si on termine le match
    if (dto.isFinal()) {
        matchEventService.createFullTimeEvent(match); // 🆕 EVENT
        
        Match saved = finishMatch(matchId, dto.scoreA(), dto.scoreB());


        return saved;
    }

    // 4. Score intermédiaire
    return repo.save(match);
}



}
