import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getTransactions, type Transaction } from '../lib/api'

export default function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchTransactions() {
      try {
        const data = await getTransactions()
        setTransactions(data)
        setLoading(false)
      } catch (err) {
        console.error('Error fetching transactions:', err)
        setError('Failed to load transactions')
        setLoading(false)
      }
    }
    fetchTransactions()
  }, [])

  if (loading) {
    return <div className="container">Loading...</div>
  }

  return (
    <div>
      <div className="header">
        <h1>Transactions</h1>
        <nav className="nav">
          <Link href="/">Dashboard</Link>
          <Link href="/projects">Projects</Link>
          <Link href="/transactions">Transactions</Link>
          <Link href="/milestones">Milestones</Link>
        </nav>
      </div>

      <div className="container">
        <div className="card">
          <h2>Recent Transactions</h2>
          {transactions.length > 0 ? (
            <table className="table">
              <thead>
                <tr>
                  <th>Transaction Hash</th>
                  <th>Event Type</th>
                  <th>Slot</th>
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
                    <td>{tx.event_type || '-'}</td>
                    <td>{tx.slot}</td>
                    <td>
                      <Link href={`/transactions/${tx.tx_hash}`} style={{ color: '#0066cc' }}>View Details</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No transactions found</p>
          )}
        </div>
      </div>
    </div>
  )
}
