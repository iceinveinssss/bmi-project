package com.bmi.dto;
import jakarta.validation.constraints.*;
import lombok.*;

@Data @NoArgsConstructor @AllArgsConstructor
public class BmiRequest {
    @NotNull @DecimalMin("30.0") @DecimalMax("300.0")
    private Double weight;  // кг
    @NotNull @DecimalMin("50.0") @DecimalMax("250.0")
    private Double height;  // см
}
