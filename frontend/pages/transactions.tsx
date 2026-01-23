import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Transaction {
  tx_hash: string
  event_type: string
  slot: number
}

export default function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
    fetch(`${apiUrl}/api/transactions`)
      .then(r => r.json())
      .then(data => {
        setTransactions(data.transactions || [])
        setLoading(false)
      })
      .catch(err => {
        console.error('Error fetching transactions:', err)
        setLoading(false)
      })
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
                      <Link href={`/transactions/${tx.tx_hash}`}>View</Link>
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
