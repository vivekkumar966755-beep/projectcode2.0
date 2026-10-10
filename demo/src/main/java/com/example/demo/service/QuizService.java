package com.example.demo.service;

import com.example.demo.entity.Question;
import com.example.demo.entity.Quiz;
import com.example.demo.entity.Result;
import com.example.demo.entity.User;
import com.example.demo.repository.QuestionRepository;
import com.example.demo.repository.QuizRepository;
import com.example.demo.repository.ResultRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class QuizService {

    private final QuizRepository quizRepository;
    private final QuestionRepository questionRepository;
    private final ResultRepository resultRepository;

    public Quiz createQuiz(Quiz quiz, User creator) {
        quiz.setCreator(creator);
        quiz.setStatus(Quiz.Status.PENDING);
        return quizRepository.save(quiz);
    }

    public Question addQuestion(Long quizId, Question question) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new IllegalArgumentException("Invalid quiz ID"));
        question.setQuiz(quiz);
        return questionRepository.save(question);
    }

    public List<Quiz> getQuizzesByCreator(User creator) {
        return quizRepository.findByCreator(creator);
    }

    public List<Quiz> getApprovedQuizzes() {
        return quizRepository.findByStatus(Quiz.Status.APPROVED);
    }

    public List<Quiz> getAllQuizzes() {
        return quizRepository.findAll();
    }

    public Optional<Quiz> getQuizById(Long id) {
        return quizRepository.findById(id);
    }

    public void approveQuiz(Long id) {
        Quiz quiz = quizRepository.findById(id).orElseThrow();
        quiz.setStatus(Quiz.Status.APPROVED);
        quizRepository.save(quiz);
    }

    public void rejectQuiz(Long id) {
        Quiz quiz = quizRepository.findById(id).orElseThrow();
        quiz.setStatus(Quiz.Status.REJECTED);
        quizRepository.save(quiz);
    }

    public Result submitQuiz(Quiz quiz, User participant, List<String> answers) {
        List<Question> questions = quiz.getQuestions();
        int score = 0;

        for (int i = 0; i < questions.size(); i++) {
            if (i < answers.size() && answers.get(i) != null) {
                if (answers.get(i).equalsIgnoreCase(questions.get(i).getCorrectoption())) {
                    score++;
                }
            }
        }

        Result result = Result.builder()
                .participant(participant)
                .quiz(quiz)
                .score(score)
                .totalQuestions(questions.size())
                .build();

        return resultRepository.save(result);
    }

    public List<Result> getResultsByParticipant(User participant) {
        return resultRepository.findByParticipantOrderByTakenAtDesc(participant);
    }

    public long countQuizzesByStatus(Quiz.Status status) {
        return quizRepository.countByStatus(status);
    }

    public long countResults() {
        return resultRepository.count();
    }
}
