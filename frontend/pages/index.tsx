import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getStats, getBalance, getTransactions, formatAda, type Stats, type Balance, type Transaction } from '../lib/api'
import StatsCard from '../components/StatsCard'
import LoadingSpinner from '../components/LoadingSpinner'

export default function Home() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [balance, setBalance] = useState<Balance | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsData, balanceData, transactionsData] = await Promise.all([
          getStats(),
          getBalance(),
          getTransactions({ limit: 10 })
        ])
        setStats(statsData)
        setBalance(balanceData)
        setTransactions(transactionsData)
        setLoading(false)
      } catch (err) {
        console.error('Error fetching data:', err)
        setError('Failed to load data')
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div>
        <div className="header">
          <h1>Cardano Treasury Budget Data</h1>
        </div>
        <div className="container">
          <LoadingSpinner />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <div className="header">
          <h1>Cardano Treasury Budget Data</h1>
        </div>
        <div className="container">
          <div className="card">
            <p style={{ color: 'red' }}>{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="header">
        <h1>Cardano Treasury Budget Data</h1>
        <nav className="nav">
          <Link href="/">Dashboard</Link>
          <Link href="/projects">Projects</Link>
          <Link href="/transactions">Transactions</Link>
          <Link href="/vendor-contracts">Treasury Addresses</Link>
          <Link href="/events">Fund Flows</Link>
        </nav>
      </div>

      <div className="container">
        <div className="stats-grid">
          <StatsCard
            title="Treasury Balance"
            value={balance ? formatAda(balance.lovelace) + ' ADA' : '-'}
          />
          <StatsCard
            title="TOM Transactions"
            value={stats?.tom_transactions || 0}
          />
          <StatsCard
            title="Treasury Addresses"
            value={stats?.treasury_addresses || 0}
          />
          <StatsCard
            title="Latest Block"
            value={stats?.latest_block?.toLocaleString() || '-'}
          />
        </div>

        <div className="card">
          <h2>Recent TOM Transactions</h2>
          {transactions.length > 0 ? (
            <table className="table">
              <thead>
                <tr>
                  <th>Transaction Hash</th>
                  <th>Event Type</th>
                  <th>Slot</th>
                  <th>Block</th>
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
                    <td>
                      <Link href={`/transactions/${tx.tx_hash}`} style={{ color: '#0066cc' }}>
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No transactions found</p>
          )}
          {transactions.length > 0 && (
            <div style={{ marginTop: '1rem' }}>
              <Link href="/transactions" style={{ color: '#0066cc' }}>
                View all transactions →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
