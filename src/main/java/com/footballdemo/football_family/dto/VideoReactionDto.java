package com.footballdemo.football_family.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class VideoReactionDto {
    private String emoji;
    private Integer count;
}
