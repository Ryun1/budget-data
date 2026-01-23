package com.intersect.budget.service;

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
 * Service to extract vendor contract addresses from transaction outputs.
 * When a "fund" event occurs, the treasury contract sends funds to a vendor contract.
 * This service identifies the vendor contract address from the transaction outputs.
 */
@Service
@Slf4j
public class VendorContractExtractionService {
    private final UtxoQueryService utxoQueryService;
    private final TreasuryIndexingService indexingService;
    private final ProjectRepository projectRepository;

    @Value("${treasury.contract.payment-address}")
    private String treasuryPaymentAddress;

    @Autowired
    public VendorContractExtractionService(
            UtxoQueryService utxoQueryService,
            TreasuryIndexingService indexingService,
            ProjectRepository projectRepository) {
        this.utxoQueryService = utxoQueryService;
        this.indexingService = indexingService;
        this.projectRepository = projectRepository;
    }

    @Transactional
    public void extractAndRegisterVendorContracts(String txHash, String projectIdentifier) {
        try {
            Optional<Project> projectOpt = projectRepository.findByIdentifier(projectIdentifier);
            if (projectOpt.isEmpty()) {
                log.warn("Project not found for identifier: {}", projectIdentifier);
                return;
            }

            Project project = projectOpt.get();
            List<Utxo> utxos = utxoQueryService.findUtxosByTxHash(txHash);

            if (utxos == null || utxos.isEmpty()) {
                log.debug("No UTXOs found for transaction: {}", txHash);
                return;
            }

            for (Utxo utxo : utxos) {
                String address = utxo.getAddress();
                
                // Skip treasury address - we're looking for vendor contract addresses
                if (address != null && !address.equals(treasuryPaymentAddress)) {
                    String scriptHash = utxo.getScriptHash();
                    
                    // Register this vendor contract
                    indexingService.registerVendorContract(
                        address,
                        scriptHash,
                        project.getProjectId(),
                        txHash
                    );
                    
                    log.info("Registered vendor contract {} for project {} from transaction {}", 
                        address, projectIdentifier, txHash);
                }
            }
        } catch (Exception e) {
            log.error("Error extracting vendor contracts from transaction: {}", txHash, e);
        }
    }
}
