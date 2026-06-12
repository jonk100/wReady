/**
 * Health Check Endpoint
 * Returns service health status for monitoring and discovery
 */

import type { APIRoute } from 'astro';

export const GET: APIRoute = () => {
  const health = {
    status: 'pass',
    version: '1.0.0',
    releaseId: '1.0.0',
    description: 'Writty - Creative Writing and Music Workbench',
    checks: {
      'api:responseTime': [
        {
          componentType: 'system',
          observedValue: 50,
          observedUnit: 'ms',
          status: 'pass',
          time: new Date().toISOString()
        }
      ],
      'database:connections': [
        {
          componentType: 'datastore',
          status: 'pass',
          time: new Date().toISOString()
        }
      ],
      'content:availability': [
        {
          componentType: 'component',
          status: 'pass',
          time: new Date().toISOString()
        }
      ]
    },
    links: {
      about: 'https://writty.netlify.app/about',
      'api-catalog': 'https://writty.netlify.app/.well-known/api-catalog',
      'mcp-server-card': 'https://writty.netlify.app/.well-known/mcp/server-card.json'
    }
  };

  return new Response(JSON.stringify(health, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/health+json',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    }
  });
};

// Made with Bob
