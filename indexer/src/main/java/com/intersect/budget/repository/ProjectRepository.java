package com.intersect.budget.repository;

import com.intersect.budget.domain.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {
    Optional<Project> findByIdentifier(String identifier);
    List<Project> findByTreasuryInstanceId(Long treasuryInstanceId);
}
