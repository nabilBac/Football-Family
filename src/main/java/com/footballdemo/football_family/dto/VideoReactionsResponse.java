package com.footballdemo.football_family.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class VideoReactionsResponse {
    private Map<String, Integer> reactions; // { "❤️": 42, "🔥": 28 }
    private String userReaction; // L'emoji mis par l'utilisateur (ou null)
    private Integer totalReactions;
}

