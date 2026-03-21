package com.bmi.mediator.impl;
import com.bmi.dto.*;
import com.bmi.entity.User;
import com.bmi.foundation.UserRepository;
import com.bmi.mediator.IUserService;
import com.bmi.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

/**
 * Реализация бизнес-логики для пользователей.
 * Слой Mediator (M) паттерна PCMEF.
 */
@Service @RequiredArgsConstructor @Transactional
public class UserServiceImpl implements IUserService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    @Override
    public AuthResponse register(RegisterRequest req) {
        if (userRepository.existsByEmail(req.getEmail())) {
            throw new RuntimeException("Email уже зарегистрирован");
        }
        User user = User.builder()
            .name(req.getName()).email(req.getEmail())
            .password(passwordEncoder.encode(req.getPassword()))
            .birthYear(req.getBirthYear()).role(User.Role.USER).build();
        user = userRepository.save(user);
        String token = jwtUtil.generateToken(user.getEmail(), user.getId(), user.getRole().name());
        return AuthResponse.builder().token(token).userId(user.getId())
            .name(user.getName()).email(user.getEmail()).role(user.getRole().name()).build();
    }

    @Override
    public AuthResponse login(LoginRequest req) {
        User user = userRepository.findByEmail(req.getEmail())
            .orElseThrow(() -> new RuntimeException("Пользователь не найден"));
        if (!passwordEncoder.matches(req.getPassword(), user.getPassword())) {
            throw new RuntimeException("Неверный пароль");
        }
        String token = jwtUtil.generateToken(user.getEmail(), user.getId(), user.getRole().name());
        return AuthResponse.builder().token(token).userId(user.getId())
            .name(user.getName()).email(user.getEmail()).role(user.getRole().name()).build();
    }

    @Override @Transactional(readOnly = true)
    public User getUserById(Long id) {
        return userRepository.findById(id).orElseThrow(() -> new RuntimeException("Пользователь не найден"));
    }

    @Override
    public User updateProfile(Long id, UpdateProfileRequest req) {
        User user = getUserById(id);
        if (req.getName() != null) user.setName(req.getName());
        if (req.getBirthYear() != null) user.setBirthYear(req.getBirthYear());
        return userRepository.save(user);
    }

    @Override @Transactional(readOnly = true)
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }
}
