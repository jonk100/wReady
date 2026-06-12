// WebMCP API Implementation
// Exposes site tools to AI agents via the browser
if (typeof navigator !== 'undefined' && navigator.modelContext) {
  // Define tools for AI agents
  const tools = [
    {
      name: 'search_content',
      description: 'Search across all content types including scenes, characters, songs, and stories',
      inputSchema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search query text'
          },
          contentType: {
            type: 'string',
            enum: ['scenes', 'characters', 'songs', 'projects', 'stories', 'all'],
            description: 'Type of content to search (default: all)',
            default: 'all'
          },
          limit: {
            type: 'number',
            description: 'Maximum number of results (default: 10)',
            default: 10
          }
        },
        required: ['query']
      },
      execute: async (params) => {
        const { query, contentType = 'all', limit = 10 } = params;
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&type=${contentType}&limit=${limit}`);
        return await response.json();
      }
    },
    {
      name: 'get_character_stats',
      description: 'Get detailed statistics for a character including scenes, lines, co-stars, and locations',
      inputSchema: {
        type: 'object',
        properties: {
          characterSlug: {
            type: 'string',
            description: 'Character slug identifier (e.g., "john-tavner")'
          }
        },
        required: ['characterSlug']
      },
      execute: async (params) => {
        const { characterSlug } = params;
        const response = await fetch(`/api/characters/${characterSlug}/stats`);
        return await response.json();
      }
    },
    {
      name: 'analyze_scene',
      description: 'Analyze a screenplay scene for tension, pacing, dramatic structure, and character dynamics',
      inputSchema: {
        type: 'object',
        properties: {
          sceneSlug: {
            type: 'string',
            description: 'Scene slug identifier'
          }
        },
        required: ['sceneSlug']
      },
      execute: async (params) => {
        const { sceneSlug } = params;
        const response = await fetch(`/api/scenes/${sceneSlug}/analyze`);
        return await response.json();
      }
    },
    {
      name: 'get_song_chords',
      description: 'Get chord progression and structure for a song',
      inputSchema: {
        type: 'object',
        properties: {
          songSlug: {
            type: 'string',
            description: 'Song slug identifier'
          }
        },
        required: ['songSlug']
      },
      execute: async (params) => {
        const { songSlug } = params;
        const response = await fetch(`/api/songs/${songSlug}`);
        return await response.json();
      }
    },
    {
      name: 'analyze_chord',
      description: 'Analyze a chord and get voicings, intervals, and music theory information',
      inputSchema: {
        type: 'object',
        properties: {
          chord: {
            type: 'string',
            description: 'Chord name (e.g., "Cmaj7", "Am", "G7")'
          }
        },
        required: ['chord']
      },
      execute: async (params) => {
        const { chord } = params;
        const response = await fetch(`/api/chords/analyze?chord=${encodeURIComponent(chord)}`);
        return await response.json();
      }
    },
    {
      name: 'list_projects',
      description: 'List all screenplay projects with metadata',
      inputSchema: {
        type: 'object',
        properties: {
          limit: {
            type: 'number',
            description: 'Maximum number of projects to return',
            default: 20
          }
        }
      },
      execute: async (params) => {
        const { limit = 20 } = params;
        const response = await fetch(`/api/projects?limit=${limit}`);
        return await response.json();
      }
    },
    {
      name: 'get_scene_content',
      description: 'Get the full content of a screenplay scene including dialogue and action',
      inputSchema: {
        type: 'object',
        properties: {
          sceneSlug: {
            type: 'string',
            description: 'Scene slug identifier'
          }
        },
        required: ['sceneSlug']
      },
      execute: async (params) => {
        const { sceneSlug } = params;
        const response = await fetch(`/api/scenes/${sceneSlug}`);
        return await response.json();
      }
    }
  ];

  // Provide context to AI agents
  navigator.modelContext.provideContext({
    tools: tools,
    metadata: {
      name: 'Writty',
      description: 'A personal creative writing and music workbench',
      version: '1.0.0',
      capabilities: [
        'screenplay-analysis',
        'character-statistics',
        'scene-analysis',
        'music-theory',
        'chord-analysis',
        'content-search'
      ]
    }
  });

  console.log('WebMCP tools registered:', tools.length);
}

// Made with Bob
