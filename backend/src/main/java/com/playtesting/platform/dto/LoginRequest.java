package com.playtesting.platform.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
        @NotBlank @JsonAlias({"email", "username"}) String identifier,
        @NotBlank String password) {
}
