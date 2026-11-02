package com.theadbasket.backend.common.storage;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import com.theadbasket.backend.common.error.ErrorCode;
import com.theadbasket.backend.common.exception.BadRequestException;

class LocalFileStorageServiceTest {

    private Path tempUploadDir;
    private LocalFileStorageService storageService;

    @BeforeEach
    void setUp() throws IOException {
        tempUploadDir = Files.createTempDirectory("test-uploads-");
        storageService = new LocalFileStorageService(tempUploadDir.toString());
    }

    @AfterEach
    void tearDown() throws IOException {
        if (tempUploadDir != null && Files.exists(tempUploadDir)) {
            try (var stream = Files.walk(tempUploadDir)) {
                stream.sorted((a, b) -> b.compareTo(a)).forEach(p -> {
                    try {
                        Files.deleteIfExists(p);
                    } catch (IOException ignored) {
                    }
                });
            }
        }
    }

    private static byte[] createMp4Header() {
        byte[] data = new byte[64];
        byte[] header = new byte[] {
                0x00, 0x00, 0x00, 0x20,
                'f', 't', 'y', 'p',
                'i', 's', 'o', 'm',
                0x00, 0x00, 0x02, 0x00,
                'i', 's', 'o', 'm',
                'm', 'p', '4', '1'
        };
        System.arraycopy(header, 0, data, 0, header.length);
        return data;
    }

    private static byte[] createQuickTimeMovHeader() {
        byte[] data = new byte[64];
        byte[] header = new byte[] {
                0x00, 0x00, 0x00, 0x14,
                'f', 't', 'y', 'p',
                'q', 't', ' ', ' ',
                0x20, 0x05, 0x03, 0x00
        };
        System.arraycopy(header, 0, data, 0, header.length);
        return data;
    }

    @Test
    @DisplayName("storeVideo accepts MP4 video and saves with .mp4 extension")
    void storeVideo_acceptsMp4() {
        MockMultipartFile file = new MockMultipartFile(
                "file", "video.mp4", "video/mp4", createMp4Header()
        );

        FileStorageService.StoredFile stored = storageService.storeVideo("videos", file, "sample-mp4");

        assertThat(stored).isNotNull();
        assertThat(stored.storageKey()).isEqualTo("videos/sample-mp4.mp4");
        assertThat(stored.contentType()).isEqualTo("video/mp4");
        assertThat(Files.exists(storageService.resolvePath(stored.storageKey()))).isTrue();
    }

    @Test
    @DisplayName("storeVideo accepts QuickTime MOV video and saves with .mov extension")
    void storeVideo_acceptsQuickTimeMov() {
        MockMultipartFile file = new MockMultipartFile(
                "file", "iphone_recording.mov", "video/quicktime", createQuickTimeMovHeader()
        );

        FileStorageService.StoredFile stored = storageService.storeVideo("videos", file, "sample-mov");

        assertThat(stored).isNotNull();
        assertThat(stored.storageKey()).isEqualTo("videos/sample-mov.mov");
        assertThat(stored.contentType()).isEqualTo("video/quicktime");
        assertThat(Files.exists(storageService.resolvePath(stored.storageKey()))).isTrue();
    }

    @Test
    @DisplayName("storeVideo rejects unsupported video formats such as AVI")
    void storeVideo_rejectsUnsupportedFormat() {
        byte[] aviHeader = new byte[] {
                'R', 'I', 'F', 'F',
                0x24, 0x00, 0x00, 0x00,
                'A', 'V', 'I', ' ',
                'L', 'I', 'S', 'T'
        };
        MockMultipartFile file = new MockMultipartFile(
                "file", "clip.avi", "video/x-msvideo", aviHeader
        );

        assertThatThrownBy(() -> storageService.storeVideo("videos", file, UUID.randomUUID().toString()))
                .isInstanceOf(BadRequestException.class)
                .satisfies(ex -> {
                    BadRequestException bre = (BadRequestException) ex;
                    assertThat(bre.getErrorCode()).isEqualTo(ErrorCode.UNSUPPORTED_MEDIA_TYPE);
                });
    }

    @Test
    @DisplayName("storeVideo accepts video at exact 50MB boundary")
    void storeVideo_acceptsExact50MbBoundary() {
        MockMultipartFile file = new MockMultipartFile("file", "boundary.mp4", "video/mp4", createMp4Header()) {
            @Override
            public long getSize() {
                return 50 * 1024 * 1024L; // exactly 50 MB
            }
        };

        FileStorageService.StoredFile stored = storageService.storeVideo("videos", file, "exact-50mb");
        assertThat(stored).isNotNull();
        assertThat(stored.contentType()).isEqualTo("video/mp4");
        assertThat(stored.storageKey()).isEqualTo("videos/exact-50mb.mp4");
    }

