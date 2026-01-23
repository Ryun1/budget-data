package com.intersect.budget.listener;

import com.bloxbean.cardano.yaci.store.events.EventMetadata;
import com.bloxbean.cardano.yaci.store.metadata.event.MetadataEvent;
import com.bloxbean.cardano.yaci.store.transaction.events.TransactionEvent;
import com.bloxbean.cardano.yaci.store.utxo.events.UtxoEvent;
import com.intersect.budget.service.TreasuryIndexingService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

@Component
@Slf4j
public class TreasuryContractListener {
    private final TreasuryIndexingService indexingService;

    @Value("${treasury.contract.payment-address}")
    private String treasuryPaymentAddress;

    @Value("${treasury.contract.script-hash}")
    private String treasuryScriptHash;

    @Autowired
    public TreasuryContractListener(TreasuryIndexingService indexingService) {
        this.indexingService = indexingService;
    }

    @EventListener
    @Async
    public void handleTransactionEvent(TransactionEvent transactionEvent) {
        try {
            String txHash = transactionEvent.getTxHash();
            Long slot = transactionEvent.getSlot();
            Long blockHeight = transactionEvent.getBlockHeight();

            // Check if this transaction involves tracked addresses
            // We'll process metadata events separately, but we can check UTXOs here
            log.debug("Received transaction event: {} at slot {}", txHash, slot);
        } catch (Exception e) {
            log.error("Error handling transaction event", e);
        }
    }

    @EventListener
    @Async
    public void handleUtxoEvent(UtxoEvent utxoEvent) {
        try {
            // Check if UTXO involves treasury or vendor contract addresses
            utxoEvent.getUtxoUpdates().forEach(utxoUpdate -> {
                String address = utxoUpdate.getAddress();
                
                if (indexingService.isTrackedAddress(address)) {
                    log.debug("UTXO update for tracked address: {}", address);
                    // Extract vendor contract address from fund event outputs
                    // This would require checking the transaction outputs
                }
            });
        } catch (Exception e) {
            log.error("Error handling UTXO event", e);
        }
    }

    @EventListener
    @Async
    public void handleMetadataEvent(MetadataEvent metadataEvent) {
        try {
            String txHash = metadataEvent.getTxHash();
            Long slot = metadataEvent.getSlot();
            Map<String, Object> metadata = metadataEvent.getMetadata();

            if (metadata == null || metadata.isEmpty()) {
                return;
            }

            // Check if metadata contains key 1694 (TOM metadata)
            if (!metadata.containsKey("1694")) {
                return;
            }

            log.debug("Processing metadata event for transaction: {}", txHash);

            // Process the transaction with metadata
            indexingService.processTransaction(txHash, slot, null, metadata);

        } catch (Exception e) {
            log.error("Error handling metadata event", e);
        }
    }
}
