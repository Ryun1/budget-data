import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getProjects, formatAda, type Project } from '../../lib/api'
import ProjectCard from '../../components/ProjectCard'
import LoadingSpinner from '../../components/LoadingSpinner'
import StatsCard from '../../components/StatsCard'

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')

  useEffect(() => {
    async function fetchProjects() {
      setLoading(true)
      try {
        const data = await getProjects({ search: search || undefined })
        setProjects(data)
        setLoading(false)
      } catch (err) {
        console.error('Error fetching projects:', err)
        setError('Failed to load projects')
        setLoading(false)
      }
    }
    fetchProjects()
  }, [search])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearch(searchInput)
  }

  const totalMilestones = projects.reduce((sum, p) => sum + (p.milestone_count || 0), 0)

  return (
    <div>
      <div className="header">
        <h1>Vendor Contracts</h1>
        <nav className="nav">
          <Link href="/">Dashboard</Link>
          <Link href="/projects">Projects</Link>
          <Link href="/events">Fund Flow</Link>
        </nav>
      </div>

      <div className="container">
        {/* Summary Stats */}
        <div className="stats-grid">
          <StatsCard
            title="Total Projects"
            value={projects.length}
          />
          <StatsCard
            title="Total Milestones"
            value={totalMilestones}
          />
        </div>

        {/* Search */}
        <div className="card">
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              placeholder="Search by project name or ID..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="search-input"
              style={{ flex: 1 }}
            />
            <button
              type="submit"
              style={{
                padding: '0.75rem 1.5rem',
                background: '#0066cc',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Search
            </button>
            {search && (
              <button
                type="button"
                onClick={() => { setSearch(''); setSearchInput(''); }}
                style={{
                  padding: '0.75rem 1rem',
                  background: '#f5f5f5',
                  border: '1px solid #e0e0e0',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Clear
              </button>
            )}
          </form>
        </div>

        {/* Projects Grid */}
        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <div className="card">
            <p style={{ color: 'red' }}>{error}</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="card">
            <p>No projects found{search ? ` matching "${search}"` : ''}.</p>
          </div>
        ) : (
          <div className="projects-grid">
            {projects.map((project) => (
              <ProjectCard
                key={project.project_id}
                project={project}
                balance={project.current_balance || 0}
                completedMilestones={project.completed_milestones || 0}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
