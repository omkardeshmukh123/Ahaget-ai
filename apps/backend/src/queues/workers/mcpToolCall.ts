import { Worker, Job, Queue } from 'bullmq';
import { getQueueConnection } from '../connection';
import { JOBS, McpToolCallPayload } from '../jobTypes';
import { callMcpToolWithPoll } from '../../services/mcp';
import { broadcastToOrgWidgets } from '../../utils/websocket';
import { prisma } from '../../utils/prisma';

let _mcpQueue: Queue | null = null;

/** Returns the MCP tool call queue, or null when Redis is not configured. */
export function getMcpQueue(): Queue | null {
  if (_mcpQueue) return _mcpQueue;
  const connection = getQueueConnection();
  if (!connection) return null;
  _mcpQueue = new Queue(JOBS.MCP_TOOL_CALL, { connection });
  return _mcpQueue;
}

export function startMcpToolCallWorker(): Worker | null {
  const connection = getQueueConnection();
  if (!connection) return null;

  const worker = new Worker<McpToolCallPayload>(
    JOBS.MCP_TOOL_CALL,
    async (job: Job<McpToolCallPayload>) => {
      const { jobId, orgId, sessionId, connectorId, connectorName, serverUrl, authType, authValue, mcpToolName, args, readOnly, allowedTools } = job.data;

      try {
        const connector = { id: connectorId, name: connectorName, serverUrl, authType, authValue, allowedTools, readOnly };
        const result = await callMcpToolWithPoll(connector, mcpToolName, args, { orgId, sessionId });

        // Store result in DB so the resume endpoint can retrieve it
        await prisma.$executeRaw`
          UPDATE mcp_pending_jobs
          SET status = 'complete',
              mcp_result = ${JSON.stringify(result.content)}::jsonb,
              updated_at = NOW()
          WHERE id = ${jobId}
        `;

        // Push via WebSocket so widget knows the result is ready
        broadcastToOrgWidgets(orgId, {
          type: 'mcp_result',
          jobId,
          ready: true,
        });
      } catch (err) {
        const msg = (err as Error).message;
        await prisma.$executeRaw`
          UPDATE mcp_pending_jobs
          SET status = 'error', error = ${msg}, updated_at = NOW()
          WHERE id = ${jobId}
        `;
        broadcastToOrgWidgets(orgId, { type: 'mcp_result', jobId, ready: false, error: msg });
      }
    },
    { connection, concurrency: 5 }
  );

  worker.on('failed', (_job, err) => {
    console.error('[queue:mcp_tool_call] job failed:', err.message);
  });

  return worker;
}
