package com.footballdemo.football_family.service;

import com.footballdemo.football_family.dto.VideoReactionsResponse;
import com.footballdemo.football_family.model.Video;
import com.footballdemo.football_family.entity.VideoReaction;
import com.footballdemo.football_family.model.User;
import com.footballdemo.football_family.repository.VideoReactionRepository;
import com.footballdemo.football_family.repository.VideoRepository;
import com.footballdemo.football_family.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class VideoReactionService {

    private final VideoReactionRepository reactionRepository;
    private final VideoRepository videoRepository;
    private final UserRepository userRepository;

    // ✅ Ajouter ou changer une réaction
    @Transactional
    public VideoReactionsResponse addOrUpdateReaction(Long videoId, Long userId, String emoji) {
        
        Video video = videoRepository.findById(videoId)
                .orElseThrow(() -> new RuntimeException("Vidéo introuvable"));
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));

        // Vérifier si l'utilisateur a déjà réagi
        Optional<VideoReaction> existingReaction = reactionRepository.findByVideoIdAndUserId(videoId, userId);

        if (existingReaction.isPresent()) {
            VideoReaction reaction = existingReaction.get();
            
            // Si même emoji → on supprime (toggle)
            if (reaction.getEmoji().equals(emoji)) {
                reactionRepository.delete(reaction);
            } else {
                // Sinon on change l'emoji
                reaction.setEmoji(emoji);
                reactionRepository.save(reaction);
            }
        } else {
            // Créer nouvelle réaction
            VideoReaction newReaction = new VideoReaction();
            newReaction.setVideo(video);
            newReaction.setUser(user);
            newReaction.setEmoji(emoji);
            reactionRepository.save(newReaction);
        }

        return getReactionsForVideo(videoId, userId);
    }

    // ✅ Récupérer toutes les réactions d'une vidéo
    public VideoReactionsResponse getReactionsForVideo(Long videoId, Long userId) {
        
        // Compter par emoji
        List<Object[]> results = reactionRepository.countReactionsByEmoji(videoId);
        Map<String, Integer> reactions = new HashMap<>();
        int total = 0;

        for (Object[] result : results) {
            String emoji = (String) result[0];
            Long count = (Long) result[1];
            reactions.put(emoji, count.intValue());
            total += count.intValue();
        }

        // Trouver la réaction de l'utilisateur actuel
        String userReaction = null;
        if (userId != null) {
            Optional<VideoReaction> userReactionOpt = reactionRepository.findByVideoIdAndUserId(videoId, userId);
            if (userReactionOpt.isPresent()) {
                userReaction = userReactionOpt.get().getEmoji();
            }
        }

        VideoReactionsResponse response = new VideoReactionsResponse();
        response.setReactions(reactions);
        response.setUserReaction(userReaction);
        response.setTotalReactions(total);

        return response;
    }

    // ✅ Supprimer une réaction
    @Transactional
    public void removeReaction(Long videoId, Long userId) {
        reactionRepository.deleteByVideoIdAndUserId(videoId, userId);
    }
}
