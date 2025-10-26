package com.footballdemo.football_family.controller;

import com.footballdemo.football_family.model.User;
import com.footballdemo.football_family.model.Video;
import com.footballdemo.football_family.dto.CommentDto;
import com.footballdemo.football_family.dto.CommentListResponse;
import com.footballdemo.football_family.dto.LikeResult;
import com.footballdemo.football_family.dto.VideoDto;
import com.footballdemo.football_family.repository.CommentRepository;
import com.footballdemo.football_family.service.CommentService;
import com.footballdemo.football_family.service.UserService;
import com.footballdemo.football_family.service.VideoService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.UrlResource;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import jakarta.annotation.PostConstruct;
import org.springframework.security.access.prepost.PreAuthorize;
import com.footballdemo.football_family.dto.ApiResponse;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.data.domain.Page;
import com.footballdemo.football_family.model.Comment;




import java.io.File;
import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.Principal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Controller
@RequestMapping("/videos")
public class VideoController {

    private final VideoService videoService;
    private final UserService userService;
    private final CommentService commentService;

    
  


    @Value("${videos.upload.dir}")
    private String uploadDir;

   public VideoController(VideoService videoService,
                       UserService userService,
                       CommentService commentService,
                       CommentRepository commentRepository,
                       SimpMessagingTemplate messagingTemplate) { // <-- AJOUTER
    this.videoService = videoService;
    this.userService = userService;
    this.commentService = commentService;
   
}


    @PostConstruct
    public void init() {
        File folder = new File(uploadDir);
        if (!folder.exists() && !folder.mkdirs()) {
            throw new RuntimeException("Impossible de créer le dossier de stockage : " + uploadDir);
        }
        System.out.println("📂 Dossier de stockage des vidéos : " + uploadDir);
    }

    // ------------------- UPLOAD -------------------
    @GetMapping("/upload")
    @PreAuthorize("isAuthenticated()")
    public String showUploadForm(Model model) {
        model.addAttribute("video", new Video());
        model.addAttribute("page", "upload");
        return "video-upload";
    }

    @PostMapping("/upload")
    @PreAuthorize("isAuthenticated()")
    public String uploadVideo(@ModelAttribute Video video,
                              @RequestParam("file") MultipartFile file,
                              Principal principal,
                              Model model) throws IOException {

        if (file.isEmpty()) {
            model.addAttribute("error", "Veuillez sélectionner un fichier !");
            return "video-upload";
        }

        String originalName = file.getOriginalFilename();
        String extension = (originalName != null && originalName.contains("."))
                ? originalName.substring(originalName.lastIndexOf("."))
                : "";

        String filename = UUID.randomUUID() + extension;
        String thumbnailUrl = UUID.randomUUID() + ".jpg";

        File destination = new File(uploadDir, filename);
        file.transferTo(destination);

        video.setFilename(filename);
        video.setThumbnailUrl(thumbnailUrl);
        video.setDateUpload(LocalDateTime.now());

        User uploader = userService.getUserByUsername(principal.getName())
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable !"));
        video.setUploader(uploader);

        videoService.saveVideo(video);
        return "redirect:/videos/list";
    }

    // ------------------- LIST / FEED -------------------
    @GetMapping("/list")
    public String listVideos(Principal principal, Model model) {
        List<VideoDto> videos = videoService.getFeedVideosForUser(
                PageRequest.of(0, 50, Sort.by("dateUpload").descending()),
                principal != null ? principal.getName() : "anonymousUser"
        );
        model.addAttribute("videos", videos);
        return "video-list";
    }

    @GetMapping("/feed")
    public String feed(@RequestParam(defaultValue = "0") int page,
                       Principal principal,
                       Model model) {
        List<VideoDto> videos = videoService.getFeedVideosForUser(
                PageRequest.of(page, 5, Sort.by("dateUpload").descending()),
                principal != null ? principal.getName() : "anonymousUser"
        );
        model.addAttribute("videos", videos);
        model.addAttribute("currentPage", page);
        model.addAttribute("page", "feed");
        model.addAttribute("cssVersion", System.currentTimeMillis());
        return "video-feed";
    }

    @GetMapping("/feed/fragment")
    public String loadVideoFragment(@RequestParam(defaultValue = "0") int page,
                                    Principal principal,
                                    Model model) {
        List<VideoDto> videos = videoService.getFeedVideosForUser(
                PageRequest.of(page, 5, Sort.by("dateUpload").descending()),
                principal != null ? principal.getName() : "anonymousUser"
        );
        model.addAttribute("videos", videos);
        return "fragments/video-cards :: video-cards";
    }

