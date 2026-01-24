import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // For server-side requests, use the internal Docker network name
  // NEXT_PUBLIC_API_URL is for browser-side requests
  const apiUrl = process.env.API_URL || 'http://api:8080'

  try {
    const response = await fetch(`${apiUrl}/health`)
    if (response.ok) {
      const text = await response.text()
      res.status(200).json({ status: 'ok', api: text })
    } else {
      res.status(response.status).json({ error: 'API returned error' })
    }
  } catch (error) {
    res.status(500).json({ error: 'API health check failed', details: String(error) })
  }
}
