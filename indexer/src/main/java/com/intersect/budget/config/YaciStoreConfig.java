package com.intersect.budget.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import lombok.Data;

@Configuration
@ConfigurationProperties(prefix = "yaci.store")
@Data
public class YaciStoreConfig {
    private Long startSlot;
    private N2cConfig n2c = new N2cConfig();
    
    @Data
    public static class N2cConfig {
        private String host = "localhost";
        private Integer port = 1337;
        private String protocol = "n2c";
    }
}
