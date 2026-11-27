package com.playtesting.platform.exception;

import jakarta.validation.ConstraintViolationException;
import java.util.LinkedHashMap;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.MultipartException;
import org.springframework.web.multipart.support.MissingServletRequestPartException;
import org.springframework.web.server.ResponseStatusException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger LOGGER = LoggerFactory.getLogger(GlobalExceptionHandler.class);
    private static final String INTERNAL_ERROR =
            "Ocurrió un error interno al procesar tu solicitud. Inténtalo nuevamente.";
    private static final String UPLOAD_ERROR =
            "El archivo es muy pesado. El tamaño máximo permitido es de 4 GB.";

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<Map<String, String>> handleMaxUploadSize(MaxUploadSizeExceededException exception) {
        return response(HttpStatus.PAYLOAD_TOO_LARGE, UPLOAD_ERROR);
    }

    @ExceptionHandler(MultipartException.class)
    public ResponseEntity<Map<String, String>> handleMultipart(MultipartException exception) {
        return response(HttpStatus.PAYLOAD_TOO_LARGE, UPLOAD_ERROR);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidation(MethodArgumentNotValidException exception) {
        String message = exception.getBindingResult().getFieldErrors().stream()
                .map(this::formatFieldError)
                .distinct()
                .reduce((first, second) -> first + " " + second)
                .orElse("Revisa los datos ingresados.");
        return response(HttpStatus.BAD_REQUEST, message);
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<Map<String, String>> handleConstraintViolation(ConstraintViolationException exception) {
        String message = exception.getConstraintViolations().stream()
                .map(violation -> violation.getMessage())
                .distinct()
                .reduce((first, second) -> first + " " + second)
                .orElse("Revisa los datos ingresados.");
        return response(HttpStatus.BAD_REQUEST, message);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleIllegalArgument(IllegalArgumentException exception) {
        return response(HttpStatus.BAD_REQUEST, "El formato de los datos enviados no es válido.");
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, String>> handleUnreadableMessage(HttpMessageNotReadableException exception) {
        return response(HttpStatus.BAD_REQUEST, "El formato de los datos enviados no es válido.");
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<Map<String, String>> handleMissingParameter(
            MissingServletRequestParameterException exception) {
        return response(HttpStatus.BAD_REQUEST, "Falta un dato obligatorio en la solicitud.");
    }

    @ExceptionHandler(MissingServletRequestPartException.class)
    public ResponseEntity<Map<String, String>> handleMissingPart(MissingServletRequestPartException exception) {
        return response(HttpStatus.BAD_REQUEST, "Falta un archivo o dato obligatorio en la solicitud.");
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<Map<String, String>> handleTypeMismatch(MethodArgumentTypeMismatchException exception) {
        return response(HttpStatus.BAD_REQUEST, "Uno de los datos enviados tiene un formato no válido.");
    }

    @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
    public ResponseEntity<Map<String, String>> handleUnsupportedMediaType(
            HttpMediaTypeNotSupportedException exception) {
        return response(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "El formato del contenido enviado no es compatible.");
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<Map<String, String>> handleMethodNotAllowed(
            HttpRequestMethodNotSupportedException exception) {
        return response(HttpStatus.METHOD_NOT_ALLOWED, "Esta acción no está disponible para la solicitud.");
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, String>> handleAccessDenied(AccessDeniedException exception) {
        return response(HttpStatus.FORBIDDEN, "No tienes permisos para realizar esta acción.");
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, String>> handleResponseStatus(ResponseStatusException exception) {
        HttpStatus status = HttpStatus.valueOf(exception.getStatusCode().value());
        String message = exception.getReason();
        if (isGenericEnglishMessage(message)) {
            message = statusMessage(status);
        }
        return response(status, message == null || message.isBlank() ? statusMessage(status) : message);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> handleUnexpected(Exception exception) {
        LOGGER.error("Error interno al procesar una solicitud", exception);
        return response(HttpStatus.INTERNAL_SERVER_ERROR, INTERNAL_ERROR);
    }

    private String formatFieldError(FieldError error) {
        String fieldName = error.getField();
        int separator = fieldName.lastIndexOf('.');
        if (separator >= 0) fieldName = fieldName.substring(separator + 1);
        int index = fieldName.indexOf('[');
        if (index >= 0) fieldName = fieldName.substring(0, index);
        String field = switch (fieldName) {
            case "identifier" -> "El usuario o correo electrónico";
            case "username" -> "El nombre de usuario";
            case "email" -> "El correo electrónico";
            case "password" -> "La contraseña";
            case "title" -> "El título";
            case "description" -> "La descripción";
            case "genre" -> "El género";
            case "platform" -> "La plataforma";
            case "questions" -> "Las preguntas";
            case "questionText" -> "El texto de la pregunta";
            case "questionType" -> "El tipo de pregunta";
            case "status" -> "El estado";
            default -> "El campo " + error.getField();
        };
        String detail = error.getDefaultMessage();
        if (detail == null || detail.isBlank()) return field + " no es válido.";
        if (detail.regionMatches(true, 0, "el ", 0, 3)
                || detail.regionMatches(true, 0, "la ", 0, 3)
                || detail.regionMatches(true, 0, "los ", 0, 4)
                || detail.regionMatches(true, 0, "las ", 0, 4)
                || detail.regionMatches(true, 0, "ingresa ", 0, 8)
                || detail.regionMatches(true, 0, "selecciona ", 0, 11)
                || detail.regionMatches(true, 0, "agrega ", 0, 7)
                || detail.regionMatches(true, 0, "completa ", 0, 9)) {
            return detail;
        }
        return field + " " + Character.toLowerCase(detail.charAt(0)) + detail.substring(1);
    }

    private boolean isGenericEnglishMessage(String message) {
        if (message == null || message.isBlank()) return true;
        String lower = message.toLowerCase(java.util.Locale.ROOT);
        return lower.contains("invalid")
                || lower.contains("required")
                || lower.contains("not found")
                || lower.contains("only ")
                || lower.contains("already ")
                || lower.contains("must ")
                || lower.contains("could not")
                || lower.contains("does not")
                || lower.contains("is required")
                || lower.contains("game ")
                || lower.contains("user ")
                || lower.contains("question ");
    }

    private String statusMessage(HttpStatus status) {
        return switch (status) {
            case BAD_REQUEST -> "La solicitud contiene datos inválidos. Revisa la información.";
            case UNAUTHORIZED -> "Tu sesión ha expirado o las credenciales son incorrectas.";
            case FORBIDDEN -> "No tienes permisos para realizar esta acción.";
            case NOT_FOUND -> "No se encontró el recurso solicitado.";
            case CONFLICT -> "La solicitud entra en conflicto con el estado actual. Revisa los datos.";
            case PAYLOAD_TOO_LARGE -> UPLOAD_ERROR;
            default -> status.is5xxServerError() ? INTERNAL_ERROR : "No se pudo completar la solicitud.";
        };
    }

    private ResponseEntity<Map<String, String>> response(HttpStatus status, String message) {
        Map<String, String> body = new LinkedHashMap<>();
        body.put("message", message);
        return ResponseEntity.status(status).body(body);
    }
}
