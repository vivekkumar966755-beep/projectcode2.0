package com.example.demo.repository;

import com.example.demo.entity.Quiz;
import com.example.demo.entity.Result;
import com.example.demo.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ResultRepository extends JpaRepository<Result, Long> {
    List<Result> findByParticipantOrderByTakenAtDesc(User participant);
    List<Result> findByQuiz(Quiz quiz);
}
