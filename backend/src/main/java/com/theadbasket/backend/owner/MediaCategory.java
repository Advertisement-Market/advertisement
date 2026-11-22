package com.theadbasket.backend.owner;

/**
 * Functional category of a billboard media asset.
 *
 * <p>The {@code isPublic} flag distinguishes gallery media (photos/video), which may be served
 * from the public {@code /api/media/**} path, from private legal documents (ownership deed,
 * municipal approval), which must never be exposed through the public media endpoint.
 */
public enum MediaCategory {
    DAY_PHOTO(true, 10, 2, true),
    NIGHT_PHOTO(true, 5, 0, true),
    SURROUNDING_PHOTO(true, 5, 0, true),
    VIDEO(false, 1, 0, true),
    // Legal documents: single file each, PDF or image, excluded from the public gallery.
    OWNERSHIP_DOC(false, 1, 0, false),
    APPROVAL_DOC(false, 1, 0, false);

    private final boolean photo;
    private final int maxCount;
    private final int minCount;
    private final boolean isPublic;

    MediaCategory(boolean photo, int maxCount, int minCount, boolean isPublic) {
        this.photo = photo;
        this.maxCount = maxCount;
        this.minCount = minCount;
        this.isPublic = isPublic;
    }

    public boolean isPhoto() {
        return photo;
    }

    public int getMaxCount() {
        return maxCount;
    }

    public int getMinCount() {
        return minCount;
    }

    /**
     * Whether assets in this category may be served from the public media path. Private
     * categories (legal documents) are served only through an authenticated owner endpoint.
     */
    public boolean isPublic() {
        return isPublic;
    }

    /** Whether this category holds a verification document rather than gallery media. */
    public boolean isDocument() {
        return !isPublic;
    }
}
