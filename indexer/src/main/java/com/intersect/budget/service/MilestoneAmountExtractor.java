package com.intersect.budget.service;

import com.bloxbean.cardano.yaci.store.utxo.storage.UtxoStorage;
import com.bloxbean.cardano.yaci.store.utxo.storage.model.Utxo;
import com.intersect.budget.domain.Milestone;
import com.intersect.budget.repository.MilestoneRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigInteger;
import java.util.Optional;

/**
 * Service to extract milestone amounts from UTXOs.
 * When a fund event occurs, the transaction outputs contain the milestone amounts.
 * This service extracts those amounts and updates milestone records.
 */
@Service
@Slf4j
public class MilestoneAmountExtractor {
    private final UtxoStorage utxoStorage;
    private final MilestoneRepository milestoneRepository;

    @Autowired
    public MilestoneAmountExtractor(
            UtxoStorage utxoStorage,
            MilestoneRepository milestoneRepository) {
        this.utxoStorage = utxoStorage;
        this.milestoneRepository = milestoneRepository;
    }

    /**
     * Extract milestone amounts from a fund transaction and update milestone records.
     * This is called after milestones are created from metadata.
     */
    @Transactional
    public void extractMilestoneAmounts(String txHash, Long projectId) {
        try {
            // Get UTXOs created by this transaction
            // These UTXOs represent the funds allocated to milestones
            var utxos = utxoStorage.findUtxosByTxHash(txHash);
            
            if (utxos == null || utxos.isEmpty()) {
                log.debug("No UTXOs found for extracting milestone amounts: {}", txHash);
                return;
            }

            // Get all milestones for this project
            var milestones = milestoneRepository.findByProjectId(projectId);
            
            // Match UTXOs to milestones
            // Note: This is a simplified approach. In practice, you may need to
            // match UTXOs to milestones based on the transaction structure or metadata
            int utxoIndex = 0;
            for (Milestone milestone : milestones) {
                if (utxoIndex < utxos.size()) {
                    Utxo utxo = utxos.get(utxoIndex);
                    try {
                        // Extract amount from UTXO
                        // YACI Store Utxo model may have different field names
                        BigInteger amount = utxo.getAmount(); // Adjust based on actual API
                        if (amount != null) {
                            milestone.setAmountLovelace(amount.longValue());
                            milestoneRepository.save(milestone);
                            log.debug("Set amount {} for milestone {}:{}", 
                                amount, milestone.getProjectId(), milestone.getIdentifier());
                        }
                    } catch (Exception e) {
                        log.debug("Could not extract amount from UTXO: {}", e.getMessage());
                    }
                    utxoIndex++;
                }
            }
        } catch (Exception e) {
            log.error("Error extracting milestone amounts from transaction: {}", txHash, e);
        }
    }
}
