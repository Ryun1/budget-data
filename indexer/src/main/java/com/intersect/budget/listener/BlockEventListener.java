package com.intersect.budget.listener;

import com.bloxbean.cardano.yaci.store.events.BlockHeaderEvent;
import com.intersect.budget.service.MilestoneMaturityChecker;
import com.intersect.budget.service.SlotTracker;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

/**
 * Listener for block header events to track slot progress and check milestone maturity.
 */
@Component
@Slf4j
public class BlockEventListener {
    private final SlotTracker slotTracker;
    private final MilestoneMaturityChecker maturityChecker;

    @Autowired
    public BlockEventListener(
            SlotTracker slotTracker,
            MilestoneMaturityChecker maturityChecker) {
        this.slotTracker = slotTracker;
        this.maturityChecker = maturityChecker;
    }

    @EventListener
    @Async
    public void handleBlockHeaderEvent(BlockHeaderEvent blockHeaderEvent) {
        try {
            Long slot = blockHeaderEvent.getSlot();
            if (slot != null) {
                slotTracker.updateCurrentSlot(slot);
                
                // Check milestone maturity periodically (every 100 slots)
                if (slot % 100 == 0) {
                    maturityChecker.checkMaturity(slot);
                }
            }
        } catch (Exception e) {
            log.error("Error handling block header event", e);
        }
    }
}
