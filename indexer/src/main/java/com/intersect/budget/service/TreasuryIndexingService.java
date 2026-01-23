package com.intersect.budget.service;

import com.intersect.budget.domain.*;
import com.intersect.budget.repository.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
@Slf4j
public class TreasuryIndexingService {
    private final TreasuryInstanceRepository treasuryInstanceRepository;
    private final VendorContractRepository vendorContractRepository;
    private final ProjectRepository projectRepository;
    private final MilestoneRepository milestoneRepository;
    private final TreasuryTransactionRepository transactionRepository;
    private final TreasuryEventRepository eventRepository;
    private final MetadataParserService metadataParserService;
    private final ObjectMapper objectMapper;

    @Value("${treasury.contract.payment-address}")
    private String treasuryPaymentAddress;

    @Value("${treasury.contract.script-hash}")
    private String treasuryScriptHash;

    // Track vendor contract addresses dynamically
    private final Set<String> trackedAddresses = ConcurrentHashMap.newKeySet();
    private final Set<String> trackedScriptHashes = ConcurrentHashMap.newKeySet();

    @Autowired
    public TreasuryIndexingService(
            TreasuryInstanceRepository treasuryInstanceRepository,
            VendorContractRepository vendorContractRepository,
            ProjectRepository projectRepository,
            MilestoneRepository milestoneRepository,
            TreasuryTransactionRepository transactionRepository,
            TreasuryEventRepository eventRepository,
            MetadataParserService metadataParserService,
            ObjectMapper objectMapper) {
        this.treasuryInstanceRepository = treasuryInstanceRepository;
        this.vendorContractRepository = vendorContractRepository;
        this.projectRepository = projectRepository;
        this.milestoneRepository = milestoneRepository;
        this.transactionRepository = transactionRepository;
        this.eventRepository = eventRepository;
        this.metadataParserService = metadataParserService;
        this.objectMapper = objectMapper;

        // Initialize with treasury contract address
        trackedAddresses.add(treasuryPaymentAddress);
        trackedScriptHashes.add(treasuryScriptHash);
    }

    @Transactional
    public Long processTransaction(String txHash, Long slot, Long blockHeight, Map<String, Object> metadata) {
        try {
            // Parse metadata
            MetadataParserService.ParsedMetadata parsedMetadata = metadataParserService.parseMetadata(metadata);
            if (parsedMetadata == null || parsedMetadata.getEvent() == null) {
                return null; // Not a treasury-related transaction
            }

            String eventType = parsedMetadata.getEvent();
            log.debug("Processing transaction {} with event type: {}", txHash, eventType);

            // Check if transaction already processed
            Optional<TreasuryTransaction> existingTx = transactionRepository.findByTxHash(txHash);
            if (existingTx.isPresent()) {
                log.debug("Transaction {} already processed", txHash);
                return existingTx.get().getProjectId();
            }

            // Get or create treasury instance
            TreasuryInstance instance = getOrCreateTreasuryInstance(parsedMetadata);

            // Create transaction record
            TreasuryTransaction tx = new TreasuryTransaction();
            tx.setTxHash(txHash);
            tx.setSlot(slot);
            tx.setBlockHeight(blockHeight);
            tx.setEventType(eventType);
            tx.setInstanceId(instance.getInstanceId());
            tx.setTxAuthor(parsedMetadata.getTxAuthor());
            
            try {
                tx.setMetadata(objectMapper.writeValueAsString(metadata));
            } catch (Exception e) {
                log.warn("Failed to serialize metadata", e);
            }

            tx = transactionRepository.save(tx);

            // Process event-specific logic
            switch (eventType) {
                case "publish":
                    handlePublishEvent(tx, parsedMetadata, instance);
                    break;
                case "fund":
                    handleFundEvent(tx, parsedMetadata, instance);
                    break;
                case "disburse":
                    handleDisburseEvent(tx, parsedMetadata);
                    break;
                case "complete":
                    handleCompleteEvent(tx, parsedMetadata);
                    break;
                case "withdraw":
                    handleWithdrawEvent(tx, parsedMetadata);
                    break;
                case "pause":
                    handlePauseEvent(tx, parsedMetadata);
                    break;
                case "resume":
                    handleResumeEvent(tx, parsedMetadata);
                    break;
                case "modify":
                    handleModifyEvent(tx, parsedMetadata);
                    break;
                case "cancel":
                    handleCancelEvent(tx, parsedMetadata);
                    break;
                case "sweep":
                    handleSweepEvent(tx, parsedMetadata);
                    break;
            }

            // Create event record
            TreasuryEvent event = new TreasuryEvent();
            event.setTxId(tx.getTxId());
            event.setEventType(eventType);
            try {
                event.setEventData(objectMapper.writeValueAsString(parsedMetadata));
            } catch (Exception e) {
                log.warn("Failed to serialize event data", e);
            }
            eventRepository.save(event);

            return tx.getProjectId();

        } catch (Exception e) {
            log.error("Error processing transaction: {}", txHash, e);
            return null;
        }
    }

