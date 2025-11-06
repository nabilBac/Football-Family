package com.footballdemo.football_family.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.footballdemo.football_family.model.Match;
import com.footballdemo.football_family.repository.MatchRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class MatchService {
    private final MatchRepository matchRepo;

    public List<Match> getMatchesByEvent(Long eventId) {
        return matchRepo.findByEventId(eventId);
    }
}