package com.bmi.dto;
import jakarta.validation.constraints.*;
import lombok.*;

@Data @NoArgsConstructor @AllArgsConstructor
public class RegisterRequest {
    @NotBlank(message = "Имя обязательно")
    private String name;
    @NotBlank @Email(message = "Некорректный email")
    private String email;
    @NotBlank @Size(min = 6, message = "Пароль минимум 6 символов")
    private String password;
    private Integer birthYear;
}
