import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Project {
  project_id: number
  identifier: string
  label: string
  description: string
}

export default function ProjectDetail() {
  const router = useRouter()
  const { id } = router.query
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
    fetch(`${apiUrl}/api/projects/${id}`)
      .then(r => r.json())
      .then(data => {
        setProject(data)
        setLoading(false)
      })
      .catch(err => {
        console.error('Error fetching project:', err)
        setLoading(false)
      })
  }, [id])

  if (loading) {
    return <div className="container">Loading...</div>
  }

  if (!project) {
    return <div className="container">Project not found</div>
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
        </nav>
      </div>

      <div className="container">
        <div className="card">
          <h2>{project.label || project.identifier}</h2>
          <p><strong>ID:</strong> {project.project_id}</p>
          <p><strong>Identifier:</strong> {project.identifier}</p>
          {project.description && (
            <p><strong>Description:</strong> {project.description}</p>
          )}
        </div>
      </div>
    </div>
  )
}
