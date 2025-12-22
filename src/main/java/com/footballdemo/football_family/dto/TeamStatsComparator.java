package com.footballdemo.football_family.dto;



import java.util.Comparator;

public class TeamStatsComparator implements Comparator<TeamStats> {

    @Override
    public int compare(TeamStats a, TeamStats b) {
        int diffA = a.getGoalsFor() - a.getGoalsAgainst();
        int diffB = b.getGoalsFor() - b.getGoalsAgainst();

        // 1. Points
        if (a.getPoints() != b.getPoints()) {
            return b.getPoints() - a.getPoints();
        }

        // 2. Différence de buts
        if (diffA != diffB) {
            return diffB - diffA;
        }

        // 3. Buts marqués
        if (a.getGoalsFor() != b.getGoalsFor()) {
            return b.getGoalsFor() - a.getGoalsFor();
        }

        return 0;
    }
}

