package com.theadbasket.backend.owner;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface BillboardMediaRepository extends JpaRepository<BillboardMedia, Long> {

    List<BillboardMedia> findByBillboardIdOrderByDisplayOrderAscCreatedTsAsc(Long billboardId);

    Optional<BillboardMedia> findByIdAndBillboardId(Long id, Long billboardId);

    List<BillboardMedia> findByBillboardIdAndUploadIdIn(Long billboardId, Collection<String> uploadIds);

    long countByBillboardIdAndCategory(Long billboardId, MediaCategory category);

    Optional<BillboardMedia> findFirstByBillboardIdAndCategoryOrderByDisplayOrderAsc(Long billboardId, MediaCategory category);

    @Query("SELECT m FROM BillboardMedia m WHERE m.billboard.id = :billboardId AND m.isCover = true")
    Optional<BillboardMedia> findCoverByBillboardId(@Param("billboardId") Long billboardId);

    @Query("SELECT COALESCE(MAX(m.displayOrder), 0) FROM BillboardMedia m WHERE m.billboard.id = :billboardId AND m.category = :category")
    int findMaxDisplayOrderByBillboardIdAndCategory(@Param("billboardId") Long billboardId, @Param("category") MediaCategory category);

    void deleteByIdAndBillboardId(Long id, Long billboardId);
}
