import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getProject, getMilestones, type Project, type Milestone } from '../../lib/api'

export default function ProjectDetail() {
  const router = useRouter()
  const { id } = router.query
  const [project, setProject] = useState<Project | null>(null)
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    
    async function fetchData() {
      try {
        const projectId = typeof id === 'string' ? parseInt(id) : Number(id)
        const [projectData, milestonesData] = await Promise.all([
          getProject(projectId),
          getMilestones()
        ])
        
        if (!projectData) {
          setError('Project not found')
          setLoading(false)
          return
        }
        
        setProject(projectData)
        // Filter milestones for this project
        const projectMilestones = milestonesData.filter(m => m.project_id === projectId)
        setMilestones(projectMilestones)
        setLoading(false)
      } catch (err) {
        console.error('Error fetching project:', err)
        setError('Failed to load project')
        setLoading(false)
      }
    }
    fetchData()
  }, [id])

  if (loading) {
    return (
      <div>
        <div className="header">
          <h1>Project Details</h1>
          <nav className="nav">
            <Link href="/">Dashboard</Link>
            <Link href="/projects">Projects</Link>
            <Link href="/transactions">Transactions</Link>
            <Link href="/milestones">Milestones</Link>
            <Link href="/vendor-contracts">Vendor Contracts</Link>
            <Link href="/events">Events</Link>
          </nav>
        </div>
        <div className="container">Loading...</div>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div>
        <div className="header">
          <h1>Project Details</h1>
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
            <p style={{ color: 'red' }}>{error || 'Project not found'}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="header">
        <h1>Project Details</h1>
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
          <h2>{project.label || project.identifier}</h2>
          <table className="table">
            <tbody>
              <tr>
                <th>Project ID</th>
                <td>{project.project_id}</td>
              </tr>
              <tr>
                <th>Identifier</th>
                <td>{project.identifier}</td>
              </tr>
              {project.label && (
                <tr>
                  <th>Label</th>
                  <td>{project.label}</td>
                </tr>
              )}
              {project.description && (
                <tr>
                  <th>Description</th>
                  <td>{project.description}</td>
                </tr>
              )}
              {project.vendor_label && (
                <tr>
                  <th>Vendor</th>
                  <td>{project.vendor_label}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {milestones.length > 0 && (
          <div className="card">
            <h2>Milestones ({milestones.length})</h2>
            <table className="table">
              <thead>
                <tr>
                  <th>Identifier</th>
                  <th>Status</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {milestones.map((milestone) => (
                  <tr key={milestone.milestone_id}>
                    <td>{milestone.identifier}</td>
                    <td>
                      <span className={`status ${milestone.status.toLowerCase()}`}>
                        {milestone.status}
                      </span>
                    </td>
                    <td>
                      {milestone.amount_lovelace 
                        ? `${(milestone.amount_lovelace / 1_000_000).toFixed(2)} ADA`
                        : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
