package com.playtesting.platform.service;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.UUID;
import java.util.Locale;
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

    private static final long MAX_PROTOTYPE_SIZE = 4L * 1024 * 1024 * 1024;
    private static final long MAX_COVER_SIZE = 10L * 1024 * 1024;
    private static final java.util.Set<String> PROTOTYPE_EXTENSIONS =
            java.util.Set.of(".exe", ".zip", ".rar", ".7z", ".apk", ".pdf");

    private final Path storageDirectory;

    public FileStorageService(
            @Value("${app.storage.games-dir:uploads/games}") String storageDirectory) {
        this.storageDirectory = Path.of(storageDirectory).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.storageDirectory);
        } catch (IOException exception) {
            throw new IllegalStateException("No se pudo inicializar el almacenamiento de archivos.", exception);
        }
    }

    public String store(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selecciona un archivo de prototipo válido.");
        }
        if (file.getSize() > MAX_PROTOTYPE_SIZE) {
            throw new ResponseStatusException(
                    HttpStatus.PAYLOAD_TOO_LARGE, "El archivo es muy pesado. El tamaño máximo permitido es de 4 GB.");
        }

        String extension = getExtension(file.getOriginalFilename());
        if (!PROTOTYPE_EXTENSIONS.contains(extension.toLowerCase(Locale.ROOT))) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Formato no permitido. Solo se aceptan archivos .exe, .zip, .rar, .7z, .apk o .pdf.");
        }
        String filename = UUID.randomUUID() + extension;
        Path target = storageDirectory.resolve(filename).normalize();

        if (!target.startsWith(storageDirectory)) {
            throw new IllegalStateException("La ruta del archivo no es válida.");
        }

        try (InputStream inputStream = file.getInputStream()) {
            Files.copy(inputStream, target, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException exception) {
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR, "No se pudo guardar el archivo del prototipo.", exception);
        }
        return storageDirectory.relativize(target).toString();
    }

    public String storeCoverImage(MultipartFile file) {
        if (file == null) {
            return null;
        }
        if (file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La imagen de portada está vacía o dañada.");
        }
        if (file.getSize() > MAX_COVER_SIZE) {
            throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE, "La portada no puede superar los 10 MB.");
        }

        String extension = getExtension(file.getOriginalFilename()).toLowerCase(Locale.ROOT);
        MediaType expectedType = switch (extension) {
            case ".jpg", ".jpeg" -> MediaType.IMAGE_JPEG;
            case ".png" -> MediaType.IMAGE_PNG;
            case ".webp" -> MediaType.parseMediaType("image/webp");
            default -> throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Formato de portada no válido. Solo se aceptan archivos .jpg, .jpeg, .png o .webp.");
        };
        String contentType = file.getContentType();
        if (StringUtils.hasText(contentType)) {
            try {
                if (!MediaType.parseMediaType(contentType).isCompatibleWith(expectedType)) {
                    throw new ResponseStatusException(
                            HttpStatus.BAD_REQUEST, "El tipo de contenido de la portada no coincide con su formato.");
                }
            } catch (IllegalArgumentException exception) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "El tipo de contenido de la portada no es válido.", exception);
            }
        }
        return storeWithExtension(file, extension);
    }

    public Resource loadAsResource(String storedPath) {
        Path file = resolveStoredPath(storedPath);
        try {
            Resource resource = new UrlResource(file.toUri());
            if (!resource.exists() || !resource.isReadable()) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No se encontró el archivo solicitado.");
            }
            return resource;
        } catch (IOException exception) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND, "No se pudo leer el archivo solicitado.", exception);
        }
    }

    public String getStoredFilename(String storedPath) {
        return resolveStoredPath(storedPath).getFileName().toString();
    }

    public String getFileExtension(String storedPath) {
        if (!StringUtils.hasText(storedPath)) {
            return "N/D";
        }
        String extension = getExtension(getStoredFilename(storedPath));
        return extension.isEmpty() ? "N/D" : extension.substring(1).toUpperCase(Locale.ROOT);
    }

    public String getFormattedFileSize(String storedPath) {
        if (!StringUtils.hasText(storedPath)) {
            return "N/D";
        }

        Path file = resolveStoredPath(storedPath);
        try {
            if (!Files.isRegularFile(file)) {
                return "N/D";
            }
            return formatFileSize(Files.size(file));
        } catch (IOException exception) {
            return "N/D";
        }
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

    public MediaType getCoverImageMediaType(String storedPath) {
        return switch (getExtension(getStoredFilename(storedPath)).toLowerCase(Locale.ROOT)) {
            case ".jpg", ".jpeg" -> MediaType.IMAGE_JPEG;
            case ".png" -> MediaType.IMAGE_PNG;
            case ".webp" -> MediaType.parseMediaType("image/webp");
            default -> throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No se encontró la portada solicitada.");
        };
    }

    private String storeWithExtension(MultipartFile file, String extension) {
        String filename = UUID.randomUUID() + extension;
        Path target = storageDirectory.resolve(filename).normalize();
        if (!target.startsWith(storageDirectory)) {
            throw new IllegalStateException("La ruta del archivo no es válida.");
        }
        try (InputStream inputStream = file.getInputStream()) {
            Files.copy(inputStream, target, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException exception) {
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR, "No se pudo guardar la imagen de portada.", exception);
        }
        return storageDirectory.relativize(target).toString();
    }

    private Path resolveStoredPath(String storedPath) {
        if (!StringUtils.hasText(storedPath)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No se encontró el archivo solicitado.");
        }
        Path file = storageDirectory.resolve(storedPath).normalize();
        if (!file.startsWith(storageDirectory)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No se encontró el archivo solicitado.");
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

    private String formatFileSize(long bytes) {
        if (bytes < 1024) {
            return bytes + " B";
        }

        double size = bytes;
        String[] units = {"KB", "MB", "GB", "TB"};
        int unitIndex = -1;
        do {
            size /= 1024;
            unitIndex++;
        } while (size >= 1024 && unitIndex < units.length - 1);

        return String.format(Locale.ROOT, "%.1f %s", size, units[unitIndex])
                .replace(".0 ", " ");
    }
}
