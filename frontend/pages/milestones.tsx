import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Milestone {
  milestone_id: number
  project_id: number
  identifier: string
  status: string
}

export default function Milestones() {
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
    fetch(`${apiUrl}/api/milestones`)
      .then(r => r.json())
      .then(data => {
        setMilestones(data.milestones || [])
        setLoading(false)
      })
      .catch(err => {
        console.error('Error fetching milestones:', err)
        setLoading(false)
      })
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
