package com.intersect.budget.domain;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "treasury_transactions")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TreasuryTransaction {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "tx_id")
    private Long txId;

    @Column(name = "tx_hash", nullable = false, unique = true, length = 64)
    private String txHash;

    @Column(name = "slot", nullable = false)
    private Long slot;

    @Column(name = "block_height")
    private Long blockHeight;

    @Column(name = "event_type", length = 50)
    private String eventType;

    @Column(name = "instance_id")
    private Long instanceId;

    @Column(name = "project_id")
    private Long projectId;

    @Column(name = "metadata", columnDefinition = "JSONB")
    private String metadata; // JSON string

    @Column(name = "metadata_anchor_url", columnDefinition = "TEXT")
    private String metadataAnchorUrl;

    @Column(name = "metadata_anchor_hash", length = 64)
    private String metadataAnchorHash;

    @Column(name = "tx_author", length = 64)
    private String txAuthor;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "instance_id", insertable = false, updatable = false)
    private TreasuryInstance treasuryInstance;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", insertable = false, updatable = false)
    private Project project;
}
