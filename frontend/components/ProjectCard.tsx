import Link from 'next/link'
import { formatAda, truncateHash, type Project } from '../lib/api'

interface ProjectCardProps {
  project: Project
  balance?: number
  completedMilestones?: number
}

export default function ProjectCard({ project, balance, completedMilestones }: ProjectCardProps) {
  const milestoneCount = project.milestone_count || 0
  const progressPercent = milestoneCount > 0
    ? ((completedMilestones || 0) / milestoneCount) * 100
    : 0

  return (
    <div className="project-card">
      <div className="project-header">
        <span className="project-id">{project.project_id}</span>
        <span className={`project-status ${progressPercent === 100 ? 'completed' : 'active'}`}>
          {progressPercent === 100 ? 'Completed' : 'Active'}
        </span>
      </div>

      <h3 className="project-name">
        <Link href={`/projects/${encodeURIComponent(project.project_id)}`}>
          {project.project_name || 'Unnamed Project'}
        </Link>
      </h3>

      {project.description && (
        <p className="project-description">{project.description}</p>
      )}

      <div className="project-stats">
        <div className="stat">
          <span className="stat-label">Balance</span>
          <span className="stat-value">
            {formatAda(balance || 0)} ADA
          </span>
        </div>
        <div className="stat">
          <span className="stat-label">Milestones</span>
          <span className="stat-value">
            {completedMilestones || 0} / {milestoneCount}
          </span>
        </div>
      </div>

      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {project.vendor_address && (
        <div className="project-vendor">
          <span className="label">Vendor:</span>
          <code title={project.vendor_address}>
            {truncateHash(project.vendor_address, 12)}
          </code>
        </div>
      )}
    </div>
  )
}
