package com.footballdemo.football_family.controller;

import com.footballdemo.football_family.model.User;
import com.footballdemo.football_family.model.Video;
import com.footballdemo.football_family.repository.CommentRepository;
import com.footballdemo.football_family.service.CommentService;
import com.footballdemo.football_family.service.UserService;
import com.footballdemo.football_family.service.VideoService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.UrlResource;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import java.nio.file.Path;
import com.footballdemo.football_family.model.Comment;
import org.springframework.data.domain.Sort;
import org.springframework.data.domain.Page; // <--- AJOUTER CETTE LIGNE
import java.util.Map;
import org.springframework.messaging.simp.SimpMessagingTemplate; 






import java.io.File;
import java.io.IOException;
import java.nio.file.Paths;
import java.security.Principal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.UUID;

@Controller
@RequestMapping("/videos")
public class VideoController {

    private final VideoService videoService;
    private final UserService userService;
    private final CommentRepository commentRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final CommentService commentService;

    @Value("${videos.upload.dir}")
    private String uploadDir;

    public VideoController(VideoService videoService, UserService userService,
                       CommentRepository commentRepository,
                       SimpMessagingTemplate messagingTemplate,
                       CommentService commentService) { // <-- AJOUTER ARGUMENT
    this.videoService = videoService;
    this.userService = userService;
    this.commentRepository = commentRepository;
    this.messagingTemplate = messagingTemplate;
    this.commentService = commentService; // <-- AFFECTER LE CHAMP
}

    // --- Formulaire upload
    @GetMapping("/upload")
    public String showUploadForm(Model model) {
        model.addAttribute("video", new Video());
        model.addAttribute("page", "upload");
        return "video-upload";
    }

    // --- Upload vidéo
    @PostMapping("/upload")
    public String uploadVideo(@ModelAttribute Video video,
                              @RequestParam("file") MultipartFile file,
                              Principal principal,
                              Model model) throws IOException {

        if (file.isEmpty()) {
            model.addAttribute("error", "Veuillez sélectionner un fichier !");
            return "video-upload";
        }

        // Récupérer l’extension du fichier
        String originalName = file.getOriginalFilename();
        String extension = "";
        if (originalName != null && originalName.contains(".")) {
            extension = originalName.substring(originalName.lastIndexOf("."));
        }

        // Générer un nom unique
        String filename = UUID.randomUUID().toString() + extension;

        // Vérifier le dossier de stockage
        File uploadPath = new File(uploadDir);
        if (!uploadPath.exists() && !uploadPath.mkdirs()) {
            model.addAttribute("error", "Impossible de créer le dossier de stockage des vidéos !");
            return "video-upload";
        }

        if (!uploadPath.canWrite()) {
            model.addAttribute("error", "Le serveur n'a pas les droits d'écriture dans le dossier des vidéos !");
            return "video-upload";
        }

        // Sauvegarder le fichier sur le disque
        File destination = new File(uploadPath, filename);
        file.transferTo(destination);

        // Remplir l’objet vidéo
        video.setFilename(filename);
        video.setDateUpload(LocalDateTime.now());

        User user = userService.getUserByUsername(principal.getName());
        video.setUploader(user);

        // Sauvegarder en base
        videoService.saveVideo(video);

        return "redirect:/videos/list";
    }

    // --- Lister les vidéos
    @GetMapping("/list")
    public String listVideos(@RequestParam(required = false) String category, Model model) {
        List<Video> videos = (category != null && !category.isEmpty())
                ? videoService.getVideosByCategory(category)
                : videoService.getAllVideosOrderByDate();
        model.addAttribute("videos", videos);
        return "video-list";
    }

    // --- Feed type TikTok
@GetMapping("/feed")
public String feed(@RequestParam(required = false) String category,
                   @RequestParam(defaultValue = "0") int page,
                   Model model) {

    // 1. CRÉER l'objet de pagination (Page 0, taille 5, trié)
    var pageable = PageRequest.of(page, 5, Sort.by("dateUpload").descending());

    // 2. APPELER les méthodes du service avec le paramètre 'pageable'
   List<Video> videos = (category != null && !category.isEmpty())
        ? videoService.getVideosByCategoryWithComments(category, pageable)
        : videoService.getAllVideosWithComments(pageable);     // Correction: pageable est ajouté

    // 3. Passer le contenu de la Page et les variables au modèle
    model.addAttribute("videos", videos);
    model.addAttribute("category", category);
    model.addAttribute("currentPage", page);

    model.addAttribute("page", "feed");

    return "video-feed"; 
}

// Dans VideoController.java

@GetMapping("/feed/fragment")
public String feedFragment(@RequestParam(required = false) String category,
                           @RequestParam(defaultValue = "0") int page,
                           Model model) {
    var pageable = PageRequest.of(page, 5, Sort.by("dateUpload").descending());

    // Utilisation des méthodes de service qui retournent Page<Video> standard
    Page<Video> videoPage = (category != null && !category.isEmpty())
            ? videoService.getVideosByCategory(category, pageable)
            : videoService.getAllVideosOrderByDate(pageable);
            
    // IMPORTANT : On passe la liste de vidéos du contenu de la Page au modèle
    model.addAttribute("videos", videoPage.getContent());

    // Log de vérification pour s'assurer que des vidéos sont trouvées
    System.out.println("Page demandée : " + page + ", Vidéos trouvées : " + videoPage.getContent().size());
    
    return "fragments/video-cards :: video-cards";
}




@GetMapping("/{filename:.+}")
@ResponseBody
public ResponseEntity<Resource> getVideo(@PathVariable String filename) {
    try {
        Path file = Paths.get(uploadDir).resolve(filename).normalize();
        Resource resource = new UrlResource(file.toUri());

        if (!resource.exists() || !resource.isReadable()) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("video/mp4"))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                .body(resource);

    } catch (Exception e) {
        e.printStackTrace();
        return ResponseEntity.internalServerError().build();
    }
}

