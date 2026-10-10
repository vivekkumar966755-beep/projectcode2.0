package com.example.demo.repository;

import com.example.demo.entity.Quiz;
import com.example.demo.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuizRepository extends JpaRepository<Quiz, Long> {
    List<Quiz> findByCreator(User creator);
    List<Quiz> findByStatus(Quiz.Status status);
    long countByStatus(Quiz.Status status);
}
