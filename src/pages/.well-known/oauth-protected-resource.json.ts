/**
 * OAuth Protected Resource Metadata (RFC 9728)
 * Tells agents how to obtain access tokens for protected APIs
 */

import type { APIRoute } from 'astro';

export const GET: APIRoute = () => {
  const baseUrl = 'https://writty.netlify.app';
  
  const metadata = {
    resource: baseUrl,
    authorization_servers: [baseUrl],
    scopes_supported: [
      'read:content',
      'write:content',
      'read:projects',
      'write:projects',
      'read:scenes',
      'write:scenes',
      'read:characters',
      'write:characters',
      'read:songs',
      'write:songs',
      'read:locations',
      'write:locations',
      'read:plots',
      'write:plots'
    ],
    bearer_methods_supported: ['header', 'query'],
    resource_signing_alg_values_supported: ['RS256'],
    resource_documentation: `${baseUrl}/docs/api`,
    resource_policy_uri: `${baseUrl}/docs/api-policy`,
    op_policy_uri: `${baseUrl}/docs/privacy`,
    op_tos_uri: `${baseUrl}/docs/terms`
  };

  return new Response(JSON.stringify(metadata, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600'
    }
  });
};

// Made with Bob
