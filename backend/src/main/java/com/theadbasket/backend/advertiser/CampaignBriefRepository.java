package com.theadbasket.backend.advertiser;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CampaignBriefRepository extends JpaRepository<CampaignBrief, Long> {

    List<CampaignBrief> findByUserId(Long userId);
}
