/**
 * OpenID Connect Discovery Metadata
 * Allows AI agents to discover authentication endpoints
 */

import type { APIRoute } from 'astro';

export const GET: APIRoute = () => {
  const baseUrl = 'https://writty.netlify.app';
  
  const config = {
    issuer: baseUrl,
    authorization_endpoint: `${baseUrl}/oauth/authorize`,
    token_endpoint: `${baseUrl}/oauth/token`,
    userinfo_endpoint: `${baseUrl}/oauth/userinfo`,
    jwks_uri: `${baseUrl}/.well-known/jwks.json`,
    registration_endpoint: `${baseUrl}/oauth/register`,
    scopes_supported: [
      'openid',
      'profile',
      'email',
      'read:content',
      'write:content',
      'read:projects',
      'write:projects',
      'read:scenes',
      'write:scenes',
      'read:characters',
      'write:characters',
      'read:songs',
      'write:songs'
    ],
    response_types_supported: [
      'code',
      'token',
      'id_token',
      'code token',
      'code id_token',
      'token id_token',
      'code token id_token'
    ],
    grant_types_supported: [
      'authorization_code',
      'implicit',
      'refresh_token',
      'client_credentials'
    ],
    subject_types_supported: ['public'],
    id_token_signing_alg_values_supported: ['RS256'],
    token_endpoint_auth_methods_supported: [
      'client_secret_basic',
      'client_secret_post',
      'private_key_jwt'
    ],
    claims_supported: [
      'sub',
      'iss',
      'aud',
      'exp',
      'iat',
      'name',
      'email',
      'email_verified'
    ],
    code_challenge_methods_supported: ['S256'],
    service_documentation: `${baseUrl}/docs/oauth`
  };

  return new Response(JSON.stringify(config, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600'
    }
  });
};

// Made with Bob
