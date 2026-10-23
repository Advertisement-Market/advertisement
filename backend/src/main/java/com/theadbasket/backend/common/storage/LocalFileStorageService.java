package com.theadbasket.backend.common.storage;

import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.geom.AffineTransform;
import java.awt.image.BufferedImage;
import java.io.BufferedInputStream;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Comparator;
import java.util.Iterator;
import java.util.UUID;
import java.util.concurrent.Semaphore;
import java.util.concurrent.TimeUnit;

import javax.imageio.IIOImage;
import javax.imageio.ImageIO;
import javax.imageio.ImageReadParam;
import javax.imageio.ImageReader;
import javax.imageio.ImageWriteParam;
import javax.imageio.ImageWriter;
import javax.imageio.stream.ImageInputStream;
import javax.imageio.stream.ImageOutputStream;

import org.apache.tika.Tika;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.drew.imaging.ImageMetadataReader;
import com.drew.metadata.Metadata;
import com.drew.metadata.exif.ExifIFD0Directory;
import com.theadbasket.backend.common.error.ErrorCode;
import com.theadbasket.backend.common.exception.BadRequestException;
import com.theadbasket.backend.common.exception.ServiceUnavailableException;

@Service
public class LocalFileStorageService implements FileStorageService {

    private static final Logger log = LoggerFactory.getLogger(LocalFileStorageService.class);

    private static final int MAX_PIXELS = 25_000_000; // 25 Megapixels
    private static final int MAX_DIMENSION = 10_000;
    private static final int TARGET_MAX_EDGE = 2560;
    private static final float JPEG_QUALITY = 0.85f;
    private static final long MAX_IMAGE_BYTES = 10 * 1024 * 1024L; // 10 MB
    private static final long MAX_VIDEO_BYTES = 50 * 1024 * 1024L; // 50 MB

    private final Path uploadRoot;
    private final Tika tika;
    private final Semaphore imageProcessingSemaphore;

    public LocalFileStorageService(@Value("${app.storage.upload-dir:./uploads}") String uploadDir) {
        this.uploadRoot = Paths.get(uploadDir).toAbsolutePath().normalize();
        this.tika = new Tika();
        this.imageProcessingSemaphore = new Semaphore(2);
        try {
            Files.createDirectories(this.uploadRoot);
        } catch (IOException e) {
            throw new IllegalStateException("Failed to create root upload directory: " + this.uploadRoot, e);
        }
    }

