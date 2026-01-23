package com.intersect.budget.repository;

import com.intersect.budget.domain.VendorContract;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;

@Repository
public interface VendorContractRepository extends JpaRepository<VendorContract, Long> {
    Optional<VendorContract> findByPaymentAddress(String paymentAddress);
    List<VendorContract> findByProjectId(Long projectId);
    boolean existsByPaymentAddress(String paymentAddress);
}
