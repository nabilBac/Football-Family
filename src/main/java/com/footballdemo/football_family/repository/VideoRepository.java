package com.footballdemo.football_family.repository;

import com.footballdemo.football_family.model.Video;
import org.springframework.data.domain.Page;      // <- à ajouter
import org.springframework.data.domain.Pageable; 
import org.springframework.data.jpa.repository.JpaRepository;


import java.util.List;

public interface VideoRepository extends JpaRepository<Video, Long> {
    
     List<Video> findAllByOrderByDateUploadDesc();
     List<Video> findByCategoryOrderByDateUploadDesc(String category);

         // Pour feed avec pagination
    Page<Video> findAllByOrderByDateUploadDesc(Pageable pageable);
    Page<Video> findByCategoryOrderByDateUploadDesc(String category, Pageable pageable);
     

}
