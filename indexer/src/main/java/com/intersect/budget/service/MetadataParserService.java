package com.intersect.budget.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class MetadataParserService {
    private final ObjectMapper objectMapper;
    private final AnchorMetadataFetcher anchorMetadataFetcher;

    private static final String METADATA_KEY = "1694";
    private static final String TOM_CONTEXT_URL = "https://raw.githubusercontent.com/SundaeSwap-finance/treasury-contracts/refs/heads/main/offchain/src/metadata/context.jsonld";

    @Autowired
    public MetadataParserService(ObjectMapper objectMapper, AnchorMetadataFetcher anchorMetadataFetcher) {
        this.objectMapper = objectMapper;
        this.anchorMetadataFetcher = anchorMetadataFetcher;
    }

    public ParsedMetadata parseMetadata(Map<String, Object> metadataMap) {
        if (metadataMap == null || metadataMap.isEmpty()) {
            return null;
        }

        Object metadataValue = metadataMap.get(METADATA_KEY);
        if (metadataValue == null) {
            return null;
        }

        try {
            JsonNode metadataNode;
            
            // Handle different metadata formats
            if (metadataValue instanceof String) {
                metadataNode = objectMapper.readTree((String) metadataValue);
            } else if (metadataValue instanceof Map) {
                metadataNode = objectMapper.valueToTree(metadataValue);
            } else {
                metadataNode = objectMapper.valueToTree(metadataValue);
            }

            // Check if it's a remote anchor reference
            if (metadataNode.has("anchorUrl")) {
                String anchorUrl = metadataNode.get("anchorUrl").asText();
                String anchorHash = metadataNode.has("anchorDataHash") 
                    ? metadataNode.get("anchorDataHash").asText() 
                    : null;
                
                JsonNode remoteMetadata = anchorMetadataFetcher.fetchAndVerifyMetadata(anchorUrl, anchorHash);
                if (remoteMetadata != null) {
                    metadataNode = remoteMetadata;
                } else {
                    log.warn("Failed to fetch remote metadata from: {}", anchorUrl);
                    return null;
                }
            }

            return parseTomMetadata(metadataNode);
        } catch (Exception e) {
            log.error("Error parsing metadata", e);
            return null;
        }
    }

    private ParsedMetadata parseTomMetadata(JsonNode metadataNode) {
        ParsedMetadata parsed = new ParsedMetadata();
        
        // Extract context and hash algorithm
        if (metadataNode.has("@context")) {
            parsed.setContext(metadataNode.get("@context").asText());
        }
        if (metadataNode.has("hashAlgorithm")) {
            parsed.setHashAlgorithm(metadataNode.get("hashAlgorithm").asText());
        }
        if (metadataNode.has("txAuthor")) {
            parsed.setTxAuthor(metadataNode.get("txAuthor").asText());
        }
        if (metadataNode.has("instance")) {
            parsed.setInstance(metadataNode.get("instance").asText());
        }

        // Parse body
        JsonNode body = metadataNode.get("body");
        if (body == null) {
            return parsed;
        }

        if (body.has("event")) {
            parsed.setEvent(body.get("event").asText());
        }

        // Parse event-specific fields
        parseEventSpecificFields(body, parsed);

        return parsed;
    }

    private void parseEventSpecificFields(JsonNode body, ParsedMetadata parsed) {
        String event = parsed.getEvent();
        if (event == null) {
            return;
        }

        switch (event) {
            case "publish":
                parsePublishEvent(body, parsed);
                break;
            case "initialize":
            case "reorganize":
                parseReorganizeEvent(body, parsed);
                break;
            case "fund":
                parseFundEvent(body, parsed);
                break;
            case "disburse":
                parseDisburseEvent(body, parsed);
                break;
            case "complete":
                parseCompleteEvent(body, parsed);
                break;
            case "withdraw":
                parseWithdrawEvent(body, parsed);
                break;
            case "pause":
                parsePauseEvent(body, parsed);
                break;
            case "resume":
                parseResumeEvent(body, parsed);
                break;
            case "modify":
            case "cancel":
                parseModifyEvent(body, parsed);
                break;
            case "sweep":
                parseSweepEvent(body, parsed);
                break;
            default:
                log.warn("Unknown event type: {}", event);
        }
    }

    private void parsePublishEvent(JsonNode body, ParsedMetadata parsed) {
        if (body.has("label")) parsed.setLabel(body.get("label").asText());
        if (body.has("description")) parsed.setDescription(body.get("description").asText());
        if (body.has("expiration")) parsed.setExpiration(body.get("expiration").asLong());
        if (body.has("payoutUpperbound")) parsed.setPayoutUpperbound(body.get("payoutUpperbound").asLong());
        if (body.has("vendorExpiration")) parsed.setVendorExpiration(body.get("vendorExpiration").asLong());
        if (body.has("permissions")) {
            parsed.setPermissions(body.get("permissions").toString());
        }
    }

    private void parseReorganizeEvent(JsonNode body, ParsedMetadata parsed) {
        if (body.has("reason")) parsed.setReason(body.get("reason").asText());
        if (body.has("outputs")) {
            Map<String, Object> outputs = new HashMap<>();
            body.get("outputs").fields().forEachRemaining(entry -> {
                outputs.put(entry.getKey(), objectMapper.valueToTree(entry.getValue()));
            });
            parsed.setOutputs(outputs);
        }
    }

    private void parseFundEvent(JsonNode body, ParsedMetadata parsed) {
        if (body.has("identifier")) parsed.setIdentifier(body.get("identifier").asText());
        if (body.has("otherIdentifiers")) {
            List<String> otherIds = new ArrayList<>();
            body.get("otherIdentifiers").forEach(node -> otherIds.add(node.asText()));
            parsed.setOtherIdentifiers(otherIds);
        }
        if (body.has("label")) parsed.setLabel(body.get("label").asText());
        if (body.has("description")) parsed.setDescription(body.get("description").asText());
        
        if (body.has("vendor")) {
            JsonNode vendor = body.get("vendor");
            if (vendor.has("label")) parsed.setVendorLabel(vendor.get("label").asText());
            if (vendor.has("details")) {
                parsed.setVendorDetails(vendor.get("details").toString());
            }
        }
        
        if (body.has("contract")) {
            JsonNode contract = body.get("contract");
            if (contract.has("anchorUrl")) parsed.setContractUrl(contract.get("anchorUrl").asText());
            if (contract.has("anchorDataHash")) parsed.setContractHash(contract.get("anchorDataHash").asText());
        }
        
        if (body.has("milestones")) {
            Map<String, Map<String, Object>> milestones = new HashMap<>();
            body.get("milestones").fields().forEachRemaining(entry -> {
                JsonNode milestone = entry.getValue();
                Map<String, Object> milestoneData = new HashMap<>();
                if (milestone.has("identifier")) milestoneData.put("identifier", milestone.get("identifier").asText());
                if (milestone.has("label")) milestoneData.put("label", milestone.get("label").asText());
                if (milestone.has("description")) milestoneData.put("description", milestone.get("description").asText());
                if (milestone.has("acceptanceCriteria")) milestoneData.put("acceptanceCriteria", milestone.get("acceptanceCriteria").asText());
                milestones.put(entry.getKey(), milestoneData);
            });
            parsed.setMilestones(milestones);
        }
    }

    private void parseDisburseEvent(JsonNode body, ParsedMetadata parsed) {
        if (body.has("label")) parsed.setLabel(body.get("label").asText());
        if (body.has("description")) parsed.setDescription(body.get("description").asText());
        if (body.has("justification")) parsed.setJustification(body.get("justification").asText());
        if (body.has("estimatedReturn")) parsed.setEstimatedReturn(body.get("estimatedReturn").asLong());
    }

    private void parseCompleteEvent(JsonNode body, ParsedMetadata parsed) {
        if (body.has("milestones")) {
            Map<String, Map<String, Object>> milestones = new HashMap<>();
            body.get("milestones").fields().forEachRemaining(entry -> {
                JsonNode milestone = entry.getValue();
                Map<String, Object> milestoneData = new HashMap<>();
                if (milestone.has("description")) milestoneData.put("description", milestone.get("description").asText());
                if (milestone.has("evidence")) {
                    List<Map<String, String>> evidence = new ArrayList<>();
                    milestone.get("evidence").forEach(ev -> {
                        Map<String, String> evData = new HashMap<>();
                        if (ev.has("label")) evData.put("label", ev.get("label").asText());
                        if (ev.has("anchorUrl")) evData.put("anchorUrl", ev.get("anchorUrl").asText());
                        if (ev.has("anchorDataHash")) evData.put("anchorDataHash", ev.get("anchorDataHash").asText());
                        evidence.add(evData);
                    });
                    milestoneData.put("evidence", evidence);
                }
                milestones.put(entry.getKey(), milestoneData);
            });
            parsed.setMilestones(milestones);
        }
    }

    private void parseWithdrawEvent(JsonNode body, ParsedMetadata parsed) {
        if (body.has("milestones")) {
            Map<String, Map<String, Object>> milestones = new HashMap<>();
            body.get("milestones").fields().forEachRemaining(entry -> {
                JsonNode milestone = entry.getValue();
                Map<String, Object> milestoneData = new HashMap<>();
                if (milestone.has("comment")) milestoneData.put("comment", milestone.get("comment").asText());
                milestones.put(entry.getKey(), milestoneData);
            });
            parsed.setMilestones(milestones);
        }
    }

    private void parsePauseEvent(JsonNode body, ParsedMetadata parsed) {
        if (body.has("milestones")) {
            Map<String, Map<String, Object>> milestones = new HashMap<>();
            body.get("milestones").fields().forEachRemaining(entry -> {
                JsonNode milestone = entry.getValue();
                Map<String, Object> milestoneData = new HashMap<>();
                if (milestone.has("reason")) milestoneData.put("reason", milestone.get("reason").asText());
                if (milestone.has("resolution")) milestoneData.put("resolution", milestone.get("resolution").asText());
                milestones.put(entry.getKey(), milestoneData);
            });
            parsed.setMilestones(milestones);
        }
    }

    private void parseResumeEvent(JsonNode body, ParsedMetadata parsed) {
        if (body.has("milestones")) {
            Map<String, Map<String, Object>> milestones = new HashMap<>();
            body.get("milestones").fields().forEachRemaining(entry -> {
                JsonNode milestone = entry.getValue();
                Map<String, Object> milestoneData = new HashMap<>();
                if (milestone.has("reason")) milestoneData.put("reason", milestone.get("reason").asText());
                milestones.put(entry.getKey(), milestoneData);
            });
            parsed.setMilestones(milestones);
        }
    }

    private void parseModifyEvent(JsonNode body, ParsedMetadata parsed) {
        parseFundEvent(body, parsed); // Similar structure to fund event
        if (body.has("reason")) parsed.setReason(body.get("reason").asText());
    }

    private void parseSweepEvent(JsonNode body, ParsedMetadata parsed) {
        if (body.has("comment")) parsed.setComment(body.get("comment").asText());
    }

    // Inner class to hold parsed metadata
    public static class ParsedMetadata {
        private String context;
        private String hashAlgorithm;
        private String txAuthor;
        private String instance;
        private String event;
        private String identifier;
        private List<String> otherIdentifiers;
        private String label;
        private String description;
        private String reason;
        private String comment;
        private String justification;
        private Long expiration;
        private Long payoutUpperbound;
        private Long vendorExpiration;
        private Long estimatedReturn;
        private String permissions;
        private String vendorLabel;
        private String vendorDetails;
        private String contractUrl;
        private String contractHash;
        private Map<String, Map<String, Object>> milestones;
        private Map<String, Object> outputs;

        // Getters and setters
        public String getContext() { return context; }
        public void setContext(String context) { this.context = context; }
        public String getHashAlgorithm() { return hashAlgorithm; }
        public void setHashAlgorithm(String hashAlgorithm) { this.hashAlgorithm = hashAlgorithm; }
        public String getTxAuthor() { return txAuthor; }
        public void setTxAuthor(String txAuthor) { this.txAuthor = txAuthor; }
        public String getInstance() { return instance; }
        public void setInstance(String instance) { this.instance = instance; }
        public String getEvent() { return event; }
        public void setEvent(String event) { this.event = event; }
        public String getIdentifier() { return identifier; }
        public void setIdentifier(String identifier) { this.identifier = identifier; }
        public List<String> getOtherIdentifiers() { return otherIdentifiers; }
        public void setOtherIdentifiers(List<String> otherIdentifiers) { this.otherIdentifiers = otherIdentifiers; }
        public String getLabel() { return label; }
        public void setLabel(String label) { this.label = label; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        public String getReason() { return reason; }
        public void setReason(String reason) { this.reason = reason; }
        public String getComment() { return comment; }
        public void setComment(String comment) { this.comment = comment; }
        public String getJustification() { return justification; }
        public void setJustification(String justification) { this.justification = justification; }
        public Long getExpiration() { return expiration; }
        public void setExpiration(Long expiration) { this.expiration = expiration; }
        public Long getPayoutUpperbound() { return payoutUpperbound; }
        public void setPayoutUpperbound(Long payoutUpperbound) { this.payoutUpperbound = payoutUpperbound; }
        public Long getVendorExpiration() { return vendorExpiration; }
        public void setVendorExpiration(Long vendorExpiration) { this.vendorExpiration = vendorExpiration; }
        public Long getEstimatedReturn() { return estimatedReturn; }
        public void setEstimatedReturn(Long estimatedReturn) { this.estimatedReturn = estimatedReturn; }
        public String getPermissions() { return permissions; }
        public void setPermissions(String permissions) { this.permissions = permissions; }
        public String getVendorLabel() { return vendorLabel; }
        public void setVendorLabel(String vendorLabel) { this.vendorLabel = vendorLabel; }
        public String getVendorDetails() { return vendorDetails; }
        public void setVendorDetails(String vendorDetails) { this.vendorDetails = vendorDetails; }
        public String getContractUrl() { return contractUrl; }
        public void setContractUrl(String contractUrl) { this.contractUrl = contractUrl; }
        public String getContractHash() { return contractHash; }
        public void setContractHash(String contractHash) { this.contractHash = contractHash; }
        public Map<String, Map<String, Object>> getMilestones() { return milestones; }
        public void setMilestones(Map<String, Map<String, Object>> milestones) { this.milestones = milestones; }
        public Map<String, Object> getOutputs() { return outputs; }
        public void setOutputs(Map<String, Object> outputs) { this.outputs = outputs; }
    }
}
