package com.playtesting.platform.service;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.MediaTypeFactory;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@Service
public class FileStorageService {

    private final Path storageDirectory;

    public FileStorageService(
            @Value("${app.storage.games-dir:uploads/games}") String storageDirectory) {
        this.storageDirectory = Path.of(storageDirectory).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.storageDirectory);
        } catch (IOException exception) {
            throw new IllegalStateException("Could not initialize game file storage", exception);
        }
    }

    public String store(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Game file is required");
        }

        String extension = getExtension(file.getOriginalFilename());
        String filename = UUID.randomUUID() + extension;
        Path target = storageDirectory.resolve(filename).normalize();

        if (!target.startsWith(storageDirectory)) {
            throw new IllegalStateException("Invalid game file path");
        }

        try (InputStream inputStream = file.getInputStream()) {
            Files.copy(inputStream, target, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException exception) {
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR, "Could not store game file", exception);
        }
        return storageDirectory.relativize(target).toString();
    }

    public Resource loadAsResource(String storedPath) {
        Path file = resolveStoredPath(storedPath);
        try {
            Resource resource = new UrlResource(file.toUri());
            if (!resource.exists() || !resource.isReadable()) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Game file not found");
            }
            return resource;
        } catch (IOException exception) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND, "Game file could not be read", exception);
        }
    }

    public String getStoredFilename(String storedPath) {
        return resolveStoredPath(storedPath).getFileName().toString();
    }

    public String getDownloadFilename(String title, String storedPath) {
        String extension = getExtension(getStoredFilename(storedPath));
        String safeTitle = StringUtils.hasText(title)
                ? title.trim().replaceAll("[^a-zA-Z0-9._-]", "_")
                : "prototipo";
        return safeTitle + extension;
    }

    public MediaType getMediaType(String storedPath) {
        String filename = getStoredFilename(storedPath);
        return MediaTypeFactory.getMediaType(filename).orElse(MediaType.APPLICATION_OCTET_STREAM);
    }

    private Path resolveStoredPath(String storedPath) {
        if (!StringUtils.hasText(storedPath)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Game file not found");
        }
        Path file = storageDirectory.resolve(storedPath).normalize();
        if (!file.startsWith(storageDirectory)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Game file not found");
        }
        return file;
    }

    private String getExtension(String originalFilename) {
        if (!StringUtils.hasText(originalFilename)) {
            return "";
        }
        String filename = StringUtils.cleanPath(originalFilename);
        int dotIndex = filename.lastIndexOf('.');
        return dotIndex >= 0 ? filename.substring(dotIndex).replaceAll("[^a-zA-Z0-9.]", "") : "";
    }
}
