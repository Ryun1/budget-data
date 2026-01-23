package com.intersect.budget.repository;

import com.intersect.budget.domain.TreasuryEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TreasuryEventRepository extends JpaRepository<TreasuryEvent, Long> {
    List<TreasuryEvent> findByEventType(String eventType);
    List<TreasuryEvent> findByProjectId(Long projectId);
    List<TreasuryEvent> findByTxId(Long txId);
}
