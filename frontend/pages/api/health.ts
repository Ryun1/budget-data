import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Simple health check - don't depend on external API for Render health checks
  res.status(200).json({ status: 'ok' })
}
