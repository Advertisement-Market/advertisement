package com.theadbasket.backend.owner.dto;

import java.util.Collections;
import java.util.List;

import jakarta.validation.Valid;

public record SyncManifest(
        List<Long> stagedDeleteIds,
        List<@Valid SyncFileMapping> fileMappings
) {
    public List<Long> stagedDeleteIds() {
        return stagedDeleteIds != null ? stagedDeleteIds : Collections.emptyList();
    }

    public List<SyncFileMapping> fileMappings() {
        return fileMappings != null ? fileMappings : Collections.emptyList();
    }
}