// DANS VideoController.java

@PostMapping("/{videoId}/comment")
@ResponseBody
public Map<String, Object> addComment(@PathVariable Long videoId,
                                      @RequestBody Map<String, String> payload,
                                      Principal principal) {
    // ... (Logique existante de création et d'enregistrement du commentaire)

    // Logique de création du commentaire (avant l'envoi du message)
    Video video = videoService.getVideoById(videoId);
    User user = userService.getUserByUsername(principal.getName());
    // ... (Sauvegarde du commentaire)
    Comment comment = new Comment();
    comment.setVideo(video);
    comment.setAuthor(user);
    comment.setContent(payload.get("content"));
    comment.setCreatedAt(LocalDateTime.now());
    commentRepository.save(comment);

    // CRÉER L'OBJET DE RÉPONSE POUR LES MESSAGES EN TEMPS RÉEL
    Map<String, Object> newCommentData = Map.of(
        "author", user.getUsername(),
        "content", comment.getContent(),
        "videoId", videoId
    );

    // 1. ENVOYER LA NOTIFICATION VIA WEBSOCKET (Temps Réel)
    // Destination : /topic/comments/1 (pour la vidéo ID 1)
    String destination = "/topic/comments/" + videoId;
    messagingTemplate.convertAndSend(destination, newCommentData);

    // 2. RENVOYER LA RÉPONSE CLASSIQUE (pour le client qui vient de poster)
    int commentCount = commentRepository.findByVideoId(videoId).size();
    return Map.of("commentCount", commentCount);
}
    


@PostMapping("/{videoId}/like")
@ResponseBody
public Map<String, Object> likeVideo(@PathVariable Long videoId, Principal principal) {
    if (principal == null) {
        System.out.println("Utilisateur non connecté !");
        throw new RuntimeException("Utilisateur non connecté");
    }

    Video video = videoService.getVideoById(videoId);
    if (video == null) {
        System.out.println("Vidéo introuvable : " + videoId);
        throw new RuntimeException("Vidéo introuvable : " + videoId);
    }

    System.out.println("LIKE reçu pour videoId = " + videoId + ", user = " + principal.getName());
    int likes = videoService.likeVideo(videoId, principal.getName());
    Map<String, Object> response = new HashMap<>();
    response.put("likes", likes);
    return response;
}

// ... dans VideoController.java

@DeleteMapping("/comments/{commentId}") // URI RESTful
@ResponseBody
public ResponseEntity<Map<String, Object>> deleteComment(@PathVariable Long commentId, 
                                                         Principal principal) {
    if (principal == null) {
        return ResponseEntity.status(401).body(Map.of("error", "Non connecté."));
    }

    try {
        // Logique métier dans le service (vérification de l'auteur incluse)
        commentService.deleteComment(commentId, principal.getName());
        
        // 1. ENVOYER LA NOTIFICATION VIA WEBSOCKET (Temps Réel)
        // On notifie les abonnés que le commentaire a été supprimé
        String destination = "/topic/comments/delete"; // Destination générique pour la suppression
        messagingTemplate.convertAndSend(destination, Map.of(
            "action", "DELETED",
            "commentId", commentId
        ));

        // 2. RENVOYER LA RÉPONSE CLASSIQUE (code 200 OK)
        return ResponseEntity.ok(Map.of("message", "Commentaire supprimé."));

    } catch (SecurityException e) {
        // Non autorisé (pas l'auteur)
        return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
    } catch (RuntimeException e) {
        // Commentaire non trouvé
        return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
    }

    
}

// ... dans VideoController.java

@PutMapping("/comments/{commentId}") // URI RESTful
@ResponseBody
public ResponseEntity<Map<String, Object>> updateComment(@PathVariable Long commentId,
                                                         @RequestBody Map<String, String> payload,
                                                         Principal principal) {
    if (principal == null) {
        return ResponseEntity.status(401).body(Map.of("error", "Non connecté."));
    }

    String newContent = payload.get("content");
    if (newContent == null || newContent.trim().isEmpty()) {
        return ResponseEntity.badRequest().body(Map.of("error", "Le contenu ne peut être vide."));
    }

    try {
        // Logique métier dans le service (vérification de l'auteur incluse)
        Comment updatedComment = commentService.updateComment(commentId, newContent, principal.getName());

        // 1. CRÉER L'OBJET DE RÉPONSE POUR LES MESSAGES EN TEMPS RÉEL
        Map<String, Object> updatedCommentData = Map.of(
            "action", "UPDATED",
            "commentId", updatedComment.getId(),
            "content", updatedComment.getContent(),
            "author", updatedComment.getAuthor().getUsername()
            // Ajoutez d'autres champs si nécessaire (ex: date de modification)
        );

        // 2. ENVOYER LA NOTIFICATION VIA WEBSOCKET (Temps Réel)
        // On notifie les abonnés que le commentaire a été modifié
        String destination = "/topic/comments/update"; // Destination générique pour la modification
        messagingTemplate.convertAndSend(destination, updatedCommentData);

        // 3. RENVOYER LA RÉPONSE CLASSIQUE (code 200 OK)
        return ResponseEntity.ok(Map.of(
            "message", "Commentaire modifié.",
            "newContent", updatedComment.getContent()
        ));

    } catch (SecurityException e) {
        return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
    } catch (RuntimeException e) {
        return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
    }
}





}
