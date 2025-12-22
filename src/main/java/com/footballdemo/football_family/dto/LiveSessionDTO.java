package com.footballdemo.football_family.dto;



import com.footballdemo.football_family.model.LiveSession;
import lombok.Data;

@Data
public class LiveSessionDTO {
    private Long id;
    private String titre;
    private String description;
    private String streamer;
    private boolean actif;

    private Long userId;
    private String username;
    private String avatarUrl;

    public LiveSessionDTO(LiveSession live) {
        this.id = live.getId();
        this.titre = live.getTitre();
        this.description = live.getDescription();
        this.streamer = live.getStreamer();
        this.actif = live.isActif();

        if (live.getUser() != null) {
            this.userId = live.getUser().getId();
            this.username = live.getUser().getUsername();
            this.avatarUrl = live.getUser().getAvatarUrl();
        }
    }
}
