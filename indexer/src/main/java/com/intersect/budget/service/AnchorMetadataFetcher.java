package com.intersect.budget.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Base64;

@Service
@Slf4j
public class AnchorMetadataFetcher {
    private final WebClient webClient;
    private final ObjectMapper objectMapper;

    public AnchorMetadataFetcher(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
        this.webClient = WebClient.builder()
                .codecs(configurer -> configurer.defaultCodecs().maxInMemorySize(10 * 1024 * 1024)) // 10MB
                .build();
    }

    public JsonNode fetchAndVerifyMetadata(String anchorUrl, String anchorDataHash) {
        try {
            String content = webClient.get()
                    .uri(anchorUrl)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            if (content == null) {
                log.warn("Failed to fetch metadata from anchor URL: {}", anchorUrl);
                return null;
            }

            // Verify hash if provided
            if (anchorDataHash != null && !anchorDataHash.isEmpty()) {
                String computedHash = computeBlake2b256Hash(content);
                if (!computedHash.equals(anchorDataHash)) {
                    log.error("Hash mismatch for anchor URL: {}. Expected: {}, Got: {}", 
                            anchorUrl, anchorDataHash, computedHash);
                    return null;
                }
            }

            return objectMapper.readTree(content);
        } catch (Exception e) {
            log.error("Error fetching metadata from anchor URL: {}", anchorUrl, e);
            return null;
        }
    }

    private String computeBlake2b256Hash(String content) {
        try {
            // Note: This is a simplified hash. In production, use proper Blake2b implementation
            // For now, using SHA-256 as a placeholder - should be replaced with Blake2b
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(content.getBytes(StandardCharsets.UTF_8));
            return bytesToHex(hash);
        } catch (Exception e) {
            log.error("Error computing hash", e);
            return null;
        }
    }

    private String bytesToHex(byte[] bytes) {
        StringBuilder result = new StringBuilder();
        for (byte b : bytes) {
            result.append(String.format("%02x", b));
        }
        return result.toString();
    }
}
