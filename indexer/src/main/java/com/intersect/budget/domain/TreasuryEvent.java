package com.intersect.budget.domain;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "treasury_events")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TreasuryEvent {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "event_id")
    private Long eventId;

    @Column(name = "tx_id", nullable = false)
    private Long txId;

    @Column(name = "event_type", nullable = false, length = 50)
    private String eventType;

    @Column(name = "project_id")
    private Long projectId;

    @Column(name = "milestone_id")
    private Long milestoneId;

    @Column(name = "event_data", columnDefinition = "JSONB")
    private String eventData; // JSON string

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tx_id", insertable = false, updatable = false)
    private TreasuryTransaction transaction;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", insertable = false, updatable = false)
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "milestone_id", insertable = false, updatable = false)
    private Milestone milestone;
}
