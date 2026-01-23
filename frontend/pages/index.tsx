import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getTreasury, getProjects, getTransactions, getMilestones, type Treasury, type Project } from '../lib/api'
import StatsCard from '../components/StatsCard'
import LoadingSpinner from '../components/LoadingSpinner'
import '../styles/components.css'

export default function Home() {
  const [treasury, setTreasury] = useState<Treasury | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [transactions, setTransactions] = useState<any[]>([])
  const [milestones, setMilestones] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const [treasuryData, projectsData, transactionsData, milestonesData] = await Promise.all([
          getTreasury(),
          getProjects(),
          getTransactions(),
          getMilestones()
        ])
        setTreasury(treasuryData)
        setProjects(projectsData)
        setTransactions(transactionsData)
        setMilestones(milestonesData)
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
          <Link href="/milestones">Milestones</Link>
          <Link href="/vendor-contracts">Vendor Contracts</Link>
          <Link href="/events">Events</Link>
        </nav>
      </div>

      <div className="container">
        <div className="stats-grid">
          <StatsCard title="Total Projects" value={projects.length} />
          <StatsCard title="Total Transactions" value={transactions.length} />
          <StatsCard title="Total Milestones" value={milestones.length} />
          <StatsCard 
            title="Active Milestones" 
            value={milestones.filter(m => m.status === 'PENDING' || m.status === 'COMPLETED').length} 
          />
        </div>

        <div className="card">
          <h2>Treasury Instance</h2>
          {treasury ? (
            <div>
              <p><strong>Payment Address:</strong> <code style={{ fontSize: '0.875rem', wordBreak: 'break-all' }}>{treasury.payment_address}</code></p>
              <p><strong>Script Hash:</strong> <code>{treasury.script_hash}</code></p>
              {treasury.label && <p><strong>Label:</strong> {treasury.label}</p>}
            </div>
          ) : (
            <p>No treasury instance found</p>
          )}
        </div>

        <div className="card">
          <h2>Projects ({projects.length})</h2>
          {projects.length > 0 ? (
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Identifier</th>
                  <th>Label</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => (
                  <tr key={project.project_id}>
                    <td>{project.project_id}</td>
                    <td>{project.identifier}</td>
                    <td>{project.label || '-'}</td>
                    <td>
                      <Link href={`/projects/${project.project_id}`}>View</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No projects found</p>
          )}
        </div>
      </div>
    </div>
  )
}
