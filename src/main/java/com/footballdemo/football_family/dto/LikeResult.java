package com.footballdemo.football_family.dto;


// Changement : isLiked -> isLikedNow
public record LikeResult(
 Long finalLikesCount, 
boolean isLikedNow // <-- MODIFIÉ ICI
) {}