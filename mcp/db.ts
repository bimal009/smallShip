import { McpServer } from '@modelcontextprotocol/server';
import { z } from 'zod';
import { getOwnedApp } from './core/apps';
import { generateAndMigrate } from '@/core/db';

export function registerDbTools(server: McpServer) {
  server.registerTool(
    'generate-and-migrate',
    {
      description: "Generate database migrations and then apply them in an app's sandbox. Migration runs only if generation succeeds.",
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

        const result = await generateAndMigrate(appId)
        return {
          isError: result.exitCode !== 0,
          content: [{ type: 'text', text: JSON.stringify(result) }],
        }
      } catch (error) {
        console.error('Failed to generate and migrate database:', error)
        return {
          isError: true,
          content: [{ type: 'text', text: 'Failed to generate and migrate database' }],
        }
      }
    }
  )
}
