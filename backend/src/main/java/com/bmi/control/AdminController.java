package com.bmi.control;

import com.bmi.entity.User;
import com.bmi.mediator.IUserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Административные эндпоинты (доступ только для роли ADMIN).
 */
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@Tag(name = "Администрирование")
@SecurityRequirement(name = "bearerAuth")
public class AdminController {
    private final IUserService userService;

    @GetMapping("/users")
    @Operation(summary = "Список пользователей (только ADMIN)")
    public ResponseEntity<List<User>> users() {
        return ResponseEntity.ok(userService.getAllUsers());
    }
}

