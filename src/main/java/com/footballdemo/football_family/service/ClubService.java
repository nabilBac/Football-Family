package com.footballdemo.football_family.service;

import com.footballdemo.football_family.dto.ClubRegistrationDTO;
import com.footballdemo.football_family.exception.DuplicateResourceException;
import com.footballdemo.football_family.exception.ResourceNotFoundException;
import com.footballdemo.football_family.model.Club;
import com.footballdemo.football_family.model.ClubStatus;
import com.footballdemo.football_family.model.ClubType;
import com.footballdemo.football_family.model.User;
import com.footballdemo.football_family.model.UserRole;
import com.footballdemo.football_family.repository.ClubRepository;
import com.footballdemo.football_family.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class ClubService {

    private final ClubRepository clubRepo;
    private final UserRepository userRepo;

    public Club createClub(ClubRegistrationDTO dto, Long creatorUserId) {
        log.info("Création club: {} par user ID: {}", dto.getName(), creatorUserId);

        // Vérifier que le SIRET n'existe pas déjà
        if (clubRepo.existsBySiret(dto.getSiret())) {
            throw new DuplicateResourceException("Un club avec ce numéro SIRET existe déjà");
        }

        // Vérifier que le nom n'existe pas déjà
        if (clubRepo.existsByNameIgnoreCase(dto.getName())) {
            throw new DuplicateResourceException("Un club avec ce nom existe déjà");
        }

        // Récupérer l'utilisateur créateur
        User creator = userRepo.findById(creatorUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur", creatorUserId));

        // Créer le club
        Club club = Club.builder()
                .name(dto.getName())
                .siret(dto.getSiret())
                .address(dto.getAddress())
                .city(dto.getCity())
                .zipCode(dto.getZipCode())
                .phone(dto.getPhone())
                .email(dto.getEmail())
                .type(dto.getType())
                .description(dto.getDescription())
                .status(ClubStatus.PENDING)
                .createdAt(LocalDate.now())
                .build();

        Club savedClub = clubRepo.save(club);
        log.info("✅ Club créé avec succès - ID: {}", savedClub.getId());

        // Attribuer le rôle CLUB_ADMIN au créateur
        creator.addRole(UserRole.CLUB_ADMIN);
        creator.setClub(savedClub);
        userRepo.save(creator);
        log.info("✅ Rôle CLUB_ADMIN attribué à l'utilisateur {}", creator.getUsername());

        return savedClub;
    }

    @Transactional(readOnly = true)
    public Club getClubById(Long clubId) {
        return clubRepo.findById(clubId)
                .orElseThrow(() -> new ResourceNotFoundException("Club", clubId));
    }

    @Transactional(readOnly = true)
    public Page<Club> getAllClubs(Pageable pageable) {
        return clubRepo.findAll(pageable);
    }

    // ⭐ NOUVEAU : Récupérer les clubs en attente de validation
    @Transactional(readOnly = true)
    public Page<Club> getPendingClubs(Pageable pageable) {
        return clubRepo.findByStatus(ClubStatus.PENDING, pageable);
    }

    @Transactional(readOnly = true)
    public Page<Club> getVerifiedClubs(Pageable pageable) {
        return clubRepo.findByStatus(ClubStatus.VERIFIED, pageable);
    }

    @Transactional(readOnly = true)
    public Page<Club> getClubsByType(ClubType type, Pageable pageable) {
        return clubRepo.findByType(type, pageable);
    }

    @Transactional(readOnly = true)
    public Page<Club> searchClubs(String term, Pageable pageable) {
        return clubRepo.findByNameContainingIgnoreCaseOrCityContainingIgnoreCase(
                term, term, pageable);
    }

    // ⭐ NOUVEAU : Approuver un club
    @Transactional
    public Club approveClub(Long clubId, Long adminId) {
        log.info("Approbation du club {} par l'admin {}", clubId, adminId);

        Club club = clubRepo.findById(clubId)
                .orElseThrow(() -> new ResourceNotFoundException("Club", clubId));

        if (club.getStatus() == ClubStatus.VERIFIED) {
            log.warn("Le club {} est déjà vérifié", clubId);
            return club;
        }

        User admin = userRepo.findById(adminId)
                .orElseThrow(() -> new ResourceNotFoundException("Administrateur", adminId));

        club.setStatus(ClubStatus.VERIFIED);
        club.setVerifiedAt(LocalDate.now());
        club.setVerifiedBy(admin);

        Club savedClub = clubRepo.save(club);
        log.info("✅ Club {} approuvé avec succès", club.getName());

        return savedClub;
    }

    // ⭐ NOUVEAU : Rejeter un club
    @Transactional
    public Club rejectClub(Long clubId, Long adminId, String reason) {
        log.info("Rejet du club {} par l'admin {}. Raison: {}", clubId, adminId, reason);

        Club club = clubRepo.findById(clubId)
                .orElseThrow(() -> new ResourceNotFoundException("Club", clubId));

        User admin = userRepo.findById(adminId)
                .orElseThrow(() -> new ResourceNotFoundException("Administrateur", adminId));

        club.setStatus(ClubStatus.REJECTED);
        club.setVerifiedBy(admin);
        club.setVerifiedAt(LocalDate.now());

        Club savedClub = clubRepo.save(club);
        log.info("✅ Club {} rejeté", club.getName());

        return savedClub;
    }

    @Transactional
    public Club verifyClub(Long clubId, Long adminId) {
        Club club = clubRepo.findById(clubId)
                .orElseThrow(() -> new ResourceNotFoundException("Club not found with id: " + clubId));

        if (club.getStatus() == ClubStatus.VERIFIED) {
            return club;
        }

        User admin = userRepo.findById(adminId)
                .orElseThrow(() -> new ResourceNotFoundException("Admin user not found with id: " + adminId));

        club.setStatus(ClubStatus.VERIFIED);
        club.setVerifiedAt(LocalDate.now());
        club.setVerifiedBy(admin);

        return clubRepo.save(club);
    }

    public void addMemberToClub(Long clubId, Long userId) {
        Club club = getClubById(clubId);
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur", userId));

        club.addMember(user);
        clubRepo.save(club);
        log.info("✅ Membre {} ajouté au club {}", user.getUsername(), club.getName());
    }

    public void removeMemberFromClub(Long clubId, Long userId) {
        Club club = getClubById(clubId);
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur", userId));

        club.removeMember(user);
        clubRepo.save(club);
        log.info("✅ Membre {} retiré du club {}", user.getUsername(), club.getName());
    }
}