import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getTreasuryOperations, formatTime, truncateHash, type TreasuryOperation } from '../lib/api'

export default function Events() {
  const [operations, setOperations] = useState<TreasuryOperation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>('')

  useEffect(() => {
    async function fetchOperations() {
      try {
        const data = await getTreasuryOperations()
        setOperations(data)
        setLoading(false)
      } catch (err) {
        console.error('Error fetching treasury operations:', err)
        setError('Failed to load treasury operations')
        setLoading(false)
      }
    }
    fetchOperations()
  }, [])

  const filteredOperations = filter
    ? operations.filter(op => op.action_type?.toLowerCase() === filter.toLowerCase())
    : operations

  const eventCounts = operations.reduce((acc, op) => {
    const type = op.action_type || 'unknown'
    acc[type] = (acc[type] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div>
      <div className="header">
        <h1>Treasury Operations</h1>
        <nav className="nav">
          <Link href="/">Dashboard</Link>
          <Link href="/projects">Projects</Link>
          <Link href="/events">Treasury Operations</Link>
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
              <h2>Treasury Operations ({filteredOperations.length})</h2>
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

              {filteredOperations.length > 0 ? (
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
                    {filteredOperations.map((op) => (
                      <tr key={op.tx_hash}>
                        <td>
                          <code style={{ fontSize: '0.875rem' }} title={op.tx_hash}>
                            {truncateHash(op.tx_hash, 12)}
                          </code>
                        </td>
                        <td>
                          <span className={`status ${op.action_type?.toLowerCase() || ''}`}>
                            {op.action_type || '-'}
                          </span>
                        </td>
                        <td>{op.destination || '-'}</td>
                        <td>{op.block_number?.toLocaleString() || '-'}</td>
                        <td>{formatTime(op.block_time)}</td>
                        <td>
                          <Link href={`/transactions/${op.tx_hash}`} style={{ color: '#0066cc' }}>
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>No treasury operations found</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
