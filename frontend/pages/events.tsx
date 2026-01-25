import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getFundFlows, formatTime, truncateHash, type FundFlow } from '../lib/api'

export default function Events() {
  const [flows, setFlows] = useState<FundFlow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>('')

  useEffect(() => {
    async function fetchFlows() {
      try {
        const data = await getFundFlows()
        setFlows(data)
        setLoading(false)
      } catch (err) {
        console.error('Error fetching fund flows:', err)
        setError('Failed to load fund flows')
        setLoading(false)
      }
    }
    fetchFlows()
  }, [])

  const filteredFlows = filter
    ? flows.filter(f => f.action_type?.toLowerCase() === filter.toLowerCase())
    : flows

  const eventCounts = flows.reduce((acc, flow) => {
    const type = flow.action_type || 'unknown'
    acc[type] = (acc[type] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div>
      <div className="header">
        <h1>Fund Flow</h1>
        <nav className="nav">
          <Link href="/">Dashboard</Link>
          <Link href="/projects">Projects</Link>
          <Link href="/events">Fund Flow</Link>
        </nav>
      </div>

      <div className="container">
        {loading ? (
          <div className="card">Loading...</div>
        ) : error ? (
          <div className="card">
            <p style={{ color: 'red' }}>{error}</p>
          </div>
        ) : (
          <>
            <div className="stats-grid" style={{ marginBottom: '1rem' }}>
              {Object.entries(eventCounts).map(([type, count]) => (
                <div key={type} className="card" style={{ flex: 1, minWidth: '120px' }}>
                  <h3 style={{ fontSize: '0.875rem', color: '#666', textTransform: 'capitalize' }}>{type}</h3>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{count}</div>
                </div>
              ))}
            </div>

            <div className="card">
              <h2>Treasury Fund Flows ({filteredFlows.length})</h2>
              <div style={{ marginBottom: '1rem' }}>
                <label htmlFor="filter" style={{ marginRight: '0.5rem' }}>Filter by event:</label>
                <select
                  id="filter"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
                >
                  <option value="">All Events</option>
                  <option value="initialize">Initialize</option>
                  <option value="fund">Fund</option>
                  <option value="disburse">Disburse</option>
                  <option value="withdraw">Withdraw</option>
                  <option value="complete">Complete</option>
                  <option value="pause">Pause</option>
                  <option value="resume">Resume</option>
                  <option value="modify">Modify</option>
                  <option value="cancel">Cancel</option>
                  <option value="sweep">Sweep</option>
                </select>
              </div>

              {filteredFlows.length > 0 ? (
                <table className="table">
                  <thead>
                    <tr>
                      <th>Transaction Hash</th>
                      <th>Event Type</th>
                      <th>Destination</th>
                      <th>Block</th>
                      <th>Time</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFlows.map((flow) => (
                      <tr key={flow.tx_hash}>
                        <td>
                          <code style={{ fontSize: '0.875rem' }} title={flow.tx_hash}>
                            {truncateHash(flow.tx_hash, 12)}
                          </code>
                        </td>
                        <td>
                          <span className={`status ${flow.action_type?.toLowerCase() || ''}`}>
                            {flow.action_type || '-'}
                          </span>
                        </td>
                        <td>{flow.destination || '-'}</td>
                        <td>{flow.block_number?.toLocaleString() || '-'}</td>
                        <td>{formatTime(flow.block_time)}</td>
                        <td>
                          <Link href={`/transactions/${flow.tx_hash}`} style={{ color: '#0066cc' }}>
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>No fund flows found</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
