package com.footballdemo.football_family.service;

import com.footballdemo.football_family.model.Follow;
import com.footballdemo.football_family.model.User;
import com.footballdemo.football_family.repository.FollowRepository;
import com.footballdemo.football_family.repository.UserRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class FollowService {

    private final FollowRepository followRepository;
    private final UserRepository userRepository;

    public FollowService(FollowRepository followRepository, UserRepository userRepository) {
        this.followRepository = followRepository;
        this.userRepository = userRepository;
    }

    public boolean isFollowing(User follower, User target) {
        if (follower == null || target == null)
            return false;
        return followRepository.existsByFollowerAndFollowing(follower, target);
    }

    public long getFollowersCount(User user) {
        return followRepository.countByFollowing(user);
    }

    @Transactional
    public boolean follow(User follower, User target) {
        if (follower.equals(target)) {
            throw new IllegalArgumentException("Impossible de se suivre soi-même.");
        }

        if (followRepository.existsByFollowerAndFollowing(follower, target)) {
            return false; // déjà follow
        }

        Follow f = new Follow();
        f.setFollower(follower);
        f.setFollowing(target);
        followRepository.save(f);
        return true;
    }

    @Transactional
    public boolean unfollow(User follower, User target) {
        return followRepository
                .findByFollowerAndFollowing(follower, target)
                .map(f -> {
                    followRepository.delete(f);
                    return true;
                })
                .orElse(false);
    }

    @Transactional
    public boolean toggleFollow(User follower, User target) {
        if (isFollowing(follower, target)) {
            unfollow(follower, target);
            return false; // unfollow
        } else {
            follow(follower, target);
            return true; // follow
        }
    }
}
