package com.bmi.mediator.impl;
import com.bmi.dto.*;
import com.bmi.entity.*;
import com.bmi.foundation.*;
import com.bmi.mediator.IBmiService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

/**
 * Реализация бизнес-логики для расчёта ИМТ.
 * Слой Mediator (M) паттерна PCMEF.
 */
@Service @RequiredArgsConstructor @Transactional
public class BmiServiceImpl implements IBmiService {
    private final BmiRecordRepository bmiRecordRepository;
    private final UserRepository userRepository;

    @Override
    public BmiRecord calculateAndSave(Long userId, BmiRequest req) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("Пользователь не найден"));
        double bmi = BmiRecord.calculateBmi(req.getWeight(), req.getHeight());
        String category = BmiRecord.getCategory(bmi);
        BmiRecord record = BmiRecord.builder()
            .user(user).weight(req.getWeight()).height(req.getHeight())
            .bmi(bmi).category(category).build();
        return bmiRecordRepository.save(record);
    }

    @Override @Transactional(readOnly = true)
    public List<BmiRecord> getHistory(Long userId) {
        return bmiRecordRepository.findByUserIdOrderByMeasuredAtDesc(userId);
    }

    @Override @Transactional(readOnly = true)
    public BmiRecord getById(Long id, Long userId) {
        return bmiRecordRepository.findByIdAndUserId(id, userId)
            .orElseThrow(() -> new RuntimeException("Запись не найдена"));
    }

    @Override
    public void deleteRecord(Long id, Long userId) {
        bmiRecordRepository.delete(getById(id, userId));
    }

    @Override
    public BmiRecord updateRecord(Long id, Long userId, BmiRequest req) {
        BmiRecord record = getById(id, userId);
        record.setWeight(req.getWeight());
        record.setHeight(req.getHeight());
        double bmi = BmiRecord.calculateBmi(req.getWeight(), req.getHeight());
        record.setBmi(bmi);
        record.setCategory(BmiRecord.getCategory(bmi));
        return bmiRecordRepository.save(record);
    }

    @Override @Transactional(readOnly = true)
    public BmiStatsResponse getStats(Long userId) {
        List<BmiRecord> records = bmiRecordRepository.findByUserIdOrderByMeasuredAtDesc(userId);
        if (records.isEmpty()) return BmiStatsResponse.builder().totalMeasurements(0L).build();
        double avg = records.stream().mapToDouble(BmiRecord::getBmi).average().orElse(0);
        double min = records.stream().mapToDouble(BmiRecord::getBmi).min().orElse(0);
        double max = records.stream().mapToDouble(BmiRecord::getBmi).max().orElse(0);
        return BmiStatsResponse.builder()
            .totalMeasurements(records.size())
            .averageBmi(Math.round(avg * 10.0) / 10.0)
            .minBmi(min).maxBmi(max)
            .currentCategory(records.get(0).getCategory()).build();
    }

    @Override @Transactional(readOnly = true)
    public List<BmiRecord> search(Long userId, String category) {
        if (category == null || category.isBlank()) return getHistory(userId);
        return bmiRecordRepository.findByUserIdAndCategoryContainingIgnoreCaseOrderByMeasuredAtDesc(userId, category);
    }
}
