import React from 'react'

interface StatsCardProps {
  title: string
  value: string | number
  subtitle?: string
}

export default function StatsCard({ title, value, subtitle }: StatsCardProps) {
  return (
    <div className="card" style={{ flex: 1, minWidth: '200px' }}>
      <h3 style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.5rem' }}>{title}</h3>
      <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1a1a1a' }}>{value}</div>
      {subtitle && <div style={{ fontSize: '0.875rem', color: '#999', marginTop: '0.25rem' }}>{subtitle}</div>}
    </div>
  )
}
