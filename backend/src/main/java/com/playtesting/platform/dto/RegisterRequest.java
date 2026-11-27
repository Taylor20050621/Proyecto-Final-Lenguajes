package com.playtesting.platform.dto;

import com.playtesting.platform.entity.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank(message = "no puede estar vacío.")
        @Size(min = 3, max = 50, message = "debe tener entre 3 y 50 caracteres.")
        String username,
        @NotBlank(message = "no puede estar vacío.")
        @Email(message = "debe tener un formato válido.")
        @Size(max = 255, message = "no puede superar los 255 caracteres.")
        String email,
        @NotBlank(message = "no puede estar vacía.")
        @Size(min = 8, max = 72, message = "debe tener entre 8 y 72 caracteres.")
        String password,
        @NotNull(message = "debe ser CREATOR o TESTER.")
        Role role) {
}
