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
    @DisplayName("storeVideo rejects video exceeding 50MB")
    void storeVideo_rejectsOversizedVideo() {
        MockMultipartFile file = new MockMultipartFile("file", "large.mp4", "video/mp4", createMp4Header()) {
            @Override
            public long getSize() {
                return 51 * 1024 * 1024L; // 51 MB
            }
        };

        assertThatThrownBy(() -> storageService.storeVideo("videos", file, UUID.randomUUID().toString()))
                .isInstanceOf(BadRequestException.class)
                .satisfies(ex -> {
                    BadRequestException bre = (BadRequestException) ex;
                    assertThat(bre.getErrorCode()).isEqualTo(ErrorCode.FILE_TOO_LARGE);
                });
    }
}
