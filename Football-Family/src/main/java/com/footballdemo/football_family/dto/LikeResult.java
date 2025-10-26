package com.footballdemo.football_family.dto;

public record LikeResult(
    Long finalLikesCount, 
    boolean isLiked 
) {}