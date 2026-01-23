package com.intersect.budget.repository;

import com.intersect.budget.domain.TreasuryTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;

@Repository
public interface TreasuryTransactionRepository extends JpaRepository<TreasuryTransaction, Long> {
    Optional<TreasuryTransaction> findByTxHash(String txHash);
    List<TreasuryTransaction> findByEventType(String eventType);
    List<TreasuryTransaction> findByProjectId(Long projectId);
    List<TreasuryTransaction> findByInstanceId(Long instanceId);
}
