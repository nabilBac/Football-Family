package com.footballdemo.football_family.service;

import com.footballdemo.football_family.model.TournamentGroup;
import com.footballdemo.football_family.model.Match;
import com.footballdemo.football_family.model.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TournamentService {

    private final EventService eventService;

    // 🔥 Génération des poules
   public List<TournamentGroup> generateGroups(
        Long eventId,
        int groups,
        int qualifiedPerGroup,
        User user
) {
return eventService.generateGroups(
    eventId,
    groups,
    qualifiedPerGroup,
    false
);


}
    // 🔥 Génération des matchs de poules
   public List<Match> generateMatches(Long eventId) {
    return eventService.generateMatchesForEvent(eventId);
}


    // 🔥 Récupération des rankings
    public Object computeRankings(Long eventId, User user) {
        return eventService.computeGroupRankings(eventId, user);
    }
}
