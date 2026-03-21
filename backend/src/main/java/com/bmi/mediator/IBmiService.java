package com.bmi.mediator;

import com.bmi.dto.*;
import com.bmi.entity.BmiRecord;
import java.util.List;

/**
 * Интерфейс сервиса ИМТ.
 * Контракт между слоями Control и Mediator (PCMEF).
 */
public interface IBmiService {
    BmiRecord calculateAndSave(Long userId, BmiRequest request);
    List<BmiRecord> getHistory(Long userId);
    BmiRecord getById(Long id, Long userId);
    BmiRecord updateRecord(Long id, Long userId, BmiRequest request);
    void deleteRecord(Long id, Long userId);
    BmiStatsResponse getStats(Long userId);
    List<BmiRecord> search(Long userId, String category);
}
