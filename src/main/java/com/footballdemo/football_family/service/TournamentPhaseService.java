package com.footballdemo.football_family.service;

import com.footballdemo.football_family.model.Event;
import com.footballdemo.football_family.model.TournamentPhase;
import com.footballdemo.football_family.repository.EventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class TournamentPhaseService {

    private final EventRepository eventRepository;

  public void moveToGroupStage(Event event) {
    if (event.getTournamentPhase() != TournamentPhase.REGISTRATION) {
        throw new IllegalStateException("Le tournoi a déjà commencé");
    }
    event.setTournamentPhase(TournamentPhase.GROUP_STAGE);
    eventRepository.save(event);
}


    public void moveToGroupStageFinished(Event event) {
        if (event.getTournamentPhase() != TournamentPhase.GROUP_STAGE) {
            return; // sécurité anti double transition
        }
        event.setTournamentPhase(TournamentPhase.GROUP_STAGE_FINISHED);
        eventRepository.save(event);
    }

    public void moveToKnockoutStage(Event event) {
        if (event.getTournamentPhase() != TournamentPhase.GROUP_STAGE_FINISHED) {
            throw new IllegalStateException("Les poules ne sont pas terminées");
        }
        event.setTournamentPhase(TournamentPhase.KNOCKOUT_STAGE);
        eventRepository.save(event);
    }

    public void moveToFinalPlayed(Event event) {
        if (event.getTournamentPhase() != TournamentPhase.KNOCKOUT_STAGE) {
            return;
        }
        event.setTournamentPhase(TournamentPhase.FINAL_PLAYED);
        eventRepository.save(event);
    }
}
