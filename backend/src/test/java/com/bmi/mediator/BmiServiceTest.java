package com.bmi.mediator;

import com.bmi.dto.BmiRequest;
import com.bmi.entity.*;
import com.bmi.foundation.*;
import com.bmi.mediator.impl.BmiServiceImpl;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Модульные тесты для слоя Mediator (BmiService).
 * Покрытие: расчёт ИМТ, история, статистика.
 */
@ExtendWith(MockitoExtension.class)
class BmiServiceTest {

    @Mock private BmiRecordRepository bmiRecordRepository;
    @Mock private UserRepository userRepository;
    @InjectMocks private BmiServiceImpl bmiService;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = User.builder().id(1L).name("Тест").email("test@test.com").build();
    }

    @Test
    @DisplayName("Расчёт ИМТ: нормальный вес")
    void calculateBmi_normalWeight() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        BmiRecord saved = BmiRecord.builder().id(1L).user(testUser)
            .weight(70.0).height(175.0).bmi(22.9).category("Норма").build();
        when(bmiRecordRepository.save(any())).thenReturn(saved);

        BmiRecord result = bmiService.calculateAndSave(1L, new BmiRequest(70.0, 175.0));
        assertEquals("Норма", result.getCategory());
        assertEquals(22.9, result.getBmi());
    }

    @Test
    @DisplayName("Расчёт ИМТ: формула корректна")
    void calculateBmi_formula() {
        double bmi = BmiRecord.calculateBmi(70.0, 175.0);
        assertEquals(22.9, bmi);
    }

    @Test
    @DisplayName("Категория ИМТ: ожирение")
    void getCategory_obesity() {
        assertEquals("Ожирение I степени", BmiRecord.getCategory(31.0));
    }

    @Test
    @DisplayName("Категория ИМТ: недостаток веса")
    void getCategory_underweight() {
        assertEquals("Недостаточная масса тела", BmiRecord.getCategory(17.0));
    }

    @Test
    @DisplayName("История пуста для нового пользователя")
    void getHistory_empty() {
        when(bmiRecordRepository.findByUserIdOrderByMeasuredAtDesc(1L)).thenReturn(List.of());
        assertTrue(bmiService.getHistory(1L).isEmpty());
    }

    @Test
    @DisplayName("Статистика: нет измерений")
    void getStats_noRecords() {
        when(bmiRecordRepository.findByUserIdOrderByMeasuredAtDesc(1L)).thenReturn(List.of());
        var stats = bmiService.getStats(1L);
        assertEquals(0L, stats.getTotalMeasurements());
    }

    @Test
    @DisplayName("Пользователь не найден — исключение")
    void calculateBmi_userNotFound() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());
        assertThrows(RuntimeException.class, () ->
            bmiService.calculateAndSave(99L, new BmiRequest(70.0, 175.0)));
    }
}
