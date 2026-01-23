package com.intersect.budget.domain;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "treasury_instance")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TreasuryInstance {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "instance_id")
    private Long instanceId;

    @Column(name = "script_hash", nullable = false, unique = true, length = 64)
    private String scriptHash;

    @Column(name = "payment_address", nullable = false, unique = true)
    private String paymentAddress;

    @Column(name = "stake_address")
    private String stakeAddress;

    @Column(name = "label")
    private String label;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "expiration")
    private Long expiration;

    @Column(name = "permissions", columnDefinition = "JSONB")
    private String permissions; // JSON string

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
