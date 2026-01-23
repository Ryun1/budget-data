package com.intersect.budget.repository;

import com.intersect.budget.domain.TreasuryInstance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TreasuryInstanceRepository extends JpaRepository<TreasuryInstance, Long> {
    Optional<TreasuryInstance> findByScriptHash(String scriptHash);
    Optional<TreasuryInstance> findByPaymentAddress(String paymentAddress);
}
