package com.bmi.mediator;

import com.bmi.dto.*;
import com.bmi.entity.User;
import java.util.List;

/**
 * Интерфейс сервиса пользователей.
 * Контракт между слоями Control и Mediator (PCMEF).
 */
public interface IUserService {
    AuthResponse register(RegisterRequest request);
    AuthResponse login(LoginRequest request);
    User getUserById(Long id);
    User updateProfile(Long id, UpdateProfileRequest request);
    List<User> getAllUsers();
}
