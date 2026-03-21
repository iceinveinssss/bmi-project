package com.bmi.control;
import com.bmi.dto.UpdateProfileRequest;
import com.bmi.entity.User;
import com.bmi.mediator.IUserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/**
 * Контроллер профиля пользователя.
 * Слой Control (C) паттерна PCMEF.
 */
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Tag(name = "Пользователи")
@SecurityRequirement(name = "bearerAuth")
public class UserController {
    private final IUserService userService;

    @GetMapping("/me")
    @Operation(summary = "Получить профиль текущего пользователя")
    public ResponseEntity<User> getProfile(Authentication auth) {
        Long userId = (Long) auth.getCredentials();
        return ResponseEntity.ok(userService.getUserById(userId));
    }

    @PutMapping("/me")
    @Operation(summary = "Обновить профиль")
    public ResponseEntity<User> updateProfile(@RequestBody UpdateProfileRequest request, Authentication auth) {
        Long userId = (Long) auth.getCredentials();
        return ResponseEntity.ok(userService.updateProfile(userId, request));
    }
}
