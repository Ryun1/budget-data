package com.intersect.budget.domain;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "vendor_contracts")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class VendorContract {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "contract_id")
    private Long contractId;

    @Column(name = "project_id")
    private Long projectId;

    @Column(name = "payment_address", nullable = false, unique = true)
    private String paymentAddress;

    @Column(name = "script_hash", length = 64)
    private String scriptHash;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "discovered_from_tx_hash", nullable = false, length = 64)
    private String discoveredFromTxHash;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", insertable = false, updatable = false)
    private Project project;
}