    @Override
    public StoredFile storeImage(String subDirectory, MultipartFile file, String preferredFilename) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException(ErrorCode.INVALID_FILE, "Image file cannot be empty");
        }
        if (file.getSize() > MAX_IMAGE_BYTES) {
            throw new BadRequestException(ErrorCode.FILE_TOO_LARGE, "Image file exceeds maximum allowed size of 10MB");
        }

        byte[] headerBytes = new byte[8192];
        try (InputStream is = file.getInputStream()) {
            int read = is.read(headerBytes);
            if (read < 12) {
                throw new BadRequestException(ErrorCode.INVALID_FILE, "File is too small to be a valid image");
            }
        } catch (IOException e) {
            throw new BadRequestException(ErrorCode.INVALID_FILE, "Failed to read image header");
        }

        String mimeType;
        try {
            mimeType = tika.detect(headerBytes);
        } catch (Exception e) {
            throw new BadRequestException(ErrorCode.INVALID_FILE, "Could not detect MIME type");
        }
        String extension;
        if ("image/jpeg".equalsIgnoreCase(mimeType)) {
            extension = "jpg";
        } else if ("image/png".equalsIgnoreCase(mimeType)) {
            extension = "png";
        } else {
            throw new BadRequestException(ErrorCode.UNSUPPORTED_MEDIA_TYPE,
                    "Unsupported image format: " + mimeType + ". Only JPG and PNG are supported.");
        }

        // Throttle concurrent image processing to prevent JVM OOM
        boolean acquired;
        try {
            acquired = imageProcessingSemaphore.tryAcquire(5, TimeUnit.SECONDS);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new ServiceUnavailableException("Image processing was interrupted. Please retry.");
        }
        if (!acquired) {
            throw new ServiceUnavailableException("Server is busy processing images. Please retry in a few seconds.");
        }

        try {
            return processAndWriteImage(subDirectory, file, extension, mimeType, preferredFilename);
        } finally {
            imageProcessingSemaphore.release();
        }
    }

    private StoredFile processAndWriteImage(String subDirectory, MultipartFile file, String extension, String mimeType, String preferredFilename) {
        int orientation = 1;
        try (InputStream is = file.getInputStream()) {
            Metadata metadata = ImageMetadataReader.readMetadata(new BufferedInputStream(is));
            ExifIFD0Directory directory = metadata.getFirstDirectoryOfType(ExifIFD0Directory.class);
            if (directory != null && directory.containsTag(ExifIFD0Directory.TAG_ORIENTATION)) {
                orientation = directory.getInt(ExifIFD0Directory.TAG_ORIENTATION);
            }
        } catch (Exception e) {
            log.warn("Could not read EXIF orientation (proceeding with normal orientation): {}", e.getMessage());
            orientation = 1;
        }

        int origWidth;
        int origHeight;

        Iterator<ImageReader> readers = ImageIO.getImageReadersByMIMEType(mimeType);
        if (!readers.hasNext()) {
            throw new BadRequestException(ErrorCode.UNSUPPORTED_MEDIA_TYPE, "No image reader available for " + mimeType);
        }
        ImageReader reader = readers.next();
        ImageInputStream iis = null;
        try {
            iis = ImageIO.createImageInputStream(file.getInputStream());
            reader.setInput(iis, true, true);
            origWidth = reader.getWidth(0);
            origHeight = reader.getHeight(0);
        } catch (IOException e) {
            throw new BadRequestException(ErrorCode.INVALID_FILE, "Corrupt or unreadable image file");
        } finally {
            if (iis != null) {
                try {
                    iis.close();
                } catch (IOException ignored) {
                }
            }
            reader.dispose();
        }

        long pixelCount = (long) origWidth * origHeight;
        if (pixelCount > MAX_PIXELS || Math.max(origWidth, origHeight) > MAX_DIMENSION) {
            throw new BadRequestException(ErrorCode.IMAGE_DIMENSIONS_EXCEEDED,
                    String.format("Image dimensions %dx%d exceed maximum limit of 25 Megapixels or 10,000px edge", origWidth, origHeight));
        }

        // Subsampling during decode: stay at or above TARGET_MAX_EDGE before final bilinear scaling
        int maxDim = Math.max(origWidth, origHeight);
        int subsample = 1;
        while (maxDim / (subsample * 2) >= TARGET_MAX_EDGE) {
            subsample *= 2;
        }

        BufferedImage decodedImage;
        readers = ImageIO.getImageReadersByMIMEType(mimeType);
        reader = readers.next();
        try {
            iis = ImageIO.createImageInputStream(file.getInputStream());
            reader.setInput(iis, true, true);
            ImageReadParam param = reader.getDefaultReadParam();
            if (subsample > 1) {
                param.setSourceSubsampling(subsample, subsample, 0, 0);
            }
            decodedImage = reader.read(0, param);
        } catch (IOException e) {
            throw new BadRequestException(ErrorCode.INVALID_FILE, "Failed to decode image data");
        } finally {
            if (iis != null) {
                try {
                    iis.close();
                } catch (IOException ignored) {
                }
            }
            reader.dispose();
        }

        if (decodedImage == null) {
            throw new BadRequestException(ErrorCode.INVALID_FILE, "Image data could not be parsed");
        }

        BufferedImage orientedImage = applyOrientation(decodedImage, orientation);

        // Downscale to TARGET_MAX_EDGE if needed
        int currentW = orientedImage.getWidth();
        int currentH = orientedImage.getHeight();
        int longestEdge = Math.max(currentW, currentH);
        BufferedImage finalImage = orientedImage;

        if (longestEdge > TARGET_MAX_EDGE) {
            double scale = (double) TARGET_MAX_EDGE / longestEdge;
            int targetW = (int) Math.round(currentW * scale);
            int targetH = (int) Math.round(currentH * scale);

            int imageType = "png".equals(extension) && orientedImage.getColorModel().hasAlpha()
                    ? BufferedImage.TYPE_INT_ARGB
                    : BufferedImage.TYPE_INT_RGB;

            BufferedImage resized = new BufferedImage(targetW, targetH, imageType);
            Graphics2D g2d = resized.createGraphics();
            g2d.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
            g2d.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
            g2d.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
            g2d.drawImage(orientedImage, 0, 0, targetW, targetH, null);
            g2d.dispose();
            finalImage = resized;
        } else if ("jpg".equals(extension) && orientedImage.getColorModel().hasAlpha()) {
            // Convert RGBA to RGB for clean JPEG write
            BufferedImage rgbImage = new BufferedImage(currentW, currentH, BufferedImage.TYPE_INT_RGB);
            Graphics2D g2d = rgbImage.createGraphics();
            g2d.drawImage(orientedImage, 0, 0, null);
            g2d.dispose();
            finalImage = rgbImage;
        }

        String uuid = (preferredFilename != null && !preferredFilename.isBlank())
                ? preferredFilename
                : UUID.randomUUID().toString();
        String storageKey = subDirectory + "/" + uuid + "." + extension;
        Path targetPath = resolvePath(storageKey);

        try {
            Files.createDirectories(targetPath.getParent());
            writeImageToFile(finalImage, extension, targetPath);
            long writtenSize = Files.size(targetPath);
            String originalName = sanitizeOriginalName(file.getOriginalFilename());
            return new StoredFile(storageKey, originalName, mimeType, writtenSize, finalImage.getWidth(), finalImage.getHeight());
        } catch (IOException e) {
            deleteQuietly(storageKey);
            throw new IllegalStateException("Failed to write sanitized image to disk", e);
        }
    }

    private void writeImageToFile(BufferedImage image, String extension, Path targetPath) throws IOException {
        Iterator<ImageWriter> writers = ImageIO.getImageWritersByFormatName(extension);
        if (!writers.hasNext()) {
            throw new IllegalStateException("No ImageWriter found for " + extension);
        }
        ImageWriter writer = writers.next();
        try (OutputStream os = Files.newOutputStream(targetPath);
             ImageOutputStream ios = ImageIO.createImageOutputStream(os)) {
            writer.setOutput(ios);
            if ("jpg".equalsIgnoreCase(extension)) {
                ImageWriteParam param = writer.getDefaultWriteParam();
                param.setCompressionMode(ImageWriteParam.MODE_EXPLICIT);
                param.setCompressionQuality(JPEG_QUALITY);
                writer.write(null, new IIOImage(image, null, null), param);
            } else {
                writer.write(image);
            }
        } finally {
            writer.dispose();
        }
    }

    @Override
    public StoredFile storeVideo(String subDirectory, MultipartFile file, String preferredFilename) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException(ErrorCode.INVALID_FILE, "Video file cannot be empty");
        }
        if (file.getSize() > MAX_VIDEO_BYTES) {
            throw new BadRequestException(ErrorCode.FILE_TOO_LARGE, "Video file exceeds maximum allowed size of 50MB");
        }

        byte[] headerBytes = new byte[8192];
        try (InputStream is = file.getInputStream()) {
            int read = is.read(headerBytes);
            if (read < 12) {
                throw new BadRequestException(ErrorCode.INVALID_FILE, "File is too small to be a valid video");
            }
        } catch (IOException e) {
            throw new BadRequestException(ErrorCode.INVALID_FILE, "Failed to read video header");
        }

        String mimeType;
        try {
            mimeType = tika.detect(headerBytes);
        } catch (Exception e) {
            throw new BadRequestException(ErrorCode.INVALID_FILE, "Could not detect MIME type");
        }
        if (!"video/mp4".equalsIgnoreCase(mimeType)) {
            throw new BadRequestException(ErrorCode.UNSUPPORTED_MEDIA_TYPE,
                    "Unsupported video format: " + mimeType + ". Only MP4 video is supported.");
        }

        String uuid = (preferredFilename != null && !preferredFilename.isBlank())
                ? preferredFilename
                : UUID.randomUUID().toString();
        String storageKey = subDirectory + "/" + uuid + ".mp4";
        Path targetPath = resolvePath(storageKey);

        try {
            Files.createDirectories(targetPath.getParent());
            try (InputStream in = file.getInputStream()) {
                Files.copy(in, targetPath, StandardCopyOption.REPLACE_EXISTING);
            }
            long writtenSize = Files.size(targetPath);
            String originalName = sanitizeOriginalName(file.getOriginalFilename());
            return new StoredFile(storageKey, originalName, "video/mp4", writtenSize, null, null);
        } catch (IOException e) {
            deleteQuietly(storageKey);
            throw new IllegalStateException("Failed to write video to disk", e);
        }
    }

    @Override
    public void delete(String storageKey) {
        Path path = resolvePath(storageKey);
        try {
            Files.deleteIfExists(path);
        } catch (IOException e) {
            throw new IllegalStateException("Failed to delete file at " + storageKey, e);
        }
    }

    @Override
    public void deleteQuietly(String storageKey) {
        try {
            if (storageKey != null && !storageKey.isBlank()) {
                Path path = resolvePath(storageKey);
                Files.deleteIfExists(path);
            }
        } catch (Exception e) {
            log.warn("Failed to quietly delete file {}: {}", storageKey, e.getMessage());
        }
    }

    @Override
    public void deleteDirectory(String relativeDirectory) {
        Path dir = resolvePath(relativeDirectory);
        if (Files.exists(dir)) {
            try {
                Files.walk(dir)
                        .sorted(Comparator.reverseOrder())
                        .forEach(p -> {
                            try {
                                Files.deleteIfExists(p);
                            } catch (IOException ignored) {
                            }
                        });
            } catch (IOException e) {
                log.warn("Failed to delete directory {}: {}", relativeDirectory, e.getMessage());
            }
        }
    }

    @Override
    public Path resolvePath(String storageKey) {
        if (storageKey == null || storageKey.isBlank()) {
            throw new BadRequestException(ErrorCode.INVALID_FILE, "Storage key cannot be blank");
        }
        Path normalized = uploadRoot.resolve(storageKey).normalize();
        if (!normalized.startsWith(uploadRoot)) {
            throw new BadRequestException(ErrorCode.INVALID_FILE, "Directory traversal detected");
        }
        return normalized;
    }

    private BufferedImage applyOrientation(BufferedImage image, int orientation) {
        if (orientation == 1) {
            return image;
        }

        int width = image.getWidth();
        int height = image.getHeight();
        AffineTransform tx = new AffineTransform();

        switch (orientation) {
            case 3 -> { // 180 degrees
                tx.translate(width, height);
                tx.rotate(Math.PI);
            }
            case 6 -> { // 90 degrees CW
                tx.translate(height, 0);
                tx.rotate(Math.PI / 2);
                int temp = width;
                width = height;
                height = temp;
            }
            case 8 -> { // 270 degrees CW (90 CCW)
                tx.translate(0, width);
                tx.rotate(3 * Math.PI / 2);
                int temp = width;
                width = height;
                height = temp;
            }
            default -> {
                return image;
            }
        }

        int imageType = image.getColorModel().hasAlpha() ? BufferedImage.TYPE_INT_ARGB : BufferedImage.TYPE_INT_RGB;
        BufferedImage transformed = new BufferedImage(width, height, imageType);
        Graphics2D g2d = transformed.createGraphics();
        g2d.drawImage(image, tx, null);
        g2d.dispose();
        return transformed;
    }

    private String sanitizeOriginalName(String originalName) {
        if (originalName == null || originalName.isBlank()) {
            return "unnamed";
        }
        String clean = originalName.trim().replaceAll("[^a-zA-Z0-9._-]", "_");
        return clean.length() > 250 ? clean.substring(clean.length() - 250) : clean;
    }
}
