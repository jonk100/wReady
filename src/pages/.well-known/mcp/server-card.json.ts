/**
 * MCP Server Card (SEP-1649)
 * Provides Model Context Protocol server discovery
 */

import type { APIRoute } from 'astro';

export const GET: APIRoute = () => {
  const baseUrl = 'https://writty.netlify.app';
  
  const serverCard = {
    $schema: 'https://modelcontextprotocol.io/schemas/server-card.json',
    serverInfo: {
      name: 'Writty',
      version: '1.0.0',
      description: 'A personal creative writing and music workbench with screenplay, song, and story management capabilities'
    },
    transport: {
      type: 'http',
      endpoint: `${baseUrl}/api/mcp`
    },
    capabilities: {
      resources: {
        supported: true,
        listChanged: true
      },
      tools: {
        supported: true
      },
      prompts: {
        supported: true,
        listChanged: false
      }
    },
    resources: [
      {
        uri: `${baseUrl}/api/projects`,
        name: 'Projects',
        description: 'Access screenplay projects and their metadata',
        mimeType: 'application/json'
      },
      {
        uri: `${baseUrl}/api/scenes`,
        name: 'Scenes',
        description: 'Access screenplay scenes with dialogue and action',
        mimeType: 'application/json'
      },
      {
        uri: `${baseUrl}/api/characters`,
        name: 'Characters',
        description: 'Access character profiles and relationships',
        mimeType: 'application/json'
      },
      {
        uri: `${baseUrl}/api/songs`,
        name: 'Songs',
        description: 'Access song lyrics, chords, and structure',
        mimeType: 'application/json'
      }
    ],
    tools: [
      {
        name: 'search_content',
        description: 'Search across all content types (scenes, characters, songs, etc.)',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query'
            },
            contentType: {
              type: 'string',
              enum: ['scenes', 'characters', 'songs', 'projects', 'all'],
              description: 'Type of content to search'
            }
          },
          required: ['query']
        }
      },
      {
        name: 'get_character_stats',
        description: 'Get statistics for a character (scenes, lines, co-stars, locations)',
        inputSchema: {
          type: 'object',
          properties: {
            characterSlug: {
              type: 'string',
              description: 'Character slug identifier'
            }
          },
          required: ['characterSlug']
        }
      },
      {
        name: 'analyze_scene',
        description: 'Analyze a scene for tension, pacing, and dramatic structure',
        inputSchema: {
          type: 'object',
          properties: {
            sceneSlug: {
              type: 'string',
              description: 'Scene slug identifier'
            }
          },
          required: ['sceneSlug']
        }
      }
    ]
  };

  return new Response(JSON.stringify(serverCard, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600'
    }
  });
};

// Made with Bob
