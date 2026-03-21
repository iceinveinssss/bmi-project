package com.bmi.foundation;

import com.bmi.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

/**
 * Репозиторий пользователей.
 * Слой Foundation (F) паттерна PCMEF.
 * Отвечает ТОЛЬКО за доступ к данным, не содержит бизнес-логики.
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
}
