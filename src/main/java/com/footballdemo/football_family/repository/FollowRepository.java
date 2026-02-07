package com.footballdemo.football_family.repository;

import com.footballdemo.football_family.model.Follow;
import com.footballdemo.football_family.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query; // 🎯 NOUVEL IMPORT
import org.springframework.data.repository.query.Param; // 🎯 NOUVEL IMPORT
import org.springframework.stereotype.Repository;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List; // 🎯 NOUVEL IMPORT

@Repository
public interface FollowRepository extends JpaRepository<Follow, Long> {

    long countByFollowing(User following); // Nombre d'abonnés

    long countByFollower(User follower); // Nombre d'abonnements

    boolean existsByFollowerAndFollowing(User follower, User following);

    Optional<Follow> findByFollowerAndFollowing(User follower, User following);

    @Query("SELECT f.following.id FROM Follow f WHERE f.follower = :follower")
    List<Long> findFollowingIdsByFollower(@Param("follower") User follower);



    // ✅ Count optimisé
@Query("SELECT COUNT(f) FROM Follow f WHERE f.following.id = :userId")
long countFollowers(@Param("userId") Long userId);

@Query("SELECT COUNT(f) FROM Follow f WHERE f.follower.id = :userId")
long countFollowing(@Param("userId") Long userId);

// ✅ Exists check
boolean existsByFollowerIdAndFollowingId(Long followerId, Long followingId);

// ✅ Pagination avec fetch join
@Query("SELECT f.follower FROM Follow f WHERE f.following.id = :userId")
Page<User> findFollowersByUserId(@Param("userId") Long userId, Pageable pageable);

@Query("SELECT f.following FROM Follow f WHERE f.follower.id = :userId")
Page<User> findFollowingByUserId(@Param("userId") Long userId, Pageable pageable);
}
