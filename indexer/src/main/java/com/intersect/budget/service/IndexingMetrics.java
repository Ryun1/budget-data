package com.intersect.budget.service;

import lombok.Data;
import org.springframework.stereotype.Service;

import java.util.concurrent.atomic.AtomicLong;

/**
 * Service to track indexing metrics.
 * Provides statistics about the indexing process.
 */
@Service
@Data
public class IndexingMetrics {
    private final AtomicLong transactionsProcessed = new AtomicLong(0);
    private final AtomicLong projectsCreated = new AtomicLong(0);
    private final AtomicLong milestonesCreated = new AtomicLong(0);
    private final AtomicLong vendorContractsDiscovered = new AtomicLong(0);
    private final AtomicLong errorsEncountered = new AtomicLong(0);

    public void incrementTransactionsProcessed() {
        transactionsProcessed.incrementAndGet();
    }

    public void incrementProjectsCreated() {
        projectsCreated.incrementAndGet();
    }

    public void incrementMilestonesCreated() {
        milestonesCreated.incrementAndGet();
    }

    public void incrementVendorContractsDiscovered() {
        vendorContractsDiscovered.incrementAndGet();
    }

    public void incrementErrors() {
        errorsEncountered.incrementAndGet();
    }

    public long getTransactionsProcessed() {
        return transactionsProcessed.get();
    }

    public long getProjectsCreated() {
        return projectsCreated.get();
    }

    public long getMilestonesCreated() {
        return milestonesCreated.get();
    }

    public long getVendorContractsDiscovered() {
        return vendorContractsDiscovered.get();
    }

    public long getErrorsEncountered() {
        return errorsEncountered.get();
    }
}
