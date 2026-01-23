package com.intersect.budget.service;

import com.intersect.budget.domain.Milestone;
import com.intersect.budget.domain.Project;
import com.intersect.budget.repository.MilestoneRepository;
import com.intersect.budget.repository.ProjectRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Service to calculate and track project status based on milestones.
 */
@Service
@Slf4j
public class ProjectStatusService {
    private final ProjectRepository projectRepository;
    private final MilestoneRepository milestoneRepository;

    @Autowired
    public ProjectStatusService(
            ProjectRepository projectRepository,
            MilestoneRepository milestoneRepository) {
        this.projectRepository = projectRepository;
        this.milestoneRepository = milestoneRepository;
    }

    /**
     * Get project status summary.
     */
    public ProjectStatusSummary getProjectStatus(Long projectId) {
        ProjectStatusSummary summary = new ProjectStatusSummary();
        
        var projectOpt = projectRepository.findById(projectId);
        if (projectOpt.isEmpty()) {
            return summary;
        }

        List<Milestone> milestones = milestoneRepository.findByProjectId(projectId);
        
        summary.totalMilestones = milestones.size();
        summary.pendingMilestones = (int) milestones.stream()
            .filter(m -> m.getStatus() == Milestone.MilestoneStatus.PENDING)
            .count();
        summary.completedMilestones = (int) milestones.stream()
            .filter(m -> m.getStatus() == Milestone.MilestoneStatus.COMPLETED)
            .count();
        summary.pausedMilestones = (int) milestones.stream()
            .filter(m -> m.getStatus() == Milestone.MilestoneStatus.PAUSED)
            .count();
        summary.withdrawnMilestones = (int) milestones.stream()
            .filter(m -> m.getStatus() == Milestone.MilestoneStatus.WITHDRAWN)
            .count();

        return summary;
    }

    public static class ProjectStatusSummary {
        public int totalMilestones = 0;
        public int pendingMilestones = 0;
        public int completedMilestones = 0;
        public int pausedMilestones = 0;
        public int withdrawnMilestones = 0;
    }
}
