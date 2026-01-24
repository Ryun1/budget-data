import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getTransaction, formatTime, type Transaction } from '../../lib/api'

export default function TransactionDetail() {
  const router = useRouter()
  const { hash } = router.query
  const [transaction, setTransaction] = useState<Transaction | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!hash || typeof hash !== 'string') return

    getTransaction(hash)
      .then(data => {
        if (!data) throw new Error('Transaction not found')
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
            <Link href="/vendor-contracts">Treasury Addresses</Link>
            <Link href="/events">Fund Flows</Link>
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
            <Link href="/vendor-contracts">Treasury Addresses</Link>
            <Link href="/events">Fund Flows</Link>
          </nav>
        </div>
        <div className="container">
          <div className="card">
            <p style={{ color: 'red' }}>{error || 'Transaction not found'}</p>
            <Link href="/transactions" style={{ color: '#0066cc' }}>
              ← Back to transactions
            </Link>
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
          <Link href="/transactions">Transactions</Link>
          <Link href="/vendor-contracts">Treasury Addresses</Link>
          <Link href="/events">Fund Flows</Link>
        </nav>
      </div>

      <div className="container">
        <div className="card">
          <h2>TOM Transaction</h2>
          <table className="table">
            <tbody>
              <tr>
                <th style={{ width: '200px' }}>Transaction Hash</th>
                <td><code style={{ fontSize: '0.875rem', wordBreak: 'break-all' }}>{transaction.tx_hash}</code></td>
              </tr>
              <tr>
                <th>Event Type</th>
                <td>
                  <span className={`status ${transaction.action_type?.toLowerCase() || ''}`}>
                    {transaction.action_type || '-'}
                  </span>
                </td>
              </tr>
              <tr>
                <th>Slot</th>
                <td>{transaction.slot?.toLocaleString() || '-'}</td>
              </tr>
              <tr>
                <th>Block Number</th>
                <td>{transaction.block_number?.toLocaleString() || '-'}</td>
              </tr>
              <tr>
                <th>Block Time</th>
                <td>{formatTime(transaction.block_time)}</td>
              </tr>
              <tr>
                <th>Cardanoscan</th>
                <td>
                  <a
                    href={`https://cardanoscan.io/transaction/${transaction.tx_hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#0066cc' }}
                  >
                    View on Cardanoscan ↗
                  </a>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {transaction.metadata && (
          <div className="card">
            <h2>TOM Metadata (Label 1694)</h2>
            <pre style={{
              background: '#f5f5f5',
              padding: '1rem',
              borderRadius: '4px',
              overflow: 'auto',
              fontSize: '0.875rem',
              maxHeight: '500px'
            }}>
              {JSON.stringify(transaction.metadata, null, 2)}
            </pre>
          </div>
        )}

        <div style={{ marginTop: '1rem' }}>
          <Link href="/transactions" style={{ color: '#0066cc' }}>
            ← Back to transactions
          </Link>
        </div>
      </div>
    </div>
  )
}
