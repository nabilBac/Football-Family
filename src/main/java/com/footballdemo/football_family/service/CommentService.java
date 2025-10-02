package com.footballdemo.football_family.service;



import com.footballdemo.football_family.model.Comment;
import com.footballdemo.football_family.model.Video; // <-- Importation nécessaire
// import com.footballdemo.football_family.model.User; // Si vous n'utilisez pas User directement ici, l'importation n'est pas essentielle.
import com.footballdemo.football_family.repository.CommentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CommentService {

    private final CommentRepository commentRepository;

    public CommentService(CommentRepository commentRepository) {
        this.commentRepository = commentRepository;
    }

    public Comment getCommentById(Long id) {
        return commentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Commentaire non trouvé : " + id));
    }

    /**
     * Supprime un commentaire après vérification de l'auteur et met à jour l'entité Video.
     * * CORRECTION: Ajout de la logique pour désynchroniser le commentaire de la liste de la vidéo parente.
     */
    @Transactional
    public void deleteComment(Long commentId, String currentUsername) {
        Comment comment = getCommentById(commentId);
        
        // 1. Vérification d'autorisation : Seul l'auteur peut supprimer
        if (!comment.getAuthor().getUsername().equals(currentUsername)) {
            throw new SecurityException("Non autorisé à supprimer ce commentaire.");
        }
        
        // 2. 🌟 CORRECTION CRUCIALE : Désynchroniser le commentaire de la vidéo parente.
        Video video = comment.getVideo();
        if (video != null) {
            // Retire l'objet Comment de la collection List<Comment> de l'objet Video
            // pour mettre à jour l'état de l'entité JPA en mémoire.
            video.getComments().remove(comment); 
        }
        
        // 3. Suppression effective dans la base de données.
        commentRepository.delete(comment);
    }

    /**
     * Modifie le contenu d'un commentaire après vérification de l'auteur.
     */
    @Transactional
    public Comment updateComment(Long commentId, String newContent, String currentUsername) {
        Comment comment = getCommentById(commentId);

        // Vérification d'autorisation : Seul l'auteur peut modifier
        if (!comment.getAuthor().getUsername().equals(currentUsername)) {
            throw new SecurityException("Non autorisé à modifier ce commentaire.");
        }

        comment.setContent(newContent);
        // Mettre à jour la date de modification (optionnel mais recommandé)
        // comment.setUpdatedAt(LocalDateTime.now());
        
        return commentRepository.save(comment);
    }
}