    @Test
    @DisplayName("storeVideo rejects video exceeding 50MB by 1 byte")
    void storeVideo_rejectsOversizedVideoBoundary() {
        MockMultipartFile file = new MockMultipartFile("file", "large.mp4", "video/mp4", createMp4Header()) {
            @Override
            public long getSize() {
                return 50 * 1024 * 1024L + 1L; // 50 MB + 1 byte
            }
        };

        assertThatThrownBy(() -> storageService.storeVideo("videos", file, UUID.randomUUID().toString()))
                .isInstanceOf(BadRequestException.class)
                .satisfies(ex -> {
                    BadRequestException bre = (BadRequestException) ex;
                    assertThat(bre.getErrorCode()).isEqualTo(ErrorCode.FILE_TOO_LARGE);
                });
    }

    @Test
    @DisplayName("storeVideo rejects HTML file disguised with .mp4 extension")
    void storeVideo_rejectsHtmlNamedAsMp4() {
        byte[] htmlBytes = "<html><head><title>Spoof</title></head><body>Fake video</body></html>".getBytes();
        MockMultipartFile file = new MockMultipartFile(
                "file", "clip.mp4", "video/mp4", htmlBytes
        );

        assertThatThrownBy(() -> storageService.storeVideo("videos", file, UUID.randomUUID().toString()))
                .isInstanceOf(BadRequestException.class)
                .satisfies(ex -> {
                    BadRequestException bre = (BadRequestException) ex;
                    assertThat(bre.getErrorCode()).isEqualTo(ErrorCode.UNSUPPORTED_MEDIA_TYPE);
                });
    }

    @Test
    @DisplayName("storeVideo rejects HTML file disguised with .mov extension")
    void storeVideo_rejectsHtmlNamedAsMov() {
        byte[] htmlBytes = "<!DOCTYPE html><html><body><script>alert(1)</script></body></html>".getBytes();
        MockMultipartFile file = new MockMultipartFile(
                "file", "payload.mov", "video/quicktime", htmlBytes
        );

        assertThatThrownBy(() -> storageService.storeVideo("videos", file, UUID.randomUUID().toString()))
                .isInstanceOf(BadRequestException.class)
                .satisfies(ex -> {
                    BadRequestException bre = (BadRequestException) ex;
                    assertThat(bre.getErrorCode()).isEqualTo(ErrorCode.UNSUPPORTED_MEDIA_TYPE);
                });
    }

    @Test
    @DisplayName("storeVideo derives extension and contentType strictly from detected bytes, not file name")
    void storeVideo_derivesExtensionAndMimeFromDetectedBytes() {
        // MOV magic header uploaded with .mp4 name
        MockMultipartFile file = new MockMultipartFile(
                "file", "mismatch.mp4", "video/mp4", createQuickTimeMovHeader()
        );

        FileStorageService.StoredFile stored = storageService.storeVideo("videos", file, "mismatch-test");
        assertThat(stored.contentType()).isEqualTo("video/quicktime");
        assertThat(stored.storageKey()).isEqualTo("videos/mismatch-test.mov");
    }

    @Test
    @DisplayName("deleteQuietly safely deletes file or handles missing/blank keys")
    void deleteQuietly_safelyDeletesOrIgnores() {
        MockMultipartFile file = new MockMultipartFile(
                "file", "video.mp4", "video/mp4", createMp4Header()
        );
        FileStorageService.StoredFile stored = storageService.storeVideo("videos", file, "del-test");
        Path path = storageService.resolvePath(stored.storageKey());
        assertThat(Files.exists(path)).isTrue();

        storageService.deleteQuietly(stored.storageKey());
        assertThat(Files.exists(path)).isFalse();

        // Safe with blank/null or non-existent file
        storageService.deleteQuietly(null);
        storageService.deleteQuietly("");
        storageService.deleteQuietly("videos/del-test.mp4");
    }

    @Test
    @DisplayName("deleteDirectory cleanly deletes recursive subdirectories without locking stream")
    void deleteDirectory_recursivelyDeletesDirectory() throws IOException {
        MockMultipartFile file = new MockMultipartFile(
                "file", "video.mp4", "video/mp4", createMp4Header()
        );
        FileStorageService.StoredFile stored = storageService.storeVideo("sub/folder", file, "nested-file");
        Path filePath = storageService.resolvePath(stored.storageKey());
        Path dirPath = storageService.resolvePath("sub/folder");
        assertThat(Files.exists(filePath)).isTrue();

        storageService.deleteDirectory("sub/folder");
        assertThat(Files.exists(dirPath)).isFalse();
    }
}