    // ------------------- GET VIDEO FILE -------------------
    @GetMapping("/{filename:.+}")
    @ResponseBody
    public ResponseEntity<Resource> getVideo(@PathVariable String filename) {
        try {
            Path file = Paths.get(uploadDir).resolve(filename).normalize();
            Resource resource = new UrlResource(file.toUri());

            if (!resource.exists() || !resource.isReadable())
                return ResponseEntity.notFound().build();

            String contentType = filename.toLowerCase().endsWith(".mp4") ? "video/mp4" : MediaType.APPLICATION_OCTET_STREAM_VALUE;
            String cacheControl = "public, max-age=31536000, immutable";

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                    .header(HttpHeaders.CACHE_CONTROL, cacheControl)
                    .body(resource);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    // ------------------- LIKE -------------------
@PostMapping("/{videoId}/like")
@ResponseBody
@PreAuthorize("isAuthenticated()")
public ApiResponse<Long> likeVideo(@PathVariable Long videoId, Principal principal) { 
    try {
        // 1. Appeler la nouvelle méthode du service : 'toggleLike'
        //    Celle-ci retourne le LikeResult complet (compteur final + isLiked)
        //    et se charge désormais de la diffusion WebSocket.
        LikeResult result = videoService.toggleLike(videoId, principal.getName()); 
        
        // 2. Renvoyer la réponse REST (pour l'affichage optimiste de l'utilisateur qui a cliqué)
        //    Le LikeResult étant un record, vous utilisez result.finalLikesCount()
        return new ApiResponse<>(true, "Like mis à jour", result.finalLikesCount()); 
        
    } catch (Exception e) {
        // En cas d'erreur, renvoyer 0L
        return new ApiResponse<>(false, e.getMessage(), 0L); 
    }
}


    // ------------------- COMMENTAIRES -------------------
    @PostMapping("/{videoId}/comment")
    @ResponseBody
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<CommentDto> addComment(@PathVariable Long videoId,
                                              @RequestBody Map<String, String> payload,
                                              Principal principal) {
        String content = payload.get("content");
        if (content == null || content.trim().isEmpty()) {
            return new ApiResponse<>(false, "Le contenu du commentaire ne peut pas être vide.", null);
        }
        try {
            CommentDto commentDto = commentService.addComment(videoId, content, principal.getName());
            return new ApiResponse<>(true, "Commentaire ajouté", commentDto);
        } catch (RuntimeException e) {
            return new ApiResponse<>(false, e.getMessage(), null);
        }
    }
@GetMapping("/{videoId}/comments")
@ResponseBody
public ApiResponse<CommentListResponse> getComments(
        @PathVariable Long videoId,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "5") int size) {
    try {
        // Appel paginé
        Page<Comment> commentPage = commentService.getCommentsForVideo(videoId, page, size);

        List<CommentDto> comments = commentPage.getContent().stream()
                .map(CommentDto::new)
                .collect(Collectors.toList());

        CommentListResponse responseData = new CommentListResponse(
                comments,
                commentPage.getTotalElements() // total réel
        );

        return new ApiResponse<>(true, "Commentaires chargés", responseData);
    } catch (RuntimeException e) {
        return new ApiResponse<>(false, e.getMessage(), null);
    }
}


    @PutMapping("/comments/{commentId}")
    @ResponseBody
    @PreAuthorize("isAuthenticated() and @commentService.isAuthor(#commentId, principal.name)")
    public ApiResponse<CommentDto> updateComment(@PathVariable Long commentId,
                                                 @RequestBody Map<String, String> payload,
                                                 Principal principal) {
        String newContent = payload.get("content");
        if (newContent == null || newContent.trim().isEmpty()) {
            return new ApiResponse<>(false, "Le contenu du commentaire ne peut pas être vide.", null);
        }
        try {
            CommentDto commentDto = commentService.updateComment(commentId, newContent, principal.getName());
            return new ApiResponse<>(true, "Commentaire mis à jour", commentDto);
        } catch (RuntimeException e) {
            return new ApiResponse<>(false, e.getMessage(), null);
        }
    }

    @DeleteMapping("/comments/{commentId}")
    @ResponseBody
    @PreAuthorize("isAuthenticated() and @commentService.isAuthor(#commentId, principal.name)")
    public ApiResponse<Void> deleteComment(@PathVariable Long commentId, Principal principal) {
        try {
            commentService.deleteComment(commentId, principal.getName());
            return new ApiResponse<>(true, "Commentaire supprimé", null);
        } catch (RuntimeException e) {
            return new ApiResponse<>(false, e.getMessage(), null);
        }
    }

    // ------------------- SUPPRESSION VIDEO -------------------
    @PostMapping("/{videoId}/delete")
    @PreAuthorize("isAuthenticated() and @videoService.isUploader(#videoId, principal.name)")
    public String deleteVideo(@PathVariable Long videoId, Principal principal, Model model) {
        try {
            videoService.deleteVideo(videoId);
            model.addAttribute("successMessage", "Vidéo supprimée avec succès.");
        } catch (RuntimeException e) {
            model.addAttribute("error", "Erreur lors de la suppression: " + e.getMessage());
        }
        return "redirect:/profile/" + principal.getName();
    }

    @DeleteMapping("/{videoId}")
    @ResponseBody
    @PreAuthorize("isAuthenticated() and @videoService.isUploader(#videoId, principal.name)")
    public ApiResponse<Void> deleteVideoREST(@PathVariable Long videoId, Principal principal) {
        try {
            videoService.deleteVideo(videoId);
            return new ApiResponse<>(true, "Vidéo supprimée", null);
        } catch (RuntimeException e) {
            return new ApiResponse<>(false, e.getMessage(), null);
        }
    }

}
