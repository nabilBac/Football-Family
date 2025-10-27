package com.footballdemo.football_family.service;



import com.footballdemo.football_family.dto.CommentDto;
import com.footballdemo.football_family.dto.VideoStatsUpdateDto;
import com.footballdemo.football_family.model.Comment;
import com.footballdemo.football_family.model.User;
import com.footballdemo.football_family.model.Video;
import com.footballdemo.football_family.repository.CommentRepository;
import com.footballdemo.football_family.repository.UserRepository;
import com.footballdemo.football_family.repository.VideoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.PageRequest;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;




import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;
import java.util.Queue;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;
import org.springframework.data.domain.Sort;


@Service
public class CommentService {

    private final CommentRepository commentRepository;
    private final UserRepository userRepository;
    private final VideoRepository videoRepository;
    private final SimpMessagingTemplate messagingTemplate;

     private final Map<Long, Queue<Map<String, Object>>> commentQueues = new ConcurrentHashMap<>();
    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(1);

    @Value("${comments.websocket.batch-size:5}")
    private int maxBatchSize;



    public CommentService(CommentRepository commentRepository,
                          UserRepository userRepository,
                          VideoRepository videoRepository,
                          SimpMessagingTemplate messagingTemplate) {
        this.commentRepository = commentRepository;
        this.userRepository = userRepository;
        this.videoRepository = videoRepository;
        this.messagingTemplate = messagingTemplate;

        scheduler.scheduleAtFixedRate(this::flushCommentQueues, 0, 1, TimeUnit.SECONDS);
    }

   public Page<Comment> getCommentsForVideo(Long videoId, int page, int size) {
    Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
    List<Comment> comments = commentRepository.findByVideoIdWithAuthorsPaged(videoId, pageable);
    long total = commentRepository.countByVideoId(videoId);
    return new PageImpl<>(comments, pageable, total);
}

      /**
       * Vérifie si l'utilisateur est l'auteur du commentaire.
       */
    public boolean isAuthor(Long commentId, String username) {
         return commentRepository.findById(commentId)
                 .map(comment -> comment.getAuthor().getUsername().equals(username))
                 .orElse(false); // Faux si le commentaire n'existe pas
    }

@Transactional
public CommentDto addComment(Long videoId, String content, String username) {

    if (content == null || content.trim().isEmpty()) {
        throw new IllegalArgumentException("Le contenu du commentaire ne peut pas être vide.");
    }
// Récupérer la vidéo à laquelle on veut ajouter le commentaire
 Video video = videoRepository.findById(videoId)
 .orElseThrow(() -> new RuntimeException("Vidéo introuvable"));

System.out.println("🟢 AVANT ajout - Video " + videoId + " commentsCount: " + video.getCommentsCount());

 // Récupérer l'utilisateur auteur du commentaire
 User user = userRepository.findByUsername(username)
 .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));

 // Créer un nouvel objet Comment
 Comment comment = new Comment();
 comment.setContent(content); // Le contenu du commentaire
 comment.setCreatedAt(LocalDateTime.now()); // Date de création
 comment.setAuthor(user); // L'auteur du commentaire
 comment.setVideo(video); // La vidéo à laquelle le commentaire appartient

 // Sauvegarder le commentaire dans la base de données
 Comment saved = commentRepository.save(comment);

 // Ajouter le commentaire à la liste des commentaires de la vidéo
 video.getComments().add(saved);
 videoRepository.incrementCommentsCount(videoId);

 Long newCount = videoRepository.getCommentsCountById(videoId);
 System.out.println("🟢 APRÈS ajout - Video " + videoId + " commentsCount: " + newCount);

 // Créer un DTO pour le commentaire sauvegardé
 CommentDto commentDto = new CommentDto(saved);
    
    // 🎯 AJOUT CLÉ : ENVOI DE LA MISE À JOUR DES STATISTIQUES DU FEED
    // 1. Créer le DTO de statistiques (Likes=null, Comments=newCount)
VideoStatsUpdateDto statsPayload = new VideoStatsUpdateDto(
    videoId, 
    null,       // newLikesCount pas affecté
    null,       // isLiked pas affecté
    newCount,   // newCommentsCount
    null        // lastActionBy pas concerné ici
);

    // 2. Envoyer sur le topic général de la vidéo pour la mise à jour du feed
    // Utilise /topic/video/ (topic singulier) pour les stats générales
    String videoStatsTopic = "/topic/video/" + videoId; 
    messagingTemplate.convertAndSend(videoStatsTopic, statsPayload);

 // Envoi WebSocket immédiat (pour la liste des commentaires)
 Map<String, Object> wsPayload = new HashMap<>();
 wsPayload.put("action", "CREATED");
 wsPayload.put("comment", commentDto);
 wsPayload.put("videoId", videoId);

// Utilise /topic/videos/ (topic pluriel) pour l'ajout dans la liste
 messagingTemplate.convertAndSend("/topic/videos/" + videoId + "/comments", wsPayload);

 return commentDto;
}
    // --- METTRE À JOUR UN COMMENTAIRE ---
