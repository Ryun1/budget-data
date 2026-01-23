import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Project {
  project_id: number
  identifier: string
  label: string
  description: string
  vendor_label: string
}

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
    fetch(`${apiUrl}/api/projects`)
      .then(r => r.json())
      .then(data => {
        setProjects(data.projects || [])
        setLoading(false)
      })
      .catch(err => {
        console.error('Error fetching projects:', err)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return <div className="container">Loading...</div>
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
