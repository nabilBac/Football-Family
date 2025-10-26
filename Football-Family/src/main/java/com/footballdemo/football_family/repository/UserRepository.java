package com.footballdemo.football_family.repository;


import com.footballdemo.football_family.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional; // 👈 NOUVEL IMPORT

public interface UserRepository extends JpaRepository<User, Long> {
    // Changement CRITIQUE : Retourne un Optional<User>
    Optional<User> findByUsername(String username);
}
