/**
 * Agent Skills Discovery Index (RFC v0.2.0)
 * Lists available agent skills for automated discovery
 */

import type { APIRoute } from 'astro';
import { createHash } from 'crypto';

export const GET: APIRoute = () => {
  const baseUrl = 'https://writty.netlify.app';
  
  // Helper to generate SHA256 hash
  const sha256 = (content: string) => {
    return createHash('sha256').update(content).digest('hex');
  };
  
  const skills = [
    {
      name: 'sitemap',
      type: 'discovery',
      description: 'XML sitemap for site structure and canonical URLs',
      url: `${baseUrl}/sitemap-index.xml`,
      sha256: sha256('sitemap')
    },
    {
      name: 'api-catalog',
      type: 'discovery',
      description: 'RFC 9727 API catalog for automated API discovery',
      url: `${baseUrl}/.well-known/api-catalog`,
      sha256: sha256('api-catalog')
    },
    {
      name: 'mcp-server-card',
      type: 'integration',
      description: 'Model Context Protocol server card for agent integration',
      url: `${baseUrl}/.well-known/mcp/server-card.json`,
      sha256: sha256('mcp-server-card')
    },
    {
      name: 'content-search',
      type: 'capability',
      description: 'Search across screenplay scenes, characters, songs, and stories',
      url: `${baseUrl}/api/search`,
      sha256: sha256('content-search')
    },
    {
      name: 'character-analysis',
      type: 'capability',
      description: 'Analyze character statistics, relationships, and story presence',
      url: `${baseUrl}/api/characters`,
      sha256: sha256('character-analysis')
    },
    {
      name: 'scene-analysis',
      type: 'capability',
      description: 'Analyze screenplay scenes for tension, pacing, and dramatic structure',
      url: `${baseUrl}/api/scenes`,
      sha256: sha256('scene-analysis')
    },
    {
      name: 'music-theory',
      type: 'capability',
      description: 'Music theory tools for chord analysis and song structure',
      url: `${baseUrl}/api/chords`,
      sha256: sha256('music-theory')
    }
  ];

  const index = {
    $schema: 'https://agentskills.io/schemas/index-v0.2.0.json',
    version: '0.2.0',
    skills
  };

  return new Response(JSON.stringify(index, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600'
    }
  });
};

// Made with Bob
