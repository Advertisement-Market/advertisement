package com.theadbasket.backend.owner.dto;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import com.theadbasket.backend.owner.BillboardMedia;
import com.theadbasket.backend.owner.MediaCategory;

class BillboardMediaDtoTest {

    private static BillboardMedia media(MediaCategory category, String storageKey, long id) {
        BillboardMedia m = new BillboardMedia(
                null, category, storageKey, "upload-id", "file.ext", "application/pdf", 123L, null, 0);
        ReflectionTestUtils.setField(m, "id", id);
        return m;
    }

    @Test
    @DisplayName("public media is served from the public /api/media path")
    void publicMediaUsesPublicPath() {
        BillboardMedia m = media(MediaCategory.DAY_PHOTO, "billboards/7/abc.jpg", 42L);

        BillboardMediaDto dto = BillboardMediaDto.from(m, "/api/media", 7L);

        assertThat(dto.fileUrl()).isEqualTo("/api/media/billboards/7/abc.jpg");
        assertThat(dto.category()).isEqualTo("DAY_PHOTO");
    }

    @Test
    @DisplayName("private legal documents are served only from the authenticated owner endpoint")
    void documentMediaUsesOwnerRawEndpoint() {
        BillboardMedia ownership = media(MediaCategory.OWNERSHIP_DOC, "documents/7/ownership_doc_abc.pdf", 42L);
        BillboardMedia approval = media(MediaCategory.APPROVAL_DOC, "documents/7/approval_doc_xyz.pdf", 43L);

        BillboardMediaDto ownershipDto = BillboardMediaDto.from(ownership, "/api/media", 7L);
        BillboardMediaDto approvalDto = BillboardMediaDto.from(approval, "/api/media", 7L);

        assertThat(ownershipDto.fileUrl()).isEqualTo("/api/owner/listings/7/media/42/raw");
        assertThat(ownershipDto.fileUrl()).doesNotContain("/api/media/");
        assertThat(approvalDto.fileUrl()).isEqualTo("/api/owner/listings/7/media/43/raw");
    }
}
