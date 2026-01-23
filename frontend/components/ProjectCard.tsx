import React from 'react'
import Link from 'next/link'
import { type Project } from '../lib/api'

interface ProjectCardProps {
  project: Project
}

export default function ProjectCard({ project }: ProjectCardProps) {
  return (
    <div className="card" style={{ cursor: 'pointer' }}>
      <Link href={`/projects/${project.project_id}`}>
        <h3 style={{ marginBottom: '0.5rem', color: '#0066cc' }}>
          {project.label || project.identifier}
        </h3>
        <p style={{ color: '#666', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
          <strong>ID:</strong> {project.identifier}
        </p>
        {project.vendor_label && (
          <p style={{ color: '#666', fontSize: '0.875rem' }}>
            <strong>Vendor:</strong> {project.vendor_label}
          </p>
        )}
      </Link>
    </div>
  )
}
