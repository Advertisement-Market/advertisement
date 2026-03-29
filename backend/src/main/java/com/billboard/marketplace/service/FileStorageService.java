package com.billboard.marketplace.service;

import com.billboard.marketplace.exception.FileStorageException;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.*;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
public class FileStorageService {

    private static final List<String> ALLOWED_CONTENT_TYPES = List.of(
            "image/jpeg", "image/png", "image/webp", "image/gif"
    );
    private static final long MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

    @Value("${app.storage.upload-dir}")
    private String uploadDir;

    @Value("${app.storage.base-url}")
    private String baseUrl;

    private Path rootLocation;

    @PostConstruct
    public void init() {
        this.rootLocation = Paths.get(uploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(rootLocation);
            log.info("File storage initialized at: {}", rootLocation);
        } catch (IOException e) {
            throw new FileStorageException("Could not initialize file storage directory", e);
        }
    }

    /**
     * Saves an image for the given assetId and returns its public URL.
     * Files are saved under: <uploadDir>/assets/<assetId>/<uuid>.<ext>
     * Public URL:            <baseUrl>/uploads/assets/<assetId>/<uuid>.<ext>
     */
    public String storeAssetImage(MultipartFile file, String assetId) {
        validateFile(file);

        String originalFilename = StringUtils.cleanPath(
                file.getOriginalFilename() != null ? file.getOriginalFilename() : "image"
        );
        String extension = getExtension(originalFilename);
        String storedFilename = UUID.randomUUID() + "." + extension;

        Path assetDir = rootLocation.resolve("assets").resolve(assetId);
        try {
            Files.createDirectories(assetDir);
            Path targetPath = assetDir.resolve(storedFilename);

            try (InputStream inputStream = file.getInputStream()) {
                Files.copy(inputStream, targetPath, StandardCopyOption.REPLACE_EXISTING);
            }

            log.debug("Stored file {} for asset {}", storedFilename, assetId);
            return baseUrl + "/uploads/assets/" + assetId + "/" + storedFilename;

        } catch (IOException e) {
            throw new FileStorageException("Failed to store file " + storedFilename, e);
        }
    }

    /**
     * Deletes all images stored for a given assetId.
     */
    public void deleteAssetImages(String assetId) {
        Path assetDir = rootLocation.resolve("assets").resolve(assetId);
        if (Files.exists(assetDir)) {
            try {
                deleteDirectoryRecursively(assetDir);
                log.info("Deleted image directory for asset {}", assetId);
            } catch (IOException e) {
                log.warn("Could not delete images for asset {}: {}", assetId, e.getMessage());
            }
        }
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new FileStorageException("File must not be empty");
        }
        if (file.getSize() > MAX_FILE_SIZE_BYTES) {
            throw new FileStorageException("File size exceeds limit of 10MB");
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType)) {
            throw new FileStorageException(
                    "Invalid file type. Allowed: jpeg, png, webp, gif"
            );
        }
        // Path traversal guard
        String filename = StringUtils.cleanPath(
                file.getOriginalFilename() != null ? file.getOriginalFilename() : ""
        );
        if (filename.contains("..")) {
            throw new FileStorageException("Filename contains invalid path sequence: " + filename);
        }
    }

    private String getExtension(String filename) {
        int dot = filename.lastIndexOf('.');
        if (dot >= 0 && dot < filename.length() - 1) {
            return filename.substring(dot + 1).toLowerCase();
        }
        return "jpg";
    }

    private void deleteDirectoryRecursively(Path path) throws IOException {
        if (Files.isDirectory(path)) {
            try (var entries = Files.list(path)) {
                for (Path entry : entries.toList()) {
                    deleteDirectoryRecursively(entry);
                }
            }
        }
        Files.deleteIfExists(path);
    }
}
