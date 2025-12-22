package com.footballdemo.football_family.repository;

import com.footballdemo.football_family.model.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.Sort;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Page;

public interface CommentRepository extends JpaRepository<Comment, Long> {

  @Query(value = "SELECT c FROM Comment c LEFT JOIN FETCH c.author WHERE c.video.id = :videoId ORDER BY c.createdAt DESC", countQuery = "SELECT COUNT(c) FROM Comment c WHERE c.video.id = :videoId")
  Page<Comment> findByVideoIdPaged(@Param("videoId") Long videoId, Pageable pageable);

  List<Comment> findByVideoId(Long videoId);

  List<Comment> findByVideoId(Long videoId, Sort sort);

  long countByVideoId(Long videoId);

  @Query("SELECT c FROM Comment c JOIN FETCH c.author WHERE c.video.id = :videoId ORDER BY c.createdAt DESC")
  List<Comment> findByVideoIdWithAuthorsOptimized(@Param("videoId") Long videoId);

  @Query("SELECT c FROM Comment c JOIN FETCH c.author WHERE c.id = :id")
  Optional<Comment> findByIdWithAuthor(@Param("id") Long id);
}
