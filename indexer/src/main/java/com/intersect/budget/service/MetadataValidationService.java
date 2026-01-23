package com.intersect.budget.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Set;

/**
 * Service to validate TOM metadata structure.
 * Ensures metadata follows the expected format before processing.
 */
@Service
@Slf4j
public class MetadataValidationService {
    
    private static final Set<String> VALID_EVENT_TYPES = Set.of(
        "publish", "initialize", "reorganize", "fund", "disburse",
        "complete", "withdraw", "pause", "resume", "modify", "cancel", "sweep"
    );

    /**
     * Validate that metadata contains required TOM structure.
     */
    public boolean isValidTomMetadata(Map<String, Object> metadata) {
        if (metadata == null || metadata.isEmpty()) {
            return false;
        }

        Object metadataValue = metadata.get("1694");
        if (metadataValue == null) {
            return false;
        }

        // Check if it's a map (inline JSON) or has anchorUrl (remote)
        if (metadataValue instanceof Map) {
            @SuppressWarnings("unchecked")
            Map<String, Object> metadataMap = (Map<String, Object>) metadataValue;
            
            // Check for body with event type
            Object body = metadataMap.get("body");
            if (body instanceof Map) {
                @SuppressWarnings("unchecked")
                Map<String, Object> bodyMap = (Map<String, Object>) body;
                Object event = bodyMap.get("event");
                
                if (event instanceof String) {
                    return VALID_EVENT_TYPES.contains((String) event);
                }
            }
            
            // Check for remote anchor
            if (metadataMap.containsKey("anchorUrl")) {
                return true; // Remote metadata is valid if it has anchorUrl
            }
        }

        return false;
    }

    /**
     * Validate event type.
     */
    public boolean isValidEventType(String eventType) {
        return eventType != null && VALID_EVENT_TYPES.contains(eventType);
    }
}
