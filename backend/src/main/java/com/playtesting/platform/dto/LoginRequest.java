package com.playtesting.platform.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
        @NotBlank(message = "Ingresa tu usuario o correo electrónico.")
        @JsonAlias({"email", "username"}) String identifier,
        @NotBlank(message = "Ingresa tu contraseña.") String password) {
}
