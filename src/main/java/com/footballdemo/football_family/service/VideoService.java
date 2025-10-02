package com.footballdemo.football_family.service;

import com.footballdemo.football_family.model.Video;
import com.footballdemo.football_family.model.VideoLike;
import com.footballdemo.football_family.repository.UserRepository;
import com.footballdemo.football_family.repository.VideoLikeRepository;
import com.footballdemo.football_family.repository.VideoRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import java.util.Optional;
import com.footballdemo.football_family.model.User;


import java.util.List;

@Service
public class VideoService {

    private final VideoRepository videoRepository;
    private final VideoLikeRepository videoLikeRepository;
    private final UserRepository userRepository;

     public VideoService(VideoRepository videoRepository,
                        VideoLikeRepository videoLikeRepository,
                        UserRepository userRepository) {
        this.videoRepository = videoRepository;
        this.videoLikeRepository = videoLikeRepository;
        this.userRepository = userRepository;
    }

   public List<Video> getAllVideosOrderByDate() {
    return videoRepository.findAllByOrderByDateUploadDesc();
}

public List<Video> getVideosByCategory(String category) {
    return videoRepository.findByCategoryOrderByDateUploadDesc(category);
}
// Note : Ces méthodes ne prennent PAS de Pageable en argument.

    public void saveVideo(Video video) {
        videoRepository.save(video);
    }

    // --- Nouvelles méthodes pour le feed paginé (Page)
   public Page<Video> getVideosByCategory(String category, Pageable pageable) {
    Page<Video> videos = videoRepository.findByCategoryOrderByDateUploadDesc(category, pageable);
    System.out.println("Videos par catégorie (" + category + ") page " + pageable.getPageNumber() 
                       + ": " + videos.getContent().size() + " vidéos");
    videos.getContent().forEach(v -> System.out.println(" - " + v.getTitle()));
    return videos;
}

public Page<Video> getAllVideosOrderByDate(Pageable pageable) {
    Page<Video> videos = videoRepository.findAllByOrderByDateUploadDesc(pageable);
    System.out.println("Toutes les vidéos page " + pageable.getPageNumber() 
                       + ": " + videos.getContent().size() + " vidéos");
    videos.getContent().forEach(v -> System.out.println(" - " + v.getTitle()));
    return videos;
}
public Video getVideoById(Long id) {
    Optional<Video> videoOpt = videoRepository.findById(id);
    return videoOpt.orElseThrow(() -> new RuntimeException("Vidéo non trouvée avec l'ID : " + id));
}

public List<Video> getAllVideosWithComments(Pageable pageable) {
    Page<Video> videos = videoRepository.findAllByOrderByDateUploadDesc(pageable);
    // Force le chargement des commentaires pour éviter le lazy loading
    videos.getContent().forEach(v -> v.getComments().size());
    return videos.getContent();
}

public List<Video> getVideosByCategoryWithComments(String category, Pageable pageable) {
    Page<Video> videos = videoRepository.findByCategoryOrderByDateUploadDesc(category, pageable);
    videos.getContent().forEach(v -> v.getComments().size());
    return videos.getContent();
}

// Dans VideoService
     public int likeVideo(Long videoId, String username) {
        Video video = videoRepository.findById(videoId)
                .orElseThrow(() -> new RuntimeException("Vidéo introuvable"));
        User user = userRepository.findByUsername(username);

        // Vérifie si l'utilisateur a déjà liké
        if(videoLikeRepository.findByUserAndVideo(user, video).isPresent()) {
            return videoLikeRepository.countByVideo(video);
        }

        // Crée le like
        VideoLike like = new VideoLike();
        like.setUser(user);
        like.setVideo(video);
        videoLikeRepository.save(like);

        // Optionnel : incrémente le compteur dans Video
        video.setLikes(video.getLikes() + 1);
        videoRepository.save(video);

        return videoLikeRepository.countByVideo(video);
    }



}



