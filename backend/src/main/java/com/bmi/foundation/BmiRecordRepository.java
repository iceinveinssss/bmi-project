package com.bmi.foundation;

import com.bmi.entity.BmiRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.List;

/**
 * Репозиторий записей ИМТ.
 * Слой Foundation (F) паттерна PCMEF.
 */
@Repository
public interface BmiRecordRepository extends JpaRepository<BmiRecord, Long> {
    List<BmiRecord> findByUserIdOrderByMeasuredAtDesc(Long userId);
    Optional<BmiRecord> findByIdAndUserId(Long id, Long userId);
    List<BmiRecord> findByUserIdAndCategoryContainingIgnoreCaseOrderByMeasuredAtDesc(Long userId, String category);
    long countByUserId(Long userId);
}
