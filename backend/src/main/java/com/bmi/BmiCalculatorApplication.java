package com.bmi;
import io.swagger.v3.oas.annotations.*;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration;

@SpringBootApplication(exclude = UserDetailsServiceAutoConfiguration.class)
@OpenAPIDefinition(info = @io.swagger.v3.oas.annotations.info.Info(
    title = "BMI Calculator API",
    version = "1.0",
    description = "REST API для приложения расчёта индекса массы тела (PCMEF архитектура)"
))
@SecurityScheme(name = "bearerAuth", type = SecuritySchemeType.HTTP, scheme = "bearer", bearerFormat = "JWT")
public class BmiCalculatorApplication {
    public static void main(String[] args) {
        SpringApplication.run(BmiCalculatorApplication.class, args);
    }
}
