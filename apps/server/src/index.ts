import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import { createGitHubFeedbackIssue, type FeedbackRequestPayload } from './feedback'

export * from './feedback'

/**
 * Lightweight HTTP request handler for the Feedback backend.
 * Suitable for Node HTTP server, Cloud Functions, or Serverless functions.
 */
export async function handleFeedbackRequest(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  if (req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ success: false, error: 'Method Not Allowed' }))
    return
  }

  let body = ''
  req.on('data', (chunk: Buffer | string) => {
    body += chunk
  })

  req.on('end', async () => {
    try {
      const payload = JSON.parse(body) as FeedbackRequestPayload
      const result = await createGitHubFeedbackIssue(payload)

      if (result.success) {
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify(result))
      } else {
        res.writeHead(500, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify(result))
      }
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' })
      res.end(
        JSON.stringify({
          success: false,
          error: err instanceof Error ? err.message : 'Invalid JSON payload',
        }),
      )
    }
  })
}

// If executed directly as a standalone server:
if (require.main === module) {
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001
  const server = createServer(handleFeedbackRequest)
  server.listen(PORT, () => {
    console.log(`Lingora Feedback Server running on port ${PORT}`)
  })
}
