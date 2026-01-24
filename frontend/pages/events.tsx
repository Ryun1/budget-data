import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getEvents, type Event } from '../lib/api'

export default function Events() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>('')

  useEffect(() => {
    async function fetchEvents() {
      try {
        const params = filter ? { event_type: filter } : undefined;
        const data = await getEvents(params);
        setEvents(data)
        setLoading(false)
      } catch (err) {
        console.error('Error fetching events:', err)
        setError('Failed to load events')
        setLoading(false)
      }
    }
    fetchEvents()
  }, [filter])

  if (loading) {
    return (
      <div>
        <div className="header">
          <h1>Events</h1>
          <nav className="nav">
            <Link href="/">Dashboard</Link>
            <Link href="/projects">Projects</Link>
            <Link href="/transactions">Transactions</Link>
            <Link href="/milestones">Milestones</Link>
            <Link href="/vendor-contracts">Vendor Contracts</Link>
          </nav>
        </div>
        <div className="container">Loading...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <div className="header">
          <h1>Events</h1>
          <nav className="nav">
            <Link href="/">Dashboard</Link>
            <Link href="/projects">Projects</Link>
            <Link href="/transactions">Transactions</Link>
            <Link href="/milestones">Milestones</Link>
            <Link href="/vendor-contracts">Vendor Contracts</Link>
          </nav>
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
        <h1>Events</h1>
        <nav className="nav">
          <Link href="/">Dashboard</Link>
          <Link href="/projects">Projects</Link>
          <Link href="/transactions">Transactions</Link>
          <Link href="/milestones">Milestones</Link>
          <Link href="/vendor-contracts">Vendor Contracts</Link>
        </nav>
      </div>

      <div className="container">
        <div className="card">
          <h2>All Events ({events.length})</h2>
          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="filter" style={{ marginRight: '0.5rem' }}>Filter by type:</label>
            <select 
              id="filter"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
            >
              <option value="">All</option>
              <option value="fund">Fund</option>
              <option value="withdraw">Withdraw</option>
              <option value="pause">Pause</option>
              <option value="resume">Resume</option>
              <option value="complete">Complete</option>
              <option value="modify">Modify</option>
              <option value="cancel">Cancel</option>
              <option value="sweep">Sweep</option>
            </select>
          </div>
          {events.length > 0 ? (
            <table className="table">
              <thead>
                <tr>
                  <th>Event ID</th>
                  <th>Type</th>
                  <th>Transaction ID</th>
                  <th>Project ID</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr key={event.event_id}>
                    <td>{event.event_id}</td>
                    <td>
                      <span className={`status ${event.event_type.toLowerCase()}`}>
                        {event.event_type}
                      </span>
                    </td>
                    <td>{event.tx_id}</td>
                    <td>
                      {event.project_id ? (
                        <Link href={`/projects/${event.project_id}`}>
                          {event.project_id}
                        </Link>
                      ) : (
                        '-'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No events found</p>
          )}
        </div>
      </div>
    </div>
  )
}
