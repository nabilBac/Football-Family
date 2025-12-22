package com.footballdemo.football_family.service;

import com.footballdemo.football_family.dto.ClubRegistrationDTO;
import com.footballdemo.football_family.exception.DuplicateResourceException;
import com.footballdemo.football_family.exception.ResourceNotFoundException;
import com.footballdemo.football_family.model.*;
import com.footballdemo.football_family.repository.ClubRepository;
import com.footballdemo.football_family.repository.UserRepository;
import com.footballdemo.football_family.repository.ClubUserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class ClubService {

    private final ClubRepository clubRepo;
    private final UserRepository userRepo;
    private final ClubUserRepository clubUserRepo;

    // ============================================================
    // 🔹 CRÉATION D’UN CLUB
    // ============================================================
    public Club createClub(ClubRegistrationDTO dto, Long creatorUserId) {

        if (clubRepo.existsBySiret(dto.getSiret())) {
            throw new DuplicateResourceException("Un club avec ce numéro SIRET existe déjà");
        }

        if (clubRepo.existsByNameIgnoreCase(dto.getName())) {
            throw new DuplicateResourceException("Un club avec ce nom existe déjà");
        }

        User creator = userRepo.findById(creatorUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur", creatorUserId));

        Club club = Club.builder()
                .name(dto.getName())
                .siret(dto.getSiret())
                .address(dto.getAddress())
                .city(dto.getCity())
                .zipCode(dto.getZipCode())
                .phone(dto.getPhone())
                .email(dto.getEmail())
                .description(dto.getDescription())
                .type(dto.getType())
                .admin(creator)
                .verificationStatus(ClubVerificationStatus.PENDING)
                .build();

        Club saved = clubRepo.save(club);

        

        // 🎯 Donner automatiquement le rôle CLUB_ADMIN au créateur
        creator.getRoles().add(UserRole.CLUB_ADMIN);
        userRepo.save(creator);

        // 🎯 Ajouter le créateur comme ADMIN dans le clubUsers
        ClubUser clubUser = ClubUser.builder()
                .club(saved)
                .user(creator)
                .role(ClubRole.ADMIN)
                .build();

        clubUserRepo.save(clubUser);

        return saved;
    }

    // ============================================================
    // 🔹 LISTE DES CLUBS EN ATTENTE
    // ============================================================
    @Transactional(readOnly = true)
    public Page<Club> getPendingClubs(Pageable pageable) {
        return clubRepo.findByVerificationStatus(ClubVerificationStatus.PENDING, pageable);
    }

    // ============================================================
    // 🔹 LISTE DES CLUBS VALIDÉS
    // ============================================================
    @Transactional(readOnly = true)
    public Page<Club> getVerifiedClubs(Pageable pageable) {
        return clubRepo.findByVerificationStatus(ClubVerificationStatus.APPROVED, pageable);
    }

    // ============================================================
    // 🔹 RECHERCHE CLUBS
    // ============================================================
    @Transactional(readOnly = true)
    public Page<Club> searchClubs(String term, Pageable pageable) {
        return clubRepo.findByNameContainingIgnoreCaseOrCityContainingIgnoreCase(term, term, pageable);
    }

    // ============================================================
    // 🔹 APPROBATION / REJET
    // ============================================================
    @Transactional
    public Club approveClub(Long clubId, Long adminId) {

        Club club = clubRepo.findById(clubId)
                .orElseThrow(() -> new ResourceNotFoundException("Club", clubId));

        User admin = userRepo.findById(adminId)
                .orElseThrow(() -> new ResourceNotFoundException("Administrateur", adminId));

        club.setVerificationStatus(ClubVerificationStatus.APPROVED);
        club.setVerifiedAt(LocalDate.now());
        club.setVerifiedBy(admin);

        return clubRepo.save(club);
    }

    @Transactional
    public Club rejectClub(Long clubId, Long adminId, String reason) {

        Club club = clubRepo.findById(clubId)
                .orElseThrow(() -> new ResourceNotFoundException("Club", clubId));

        User admin = userRepo.findById(adminId)
                .orElseThrow(() -> new ResourceNotFoundException("Administrateur", adminId));

        club.setVerificationStatus(ClubVerificationStatus.REJECTED);
        club.setVerifiedBy(admin);
        club.setVerifiedAt(LocalDate.now());

        return clubRepo.save(club);
    }

    // ============================================================
    // 🔹 AJOUT / SUPPRESSION D’UN MEMBRE (ClubUser)
    // ============================================================
    public void addMemberToClub(Long clubId, Long userId) {

        Club club = clubRepo.findById(clubId)
                .orElseThrow(() -> new ResourceNotFoundException("Club", clubId));

        User user = userRepo.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur", userId));

        // Vérifier si déjà membre
        if (clubUserRepo.existsByClubIdAndUserId(clubId, userId)) {
            throw new DuplicateResourceException("Cet utilisateur est déjà membre du club");
        }

        ClubUser clubUser = ClubUser.builder()
                .club(club)
                .user(user)
                .role(ClubRole.PLAYER) // rôle par défaut
                .build();

        clubUserRepo.save(clubUser);
    }

    public void removeMemberFromClub(Long clubId, Long userId) {

        ClubUser membership = clubUserRepo
                .findByClubIdAndUserId(clubId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Ce membre n’existe pas dans ce club"));

        clubUserRepo.delete(membership);
    }


    @Transactional(readOnly = true)
public Club getClubById(Long clubId) {
    return clubRepo.findById(clubId)
            .orElseThrow(() -> new ResourceNotFoundException("Club", clubId));
}

}
