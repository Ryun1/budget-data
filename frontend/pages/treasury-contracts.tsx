import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getTreasuryAddresses, formatAda, truncateHash, type TreasuryAddress } from '../lib/api'

export default function TreasuryContracts() {
  const [addresses, setAddresses] = useState<TreasuryAddress[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchAddresses() {
      try {
        const data = await getTreasuryAddresses()
        setAddresses(data)
        setLoading(false)
      } catch (err) {
        console.error('Error fetching treasury addresses:', err)
        setError('Failed to load treasury addresses')
        setLoading(false)
      }
    }
    fetchAddresses()
  }, [])

  const totalBalance = addresses.reduce((sum, addr) => sum + addr.balance_lovelace, 0)
  const totalUtxos = addresses.reduce((sum, addr) => sum + addr.utxo_count, 0)

  return (
    <div>
      <div className="header">
        <h1>Treasury Addresses</h1>
        <nav className="nav">
          <Link href="/">Dashboard</Link>
          <Link href="/projects">Projects</Link>
          <Link href="/transactions">Transactions</Link>
          <Link href="/treasury-contracts">Treasury Addresses</Link>
          <Link href="/events">Fund Flows</Link>
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
              <div className="card" style={{ flex: 1 }}>
                <h3 style={{ fontSize: '0.875rem', color: '#666' }}>Total Addresses</h3>
                <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{addresses.length}</div>
              </div>
              <div className="card" style={{ flex: 1 }}>
                <h3 style={{ fontSize: '0.875rem', color: '#666' }}>Total Balance</h3>
                <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{formatAda(totalBalance)} ADA</div>
              </div>
              <div className="card" style={{ flex: 1 }}>
                <h3 style={{ fontSize: '0.875rem', color: '#666' }}>Total UTXOs</h3>
                <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{totalUtxos}</div>
              </div>
            </div>

            <div className="card">
              <h2>Treasury Contract Addresses ({addresses.length})</h2>
              {addresses.length > 0 ? (
                <table className="table">
                  <thead>
                    <tr>
                      <th>Address</th>
                      <th>Stake Credential</th>
                      <th>Balance (ADA)</th>
                      <th>UTXOs</th>
                      <th>Latest Slot</th>
                    </tr>
                  </thead>
                  <tbody>
                    {addresses.map((addr) => (
                      <tr key={addr.address}>
                        <td>
                          <code style={{ fontSize: '0.875rem' }} title={addr.address}>
                            {truncateHash(addr.address, 16)}
                          </code>
                        </td>
                        <td>
                          {addr.stake_credential ? (
                            <code style={{ fontSize: '0.75rem' }} title={addr.stake_credential}>
                              {truncateHash(addr.stake_credential, 8)}
                            </code>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          {formatAda(addr.balance_lovelace)}
                        </td>
                        <td style={{ textAlign: 'center' }}>{addr.utxo_count}</td>
                        <td>{addr.latest_slot?.toLocaleString() || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>No treasury addresses found</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
