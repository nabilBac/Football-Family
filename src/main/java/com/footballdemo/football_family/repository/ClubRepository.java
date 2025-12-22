package com.footballdemo.football_family.repository;

import com.footballdemo.football_family.model.Club;
import com.footballdemo.football_family.model.ClubVerificationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ClubRepository extends JpaRepository<Club, Long> {

    Optional<Club> findBySiret(String siret);

    Optional<Club> findByNameIgnoreCase(String name);

    boolean existsBySiret(String siret);

    boolean existsByNameIgnoreCase(String name);

    List<Club> findByCity(String city);

    Page<Club> findByNameContainingIgnoreCaseOrCityContainingIgnoreCase(
            String name, String city, Pageable pageable);

    Page<Club> findByVerificationStatus(ClubVerificationStatus status, Pageable pageable);

    @Query("SELECT c FROM Club c WHERE c.verificationStatus = com.footballdemo.football_family.model.ClubVerificationStatus.PENDING ORDER BY c.createdAt ASC")
    List<Club> findPendingVerification();
}
