import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getProjects, type Project } from '../lib/api'

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchProjects() {
      try {
        const data = await getProjects()
        setProjects(data)
        setLoading(false)
      } catch (err) {
        console.error('Error fetching projects:', err)
        setError('Failed to load projects')
        setLoading(false)
      }
    }
    fetchProjects()
  }, [])

  if (loading) {
    return (
      <div>
        <div className="header">
          <h1>Projects</h1>
        </div>
        <div className="container">Loading...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <div className="header">
          <h1>Projects</h1>
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
        <h1>Projects</h1>
        <nav className="nav">
          <Link href="/">Dashboard</Link>
          <Link href="/projects">Projects</Link>
          <Link href="/transactions">Transactions</Link>
          <Link href="/milestones">Milestones</Link>
        </nav>
      </div>

      <div className="container">
        <div className="card">
          <h2>All Projects</h2>
          {projects.length > 0 ? (
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Identifier</th>
                  <th>Label</th>
                  <th>Vendor</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => (
                  <tr key={project.project_id}>
                    <td>{project.project_id}</td>
                    <td>{project.identifier}</td>
                    <td>{project.label || '-'}</td>
                    <td>{project.vendor_label || '-'}</td>
                    <td>
                      <Link href={`/projects/${project.project_id}`}>View Details</Link>
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
