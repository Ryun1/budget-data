package com.intersect.budget.repository;

import com.intersect.budget.domain.Milestone;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MilestoneRepository extends JpaRepository<Milestone, Long> {
    List<Milestone> findByProjectId(Long projectId);
    Optional<Milestone> findByProjectIdAndIdentifier(Long projectId, String identifier);
    List<Milestone> findByStatus(Milestone.MilestoneStatus status);
    
    @Query("SELECT m FROM Milestone m WHERE m.maturitySlot <= ?1 AND m.status = 'PENDING'")
    List<Milestone> findMatureMilestones(Long currentSlot);
}
