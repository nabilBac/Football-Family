package com.footballdemo.football_family.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class LikeResponseDto {
    private boolean liked; // true = like actif
    private long likesCount; // total des likes
}
