import { McpServer } from '@modelcontextprotocol/server';
import { z } from 'zod';
import { getOwnedApp } from './core/apps';
import { generate, migrate } from '@/core/db';
import { getSandboxContainerId } from '@/core/sandbox';

export function registerDbTools(server: McpServer) {
  server.registerTool(
    'pnpm-generate',
    {
      description: "Generate database migrations inside the app sandbox. Requires an active sandbox created via create-sandbox.",
      inputSchema: z.object({ appId: z.uuid() }).strict(),
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false },
    },
    async ({ appId }, extra) => {
      const userId = extra.http?.authInfo?.clientId
      if (!userId) {
        return { isError: true, content: [{ type: 'text', text: 'Unauthorized' }] }
      }

      try {
        const app = await getOwnedApp(appId, userId)
        if (!app) {
          return { isError: true, content: [{ type: 'text', text: 'App not found' }] }
        }

        const containerId = await getSandboxContainerId(appId)
        if (!containerId) {
          return { isError: true, content: [{ type: 'text', text: 'No active sandbox for this app. Call create-sandbox first.' }] }
        }

        const result = await generate(containerId)
        return {
          isError: result.exitCode !== 0,
          content: [{ type: 'text', text: JSON.stringify(result) }],
        }
      } catch (error) {
        console.error('Failed to generate database migrations', error)
        return {
          isError: true,
          content: [{ type: 'text', text: 'Failed to generate database migrations' }],
        }
      }
    }
  )

  server.registerTool(
    'pnpm-migrate',
    {
      description: "Apply database migrations inside the app sandbox. Run pnpm-generate first when new migrations are needed and verify success.",
      inputSchema: z.object({ appId: z.uuid() }).strict(),
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false },
    },
    async ({ appId }, extra) => {
      const userId = extra.http?.authInfo?.clientId
      if (!userId) {
        return { isError: true, content: [{ type: 'text', text: 'Unauthorized' }] }
      }

      try {
        const app = await getOwnedApp(appId, userId)
        if (!app) {
          return { isError: true, content: [{ type: 'text', text: 'App not found' }] }
        }

        const containerId = await getSandboxContainerId(appId)
        if (!containerId) {
          return { isError: true, content: [{ type: 'text', text: 'No active sandbox for this app. Call create-sandbox first.' }] }
        }

        const result = await migrate(containerId)
        return {
          isError: result.exitCode !== 0,
          content: [{ type: 'text', text: JSON.stringify(result) }],
        }
      } catch (error) {
        console.error('Failed to apply database migrations', error)
        return {
          isError: true,
          content: [{ type: 'text', text: 'Failed to apply database migrations' }],
        }
      }
    }
  )
}
