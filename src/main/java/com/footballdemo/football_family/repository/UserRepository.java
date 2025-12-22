package com.footballdemo.football_family.repository;

import com.footballdemo.football_family.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByUsername(String username);

    Optional<User> findByEmail(String email);

    boolean existsByUsername(String username);

    boolean existsByEmail(String email);


    @Query("""
    SELECT u FROM User u
    LEFT JOIN FETCH u.clubUsers cu
    LEFT JOIN FETCH cu.club
    WHERE u.username = :username
""")
Optional<User> findByUsernameWithClubs(@Param("username") String username);
}
