package com.footballdemo.football_family.controller;



import com.footballdemo.football_family.dto.ApiResponse;
import com.footballdemo.football_family.dto.CommentDto; // Assurez-vous d'importer CommentDto si vous l'utilisez
import com.footballdemo.football_family.service.CommentService; // ✅ Nom du service corrigé
import org.springframework.security.access.prepost.PreAuthorize; // ✅ Import corrigé
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.security.Principal; // ✅ Import corrigé
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import java.util.Map;

@RestController
@RequestMapping("/api/comments")
public class CommentApiController { // ✅ Mot-clé classe publique

    // 1. Déclaration du champ 'final' avec nom de variable
    private final CommentService commentService; 

    // 2. Constructeur pour l'injection de dépendances
    public CommentApiController(CommentService commentService) {
        this.commentService = commentService;
    }

    // 3. La route DELETE (qui devrait maintenant fonctionner via /api/comments/{id})
    @DeleteMapping("/{commentId}") 
    @PreAuthorize("isAuthenticated() and @commentService.isAuthor(#commentId, principal.name)")
    public ApiResponse<Void> deleteComment(@PathVariable Long commentId, Principal principal) {
        commentService.deleteComment(commentId, principal.getName());
        return new ApiResponse<>(true, "Commentaire supprimé", null);
    }

    // 4. Déplacez ici la route PUT de l'ancien VideoController!
    @PutMapping("/{commentId}")
    @PreAuthorize("isAuthenticated() and @commentService.isAuthor(#commentId, principal.name)")
    public ApiResponse<CommentDto> updateComment(@PathVariable Long commentId,
                                                 @RequestBody Map<String, String> payload,
                                                 Principal principal) {
        // ... Logique d'update ...
        String newContent = payload.get("content");
        if (newContent == null || newContent.trim().isEmpty()) {
            throw new IllegalArgumentException("Le contenu du commentaire ne peut pas être vide.");
        }
        CommentDto commentDto = commentService.updateComment(commentId, newContent, principal.getName());
        return new ApiResponse<>(true, "Commentaire mis à jour", commentDto);
    }
}