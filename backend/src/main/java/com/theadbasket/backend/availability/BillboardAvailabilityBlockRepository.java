package com.theadbasket.backend.availability;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface BillboardAvailabilityBlockRepository extends JpaRepository<BillboardAvailabilityBlock, Long> {

    List<BillboardAvailabilityBlock> findByBillboardIdAndBlockTypeOrderByStartDateAsc(
            Long billboardId, AvailabilityBlockType blockType);

    @Query("""
        SELECT b FROM BillboardAvailabilityBlock b
        WHERE b.billboardId = :billboardId
          AND b.endDate >= :from AND b.startDate <= :to
          AND (b.expiryTs IS NULL OR b.expiryTs > :now)
        ORDER BY b.startDate ASC
        """)
    List<BillboardAvailabilityBlock> findPublicActiveBlocks(
            @Param("billboardId") Long billboardId,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to,
            @Param("now") Instant now);

    @Query("""
        SELECT b FROM BillboardAvailabilityBlock b
        WHERE b.billboardId = :billboardId
          AND b.startDate <= :endDate AND b.endDate >= :startDate
          AND (b.expiryTs IS NULL OR b.expiryTs > :now)
        ORDER BY b.startDate ASC
        """)
    List<BillboardAvailabilityBlock> findActiveOverlapping(
            @Param("billboardId") Long billboardId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("now") Instant now);

    @Modifying
    @Query("DELETE FROM BillboardAvailabilityBlock b WHERE b.blockType = :holdType AND b.expiryTs < :now")
    int deleteExpiredHolds(@Param("holdType") AvailabilityBlockType holdType, @Param("now") Instant now);
}
