package com.footballdemo.football_family.service;

import com.footballdemo.football_family.dto.MatchDTO;
import com.footballdemo.football_family.dto.MatchScoreDTO;
import com.footballdemo.football_family.dto.ScoreUpdateDTO;
import com.footballdemo.football_family.model.Match;
import com.footballdemo.football_family.model.MatchStatus;
import com.footballdemo.football_family.model.Team;
import com.footballdemo.football_family.repository.MatchRepository;
import lombok.RequiredArgsConstructor;
import com.footballdemo.football_family.security.EventSecurityService;
import com.footballdemo.football_family.model.User;
import com.footballdemo.football_family.model.Event;
import com.footballdemo.football_family.model.EventVisibility;
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

    // ✅ déjà terminé ?
    if (match.getStatus() == MatchStatus.COMPLETED) {
        throw new IllegalStateException("Ce match est déjà terminé");
    }

    // ✅ équipes connues ?
    if (match.getTeamA() == null || match.getTeamB() == null) {
        throw new IllegalStateException("Impossible de jouer ce match : les équipes ne sont pas encore connues.");
    }

    // ✅ (optionnel mais pro) autoriser uniquement SCHEDULED ou IN_PROGRESS
    if (match.getStatus() != MatchStatus.SCHEDULED && match.getStatus() != MatchStatus.IN_PROGRESS) {
        throw new IllegalStateException("Impossible de terminer ce match : statut actuel = " + match.getStatus());
    }

    // ✅ FIX : Gestion différenciée des égalités selon le type de match
    boolean isKnockoutMatch = (match.getRound() != null && !match.getRound().isEmpty());
    boolean isGroupMatch = (match.getGroup() != null);

    if (scoreA == scoreB) {
        if (isKnockoutMatch) {
            // ❌ Phase finale (KO) : égalité INTERDITE
            throw new IllegalStateException(
                "⚠️ Égalité interdite en phase finale.\n\n" +
                "Veuillez jouer les prolongations ou tirs au but, puis saisir le score final.\n" +
                "Exemple : Si 1-1 après 90 min, et 2-1 après prolongations → Saisir 2-1"
            );
        }
        
        if (isGroupMatch) {
            // ✅ Match de poule : égalité AUTORISÉE (1 point chacun)
            System.out.println("✅ Match de poule terminé sur un nul : " + scoreA + "-" + scoreB);
        } else {
            // ⚠️ Cas imprévu (ni groupe ni KO)
            throw new IllegalStateException("Type de match non identifié");
        }
    }

    // ✅ Mettre à jour les scores et terminer le match
    match.setScoreTeamA(scoreA);
    match.setScoreTeamB(scoreB);
   match.setStatus(MatchStatus.COMPLETED);
    Match savedMatch = repo.save(match);

    // ✅ CALCUL DU VAINQUEUR ET PERDANT (VARIABLES FINALES)
    final Team winner;
    final Team loser;
    
    if (scoreA > scoreB) {
        winner = savedMatch.getTeamA();
        loser = savedMatch.getTeamB();
    } else if (scoreB > scoreA) {
        winner = savedMatch.getTeamB();
        loser = savedMatch.getTeamA();
    } else {
        // Égalité → pas de winner/loser
        winner = null;
        loser = null;
    }
    // ✅ PROPAGATION UNIQUEMENT SI WINNER EXISTE (phase KO)
if (winner != null && isKnockoutMatch) {
    dynamicBracketGenerator.propagateWinner(savedMatch, winner);

    if (savedMatch.getNextMatch() != null) {
        repo.save(savedMatch.getNextMatch());
    }
    
    // 🆕 CRÉER LE TOUR SUIVANT SI PRÊT
   
}

    // ✅ GESTION DE LA PETITE FINALE (seulement si loser existe)
  if (loser != null
        && savedMatch.getRound() != null
        && savedMatch.getRound().startsWith("SF")) {

    final String currentRound = savedMatch.getRound();

    List<Match> thirdPlaceMatches =
            repo.findByEventIdAndRound(savedMatch.getEvent().getId(), "3RD_PLACE");

    if (!thirdPlaceMatches.isEmpty()) {
        Match thirdPlace = thirdPlaceMatches.get(0);

        if ("SF1".equals(currentRound)) {
            thirdPlace.setTeamA(loser);
        } else if ("SF2".equals(currentRound)) {
            thirdPlace.setTeamB(loser);
        }

        repo.save(thirdPlace);
    }
}

   // ✅ GESTION DE LA CONSOLANTE (seulement si loser existe)
if (loser != null
        && savedMatch.getRound() != null
        && savedMatch.getRound().startsWith("CSF")) {

    final String currentRound = savedMatch.getRound();

    List<Match> consolanteMatches =
            repo.findByEventIdAndRound(savedMatch.getEvent().getId(), "C3RD_PLACE");

    if (!consolanteMatches.isEmpty()) {
        Match consolanteThirdPlace = consolanteMatches.get(0);

        if ("CSF1".equals(currentRound)) {
            consolanteThirdPlace.setTeamA(loser);
        } else if ("CSF2".equals(currentRound)) {
            consolanteThirdPlace.setTeamB(loser);
        }

        repo.save(consolanteThirdPlace);
    }
}
    // 🔹 TRANSITION MÉTIER : fin des matchs de poule
    if (savedMatch.getGroup() != null) {
      boolean hasUnfinishedGroupMatches =
    repo.existsByEventIdAndGroupIsNotNullAndStatusNot(
        savedMatch.getEvent().getId(),
        MatchStatus.COMPLETED
    );

        if (!hasUnfinishedGroupMatches) {
            Event event = savedMatch.getEvent();

            if (event.getTournamentPhase() == TournamentPhase.GROUP_STAGE) {
                event.setTournamentPhase(TournamentPhase.GROUP_STAGE_FINISHED);
                eventRepository.save(event);
            }
        }
    }

    // 🔹 TRANSITION MÉTIER : finale terminée
    if ("FINAL".equals(savedMatch.getRound())) {
        Event event = savedMatch.getEvent();

        if (event.getTournamentPhase() == TournamentPhase.KNOCKOUT_STAGE) {
            event.setTournamentPhase(TournamentPhase.FINAL_PLAYED);
            eventRepository.save(event);
        }
    }

    return savedMatch;
}
    // 🔥 Voici ta méthode CORRECTE
    @Transactional(readOnly = true)
