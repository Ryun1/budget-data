import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getProject, formatAda, formatTime, truncateHash, type ProjectDetail } from '../../lib/api'
import MilestoneTimeline from '../../components/MilestoneTimeline'
import LoadingSpinner from '../../components/LoadingSpinner'

export default function ProjectDetailPage() {
  const router = useRouter()
  const { id } = router.query
  const [projectDetail, setProjectDetail] = useState<ProjectDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'milestones' | 'events' | 'utxos'>('milestones')

  useEffect(() => {
    if (!id || typeof id !== 'string') return

    setLoading(true)
    getProject(id)
      .then(data => {
        if (!data) throw new Error('Project not found')
        setProjectDetail(data)
        setLoading(false)
      })
      .catch(err => {
        console.error('Error fetching project:', err)
        setError(err.message || 'Failed to load project')
        setLoading(false)
      })
  }, [id])

  if (loading) {
    return (
      <div>
        <div className="header">
          <h1>Project Details</h1>
          <nav className="nav">
            <Link href="/">Dashboard</Link>
            <Link href="/projects">Projects</Link>
            <Link href="/transactions">Transactions</Link>
            <Link href="/vendor-contracts">Treasury Addresses</Link>
            <Link href="/events">Fund Flows</Link>
          </nav>
        </div>
        <div className="container">
          <LoadingSpinner />
        </div>
      </div>
    )
  }

  if (error || !projectDetail) {
    return (
      <div>
        <div className="header">
          <h1>Project Details</h1>
          <nav className="nav">
            <Link href="/">Dashboard</Link>
            <Link href="/projects">Projects</Link>
            <Link href="/transactions">Transactions</Link>
            <Link href="/vendor-contracts">Treasury Addresses</Link>
            <Link href="/events">Fund Flows</Link>
          </nav>
        </div>
        <div className="container">
          <div className="card">
            <p style={{ color: 'red' }}>{error || 'Project not found'}</p>
            <Link href="/projects" style={{ color: '#0066cc' }}>
              Back to Projects
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const { project, milestones, events, utxos, balance_lovelace, utxo_count } = projectDetail
  const completedCount = milestones.filter(m => m.status === 'completed' || m.status === 'disbursed').length
  const disbursedCount = milestones.filter(m => m.status === 'disbursed').length

  return (
    <div>
      <div className="header">
        <h1>{project.project_name || 'Project Details'}</h1>
        <nav className="nav">
          <Link href="/">Dashboard</Link>
          <Link href="/projects">Projects</Link>
          <Link href="/transactions">Transactions</Link>
          <Link href="/vendor-contracts">Treasury Addresses</Link>
          <Link href="/events">Fund Flows</Link>
        </nav>
      </div>

      <div className="container">
        {/* Project Overview Card */}
        <div className="card">
          <div className="project-overview">
            <div className="project-meta">
              <span className="project-id">{project.project_id}</span>
              {project.contract_instance && (
                <span className="project-instance" title={project.contract_instance}>
                  Instance: {truncateHash(project.contract_instance, 8)}
                </span>
              )}
            </div>

            {project.description && (
              <p style={{ color: '#666', margin: '0.5rem 0' }}>{project.description}</p>
            )}

            <div className="project-info-grid">
              <div className="info-item">
                <span className="label">Contract Address</span>
                {project.contract_address ? (
                  <code title={project.contract_address}>{truncateHash(project.contract_address, 16)}</code>
                ) : (
                  <span className="value">-</span>
                )}
              </div>
              <div className="info-item">
                <span className="label">Vendor Address</span>
                {project.vendor_address ? (
                  <code title={project.vendor_address}>{truncateHash(project.vendor_address, 16)}</code>
                ) : (
                  <span className="value">-</span>
                )}
              </div>
              <div className="info-item">
                <span className="label">Current Balance</span>
                <span className="value">{formatAda(balance_lovelace)} ADA</span>
              </div>
              <div className="info-item">
                <span className="label">UTXOs</span>
                <span className="value">{utxo_count}</span>
              </div>
              <div className="info-item">
                <span className="label">Created</span>
                <span className="value">{formatTime(project.created_time)}</span>
              </div>
              <div className="info-item">
                <span className="label">Fund Transaction</span>
                <Link href={`/transactions/${project.fund_tx_hash}`} style={{ color: '#0066cc' }}>
                  <code>{truncateHash(project.fund_tx_hash, 12)}</code>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Summary */}
        <div className="card">
          <h2>Milestone Progress</h2>
          <div className="progress-summary">
            <div className="progress-stats">
              <span>{completedCount} of {project.milestone_count} milestones completed</span>
              <span>{disbursedCount} disbursed</span>
            </div>
            <div className="progress-bar large">
              <div
                className="progress-fill"
                style={{
                  width: `${project.milestone_count > 0 ? (completedCount / project.milestone_count) * 100 : 0}%`
                }}
              />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs">
          <button
            className={activeTab === 'milestones' ? 'active' : ''}
            onClick={() => setActiveTab('milestones')}
          >
            Milestones ({milestones.length})
          </button>
          <button
            className={activeTab === 'events' ? 'active' : ''}
            onClick={() => setActiveTab('events')}
          >
            Events ({events.length})
          </button>
          <button
            className={activeTab === 'utxos' ? 'active' : ''}
            onClick={() => setActiveTab('utxos')}
          >
            UTXOs ({utxos.length})
          </button>
        </div>

        {/* Tab Content */}
        <div className="card">
          {activeTab === 'milestones' && (
            <MilestoneTimeline milestones={milestones} />
          )}

          {activeTab === 'events' && (
            events.length > 0 ? (
              <table className="table">
                <thead>
                  <tr>
                    <th>Event</th>
                    <th>Milestone</th>
                    <th>Transaction</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((event) => (
                    <tr key={event.tx_hash}>
                      <td>
                        <span className={`status ${event.event_type?.toLowerCase() || ''}`}>
                          {event.event_type || '-'}
                        </span>
                      </td>
                      <td>{event.milestone_id || '-'}</td>
                      <td>
                        <Link href={`/transactions/${event.tx_hash}`} style={{ color: '#0066cc' }}>
                          <code>{truncateHash(event.tx_hash, 10)}</code>
                        </Link>
                      </td>
                      <td>{formatTime(event.block_time)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>No events found for this project.</p>
            )
          )}

          {activeTab === 'utxos' && (
            utxos.length > 0 ? (
              <table className="table">
                <thead>
                  <tr>
                    <th>UTXO</th>
                    <th>Amount</th>
                    <th>Slot</th>
                  </tr>
                </thead>
                <tbody>
                  {utxos.map((utxo) => (
                    <tr key={`${utxo.tx_hash}#${utxo.output_index}`}>
                      <td>
                        <code>{truncateHash(utxo.tx_hash, 10)}#{utxo.output_index}</code>
                      </td>
                      <td>{formatAda(utxo.lovelace_amount)} ADA</td>
                      <td>{utxo.slot?.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>No UTXOs found at the vendor address.</p>
            )
          )}
        </div>

        <div style={{ marginTop: '1rem' }}>
          <Link href="/projects" style={{ color: '#0066cc' }}>
            Back to Projects
          </Link>
        </div>
      </div>
    </div>
  )
}
