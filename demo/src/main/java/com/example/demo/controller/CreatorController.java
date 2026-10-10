package com.example.demo.controller;

import com.example.demo.entity.Question;
import com.example.demo.entity.Quiz;
import com.example.demo.entity.User;
import com.example.demo.service.QuizService;
import com.example.demo.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@Controller
@RequestMapping("/creator")
@RequiredArgsConstructor
public class CreatorController {

    private final QuizService quizService;
    private final UserService userService;

    @GetMapping("/dashboard")
    public String dashboard(Model model, Principal principal) {
        User creator = userService.findByEmail(principal.getName()).orElseThrow();
        List<Quiz> quizzes = quizService.getQuizzesByCreator(creator);
        model.addAttribute("quizCount", quizzes.size());
        model.addAttribute("pendingCount", quizzes.stream().filter(q -> q.getStatus() == Quiz.Status.PENDING).count());
        model.addAttribute("approvedCount", quizzes.stream().filter(q -> q.getStatus() == Quiz.Status.APPROVED).count());
        return "creator/dashboard";
    }

    @GetMapping("/quizzes")
    public String myQuizzes(Model model, Principal principal) {
        User creator = userService.findByEmail(principal.getName()).orElseThrow();
        model.addAttribute("quizzes", quizService.getQuizzesByCreator(creator));
        return "creator/my-quizzes";
    }

    @GetMapping("/quizzes/create")
    public String createQuizForm(Model model) {
        model.addAttribute("quiz", new Quiz());
        return "creator/create-quiz";
    }

    @PostMapping("/quizzes/create")
    public String createQuiz(@ModelAttribute("quiz") Quiz quiz, Principal principal) {
        User creator = userService.findByEmail(principal.getName()).orElseThrow();
        Quiz savedQuiz = quizService.createQuiz(quiz, creator);
        return "redirect:/creator/quizzes/" + savedQuiz.getId() + "/add-questions";
    }

    @GetMapping("/quizzes/{quizId}/add-questions")
    public String addQuestionForm(@PathVariable Long quizId, Model model) {
        Quiz quiz = quizService.getQuizById(quizId).orElseThrow();
        model.addAttribute("quiz", quiz);
        model.addAttribute("question", new Question());
        model.addAttribute("questions", quiz.getQuestions());
        return "creator/add-question";
    }

    @PostMapping("/quizzes/{quizId}/add-questions")
    public String addQuestion(@PathVariable Long quizId, @ModelAttribute("question") Question question) {
        quizService.addQuestion(quizId, question);
        return "redirect:/creator/quizzes/" + quizId + "/add-questions";
    }
}
