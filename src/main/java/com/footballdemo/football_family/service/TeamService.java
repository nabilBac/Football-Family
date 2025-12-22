package com.footballdemo.football_family.service;

import com.footballdemo.football_family.dto.CreateTeamDTO;
import com.footballdemo.football_family.model.*;
import com.footballdemo.football_family.repository.TeamRepository;
import com.footballdemo.football_family.repository.UserRepository;
import com.footballdemo.football_family.repository.EventRepository;
import com.footballdemo.football_family.repository.ClubRepository;
import com.footballdemo.football_family.dto.CreateClubTeamDTO;


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
    private final EventRepository eventRepo;
    private final ClubRepository clubRepo;

    // ---------------------------------------------------------
    // 🔥 CRÉATION D’ÉQUIPE (CLUB ou UTF)
    // ---------------------------------------------------------
    public Team createTeam(String name, String category, Long coachId,
                           Long clubId, Long eventId, String color,
                           TeamType type) {

        if (type == null) type = TeamType.PERMANENT;

        Team.TeamBuilder builder = Team.builder()
                .name(name)
                .category(category)
                .color(color)
                .teamType(type);

        // -------- PERMANENT = ÉQUIPE DE CLUB -------------------------
        if (type == TeamType.PERMANENT) {

            if (clubId == null) {
                throw new IllegalArgumentException("clubId requis pour créer une équipe permanente.");
            }

            Club club = clubRepo.findById(clubId)
                    .orElseThrow(() -> new IllegalArgumentException("Club introuvable : " + clubId));

            builder.club(club);
        }

        // -------- TEMPORARY = ÉQUIPE D’ÉVÉNEMENT UTF -----------------
        if (type == TeamType.TEMPORARY) {

            if (eventId == null) {
                throw new IllegalArgumentException("eventId obligatoire pour une équipe d'événement UTF.");
            }

            Event event = eventRepo.findById(eventId)
                    .orElseThrow(() -> new IllegalArgumentException("Événement introuvable : " + eventId));

            // Une équipe temporaire est simplement liée à l’événement
            builder.event(event);
        }

        Team savedTeam = teamRepo.save(builder.build());

        // -------- Ajout du coach -------------------------------------
        if (coachId != null) {
            User coach = userRepo.findById(coachId)
                    .orElseThrow(() -> new IllegalArgumentException("Coach introuvable : " + coachId));

            savedTeam.setCoach(coach);
            teamRepo.save(savedTeam);
        }

        return savedTeam;
    }

    // ---------------------------------------------------------
    // 🔥 AJOUT JOUEUR → la Team a une liste de joueurs directement
    // ---------------------------------------------------------
    public Team addPlayer(Long teamId, Long playerId) {

        Team team = teamRepo.findById(teamId)
                .orElseThrow(() -> new IllegalArgumentException("Équipe introuvable."));

        User player = userRepo.findById(playerId)
                .orElseThrow(() -> new IllegalArgumentException("Joueur introuvable."));

        // vérifie si déjà dans l'équipe
        if (!team.getPlayers().contains(player)) {
            team.getPlayers().add(player);
            teamRepo.save(team);
        }

        return team;
    }

    // ---------------------------------------------------------
    public List<Team> getAllTeams() {
        return teamRepo.findAll();
    }

    public List<Team> getTeamsByCoach(Long coachId) {
        return teamRepo.findByCoach_Id(coachId);

    }

    // ---------------------------------------------------------
    public void deleteTeam(Long teamId) {
        if (!teamRepo.existsById(teamId)) {
            throw new IllegalArgumentException("Équipe introuvable.");
        }
        teamRepo.deleteById(teamId);
    }

    // ---------------------------------------------------------
    public Team createTeam(CreateTeamDTO dto) {
        return createTeam(
                dto.getName(),
                dto.getCategory(),
                dto.getCoachId(),
                dto.getClubId(),
                dto.getEventId(),
                dto.getColor(),
                dto.getTeamType()
        );
    }

    // ---------------------------------------------------------
    // 🔥 CRÉATION ÉQUIPE POUR UN CLUB
    // ---------------------------------------------------------
    public Team createTeamForClub(CreateClubTeamDTO dto, Club club) {

       Team team = Team.builder()
    .name(dto.getName())
    .category(dto.getCategory())  // ✅ AJOUT
    .color(dto.getColor())
    .teamType(TeamType.PERMANENT)
    .club(club)
    .build();

        Team savedTeam = teamRepo.save(team);

        if (dto.getCoachId() != null) {
            User coach = userRepo.findById(dto.getCoachId())
                    .orElseThrow(() -> new IllegalArgumentException("Coach introuvable : " + dto.getCoachId()));

            savedTeam.setCoach(coach);
            teamRepo.save(savedTeam);
        }

        return savedTeam;
    }

    // ---------------------------------------------------------
    public List<Team> getTeamsByClub(Long clubId) {
        return teamRepo.findByClub_Id(clubId);

    }
}
