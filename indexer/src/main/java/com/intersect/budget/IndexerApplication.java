package com.intersect.budget;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Treasury Budget Data Indexer Application.
 * 
 * This is a background service that indexes Cardano treasury contract transactions.
 * WebFlux is included for HTTP client functionality (fetching remote metadata),
 * but no web server is started by default.
 */
@SpringBootApplication
@EnableAsync
@EnableScheduling
public class IndexerApplication {
    public static void main(String[] args) {
        // Disable web server by default (indexer runs as background worker)
        System.setProperty("server.port", "-1");
        SpringApplication.run(IndexerApplication.class, args);
    }
}
