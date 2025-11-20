// Logs controller for real-time agent log streaming
import { Request, Response } from 'express'
import { drizzleDb } from '@/services/database-drizzle'

/**
 * GET /api/agents/:agentId/logs/stream
 * Server-Sent Events (SSE) endpoint for real-time log streaming
 *
 * Streams agent logs as they are updated in the database.
 * Automatically closes when agent completes or fails.
 */
export async function streamAgentLogs(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' })
      return
    }

    const { agentId } = req.params

    if (!agentId) {
      res.status(400).json({ error: 'Agent ID is required' })
      return
    }

    // Verify agent exists and user has access
    const agent = await drizzleDb.getAgentById(agentId, { includeProject: true })

    if (!agent) {
      res.status(404).json({ error: 'Agent not found' })
      return
    }

    // Verify user owns the project
    if (agent.project?.userId !== req.user.userId) {
      res.status(403).json({ error: 'Access denied' })
      return
    }

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('X-Accel-Buffering', 'no') // Disable nginx buffering

    // Send initial logs (convert to string if array)
    const initialLogs = Array.isArray(agent.logs)
      ? agent.logs.join('\n')
      : (agent.logs || '')
    res.write(`data: ${JSON.stringify({ logs: initialLogs, status: agent.status })}\n\n`)

    let lastLogs = initialLogs
    let lastStatus = agent.status

    // Poll for new logs every second
    const pollInterval = setInterval(async () => {
      try {
        const updatedAgent = await drizzleDb.getAgentById(agentId)

        if (!updatedAgent) {
          clearInterval(pollInterval)
          res.end()
          return
        }

        const currentLogs = Array.isArray(updatedAgent.logs)
          ? updatedAgent.logs.join('\n')
          : (updatedAgent.logs || '')
        const currentStatus = updatedAgent.status

        // Only send update if logs or status changed
        if (currentLogs !== lastLogs || currentStatus !== lastStatus) {
          res.write(`data: ${JSON.stringify({
            logs: currentLogs,
            status: currentStatus
          })}\n\n`)

          lastLogs = currentLogs
          lastStatus = currentStatus
        }

        // Stop polling if agent completed or failed
        if (currentStatus === 'completed' || currentStatus === 'failed') {
          clearInterval(pollInterval)
          // Send final message and close
          res.write(`data: ${JSON.stringify({
            logs: currentLogs,
            status: currentStatus,
            final: true
          })}\n\n`)
          res.end()
        }
      } catch (error) {
        console.error('[Logs] Error polling agent:', error)
        clearInterval(pollInterval)
        res.end()
      }
    }, 1000)

    // Clean up on client disconnect
    req.on('close', () => {
      clearInterval(pollInterval)
      console.log(`[Logs] Client disconnected from agent ${agentId} stream`)
    })

  } catch (error) {
    console.error('[Logs] Stream agent logs error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
