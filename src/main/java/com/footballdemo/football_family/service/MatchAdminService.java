package com.footballdemo.football_family.service;



import com.footballdemo.football_family.dto.DeletedMatchDto;
import com.footballdemo.football_family.exception.BadRequestException;
import com.footballdemo.football_family.exception.ForbiddenException;
import com.footballdemo.football_family.exception.ResourceNotFoundException;
import com.footballdemo.football_family.model.*;
import com.footballdemo.football_family.repository.EventRepository;
import com.footballdemo.football_family.repository.MatchRepository;
import com.footballdemo.football_family.repository.TeamRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class MatchAdminService {

    private final MatchRepository matchRepo;
    private final EventRepository eventRepo;
    private final TeamRepository teamRepo;
    private final EventService eventService;

    // ═══════════════════════════════════════════════════════════
    // SOFT DELETE - MATCH INDIVIDUEL
    // ═══════════════════════════════════════════════════════════

    /**
     * Supprimer UN match (soft delete)
     */
    public void deleteMatch(Long matchId, User currentUser) {
        
        Match match = matchRepo.findByIdIncludingDeleted(matchId)
                .orElseThrow(() -> new ResourceNotFoundException("Match", matchId));
        
        Event event = match.getEvent();
        
        if (!eventService.canManageEvent(event, currentUser)) {
            throw new ForbiddenException("Vous n'avez pas les droits pour supprimer ce match");
        }
        
        if (match.isDeleted()) {
            throw new BadRequestException("Le match est déjà supprimé");
        }

        // 🔒 Interdire suppression si match déjà joué
       if (match.getStatus() == MatchStatus.IN_PROGRESS ||
    match.getStatus() == MatchStatus.COMPLETED ||
    match.getStatus() == MatchStatus.LIVE ||      // legacy
    match.getStatus() == MatchStatus.FINISHED     // legacy
) {
    throw new BadRequestException("Impossible : match déjà joué (en cours ou terminé).");
}


        
        match.softDelete();
        matchRepo.save(match);
        
        log.info("✅ Match {} supprimé par user {}", matchId, currentUser.getId());
    }

    /**
     * Restaurer un match supprimé
     */
    public Match restoreMatch(Long matchId, User currentUser) {
        
        Match match = matchRepo.findByIdIncludingDeleted(matchId)
                .orElseThrow(() -> new ResourceNotFoundException("Match", matchId));
        
        Event event = match.getEvent();
        
        if (!eventService.canManageEvent(event, currentUser)) {
            throw new ForbiddenException("Vous n'avez pas les droits pour restaurer ce match");
        }
        
        if (!match.isDeleted()) {
            throw new BadRequestException("Le match n'est pas supprimé");
        }
        
        match.restore();
        Match restored = matchRepo.save(match);
        
        log.info("✅ Match {} restauré par user {}", matchId, currentUser.getId());
        
        return restored;
    }

    /**
     * Supprimer tous les matchs d'un round (ex: "FINALE", "DEMI-FINALE")
     */
  public int deleteMatchesByRound(Long eventId, String round, User currentUser) {

    Event event = eventRepo.findById(eventId)
            .orElseThrow(() -> new ResourceNotFoundException("Événement", eventId));

    if (!eventService.canManageEvent(event, currentUser)) {
        throw new ForbiddenException("Vous n'avez pas les droits pour supprimer ces matchs");
    }

    List<Match> matches = matchRepo.findByEventIdAndRound(eventId, round);

    // ✅ 1) Check vide AVANT le lock
    if (matches.isEmpty()) {
        log.warn("⚠️ Aucun match trouvé pour le round '{}' dans l'event {}", round, eventId);
        return 0;
    }

    // 🔒 2) Interdire suppression du round si au moins un match est déjà joué
   boolean locked = matches.stream().anyMatch(m ->
    !m.isDeleted() && (
        m.getStatus() == MatchStatus.IN_PROGRESS ||
        m.getStatus() == MatchStatus.COMPLETED ||
        m.getStatus() == MatchStatus.LIVE ||      // legacy
        m.getStatus() == MatchStatus.FINISHED     // legacy
    )
);

if (locked) {
    throw new BadRequestException("Impossible : un match de ce round est déjà joué (en cours ou terminé).");
}


  int deletedCount = 0;
for (Match match : matches) {
    if (!match.isDeleted()) {
        match.softDelete();
        deletedCount++;
    }
}

matchRepo.saveAll(matches);


    log.info("✅ {} matchs du round '{}' supprimés par user {}", deletedCount, round, currentUser.getId());
    return deletedCount;
}

    /**
     * Modifier un match (équipes, horaire, statut)
     */
    public Match updateMatch(
            Long matchId,
            Long teamAId,
            Long teamBId,
            LocalDate date,
            LocalTime time,
            String field,
            MatchStatus status,
            User currentUser
    ) {
        
        Match match = matchRepo.findActiveById(matchId)
                .orElseThrow(() -> new ResourceNotFoundException("Match", matchId));
        
        Event event = match.getEvent();
        
        if (!eventService.canManageEvent(event, currentUser)) {
            throw new ForbiddenException("Vous n'avez pas les droits pour modifier ce match");
        }
        
        // Interdire la modification si le match est terminé
        if (match.getStatus() == MatchStatus.COMPLETED) {
            throw new BadRequestException("Impossible de modifier un match terminé");
        }
        
        // Modifier les équipes si fournies
        if (teamAId != null) {
            Team teamA = teamRepo.findById(teamAId)
                    .orElseThrow(() -> new ResourceNotFoundException("Équipe A", teamAId));
            
            if (!teamA.getEvent().getId().equals(event.getId())) {
                throw new BadRequestException("L'équipe A doit appartenir au même événement");
            }
            
            match.setTeamA(teamA);
        }
        
        if (teamBId != null) {
            Team teamB = teamRepo.findById(teamBId)
                    .orElseThrow(() -> new ResourceNotFoundException("Équipe B", teamBId));
            
            if (!teamB.getEvent().getId().equals(event.getId())) {
                throw new BadRequestException("L'équipe B doit appartenir au même événement");
            }
            
            match.setTeamB(teamB);
        }
        
        // Modifier l'horaire si fourni
        if (date != null) {
            match.setDate(date);
        }
        
        if (time != null) {
            match.setTime(time);
        }
        
        if (field != null) {
            match.setField(field);
        }
        
        // Modifier le statut si fourni
        if (status != null) {
            match.setStatus(status);
        }
        
        Match updated = matchRepo.save(match);
        
        log.info("✅ Match {} modifié par user {}", matchId, currentUser.getId());
        
        return updated;
    }

    // ═══════════════════════════════════════════════════════════
    // HARD DELETE (ADMIN UNIQUEMENT)
    // ═══════════════════════════════════════════════════════════

    /**
     * Suppression définitive d'un match (HARD DELETE)
     * ⚠️ IRRÉVERSIBLE - Utiliser avec précaution
     */
    public void hardDeleteMatch(Long matchId, User currentUser) {
        
        if (!currentUser.isSuperAdmin()) {
            throw new ForbiddenException("Seul un administrateur peut supprimer définitivement un match");
        }
        
        Match match = matchRepo.findByIdIncludingDeleted(matchId)
                .orElseThrow(() -> new ResourceNotFoundException("Match", matchId));
        
        // Vérifier que le match est déjà soft deleted
        if (!match.isDeleted()) {
            throw new BadRequestException("Le match doit d'abord être archivé avant suppression définitive");
        }
        
        matchRepo.delete(match);
        
        log.warn("⚠️ Match {} supprimé DÉFINITIVEMENT par user {}", matchId, currentUser.getId());
    }

    // ═══════════════════════════════════════════════════════════
    // UTILITAIRES
    // ═══════════════════════════════════════════════════════════

    /**
     * Récupérer tous les matchs supprimés d'un event (admin)
     */
    @Transactional(readOnly = true)
    public List<Match> getDeletedMatches(Long eventId, User currentUser) {
        
        Event event = eventRepo.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Événement", eventId));
        
        if (!eventService.canManageEvent(event, currentUser)) {
            throw new ForbiddenException("Vous n'avez pas les droits pour voir les matchs supprimés");
        }
        
        return matchRepo.findDeletedByEventId(eventId);
    }


  public List<DeletedMatchDto> getAllDeletedMatches(
        Long eventId,
        String round,
        User currentUser
) {

    List<Match> matches;

    if (currentUser.isSuperAdmin()) {
        if (eventId != null && round != null) {
            matches = matchRepo.findByEventIdAndRoundAndDeletedTrue(eventId, round);
        } else if (eventId != null) {
            matches = matchRepo.findByEventIdAndDeletedTrue(eventId);
        } else if (round != null) {
            matches = matchRepo.findByRoundAndDeletedTrue(round);
        } else {
            matches = matchRepo.findByDeletedTrue();
        }
    } else if (currentUser.isClubAdmin()) {
        Long clubId = currentUser.getPrimaryClubId();
        if (clubId == null) {
            return List.of();
        }

        if (eventId != null && round != null) {
            matches = matchRepo.findByEventIdAndRoundAndDeletedTrueAndEventClubId(eventId, round, clubId);
        } else if (eventId != null) {
            matches = matchRepo.findByEventIdAndDeletedTrueAndEventClubId(eventId, clubId);
        } else if (round != null) {
            matches = matchRepo.findByRoundAndDeletedTrueAndEventClubId(round, clubId);
        } else {
            matches = matchRepo.findByDeletedTrueAndEventClubId(clubId);
        }
    } else {
        return List.of();
    }

    // 🔥 LA SEULE LIGNE NOUVELLE QUI CORRIGE TOUT
    return matches.stream()
        .map(m -> new DeletedMatchDto(
            m.getId(),
            m.getRound(),
            m.getTeamA() != null ? m.getTeamA().getName() : "?",
            m.getTeamB() != null ? m.getTeamB().getName() : "?",
            m.getEvent() != null ? m.getEvent().getName() : "-",
            m.getDeletedAt()
        ))
        .toList();
}

}