    private TreasuryInstance getOrCreateTreasuryInstance(MetadataParserService.ParsedMetadata metadata) {
        Optional<TreasuryInstance> existing = treasuryInstanceRepository.findByScriptHash(treasuryScriptHash);
        if (existing.isPresent()) {
            return existing.get();
        }

        TreasuryInstance instance = new TreasuryInstance();
        instance.setScriptHash(treasuryScriptHash);
        instance.setPaymentAddress(treasuryPaymentAddress);
        instance.setLabel(metadata.getLabel());
        instance.setDescription(metadata.getDescription());
        instance.setExpiration(metadata.getExpiration());
        instance.setPermissions(metadata.getPermissions());
        return treasuryInstanceRepository.save(instance);
    }

    private void handlePublishEvent(TreasuryTransaction tx, MetadataParserService.ParsedMetadata metadata, TreasuryInstance instance) {
        // Update treasury instance with publish event data
        if (metadata.getLabel() != null) instance.setLabel(metadata.getLabel());
        if (metadata.getDescription() != null) instance.setDescription(metadata.getDescription());
        if (metadata.getExpiration() != null) instance.setExpiration(metadata.getExpiration());
        if (metadata.getPermissions() != null) instance.setPermissions(metadata.getPermissions());
        treasuryInstanceRepository.save(instance);
    }

    private void handleFundEvent(TreasuryTransaction tx, MetadataParserService.ParsedMetadata metadata, TreasuryInstance instance) {
        // Create or update project
        Project project = projectRepository.findByIdentifier(metadata.getIdentifier())
                .orElse(new Project());

        project.setIdentifier(metadata.getIdentifier());
        project.setLabel(metadata.getLabel());
        project.setDescription(metadata.getDescription());
        project.setVendorLabel(metadata.getVendorLabel());
        project.setVendorDetails(metadata.getVendorDetails());
        project.setContractUrl(metadata.getContractUrl());
        project.setContractHash(metadata.getContractHash());
        project.setTreasuryInstanceId(instance.getInstanceId());

        try {
            if (metadata.getOtherIdentifiers() != null) {
                project.setOtherIdentifiers(objectMapper.writeValueAsString(metadata.getOtherIdentifiers()));
            }
        } catch (Exception e) {
            log.warn("Failed to serialize other identifiers", e);
        }

        project = projectRepository.save(project);
        tx.setProjectId(project.getProjectId());
        transactionRepository.save(tx);

        // Create milestones
        if (metadata.getMilestones() != null) {
            metadata.getMilestones().forEach((milestoneId, milestoneData) -> {
                Milestone milestone = milestoneRepository
                        .findByProjectIdAndIdentifier(project.getProjectId(), milestoneId)
                        .orElse(new Milestone());

                milestone.setProjectId(project.getProjectId());
                milestone.setIdentifier(milestoneId);
                milestone.setLabel((String) milestoneData.get("label"));
                milestone.setDescription((String) milestoneData.get("description"));
                milestone.setAcceptanceCriteria((String) milestoneData.get("acceptanceCriteria"));
                milestone.setStatus(Milestone.MilestoneStatus.PENDING);

                milestoneRepository.save(milestone);
            });
        }

        // Vendor contract extraction is handled in the listener after transaction is processed
        // This allows us to access UTXO data from YACI Store
    }

    private void handleDisburseEvent(TreasuryTransaction tx, MetadataParserService.ParsedMetadata metadata) {
        // Store disburse event details
    }

    private void handleCompleteEvent(TreasuryTransaction tx, MetadataParserService.ParsedMetadata metadata) {
        // Update milestone status to completed
        if (metadata.getMilestones() != null && tx.getProjectId() != null) {
            metadata.getMilestones().forEach((milestoneId, milestoneData) -> {
                Optional<Milestone> milestoneOpt = milestoneRepository
                        .findByProjectIdAndIdentifier(tx.getProjectId(), milestoneId);
                if (milestoneOpt.isPresent()) {
                    Milestone milestone = milestoneOpt.get();
                    milestone.setStatus(Milestone.MilestoneStatus.COMPLETED);
                    milestone.setCompletedAt(java.time.LocalDateTime.now());
                    milestoneRepository.save(milestone);
                }
            });
        }
    }

