package com.example.demo.controller;

import com.example.demo.entity.Quiz;
import com.example.demo.service.QuizService;
import com.example.demo.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/admin")
@RequiredArgsConstructor
public class AdminController {

    private final UserService userService;
    private final QuizService quizService;

    @GetMapping("/dashboard")
    public String dashboard(Model model) {
        model.addAttribute("userCount", userService.countUsers());
        model.addAttribute("pendingCount", quizService.countQuizzesByStatus(Quiz.Status.PENDING));
        model.addAttribute("approvedCount", quizService.countQuizzesByStatus(Quiz.Status.APPROVED));
        model.addAttribute("resultCount", quizService.countResults());
        return "admin/dashboard";
    }

    @GetMapping("/users")
    public String listUsers(Model model) {
        model.addAttribute("users", userService.findAllUsers());
        return "admin/users";
    }

    @PostMapping("/users/delete/{id}")
    public String deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return "redirect:/admin/users";
    }

    @GetMapping("/quizzes")
    public String listQuizzes(Model model) {
        model.addAttribute("quizzes", quizService.getAllQuizzes());
        return "admin/quizzes";
    }

    @PostMapping("/quizzes/approve/{id}")
    public String approveQuiz(@PathVariable Long id) {
        quizService.approveQuiz(id);
        return "redirect:/admin/quizzes";
    }

    @PostMapping("/quizzes/reject/{id}")
    public String rejectQuiz(@PathVariable Long id) {
        quizService.rejectQuiz(id);
        return "redirect:/admin/quizzes";
    }
}
