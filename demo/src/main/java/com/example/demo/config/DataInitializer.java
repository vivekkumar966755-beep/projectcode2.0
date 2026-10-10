package com.example.demo.config;

import com.example.demo.entity.Question;
import com.example.demo.entity.Quiz;
import com.example.demo.entity.Role;
import com.example.demo.entity.User;
import com.example.demo.repository.QuestionRepository;
import com.example.demo.repository.QuizRepository;
import com.example.demo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final QuizRepository quizRepository;
    private final QuestionRepository questionRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.email:admin@quizplatform.local}")
    private String adminEmail;

    @Value("${app.admin.password:Admin@123}")
    private String adminPassword;

    @Value("${app.admin.name:Platform Admin}")
    private String adminName;

    @Override
    public void run(String... args) {
        if (!userRepository.existsByEmail(adminEmail)) {
            User admin = User.builder()
                    .name(adminName)
                    .email(adminEmail)
                    .password(passwordEncoder.encode(adminPassword))
                    .role(Role.ADMIN)
                    .build();
            userRepository.save(admin);
        }

        if (!userRepository.existsByEmail("creator@quizplatform.local")) {
            User creator = User.builder()
                    .name("Ava Creator")
                    .email("creator@quizplatform.local")
                    .password(passwordEncoder.encode("Creator@123"))
                    .role(Role.CREATOR)
                    .build();
            userRepository.save(creator);

            if (quizRepository.count() == 0) {
                Quiz seedQuiz = Quiz.builder()
                        .title("Spring Boot Fundamentals")
                        .duration(10)
                        .status(Quiz.Status.APPROVED)
                        .creator(creator)
                        .build();
                quizRepository.save(seedQuiz);

                Question q1 = Question.builder()
                        .quiz(seedQuiz)
                        .questionText("Which annotation starts a Spring Boot application?")
                        .optionA("@SpringBootApplication")
                        .optionB("@EnableAutoConfig")
                        .optionC("@RestController")
                        .optionD("@Entity")
                        .correctoption("A")
                        .build();

                Question q2 = Question.builder()
                        .quiz(seedQuiz)
                        .questionText("Which starter provides Spring Security?")
                        .optionA("spring-boot-starter-web")
                        .optionB("spring-boot-starter-security")
                        .optionC("spring-boot-starter-data-jpa")
                        .optionD("spring-boot-starter-thymeleaf")
                        .correctoption("B")
                        .build();

                Question q3 = Question.builder()
                        .quiz(seedQuiz)
                        .questionText("What does JPA stand for?")
                        .optionA("Java Persistence API")
                        .optionB("Java Platform Adapter")
                        .optionC("JSON Processing API")
                        .optionD("Jakarta Page Assembly")
                        .correctoption("A")
                        .build();

                questionRepository.saveAll(List.of(q1, q2, q3));
            }
        }

        if (!userRepository.existsByEmail("participant@quizplatform.local")) {
            User participant = User.builder()
                    .name("Noah Participant")
                    .email("participant@quizplatform.local")
                    .password(passwordEncoder.encode("Participant@123"))
                    .role(Role.PARTICIPANT)
                    .build();
            userRepository.save(participant);
        }
    }
}
