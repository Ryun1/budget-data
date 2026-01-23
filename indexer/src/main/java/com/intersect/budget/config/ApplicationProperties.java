package com.intersect.budget.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * Application-specific configuration properties.
 */
@Configuration
@ConfigurationProperties(prefix = "app")
@Data
public class ApplicationProperties {
    
    /**
     * Maximum number of vendor contracts to track.
     * Set to -1 for unlimited.
     */
    private int maxVendorContracts = -1;
    
    /**
     * Enable detailed logging of metadata parsing.
     */
    private boolean verboseMetadataLogging = false;
    
    /**
     * Timeout for fetching remote metadata anchors (seconds).
     */
    private int metadataFetchTimeout = 10;
    
    /**
     * Maximum retry attempts for failed operations.
     */
    private int maxRetries = 3;
}
