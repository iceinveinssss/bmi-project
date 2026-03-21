package com.bmi.dto;
import lombok.*;

@Data @NoArgsConstructor @AllArgsConstructor
public class UpdateProfileRequest {
    private String name;
    private Integer birthYear;
}
