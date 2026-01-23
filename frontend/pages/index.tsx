import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Treasury {
  instance_id: number
  script_hash: string
  payment_address: string
}

interface Project {
  project_id: number
  identifier: string
  label: string
}

export default function Home() {
  const [treasury, setTreasury] = useState<Treasury | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
    
    Promise.all([
      fetch(`${apiUrl}/api/treasury`).then(r => r.json()),
      fetch(`${apiUrl}/api/projects`).then(r => r.json())
    ]).then(([treasuryData, projectsData]) => {
      setTreasury(treasuryData)
      setProjects(projectsData.projects || [])
      setLoading(false)
    }).catch(err => {
      console.error('Error fetching data:', err)
      setLoading(false)
    })
  }, [])

  if (loading) {
    return <div className="container">Loading...</div>
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
        </nav>
      </div>

      <div className="container">
        <div className="card">
          <h2>Treasury Instance</h2>
          {treasury ? (
            <div>
              <p><strong>Payment Address:</strong> {treasury.payment_address}</p>
              <p><strong>Script Hash:</strong> {treasury.script_hash}</p>
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
