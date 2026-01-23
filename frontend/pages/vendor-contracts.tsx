import { useEffect, useState } from 'react'
import Link from 'next/link'

interface VendorContract {
  contract_id: number
  project_id: number
  payment_address: string
  script_hash?: string
}

export default function VendorContracts() {
  const [contracts, setContracts] = useState<VendorContract[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchContracts() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
        const response = await fetch(`${apiUrl}/api/vendor-contracts`)
        if (!response.ok) throw new Error('Failed to fetch')
        const data = await response.json()
        setContracts(data.vendor_contracts || [])
        setLoading(false)
      } catch (err) {
        console.error('Error fetching vendor contracts:', err)
        setError('Failed to load vendor contracts')
        setLoading(false)
      }
    }
    fetchContracts()
  }, [])

  if (loading) {
    return (
      <div>
        <div className="header">
          <h1>Vendor Contracts</h1>
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

  if (error) {
    return (
      <div>
        <div className="header">
          <h1>Vendor Contracts</h1>
          <nav className="nav">
            <Link href="/">Dashboard</Link>
            <Link href="/projects">Projects</Link>
            <Link href="/transactions">Transactions</Link>
            <Link href="/milestones">Milestones</Link>
          </nav>
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
        <h1>Vendor Contracts</h1>
        <nav className="nav">
          <Link href="/">Dashboard</Link>
          <Link href="/projects">Projects</Link>
          <Link href="/transactions">Transactions</Link>
          <Link href="/milestones">Milestones</Link>
        </nav>
      </div>

      <div className="container">
        <div className="card">
          <h2>Tracked Vendor Contracts ({contracts.length})</h2>
          {contracts.length > 0 ? (
            <table className="table">
              <thead>
                <tr>
                  <th>Contract ID</th>
                  <th>Payment Address</th>
                  <th>Script Hash</th>
                  <th>Project ID</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {contracts.map((contract) => (
                  <tr key={contract.contract_id}>
                    <td>{contract.contract_id}</td>
                    <td>
                      <code style={{ fontSize: '0.875rem', wordBreak: 'break-all' }}>
                        {contract.payment_address}
                      </code>
                    </td>
                    <td>
                      {contract.script_hash ? (
                        <code>{contract.script_hash}</code>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td>
                      <Link href={`/projects/${contract.project_id}`}>
                        {contract.project_id}
                      </Link>
                    </td>
                    <td>
                      <Link href={`/projects/${contract.project_id}`}>View Project</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No vendor contracts found</p>
          )}
        </div>
      </div>
    </div>
  )
}