public List<Match> getMatchesByEvent(Long eventId) {
    return repo.findByEventIdWithTeamsAndClubs(eventId);
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
/**
 * ✅ NOUVEAU : Enregistre le score avec gestion des prolongations et penalties
 */
@Transactional
public Match recordMatchScoreWithPenalties(Long matchId, MatchScoreDTO scoreDTO, User currentUser) {
    
    // 🔒 Vérification de sécurité
    eventSecurityService.assertMatchAdminOrOrganizer(matchId, currentUser);
    
    Match match = repo.findById(matchId)
        .orElseThrow(() -> new RuntimeException("Match introuvable"));

    // Vérifie que c'est un match éliminatoire (KO)
    if (match.getGroup() != null) {
        throw new IllegalStateException("Les prolongations/penalties ne s'appliquent qu'aux matchs éliminatoires");
    }

    // Score temps réglementaire
    match.setScoreTeamA(scoreDTO.getRegularTimeTeamA());
    match.setScoreTeamB(scoreDTO.getRegularTimeTeamB());

    // Prolongations si applicable
    if (Boolean.TRUE.equals(scoreDTO.getHadExtraTime())) {
        match.setWentToExtraTime(true);
        match.setExtraTimeScoreTeamA(scoreDTO.getExtraTimeTeamA());
        match.setExtraTimeScoreTeamB(scoreDTO.getExtraTimeTeamB());
    } else {
        match.setWentToExtraTime(false);
        match.setExtraTimeScoreTeamA(null);
        match.setExtraTimeScoreTeamB(null);
    }

    // Tirs au but si nécessaire
    if (Boolean.TRUE.equals(scoreDTO.getHadPenalties())) {
        match.setWentToPenalties(true);
        match.setPenaltyScoreTeamA(scoreDTO.getPenaltyTeamA());
        match.setPenaltyScoreTeamB(scoreDTO.getPenaltyTeamB());
        
        // 🆕 EVENT : Tirs au but
        matchEventService.createPenaltyShootoutEvent(match);
    } else {
        match.setWentToPenalties(false);
        match.setPenaltyScoreTeamA(null);
        match.setPenaltyScoreTeamB(null);
    }
// Marque le match comme terminé
match.setStatus(MatchStatus.COMPLETED);
    matchEventService.createFullTimeEvent(match);
    
    Match savedMatch = repo.save(match);

    // ✅ Détermine le vainqueur et propage dans le bracket
    Team winner = savedMatch.getWinner(); // Utilise la méthode @Transient que tu as déjà
    
    if (winner != null) {
        dynamicBracketGenerator.propagateWinner(savedMatch, winner);
        
        if (savedMatch.getNextMatch() != null) {
            repo.save(savedMatch.getNextMatch());
        }
    }

    return savedMatch;
}
/**
 * ✅ NOUVEAU : Démarre un match (passe en IN_PROGRESS)
 */
@Transactional
public Match startMatch(Long matchId, User currentUser) {

    eventSecurityService.assertMatchAdminOrOrganizer(matchId, currentUser);

    Match match = repo.findById(matchId)
        .orElseThrow(() -> new RuntimeException("Match introuvable"));

    // ✅ PROTECTION : pas de démarrage si équipes inconnues
    if (match.getTeamA() == null || match.getTeamB() == null) {
        throw new IllegalStateException("Match impossible : équipes non définies (en attente des qualifiés).");
    }

    if (match.getStatus() != MatchStatus.SCHEDULED) {
        throw new IllegalStateException("Ce match a déjà commencé ou est terminé");
    }

    match.setStatus(MatchStatus.IN_PROGRESS);
    match.setActualStartTime(java.time.LocalDateTime.now());

    matchEventService.createMatchStartedEvent(match);

    return repo.save(match);
}

/**
 * ✅ NOUVEAU : Annule un match
 */
@Transactional
public Match cancelMatch(Long matchId, User currentUser) {
    
    eventSecurityService.assertMatchAdminOrOrganizer(matchId, currentUser);
    
    Match match = repo.findById(matchId)
        .orElseThrow(() -> new RuntimeException("Match introuvable"));

    match.setStatus(MatchStatus.CANCELLED);

    return repo.save(match);
}
// ============================================================
// 🟢 MATCHS PUBLICS D'UN ÉVÉNEMENT (SANS USER)
// ============================================================
@Transactional(readOnly = true)
public List<MatchDTO> getPublicMatchesForEvent(Long eventId) {

    Event event = eventRepository.findById(eventId)
            .orElseThrow(() -> new RuntimeException("Événement introuvable"));

    // ✅ Garde ou enlève ce check selon ton choix produit :
    // - si tu veux que “public” = uniquement événements PUBLIC, garde
    // - si tu veux “vue spectateur” même pour event club, enlève
    // if (event.getVisibility() != EventVisibility.PUBLIC) return List.of();

    return repo.findByEventIdWithTeamsAndClubs(eventId)
            .stream()
            .map(MatchDTO::from)
            .toList();
}

}
