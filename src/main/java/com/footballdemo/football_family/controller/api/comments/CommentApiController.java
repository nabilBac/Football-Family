package com.footballdemo.football_family.controller.api.comments;

import com.footballdemo.football_family.dto.ApiResponse;
import com.footballdemo.football_family.dto.CommentDto;
import com.footballdemo.football_family.service.CommentService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.Map;

@RestController
@RequestMapping("/api/comments")
@CrossOrigin("*")
public class CommentApiController {

    private final CommentService commentService;

    public CommentApiController(CommentService commentService) {
        this.commentService = commentService;
    }

    // ============================================================
    // 🗑️ DELETE COMMENT
    // ============================================================
    @DeleteMapping("/{commentId}")
    @PreAuthorize("isAuthenticated() and @commentService.isAuthor(#commentId, authentication.name)")
    public ApiResponse<Void> deleteComment(
            @PathVariable Long commentId,
            Principal principal) {

        commentService.deleteComment(commentId, principal.getName());

        return new ApiResponse<>(true, "Commentaire supprimé", null);
    }

    // ============================================================
    // ✏️ UPDATE COMMENT
    // ============================================================
    @PutMapping("/{commentId}")
    @PreAuthorize("isAuthenticated() and @commentService.isAuthor(#commentId, authentication.name)")
    public ApiResponse<CommentDto> updateComment(
            @PathVariable Long commentId,
            @RequestBody Map<String, String> payload,
            Principal principal) {

        String newContent = payload.get("content");

        CommentDto dto = commentService.updateComment(
                commentId,
                newContent,
                principal.getName());

        return new ApiResponse<>(true, "Commentaire mis à jour", dto);
    }

    // ============================================================
    // 📝 CREATE COMMENT (POST)
    // ============================================================
    /* */ @PostMapping("/video/{videoId}")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<CommentDto> addComment(
            @PathVariable Long videoId,
            @RequestBody Map<String, String> payload,
            Principal principal) {

        String content = payload.get("content");

        CommentDto dto = commentService.addComment(
                videoId,
                content,
                principal.getName());

        return new ApiResponse<>(
                true,
                "Commentaire ajouté",
                dto);
    }

}
