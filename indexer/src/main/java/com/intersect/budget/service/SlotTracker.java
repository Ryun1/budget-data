package com.intersect.budget.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.concurrent.atomic.AtomicLong;

/**
 * Service to track the current slot being processed.
 * Useful for monitoring indexing progress.
 */
@Service
@Slf4j
public class SlotTracker {
    private final AtomicLong currentSlot = new AtomicLong(0);
    private final AtomicLong lastProcessedSlot = new AtomicLong(0);

    @Value("${yaci.store.start-slot:160964954}")
    private Long startSlot;

    /**
     * Update the current slot being processed.
     */
    public void updateCurrentSlot(Long slot) {
        if (slot != null && slot > currentSlot.get()) {
            currentSlot.set(slot);
        }
    }

    /**
     * Mark a slot as processed.
     */
    public void markProcessed(Long slot) {
        if (slot != null) {
            lastProcessedSlot.set(slot);
            
            // Log progress every 1000 slots
            if (slot % 1000 == 0) {
                log.info("Processed slot: {} (progress: {} slots)", slot, slot - startSlot);
            }
        }
    }

    /**
     * Get the current slot being processed.
     */
    public Long getCurrentSlot() {
        return currentSlot.get();
    }

    /**
     * Get the last processed slot.
     */
    public Long getLastProcessedSlot() {
        return lastProcessedSlot.get();
    }

    /**
     * Get the number of slots processed since start.
     */
    public Long getSlotsProcessed() {
        long last = lastProcessedSlot.get();
        return last > startSlot ? last - startSlot : 0;
    }
}
