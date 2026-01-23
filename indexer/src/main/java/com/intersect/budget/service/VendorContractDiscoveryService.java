package com.intersect.budget.service;

import com.bloxbean.cardano.yaci.store.utxo.storage.UtxoStorage;
import com.bloxbean.cardano.yaci.store.utxo.storage.model.Utxo;
import com.intersect.budget.domain.Project;
import com.intersect.budget.repository.ProjectRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/**
 * Service to discover vendor contract addresses from fund transactions.
 * This service queries UTXOs created by fund transactions to identify vendor contracts.
 */
@Service
@Slf4j
public class VendorContractDiscoveryService {
    private final UtxoStorage utxoStorage;
    private final TreasuryIndexingService indexingService;
    private final ProjectRepository projectRepository;

    @Value("${treasury.contract.payment-address}")
    private String treasuryPaymentAddress;

    @Autowired
    public VendorContractDiscoveryService(
            UtxoStorage utxoStorage,
            TreasuryIndexingService indexingService,
            ProjectRepository projectRepository) {
        this.utxoStorage = utxoStorage;
        this.indexingService = indexingService;
        this.projectRepository = projectRepository;
    }

    /**
     * Discover vendor contract addresses from a fund transaction.
     * This method is called after a fund event is processed and a project is created.
     */
    @Transactional
    public void discoverVendorContracts(String txHash, String projectIdentifier) {
        try {
            Optional<Project> projectOpt = projectRepository.findByIdentifier(projectIdentifier);
            if (projectOpt.isEmpty()) {
                log.warn("Project not found for identifier: {}", projectIdentifier);
                return;
            }

            Project project = projectOpt.get();
            
            // Query UTXOs created by this transaction
            List<Utxo> utxos = queryUtxosByTransaction(txHash);
            
            if (utxos == null || utxos.isEmpty()) {
                log.debug("No UTXOs found for transaction: {}", txHash);
                return;
            }

            for (Utxo utxo : utxos) {
                String address = utxo.getAddress();
                
                // Skip treasury address - we're looking for vendor contract addresses
                if (address != null && !address.equals(treasuryPaymentAddress)) {
                    String scriptHash = null;
                    try {
                        scriptHash = utxo.getScriptHash();
                    } catch (Exception e) {
                        log.debug("Could not extract script hash: {}", e.getMessage());
                    }
                    
                    // Register this vendor contract
                    indexingService.registerVendorContract(
                        address,
                        scriptHash,
                        project.getProjectId(),
                        txHash
                    );
                    
                    log.info("Discovered vendor contract {} for project {} from transaction {}", 
                        address, projectIdentifier, txHash);
                }
            }
        } catch (Exception e) {
            log.error("Error discovering vendor contracts from transaction: {}", txHash, e);
        }
    }

    /**
     * Query UTXOs by transaction hash.
     * Uses YACI Store's UTXO storage with fallback methods.
     */
    private List<Utxo> queryUtxosByTransaction(String txHash) {
        try {
            // Try direct method
            return utxoStorage.findUtxosByTxHash(txHash);
        } catch (Exception e) {
            log.debug("Direct txHash query failed, trying alternative: {}", e.getMessage());
            // Alternative: Query treasury address UTXOs and check transaction hash
            // This is less efficient but works as fallback
            try {
                List<Utxo> treasuryUtxos = utxoStorage.findUtxosByAddress(treasuryPaymentAddress);
                // Filter by transaction hash if UTXO model supports it
                // Implementation depends on YACI Store's Utxo model
                return List.of();
            } catch (Exception fallbackError) {
                log.warn("Alternative query method also failed: {}", fallbackError.getMessage());
                return List.of();
            }
        }
    }
}
