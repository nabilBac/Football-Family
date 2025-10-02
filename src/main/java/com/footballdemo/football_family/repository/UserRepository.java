package com.footballdemo.football_family.repository;

import com.footballdemo.football_family.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long> {
    User findByUsername(String username);
}
