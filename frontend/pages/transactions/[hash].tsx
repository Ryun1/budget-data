import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface TransactionDetail {
  tx_hash: string
  event_type?: string
  slot: number
  block_height?: number
  project_id?: number
  tx_author?: string
}

export default function TransactionDetail() {
  const router = useRouter()
  const { hash } = router.query
  const [transaction, setTransaction] = useState<TransactionDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!hash) return
    
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
    fetch(`${apiUrl}/api/transactions/${hash}`)
      .then(r => {
        if (!r.ok) throw new Error('Transaction not found')
        return r.json()
      })
      .then(data => {
        setTransaction(data)
        setLoading(false)
      })
      .catch(err => {
        console.error('Error fetching transaction:', err)
        setError(err.message)
        setLoading(false)
      })
  }, [hash])

  if (loading) {
    return (
      <div>
        <div className="header">
          <h1>Transaction Details</h1>
          <nav className="nav">
            <Link href="/">Dashboard</Link>
            <Link href="/projects">Projects</Link>
            <Link href="/transactions">Transactions</Link>
            <Link href="/milestones">Milestones</Link>
          </nav>
        </div>
        <div className="container">Loading...</div>
      </div>
    )
  }

  if (error || !transaction) {
    return (
      <div>
        <div className="header">
          <h1>Transaction Details</h1>
          <nav className="nav">
            <Link href="/">Dashboard</Link>
            <Link href="/projects">Projects</Link>
            <Link href="/transactions">Transactions</Link>
            <Link href="/milestones">Milestones</Link>
          </nav>
        </div>
        <div className="container">
          <div className="card">
            <p style={{ color: 'red' }}>{error || 'Transaction not found'}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="header">
        <h1>Transaction Details</h1>
        <nav className="nav">
          <Link href="/">Dashboard</Link>
          <Link href="/projects">Projects</Link>
          <Link href="/transactions">Transactions</Link>
          <Link href="/milestones">Milestones</Link>
          <Link href="/vendor-contracts">Vendor Contracts</Link>
          <Link href="/events">Events</Link>
        </nav>
      </div>

      <div className="container">
        <div className="card">
          <h2>Transaction {transaction.tx_hash.substring(0, 16)}...</h2>
          <table className="table">
            <tbody>
              <tr>
                <th>Transaction Hash</th>
                <td><code style={{ fontSize: '0.875rem', wordBreak: 'break-all' }}>{transaction.tx_hash}</code></td>
              </tr>
              <tr>
                <th>Event Type</th>
                <td>{transaction.event_type || '-'}</td>
              </tr>
              <tr>
                <th>Slot</th>
                <td>{transaction.slot.toLocaleString()}</td>
              </tr>
              {transaction.block_height && (
                <tr>
                  <th>Block Height</th>
                  <td>{transaction.block_height.toLocaleString()}</td>
                </tr>
              )}
              {transaction.project_id && (
                <tr>
                  <th>Project ID</th>
                  <td>
                    <Link href={`/projects/${transaction.project_id}`}>
                      {transaction.project_id}
                    </Link>
                  </td>
                </tr>
              )}
              {transaction.tx_author && (
                <tr>
                  <th>Transaction Author</th>
                  <td><code>{transaction.tx_author}</code></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
