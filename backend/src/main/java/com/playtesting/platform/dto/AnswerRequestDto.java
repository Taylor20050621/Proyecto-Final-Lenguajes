package com.playtesting.platform.dto;

import java.math.BigDecimal;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;

public record AnswerRequestDto(
        Long questionId,
        String answerText,
        @Digits(integer = 8, fraction = 2, message = "El valor numérico debe tener como máximo 8 enteros y 2 decimales.")
        @DecimalMin(value = "-99999999.99", message = "El valor numérico está fuera del rango permitido.")
        @DecimalMax(value = "99999999.99", message = "El valor numérico está fuera del rango permitido.")
        BigDecimal numericValue) {
}
