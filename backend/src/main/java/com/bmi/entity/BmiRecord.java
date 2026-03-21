package com.bmi.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * Сущность записи об измерении ИМТ.
 * Слой Entity (E) паттерна PCMEF.
 */
@Entity
@Table(name = "bmi_records")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class BmiRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private Double weight;   // кг

    @Column(nullable = false)
    private Double height;   // см

    @Column(nullable = false)
    private Double bmi;

    @Column(nullable = false, length = 50)
    private String category;

    @Column(name = "measured_at", nullable = false)
    private LocalDateTime measuredAt;

    @PrePersist
    protected void onCreate() {
        measuredAt = LocalDateTime.now();
    }

    /**
     * Бизнес-метод: рассчитать ИМТ по формуле.
     * ИМТ = вес(кг) / (рост(м))^2
     */
    public static double calculateBmi(double weightKg, double heightCm) {
        double heightM = heightCm / 100.0;
        return Math.round((weightKg / (heightM * heightM)) * 10.0) / 10.0;
    }

    /**
     * Бизнес-метод: определить категорию по значению ИМТ.
     */
    public static String getCategory(double bmi) {
        if (bmi < 16.0)  return "Выраженный дефицит массы";
        if (bmi < 18.5)  return "Недостаточная масса тела";
        if (bmi < 25.0)  return "Норма";
        if (bmi < 30.0)  return "Избыточная масса тела";
        if (bmi < 35.0)  return "Ожирение I степени";
        if (bmi < 40.0)  return "Ожирение II степени";
        return "Ожирение III степени";
    }
}
