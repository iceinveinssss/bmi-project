package com.bmi.dto;
import lombok.*;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class BmiStatsResponse {
    private long totalMeasurements;
    private Double averageBmi;
    private Double minBmi;
    private Double maxBmi;
    private String currentCategory;
}
