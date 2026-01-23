package com.intersect.budget.domain;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "milestones", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"project_id", "identifier"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Milestone {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "milestone_id")
    private Long milestoneId;

    @Column(name = "project_id", nullable = false)
    private Long projectId;

    @Column(name = "identifier", nullable = false)
    private String identifier;

    @Column(name = "label")
    private String label;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "acceptance_criteria", columnDefinition = "TEXT")
    private String acceptanceCriteria;

    @Column(name = "amount_lovelace", nullable = false)
    private Long amountLovelace;

    @Column(name = "maturity_slot")
    private Long maturitySlot;

    @Column(name = "status", nullable = false, length = 50)
    @Enumerated(EnumType.STRING)
    private MilestoneStatus status = MilestoneStatus.PENDING;

    @Column(name = "paused_at")
    private LocalDateTime pausedAt;

    @Column(name = "paused_reason", columnDefinition = "TEXT")
    private String pausedReason;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", insertable = false, updatable = false)
    private Project project;

    public enum MilestoneStatus {
        PENDING, COMPLETED, PAUSED, WITHDRAWN
    }
}
