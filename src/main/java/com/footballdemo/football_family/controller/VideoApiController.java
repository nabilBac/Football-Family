package com.footballdemo.football_family.controller;


import com.footballdemo.football_family.dto.ApiResponse;
import com.footballdemo.football_family.dto.CommentDto;
import com.footballdemo.football_family.dto.CommentListResponse;
import com.footballdemo.football_family.model.Comment;
import com.footballdemo.football_family.service.CommentService;
import com.footballdemo.football_family.service.UserService;
import com.footballdemo.football_family.service.VideoService;
import org.springframework.data.domain.Page;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController

@RequestMapping("/api/videos")
public class VideoApiController {

    private final CommentService commentService;
    private final VideoService videoService;
    private final UserService userService;

    public VideoApiController(CommentService commentService,
                              VideoService videoService,
                              UserService userService) {
        this.commentService = commentService;
        this.videoService = videoService;
        this.userService = userService;
    }

    @GetMapping("/{videoId}/comments")
    public ApiResponse<CommentListResponse> getComments(@PathVariable Long videoId,
                                                        @RequestParam(defaultValue = "0") int page,
                                                        @RequestParam(defaultValue = "5") int size) {
        Page<Comment> commentPage = commentService.getCommentsForVideo(videoId, page, size);
        List<CommentDto> comments = commentPage.getContent().stream()
                                               .map(CommentDto::new)
                                               .collect(Collectors.toList());
        CommentListResponse responseData = new CommentListResponse(comments, commentPage.getTotalElements());
        return new ApiResponse<>(true, "Commentaires chargés", responseData);
    }

    @PostMapping("/{videoId}/comment")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<CommentDto> addComment(@PathVariable Long videoId,
                                              @RequestBody Map<String, String> payload,
                                              Principal principal) {
        String content = payload.get("content");
        if (content == null || content.trim().isEmpty()) {
            throw new IllegalArgumentException("Le contenu du commentaire ne peut pas être vide.");
        }
        CommentDto commentDto = commentService.addComment(videoId, content, principal.getName());
        return new ApiResponse<>(true, "Commentaire ajouté", commentDto);
    }

    @PostMapping("/{videoId}/like")
@PreAuthorize("isAuthenticated()")
public ApiResponse<Long> likeVideoApi(@PathVariable Long videoId, Principal principal) {
    // Toggle like via ton service
    Long finalLikesCount = videoService.toggleLike(videoId, principal.getName()).finalLikesCount();
    return new ApiResponse<>(true, "Like mis à jour", finalLikesCount);
}
}
