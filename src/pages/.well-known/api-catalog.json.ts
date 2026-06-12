/**
 * API Catalog (RFC 9727)
 * Provides automated API discovery for AI agents
 */

import type { APIRoute } from 'astro';

export const GET: APIRoute = () => {
  const baseUrl = 'https://writty.netlify.app';
  
  const catalog = {
    linkset: [
      {
        anchor: `${baseUrl}/api`,
        'service-desc': [
          {
            href: `${baseUrl}/.well-known/openapi.json`,
            type: 'application/vnd.oai.openapi+json;version=3.1'
          }
        ],
        'service-doc': [
          {
            href: `${baseUrl}/api.md`,
            type: 'text/markdown'
          }
        ],
        status: [
          {
            href: `${baseUrl}/.well-known/health`,
            type: 'application/health+json'
          }
        ]
      }
    ]
  };

  return new Response(JSON.stringify(catalog, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/linkset+json',
      'Cache-Control': 'public, max-age=3600'
    }
  });
};

// Made with Bob
