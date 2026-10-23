package com.theadbasket.backend.owner;

import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.UUID;

import javax.imageio.ImageIO;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.theadbasket.backend.common.address.Address;
import com.theadbasket.backend.common.address.AddressRepository;
import com.theadbasket.backend.lov.AudienceType;
import com.theadbasket.backend.lov.BillboardType;
import com.theadbasket.backend.lov.BookingDurationUnit;
import com.theadbasket.backend.lov.FacingDirection;
import com.theadbasket.backend.lov.TrafficType;
import com.theadbasket.backend.owner.dto.AdminReviewRequest;
import com.theadbasket.backend.owner.dto.SyncFileMapping;
import com.theadbasket.backend.owner.dto.SyncManifest;
import com.theadbasket.backend.security.JwtService;
import com.theadbasket.backend.user.Role;
import com.theadbasket.backend.user.User;
import com.theadbasket.backend.user.UserRepository;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class OwnerMediaSyncIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BillboardListingRepository billboardListingRepository;

    @Autowired
    private BillboardMediaRepository billboardMediaRepository;

    @Autowired
    private AddressRepository addressRepository;

    @Autowired
    private JwtService jwtService;

    @Value("${app.storage.upload-dir:./uploads}")
    private String uploadDir;

    private User owner;
    private User admin;
    private String ownerToken;
    private String adminToken;
    private BillboardListing listing;

    @BeforeEach
    @SuppressWarnings("unused")
    void setUp() {
        billboardMediaRepository.deleteAll();
        billboardListingRepository.deleteAll();
        addressRepository.deleteAll();
        userRepository.deleteAll();

        owner = userRepository.save(new User("Rohan", "Mehta", "rohan.media@example.com", "pass", "9876543220", Role.OWNER));
        admin = userRepository.save(new User("Pooja", "Admin", "pooja.admin@example.com", "pass", "9876543221", Role.ADMIN));

        ownerToken = jwtService.generateAccessToken(owner);
        adminToken = jwtService.generateAccessToken(admin);

        Address address = Address.of("200 SV Road", "Near Station", "Bandra", "Mumbai", "Maharashtra", "400050");
        listing = new BillboardListing();
        listing.setUser(owner);
        listing.setName("SV Road Prime LED");
        listing.setAddress(address);
        listing.setType(BillboardType.DIGITAL_SCREEN);
        listing.setWidthFt(new BigDecimal("40.00"));
        listing.setHeightFt(new BigDecimal("20.00"));
        listing.setFacing(FacingDirection.NORTH);
        listing.setTrafficType(TrafficType.COMMERCIAL_ZONE);
        listing.setAudienceType(AudienceType.COMMUTERS);
        listing.setStartPrice(new BigDecimal("150000.00"));
        listing.setMinBookingValue(1);
        listing.setMinBookingUnit(BookingDurationUnit.MONTHS);
        listing.setMinBookingDays(30);
        listing.setStatus(BillboardStatus.DRAFT);
        listing = billboardListingRepository.save(listing);
    }

    @AfterEach
    @SuppressWarnings("unused")
    void tearDown() throws IOException {
        Path listingUploadPath = Paths.get(uploadDir, "billboards", String.valueOf(listing.getId()));
        if (Files.exists(listingUploadPath)) {
            try (var stream = Files.walk(listingUploadPath)) {
                stream.sorted((a, b) -> b.compareTo(a)).forEach(p -> {
                    try {
                        Files.deleteIfExists(p);
                    } catch (IOException ignored) {
                    }
                });
            }
        }
    }

    private byte[] createTestJpeg(int width, int height) throws IOException {
        BufferedImage img = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = img.createGraphics();
        g.setColor(new Color(24, 120, 200));
        g.fillRect(0, 0, width, height);
        g.setColor(Color.WHITE);
        g.drawString("Test " + width + "x" + height, 10, 25);
        g.dispose();

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(img, "jpg", baos);
        return baos.toByteArray();
    }

    @Test
    @DisplayName("Complete Media Lifecycle: Upload -> Idempotency -> Submit -> Reject -> Resubmit -> Approve -> Re-queue -> No-Op -> Static Headers")
    void fullMediaSyncAndModerationLifecycle() throws Exception {
        byte[] photo1Bytes = createTestJpeg(800, 600);
        byte[] photo2Bytes = createTestJpeg(800, 600);

        String uploadId1 = UUID.randomUUID().toString();
        String uploadId2 = UUID.randomUUID().toString();

        SyncManifest manifest = new SyncManifest(
                List.of(),
                List.of(
                        new SyncFileMapping(0, MediaCategory.DAY_PHOTO, uploadId1),
                        new SyncFileMapping(1, MediaCategory.DAY_PHOTO, uploadId2)
                )
        );

        MockMultipartFile manifestPart = new MockMultipartFile(
                "manifest", "", "application/json", objectMapper.writeValueAsBytes(manifest)
        );
        MockMultipartFile file0 = new MockMultipartFile(
                "files", "photo1.jpg", "image/jpeg", photo1Bytes
        );
        MockMultipartFile file1 = new MockMultipartFile(
                "files", "photo2.jpg", "image/jpeg", photo2Bytes
        );

        // ── 1. Upload 2 Day Photos via POST /media/sync ──
        mockMvc.perform(multipart("/api/owner/listings/" + listing.getId() + "/media/sync")
                        .file(manifestPart)
                        .file(file0)
                        .file(file1)
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].category").value("DAY_PHOTO"))
                .andExpect(jsonPath("$[0].isCover").value(true))
                .andExpect(jsonPath("$[1].category").value("DAY_PHOTO"))
                .andExpect(jsonPath("$[1].isCover").value(false));

        // Assert physical files created on disk
        Path listingDir = Paths.get(uploadDir, "billboards", String.valueOf(listing.getId()));
        assertThat(Files.exists(listingDir)).isTrue();
        try (var files = Files.list(listingDir)) {
            assertThat(files.count()).isEqualTo(2);
        }

        // ── 2. Idempotent Replay: zero extra files written to disk ──
        mockMvc.perform(multipart("/api/owner/listings/" + listing.getId() + "/media/sync")
                        .file(manifestPart)
                        .file(file0)
                        .file(file1)
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));

        try (var files = Files.list(listingDir)) {
            assertThat(files.count()).isEqualTo(2);
        }

        // ── 3. Submit Listing for Moderation: DRAFT -> PENDING_APPROVAL ──
        mockMvc.perform(post("/api/owner/listings/" + listing.getId() + "/submit")
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PENDING_APPROVAL"))
                .andExpect(jsonPath("$.coverPhotoUrl").isNotEmpty());

        // ── 4. Admin Rejects with mandatory reason: PENDING_APPROVAL -> REJECTED ──
        AdminReviewRequest rejectReq = new AdminReviewRequest("Please provide a clearer daylight photo of the frame structure.");
        mockMvc.perform(post("/api/admin/listings/" + listing.getId() + "/reject")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(rejectReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("REJECTED"))
                .andExpect(jsonPath("$.rejectionReason").value("Please provide a clearer daylight photo of the frame structure."));

        // ── 5. Reject-Fix-Resubmit Loop: Owner resubmits from REJECTED -> PENDING_APPROVAL and clears rejectionReason ──
        mockMvc.perform(post("/api/owner/listings/" + listing.getId() + "/submit")
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PENDING_APPROVAL"))
                .andExpect(jsonPath("$.rejectionReason").value(nullValue()));

        // ── 6. Admin Approves: PENDING_APPROVAL -> ACTIVE ──
        mockMvc.perform(post("/api/admin/listings/" + listing.getId() + "/approve")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACTIVE"));

        // ── 7. Re-Queue Rule: Adding a Night Photo on ACTIVE listing re-queues to PENDING_APPROVAL ──
        byte[] nightPhoto = createTestJpeg(800, 600);
        String uploadIdNight = UUID.randomUUID().toString();
        SyncManifest nightManifest = new SyncManifest(
                List.of(),
                List.of(new SyncFileMapping(0, MediaCategory.NIGHT_PHOTO, uploadIdNight))
        );
        MockMultipartFile nightManifestPart = new MockMultipartFile(
                "manifest", "", "application/json", objectMapper.writeValueAsBytes(nightManifest)
        );
        MockMultipartFile nightFile = new MockMultipartFile(
                "files", "night.jpg", "image/jpeg", nightPhoto
        );

        mockMvc.perform(multipart("/api/owner/listings/" + listing.getId() + "/media/sync")
                        .file(nightManifestPart)
                        .file(nightFile)
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(3));

        BillboardListing reloaded = billboardListingRepository.findById(listing.getId()).orElseThrow();
        assertThat(reloaded.getStatus()).isEqualTo(BillboardStatus.PENDING_APPROVAL);

        // Re-approve to ACTIVE
        mockMvc.perform(post("/api/admin/listings/" + listing.getId() + "/approve")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACTIVE"));

        // ── 8. No-Op Sync on ACTIVE listing does NOT re-queue ──
        SyncManifest noOpManifest = new SyncManifest(List.of(), List.of());
        MockMultipartFile noOpManifestPart = new MockMultipartFile(
                "manifest", "", "application/json", objectMapper.writeValueAsBytes(noOpManifest)
        );

        mockMvc.perform(multipart("/api/owner/listings/" + listing.getId() + "/media/sync")
                        .file(noOpManifestPart)
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk());

        reloaded = billboardListingRepository.findById(listing.getId()).orElseThrow();
        assertThat(reloaded.getStatus()).isEqualTo(BillboardStatus.ACTIVE);

        // ── 9. Admin Suspends: ACTIVE -> SUSPENDED with reason ──
        AdminReviewRequest suspendReq = new AdminReviewRequest("Listing flagged for structural compliance review.");
        mockMvc.perform(post("/api/admin/listings/" + listing.getId() + "/suspend")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(suspendReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SUSPENDED"))
                .andExpect(jsonPath("$.suspensionReason").value("Listing flagged for structural compliance review."));

        // Owner GET continues to work for suspended listing
        mockMvc.perform(get("/api/owner/listings/" + listing.getId())
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SUSPENDED"))
                .andExpect(jsonPath("$.suspensionReason").value("Listing flagged for structural compliance review."));

        // ── 10. Admin Unsuspends: SUSPENDED -> DRAFT and clears suspensionReason ──
        mockMvc.perform(post("/api/admin/listings/" + listing.getId() + "/unsuspend")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("DRAFT"))
                .andExpect(jsonPath("$.suspensionReason").value(nullValue()));

        // ── 11. Static Media Headers Assertion on /api/media/** ──
        List<BillboardMedia> mediaList = billboardMediaRepository.findByBillboardIdOrderByDisplayOrderAscCreatedTsAsc(listing.getId());
        assertThat(mediaList).isNotEmpty();
        String storageKey = mediaList.get(0).getStorageKey();

        mockMvc.perform(get("/api/media/" + storageKey))
                .andExpect(status().isOk())
                .andExpect(header().string("X-Content-Type-Options", "nosniff"))
                .andExpect(header().string("Content-Security-Policy", "default-src 'none'; sandbox"))
                .andExpect(header().string("Content-Disposition", "inline; filename=\"asset.jpg\""))
                .andExpect(header().string("Cache-Control", "max-age=86400, public"));

        // ── 12. Security: Non-Admin gets 403 on Admin endpoints ──
        mockMvc.perform(post("/api/admin/listings/" + listing.getId() + "/approve")
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Downscale Quality & Subsampling: 6000x4000 JPEG is accepted, subsampled >= 2560px, and resized cleanly")
    void largeHighResImageDownscaledSuccessfully() throws Exception {
        byte[] largePhoto = createTestJpeg(6000, 4000);
        String uploadId = UUID.randomUUID().toString();

        SyncManifest manifest = new SyncManifest(
                List.of(),
                List.of(new SyncFileMapping(0, MediaCategory.DAY_PHOTO, uploadId))
        );
        MockMultipartFile manifestPart = new MockMultipartFile(
                "manifest", "", "application/json", objectMapper.writeValueAsBytes(manifest)
        );
        MockMultipartFile largeFile = new MockMultipartFile(
                "files", "large_highres.jpg", "image/jpeg", largePhoto
        );

        mockMvc.perform(multipart("/api/owner/listings/" + listing.getId() + "/media/sync")
                        .file(manifestPart)
                        .file(largeFile)
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));

        List<BillboardMedia> mediaList = billboardMediaRepository.findByBillboardIdOrderByDisplayOrderAscCreatedTsAsc(listing.getId());
        assertThat(mediaList).hasSize(1);

        Path physicalFile = Paths.get(uploadDir, mediaList.get(0).getStorageKey());
        assertThat(Files.exists(physicalFile)).isTrue();

        BufferedImage savedImage = ImageIO.read(physicalFile.toFile());
        assertThat(savedImage).isNotNull();
        assertThat(Math.max(savedImage.getWidth(), savedImage.getHeight())).isEqualTo(2560);
    }
}
