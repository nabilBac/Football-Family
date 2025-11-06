package com.footballdemo.football_family.service;

import com.footballdemo.football_family.model.Team;
import com.footballdemo.football_family.model.User;
import com.footballdemo.football_family.repository.TeamRepository;
import com.footballdemo.football_family.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class TeamService {

    private final TeamRepository teamRepo;
    private final UserRepository userRepo;

    /**
     * Crée une équipe avec un coach.
     *
     * @param name      nom de l'équipe
     * @param category  catégorie (U15, U18, Sénior, etc.)
     * @param coachId   ID du coach
     * @return l'équipe créée et sauvegardée
     */
    public Team createTeam(String name, String category, Long coachId) {
        User coach = userRepo.findById(coachId)
                .orElseThrow(() -> new IllegalArgumentException("Coach introuvable avec l'ID : " + coachId));

        Team team = Team.builder()
                .name(name)
                .category(category)
                .coach(coach)
                .build();

        return teamRepo.save(team);
    }

    /**
     * Ajoute un joueur à une équipe existante.
     *
     * @param teamId   ID de l'équipe
     * @param playerId ID du joueur
     * @return l'équipe mise à jour
     */
    public Team addPlayer(Long teamId, Long playerId) {
        Team team = teamRepo.findById(teamId)
                .orElseThrow(() -> new IllegalArgumentException("Équipe introuvable avec l'ID : " + teamId));

        User player = userRepo.findById(playerId)
                .orElseThrow(() -> new IllegalArgumentException("Joueur introuvable avec l'ID : " + playerId));

        team.addPlayer(player);
        return teamRepo.save(team);
    }

    /**
     * Retourne toutes les équipes.
     */
    public List<Team> getAllTeams() {
        return teamRepo.findAll();
    }

    /**
     * Retourne toutes les équipes gérées par un coach.
     */
    public List<Team> getTeamsByCoach(Long coachId) {
        return teamRepo.findByCoachId(coachId);
    }

    /**
     * Supprime une équipe (et ses joueurs associés si cascade).
     */
    public void deleteTeam(Long teamId) {
        if (!teamRepo.existsById(teamId)) {
            throw new IllegalArgumentException("Équipe introuvable avec l'ID : " + teamId);
        }
        teamRepo.deleteById(teamId);
    }
}
