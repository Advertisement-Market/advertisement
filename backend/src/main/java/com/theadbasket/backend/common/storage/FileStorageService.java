package com.theadbasket.backend.common.storage;

import java.nio.file.Path;

import org.springframework.web.multipart.MultipartFile;

/**
 * Storage abstraction for persisting, reading, and removing user-uploaded assets.
 */
public interface FileStorageService {

    /**
     * Stored asset metadata.
     */
    record StoredFile(
            String storageKey,
            String originalName,
            String contentType,
            long fileSizeBytes,
            Integer width,
            Integer height
    ) {
    }

    /**
     * Sanitizes, checks dimensions, rotates by EXIF, downscales, and writes photo asset.
     */
    StoredFile storeImage(String subDirectory, MultipartFile file, String preferredFilename);

    /**
     * Validates MP4 container magic bytes and size, then streams video asset to disk.
     */
    StoredFile storeVideo(String subDirectory, MultipartFile file, String preferredFilename);

    /**
     * Deletes the file at storageKey, throwing if deletion fails.
     */
    void delete(String storageKey);

    /**
     * Quietly deletes the file at storageKey, logging errors without throwing.
     */
    void deleteQuietly(String storageKey);

    /**
     * Deletes an entire directory recursively (e.g. on billboard deletion).
     */
    void deleteDirectory(String relativeDirectory);

    /**
     * Resolves the canonical absolute path on disk with directory traversal validation.
     */
    Path resolvePath(String storageKey);
}