    private void handleWithdrawEvent(TreasuryTransaction tx, MetadataParserService.ParsedMetadata metadata) {
        // Update milestone status to withdrawn
        if (metadata.getMilestones() != null && tx.getProjectId() != null) {
            metadata.getMilestones().forEach((milestoneId, milestoneData) -> {
                Optional<Milestone> milestoneOpt = milestoneRepository
                        .findByProjectIdAndIdentifier(tx.getProjectId(), milestoneId);
                if (milestoneOpt.isPresent()) {
                    Milestone milestone = milestoneOpt.get();
                    milestone.setStatus(Milestone.MilestoneStatus.WITHDRAWN);
                    milestoneRepository.save(milestone);
                }
            });
        }
    }

    private void handlePauseEvent(TreasuryTransaction tx, MetadataParserService.ParsedMetadata metadata) {
        // Update milestone status to paused
        if (metadata.getMilestones() != null && tx.getProjectId() != null) {
            metadata.getMilestones().forEach((milestoneId, milestoneData) -> {
                Optional<Milestone> milestoneOpt = milestoneRepository
                        .findByProjectIdAndIdentifier(tx.getProjectId(), milestoneId);
                if (milestoneOpt.isPresent()) {
                    Milestone milestone = milestoneOpt.get();
                    milestone.setStatus(Milestone.MilestoneStatus.PAUSED);
                    milestone.setPausedAt(java.time.LocalDateTime.now());
                    milestone.setPausedReason((String) milestoneData.get("reason"));
                    milestoneRepository.save(milestone);
                }
            });
        }
    }

    private void handleResumeEvent(TreasuryTransaction tx, MetadataParserService.ParsedMetadata metadata) {
        // Update milestone status back to pending/completed
        if (metadata.getMilestones() != null && tx.getProjectId() != null) {
            metadata.getMilestones().forEach((milestoneId, milestoneData) -> {
                Optional<Milestone> milestoneOpt = milestoneRepository
                        .findByProjectIdAndIdentifier(tx.getProjectId(), milestoneId);
                if (milestoneOpt.isPresent()) {
                    Milestone milestone = milestoneOpt.get();
                    // Resume to previous status or pending
                    if (milestone.getCompletedAt() != null) {
                        milestone.setStatus(Milestone.MilestoneStatus.COMPLETED);
                    } else {
                        milestone.setStatus(Milestone.MilestoneStatus.PENDING);
                    }
                    milestone.setPausedAt(null);
                    milestone.setPausedReason(null);
                    milestoneRepository.save(milestone);
                }
            });
        }
    }

    private void handleModifyEvent(TreasuryTransaction tx, MetadataParserService.ParsedMetadata metadata) {
        // Similar to fund event - update project and milestones
        if (metadata.getIdentifier() != null && tx.getProjectId() != null) {
            Optional<Project> projectOpt = projectRepository.findById(tx.getProjectId());
            if (projectOpt.isPresent()) {
                Project project = projectOpt.get();
                if (metadata.getLabel() != null) project.setLabel(metadata.getLabel());
                if (metadata.getDescription() != null) project.setDescription(metadata.getDescription());
                projectRepository.save(project);
            }
        }
    }

    private void handleCancelEvent(TreasuryTransaction tx, MetadataParserService.ParsedMetadata metadata) {
        // Mark project as cancelled (could add a status field to Project)
    }

    private void handleSweepEvent(TreasuryTransaction tx, MetadataParserService.ParsedMetadata metadata) {
        // Store sweep event details
    }

    public void registerVendorContract(String paymentAddress, String scriptHash, Long projectId, String txHash) {
        if (vendorContractRepository.existsByPaymentAddress(paymentAddress)) {
            return;
        }

        VendorContract contract = new VendorContract();
        contract.setPaymentAddress(paymentAddress);
        contract.setScriptHash(scriptHash);
        contract.setProjectId(projectId);
        contract.setDiscoveredFromTxHash(txHash);
        vendorContractRepository.save(contract);

        trackedAddresses.add(paymentAddress);
        if (scriptHash != null) {
            trackedScriptHashes.add(scriptHash);
        }

        log.info("Registered new vendor contract: {} for project {}", paymentAddress, projectId);
    }

    public boolean isTrackedAddress(String address) {
        return trackedAddresses.contains(address);
    }

    public boolean isTrackedScriptHash(String scriptHash) {
        return trackedScriptHashes.contains(scriptHash);
    }
}
