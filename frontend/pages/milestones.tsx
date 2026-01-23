import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getMilestones, type Milestone } from '../lib/api'

export default function Milestones() {
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchMilestones() {
      try {
        const data = await getMilestones()
        setMilestones(data)
        setLoading(false)
      } catch (err) {
        console.error('Error fetching milestones:', err)
        setError('Failed to load milestones')
        setLoading(false)
      }
    }
    fetchMilestones()
  }, [])

  if (loading) {
    return <div className="container">Loading...</div>
  }

  const getStatusClass = (status: string) => {
    return status.toLowerCase()
  }

  return (
    <div>
      <div className="header">
        <h1>Milestones</h1>
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
          <h2>All Milestones</h2>
          {milestones.length > 0 ? (
            <table className="table">
              <thead>
                <tr>
                  <th>Milestone ID</th>
                  <th>Project ID</th>
                  <th>Identifier</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {milestones.map((milestone) => (
                  <tr key={milestone.milestone_id}>
                    <td>{milestone.milestone_id}</td>
                    <td>{milestone.project_id}</td>
                    <td>{milestone.identifier}</td>
                    <td>
                      <span className={`status ${getStatusClass(milestone.status)}`}>
                        {milestone.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No milestones found</p>
          )}
        </div>
      </div>
    </div>
  )
}
