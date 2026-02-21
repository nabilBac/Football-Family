package com.footballdemo.football_family.repository;

import com.footballdemo.football_family.model.Follow;
import com.footballdemo.football_family.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

@Repository
public interface FollowRepository extends JpaRepository<Follow, Long> {

    long countByFollowing(User following);

    long countByFollower(User follower);

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

    // ⭐ NOUVEAU — Amis mutuels (A suit B ET B suit A)
    @Query("""
        SELECT f1.following FROM Follow f1
        WHERE f1.follower.id = :userId
        AND f1.following.id IN (
            SELECT f2.follower.id FROM Follow f2
            WHERE f2.following.id = :userId
        )
    """)
    List<User> findMutualFriends(@Param("userId") Long userId);

    // ⭐ NOUVEAU — Vérifier si deux users sont amis mutuels
    @Query("""
        SELECT CASE WHEN
            (EXISTS (SELECT 1 FROM Follow f1 WHERE f1.follower.id = :userId AND f1.following.id = :otherId))
            AND
            (EXISTS (SELECT 1 FROM Follow f2 WHERE f2.follower.id = :otherId AND f2.following.id = :userId))
        THEN true ELSE false END
    """)
    boolean areMutualFriends(@Param("userId") Long userId, @Param("otherId") Long otherId);
}