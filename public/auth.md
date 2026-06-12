# Authentication for AI Agents

This document describes how AI agents can authenticate with the Writty API.

## Overview

Writty supports OAuth 2.0 and OpenID Connect for agent authentication. Agents can register dynamically and obtain access tokens to interact with protected resources.

## Discovery Endpoints

- **OpenID Configuration**: `/.well-known/openid-configuration`
- **OAuth Authorization Server**: `/.well-known/oauth-authorization-server`
- **Protected Resource Metadata**: `/.well-known/oauth-protected-resource`

## Agent Registration

### Dynamic Client Registration

Agents can register dynamically using the registration endpoint:

```
POST /oauth/register
Content-Type: application/json

{
  "client_name": "My AI Agent",
  "redirect_uris": ["https://agent.example.com/callback"],
  "grant_types": ["authorization_code", "refresh_token"],
  "response_types": ["code"],
  "scope": "read:content write:content",
  "token_endpoint_auth_method": "client_secret_basic"
}
```

### Supported Identity Types

- **OAuth 2.0 Clients**: Standard OAuth clients with client_id and client_secret
- **Service Accounts**: Long-lived credentials for automated agents
- **API Keys**: Simple token-based authentication for read-only access

### Credential Types

- **Client Credentials**: OAuth client_id and client_secret
- **Bearer Tokens**: JWT access tokens
- **API Keys**: Static API keys for service accounts

## Authorization Flow

### Authorization Code Flow (Recommended)

1. **Authorization Request**:
   ```
   GET /oauth/authorize?
     response_type=code&
     client_id=YOUR_CLIENT_ID&
     redirect_uri=YOUR_REDIRECT_URI&
     scope=read:content write:scenes&
     state=RANDOM_STATE
   ```

2. **Token Exchange**:
   ```
   POST /oauth/token
   Content-Type: application/x-www-form-urlencoded

   grant_type=authorization_code&
   code=AUTHORIZATION_CODE&
   redirect_uri=YOUR_REDIRECT_URI&
   client_id=YOUR_CLIENT_ID&
   client_secret=YOUR_CLIENT_SECRET
   ```

### Client Credentials Flow (Service Accounts)

For automated agents without user interaction:

```
POST /oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials&
scope=read:content&
client_id=YOUR_CLIENT_ID&
client_secret=YOUR_CLIENT_SECRET
```

## Scopes

### Content Access
- `read:content` - Read all content types
- `write:content` - Create and update content

### Project Management
- `read:projects` - Read screenplay projects
- `write:projects` - Create and update projects

### Scene Management
- `read:scenes` - Read screenplay scenes
- `write:scenes` - Create and update scenes

### Character Management
- `read:characters` - Read character profiles
- `write:characters` - Create and update characters

### Song Management
- `read:songs` - Read songs and chord progressions
- `write:songs` - Create and update songs

### Location Management
- `read:locations` - Read location data
- `write:locations` - Create and update locations

### Plot Management
- `read:plots` - Read plot structures
- `write:plots` - Create and update plots

## Using Access Tokens

Include the access token in the Authorization header:

```
GET /api/scenes
Authorization: Bearer YOUR_ACCESS_TOKEN
```

Or as a query parameter (less secure):

```
GET /api/scenes?access_token=YOUR_ACCESS_TOKEN
```

## Token Refresh

Refresh tokens can be used to obtain new access tokens:

```
POST /oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=refresh_token&
refresh_token=YOUR_REFRESH_TOKEN&
client_id=YOUR_CLIENT_ID&
client_secret=YOUR_CLIENT_SECRET
```

## Token Revocation

Revoke tokens when no longer needed:

```
POST /oauth/revoke
Content-Type: application/x-www-form-urlencoded

token=TOKEN_TO_REVOKE&
token_type_hint=access_token&
client_id=YOUR_CLIENT_ID&
client_secret=YOUR_CLIENT_SECRET
```

## Security Considerations

- Always use HTTPS for all OAuth flows
- Store client secrets securely
- Use PKCE (Proof Key for Code Exchange) for public clients
- Implement proper token rotation
- Monitor and log authentication attempts
- Revoke compromised tokens immediately

## Rate Limiting

- **Authenticated requests**: 1000 requests per hour
- **Unauthenticated requests**: 60 requests per hour
- Rate limit headers are included in all responses

## Support

For authentication issues or questions:
- Documentation: `/docs/api`
- API Catalog: `/.well-known/api-catalog`
- MCP Server Card: `/.well-known/mcp/server-card.json`

## Example Agent Implementation

```javascript
// Example: Registering and authenticating an agent
const registerAgent = async () => {
  // 1. Register the agent
  const registration = await fetch('https://writty.netlify.app/oauth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_name: 'Content Analysis Agent',
      redirect_uris: ['https://agent.example.com/callback'],
      grant_types: ['client_credentials'],
      scope: 'read:content read:scenes read:characters'
    })
  });
  
  const { client_id, client_secret } = await registration.json();
  
  // 2. Obtain access token
  const tokenResponse = await fetch('https://writty.netlify.app/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      scope: 'read:content',
      client_id,
      client_secret
    })
  });
  
  const { access_token } = await tokenResponse.json();
  
  // 3. Use the token to access protected resources
  const scenes = await fetch('https://writty.netlify.app/api/scenes', {
    headers: { 'Authorization': `Bearer ${access_token}` }
  });
  
  return await scenes.json();
};
```

## Compliance

This authentication system complies with:
- RFC 6749 (OAuth 2.0)
- RFC 7591 (OAuth 2.0 Dynamic Client Registration)
- RFC 8414 (OAuth 2.0 Authorization Server Metadata)
- RFC 9728 (OAuth 2.0 Protected Resource Metadata)
- OpenID Connect Discovery 1.0