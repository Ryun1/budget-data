package com.intersect.budget.service;

import com.intersect.budget.domain.Milestone;
import com.intersect.budget.repository.MilestoneRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Service to check milestone maturity dates.
 * Periodically checks if milestones have reached their maturity slot.
 */
@Service
@Slf4j
public class MilestoneMaturityChecker {
    private final MilestoneRepository milestoneRepository;

    @Autowired
    public MilestoneMaturityChecker(MilestoneRepository milestoneRepository) {
        this.milestoneRepository = milestoneRepository;
    }

    /**
     * Check for milestones that have reached maturity.
     * This runs periodically to identify milestones ready for withdrawal.
     * Note: This requires current slot information from YACI Store.
     */
    @Transactional
    public void checkMaturity(Long currentSlot) {
        if (currentSlot == null) {
            return;
        }

        // Find milestones that have reached maturity but are still pending
        List<Milestone> milestones = milestoneRepository.findMatureMilestones(currentSlot);
        
        if (!milestones.isEmpty()) {
            log.info("Found {} milestones that have reached maturity", milestones.size());
            for (Milestone milestone : milestones) {
                log.debug("Milestone {}:{} has reached maturity (slot {} <= current slot {})", 
                    milestone.getProjectId(), milestone.getIdentifier(), 
                    milestone.getMaturitySlot(), currentSlot);
                // Milestone is ready for withdrawal - vendor can now claim funds
                // Status remains PENDING until withdrawal occurs
            }
        }
    }
}
