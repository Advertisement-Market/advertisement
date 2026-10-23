package com.theadbasket.backend.owner;

/**
 * Functional category of a billboard media asset.
 */
public enum MediaCategory {
    DAY_PHOTO(true, 10, 2),
    NIGHT_PHOTO(true, 5, 0),
    SURROUNDING_PHOTO(true, 5, 0),
    VIDEO(false, 1, 0);

    private final boolean photo;
    private final int maxCount;
    private final int minCount;

    MediaCategory(boolean photo, int maxCount, int minCount) {
        this.photo = photo;
        this.maxCount = maxCount;
        this.minCount = minCount;
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
}
