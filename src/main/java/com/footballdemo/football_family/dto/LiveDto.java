package com.footballdemo.football_family.dto;

import com.footballdemo.football_family.model.LiveSession;
import lombok.Data;

@Data
public class LiveDto {
    private Long id;
    private String titre;
    private String streamer;
    private String action; // "STARTED" ou "ENDED"

    public LiveDto(LiveSession live, String action) {
        this.id = live.getId();
        this.titre = live.getTitre();
        this.streamer = live.getStreamer();
        this.action = action;
    }
}
