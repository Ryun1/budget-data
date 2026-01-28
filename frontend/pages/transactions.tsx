import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getTransactions, formatTime, type Transaction } from '../lib/api'

export default function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    async function fetchTransactions() {
      setLoading(true)
      try {
        const data = await getTransactions({
          page,
          limit: 50,
          action_type: filter || undefined
        })
        setTransactions(data)
        setLoading(false)
      } catch (err) {
        console.error('Error fetching transactions:', err)
        setError('Failed to load transactions')
        setLoading(false)
      }
    }
    fetchTransactions()
  }, [filter, page])

  return (
    <div>
      <div className="header">
        <h1>TOM Transactions</h1>
        <nav className="nav">
          <Link href="/">Dashboard</Link>
          <Link href="/projects">Projects</Link>
          <Link href="/transactions">Transactions</Link>
          <Link href="/treasury-addresses">Treasury Addresses</Link>
          <Link href="/events">Treasury Operations</Link>
        </nav>
      </div>

      <div className="container">
        <div className="card">
          <h2>Treasury Oversight Metadata Transactions</h2>
          <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div>
              <label htmlFor="filter" style={{ marginRight: '0.5rem' }}>Filter by event:</label>
              <select
                id="filter"
                value={filter}
                onChange={(e) => { setFilter(e.target.value); setPage(1); }}
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
          </div>

          {loading ? (
            <p>Loading...</p>
          ) : error ? (
            <p style={{ color: 'red' }}>{error}</p>
          ) : transactions.length > 0 ? (
            <>
              <table className="table">
                <thead>
                  <tr>
                    <th>Transaction Hash</th>
                    <th>Event Type</th>
                    <th>Slot</th>
                    <th>Block</th>
                    <th>Time</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx.tx_hash}>
                      <td>
                        <code style={{ fontSize: '0.875rem' }}>
                          {tx.tx_hash.substring(0, 16)}...
                        </code>
                      </td>
                      <td>
                        <span className={`status ${tx.action_type?.toLowerCase() || ''}`}>
                          {tx.action_type || '-'}
                        </span>
                      </td>
                      <td>{tx.slot?.toLocaleString() || '-'}</td>
                      <td>{tx.block_number?.toLocaleString() || '-'}</td>
                      <td>{formatTime(tx.block_time)}</td>
                      <td>
                        <Link href={`/transactions/${tx.tx_hash}`} style={{ color: '#0066cc' }}>
                          View Details
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  style={{ padding: '0.5rem 1rem', cursor: page === 1 ? 'not-allowed' : 'pointer' }}
                >
                  Previous
                </button>
                <span>Page {page}</span>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={transactions.length < 50}
                  style={{ padding: '0.5rem 1rem', cursor: transactions.length < 50 ? 'not-allowed' : 'pointer' }}
                >
                  Next
                </button>
              </div>
            </>
          ) : (
            <p>No transactions found</p>
          )}
        </div>
      </div>
    </div>
  )
}