@Transactional
public CommentDto updateComment(Long commentId, String newContent, String username) {
    // 🎯 FIX: Retrieve the existing comment from the database
    Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Commentaire introuvable"));

                if (newContent == null || newContent.trim().isEmpty()) {
        throw new IllegalArgumentException("Le contenu du commentaire ne peut pas être vide.");
    }
    
    // 🎯 FIX: Verify the user is the author before proceeding
    if (!comment.getAuthor().getUsername().equals(username)) {
        throw new SecurityException("L'utilisateur n'est pas l'auteur de ce commentaire.");
    }

    // Modification du contenu (as per original logic)
    comment.setContent(newContent);
    comment.setUpdatedAt(LocalDateTime.now());
    
    // Save the updated comment. It's safe to assign it to 'updated'.
    Comment updated = commentRepository.save(comment);
    
    CommentDto commentDto = new CommentDto(updated);

    Long videoId = updated.getVideo().getId();

    Map<String,Object> wsPayload = new HashMap<>();
    wsPayload.put("action", "UPDATED");
    wsPayload.put("comment", commentDto); 
    wsPayload.put("videoId", videoId);
    
    // ENVOI VERS LE TOPIC /update
    String topic = "/topic/videos/" + videoId + "/update"; 
    messagingTemplate.convertAndSend(topic, wsPayload);

    return commentDto;
}
    // --- SUPPRIMER UN COMMENTAIRE ---
@Transactional
public void deleteComment(Long commentId, String username) {
    // 🎯 FIX: Retrieve the existing comment from the database
    Comment comment = commentRepository.findById(commentId)
            .orElseThrow(() -> new RuntimeException("Commentaire introuvable"));

    // 🎯 FIX: Verify the user is the author before proceeding
    if (!comment.getAuthor().getUsername().equals(username)) {
        throw new SecurityException("L'utilisateur n'est pas l'auteur de ce commentaire.");
    }

    Long videoId = comment.getVideo().getId();
    Video video = comment.getVideo(); // Get video object before deletion
    
    System.out.println("🔴 AVANT suppression - Video " + videoId + " commentsCount: " + video.getCommentsCount());

    // Retirer de la collection Java (si vous gérez la relation de cette manière)
    // Note: If 'video' is a managed entity, this line helps keep the session consistent.
    video.getComments().remove(comment); 

    // Supprimer le commentaire
    commentRepository.delete(comment);
    
    // Décrémenter le compteur en base
    videoRepository.decrementCommentsCount(videoId);

    Long newCount = videoRepository.getCommentsCountById(videoId);
    System.out.println("🔴 APRÈS suppression - Video " + videoId + " commentsCount: " + newCount);

    // 🎯 AJOUT CLÉ : ENVOI DE LA MISE À JOUR DES STATISTIQUES DU FEED
// 1. Créer le DTO de statistiques (Likes=null, Comments=newCount)
VideoStatsUpdateDto statsPayload = new VideoStatsUpdateDto(
    videoId, 
    null,
    null,
    newCount, // récupère la nouvelle taille si nécessaire
    null
);

// 2. Envoyer sur le topic général de la vidéo pour la mise à jour du feed
String videoStatsTopic = "/topic/video/" + videoId; // ATTENTION : C'est /topic/video/, PAS /topic/videos/
messagingTemplate.convertAndSend(videoStatsTopic, statsPayload);


    // WebSocket
    Map<String,Object> wsPayload = new HashMap<>();
    wsPayload.put("action", "DELETED");
    wsPayload.put("commentId", commentId);
    wsPayload.put("videoId", videoId);
    
    // ENVOI VERS LE TOPIC /delete
    String topic = "/topic/videos/" + videoId + "/delete"; 
    messagingTemplate.convertAndSend(topic, wsPayload);
}
private void flushCommentQueues() {
    for (Map.Entry<Long, Queue<Map<String, Object>>> entry : commentQueues.entrySet()) {
        Long videoId = entry.getKey();
        Queue<Map<String, Object>> queue = entry.getValue();

        if (!queue.isEmpty()) {
            List<Map<String, Object>> batch = new ArrayList<>();
            while (!queue.isEmpty() && batch.size() < maxBatchSize) {
                batch.add(queue.poll());
            }
            System.out.println("Envoyer un batch de commentaires : " + batch.size());  // Log pour vérifier le batch
            // Envoi en batch sur le topic existant /comments
            messagingTemplate.convertAndSend("/topic/videos/" + videoId + "/comments", batch);
        }
    }
}
    public List<CommentDto> getCommentsByVideoId(Long videoId) {
        List<Comment> comments = commentRepository.findByVideoId(videoId);
        return comments.stream().map(comment -> new CommentDto(comment)).collect(Collectors.toList());
    }
    /**
 * Récupère uniquement les X derniers commentaires pour une vidéo.
 */
public List<CommentDto> getRecentCommentsByVideoId(Long videoId, int limit) {
    
    // Crée l'objet Pageable pour la limite de X commentaires
    // Le tri (DESC par createdAt) est déjà géré dans l'annotation @Query du Repository,
    // donc nous n'avons besoin que de la taille de la page (limit)
    Pageable pageable = PageRequest.of(0, limit); 

    // 🎯 UTILISATION de la méthode optimisée de votre Repository
    Page<Comment> commentPage = commentRepository.findTopCommentsByVideo(videoId, pageable);
    
    // Convertir la liste des entités Comment en liste de DTO
    return commentPage.getContent().stream()
        .map(CommentDto::new)
        .collect(Collectors.toList());
}

/**
 * Récupère le nombre total de commentaires pour la vidéo.
 */
public long getCommentCountByVideoId(Long videoId) {
    // NOTE : Vous devez implémenter cette méthode dans votre CommentRepository
    // public long countByVideoId(Long videoId);
    return commentRepository.countByVideoId(videoId); 
}

}