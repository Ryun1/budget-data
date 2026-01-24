import Link from 'next/link'
import { formatTime, truncateHash, type Milestone } from '../lib/api'

interface MilestoneTimelineProps {
  milestones: Milestone[]
}

export default function MilestoneTimeline({ milestones }: MilestoneTimelineProps) {
  if (milestones.length === 0) {
    return <p>No milestones defined for this project.</p>
  }

  return (
    <div className="milestone-timeline">
      {milestones.map((milestone, index) => (
        <div
          key={milestone.milestone_id}
          className={`milestone-item milestone-${milestone.status}`}
        >
          <div className="milestone-indicator">
            <div className="milestone-dot" />
            {index < milestones.length - 1 && (
              <div className="milestone-line" />
            )}
          </div>

          <div className="milestone-content">
            <div className="milestone-header">
              <h4 className="milestone-title">
                {milestone.milestone_label || `Milestone ${milestone.milestone_order}`}
              </h4>
              <span className={`milestone-status status ${milestone.status}`}>
                {milestone.status}
              </span>
            </div>

            {milestone.acceptance_criteria && (
              <p className="milestone-criteria">{milestone.acceptance_criteria}</p>
            )}

            <div className="milestone-transactions">
              {milestone.complete_tx_hash && (
                <div className="milestone-tx">
                  <span className="tx-label">Completed:</span>
                  <Link href={`/transactions/${milestone.complete_tx_hash}`}>
                    <code>{truncateHash(milestone.complete_tx_hash, 8)}</code>
                  </Link>
                  <span className="tx-time">{formatTime(milestone.complete_time)}</span>
                </div>
              )}
              {milestone.disburse_tx_hash && (
                <div className="milestone-tx">
                  <span className="tx-label">Disbursed:</span>
                  <Link href={`/transactions/${milestone.disburse_tx_hash}`}>
                    <code>{truncateHash(milestone.disburse_tx_hash, 8)}</code>
                  </Link>
                  <span className="tx-time">{formatTime(milestone.disburse_time)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
