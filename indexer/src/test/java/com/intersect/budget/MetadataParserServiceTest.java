package com.intersect.budget;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.intersect.budget.service.AnchorMetadataFetcher;
import com.intersect.budget.service.MetadataParserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class MetadataParserServiceTest {

    private MetadataParserService metadataParserService;
    private ObjectMapper objectMapper;

    @Mock
    private AnchorMetadataFetcher anchorMetadataFetcher;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        objectMapper = new ObjectMapper();
        metadataParserService = new MetadataParserService(objectMapper, anchorMetadataFetcher);
    }

    @Test
    void testParseFundEvent() {
        Map<String, Object> metadata = new HashMap<>();
        Map<String, Object> body = new HashMap<>();
        body.put("event", "fund");
        body.put("identifier", "PO123");
        body.put("label", "Test Project");
        
        Map<String, Object> metadataValue = new HashMap<>();
        metadataValue.put("body", body);
        metadata.put("1694", metadataValue);

        MetadataParserService.ParsedMetadata parsed = metadataParserService.parseMetadata(metadata);
        
        assertNotNull(parsed);
        assertEquals("fund", parsed.getEvent());
        assertEquals("PO123", parsed.getIdentifier());
        assertEquals("Test Project", parsed.getLabel());
    }

    @Test
    void testParseNullMetadata() {
        MetadataParserService.ParsedMetadata parsed = metadataParserService.parseMetadata(null);
        assertNull(parsed);
    }

    @Test
    void testParseEmptyMetadata() {
        Map<String, Object> metadata = new HashMap<>();
        MetadataParserService.ParsedMetadata parsed = metadataParserService.parseMetadata(metadata);
        assertNull(parsed);
    }
}
