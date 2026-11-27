package com.playtesting.platform.dto;

import com.playtesting.platform.entity.Platform;
import com.playtesting.platform.entity.GameStatus;
import java.time.OffsetDateTime;

public record GameResponseDto(
        Long id,
        String title,
        String description,
        String genre,
        String version,
        Platform platform,
        GameStatus status,
        String filePathOrUrl,
        boolean hasCoverImage,
        String releaseNotes,
        String officialUrl,
        String creatorUsername,
        OffsetDateTime createdAt,
        boolean alreadyEvaluatedCurrentVersion,
        String fileExtension,
        String fileSizeFormatted) {

    public GameResponseDto(
            Long id,
            String title,
            String description,
            String genre,
            String version,
            Platform platform,
            GameStatus status,
            String filePathOrUrl,
            boolean hasCoverImage,
            String releaseNotes,
            String officialUrl,
            String creatorUsername,
            OffsetDateTime createdAt,
            boolean alreadyEvaluatedCurrentVersion) {
        this(
                id,
                title,
                description,
                genre,
                version,
                platform,
                status,
                filePathOrUrl,
                hasCoverImage,
                releaseNotes,
                officialUrl,
                creatorUsername,
                createdAt,
                alreadyEvaluatedCurrentVersion,
                "N/D",
                "N/D");
    }

    public GameResponseDto(
            Long id,
            String title,
            String description,
            String genre,
            String version,
            Platform platform,
            GameStatus status,
            String filePathOrUrl,
            String creatorUsername,
            OffsetDateTime createdAt) {
        this(
                id,
                title,
                description,
                genre,
                version,
                platform,
                status,
                filePathOrUrl,
                false,
                null,
                null,
                creatorUsername,
                createdAt,
                false,
                "N/D",
                "N/D");
    }

    public GameResponseDto(
            Long id,
            String title,
            String description,
            String genre,
            String version,
            Platform platform,
            GameStatus status,
            String filePathOrUrl,
            boolean hasCoverImage,
            String creatorUsername,
            OffsetDateTime createdAt) {
        this(
                id,
                title,
                description,
                genre,
                version,
                platform,
                status,
                filePathOrUrl,
                hasCoverImage,
                null,
                null,
                creatorUsername,
                createdAt,
                false,
                "N/D",
                "N/D");
    }
}
