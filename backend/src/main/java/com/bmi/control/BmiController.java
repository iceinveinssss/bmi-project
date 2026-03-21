package com.bmi.control;
import com.bmi.dto.*;
import com.bmi.entity.BmiRecord;
import com.bmi.mediator.IBmiService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;

/**
 * Контроллер для работы с расчётами ИМТ.
 * Слой Control (C) паттерна PCMEF.
 */
@RestController
@RequestMapping("/api/bmi")
@RequiredArgsConstructor
@Tag(name = "ИМТ - расчёты")
@SecurityRequirement(name = "bearerAuth")
public class BmiController {
    private final IBmiService bmiService;

    @PostMapping("/calculate")
    @Operation(summary = "Рассчитать ИМТ и сохранить результат")
    public ResponseEntity<BmiRecord> calculate(@Valid @RequestBody BmiRequest request, Authentication auth) {
        Long userId = (Long) auth.getCredentials();
        return ResponseEntity.ok(bmiService.calculateAndSave(userId, request));
    }

    @GetMapping("/history")
    @Operation(summary = "История измерений пользователя")
    public ResponseEntity<List<BmiRecord>> history(Authentication auth) {
        Long userId = (Long) auth.getCredentials();
        return ResponseEntity.ok(bmiService.getHistory(userId));
    }

    @GetMapping("/stats")
    @Operation(summary = "Статистика измерений")
    public ResponseEntity<BmiStatsResponse> stats(Authentication auth) {
        Long userId = (Long) auth.getCredentials();
        return ResponseEntity.ok(bmiService.getStats(userId));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Получить запись по ID")
    public ResponseEntity<BmiRecord> getById(@PathVariable Long id, Authentication auth) {
        Long userId = (Long) auth.getCredentials();
        return ResponseEntity.ok(bmiService.getById(id, userId));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Обновить запись")
    public ResponseEntity<BmiRecord> update(@PathVariable Long id, @Valid @RequestBody BmiRequest request, Authentication auth) {
        Long userId = (Long) auth.getCredentials();
        return ResponseEntity.ok(bmiService.updateRecord(id, userId, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Удалить запись")
    public ResponseEntity<Void> delete(@PathVariable Long id, Authentication auth) {
        Long userId = (Long) auth.getCredentials();
        bmiService.deleteRecord(id, userId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/search")
    @Operation(summary = "Поиск записей (история с фильтрацией)")
    public ResponseEntity<List<BmiRecord>> search(@RequestParam(required = false) String category, Authentication auth) {
        Long userId = (Long) auth.getCredentials();
        return ResponseEntity.ok(bmiService.search(userId, category));
    }
}
