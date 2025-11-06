package com.footballdemo.football_family.repository;

import com.footballdemo.football_family.model.Media;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MediaRepository extends JpaRepository<Media, Long> {
}

