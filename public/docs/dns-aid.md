# DNS for AI Discovery (DNS-AID) Configuration

This document provides instructions for configuring DNS-AID records for agent discovery at the DNS level.

## Overview

DNS for AI Discovery (DNS-AID) enables AI agents to discover services through DNS queries using SVCB/HTTPS records. This provides a decentralized, secure method for service discovery.

## Required DNS Records

### 1. Index Record (Discovery Entrypoint)

Create a SVCB record for the main discovery entrypoint:

```
_index._agents.writty.netlify.app. 3600 IN HTTPS 1 . (
    alpn=h2,h3
    endpoint=writty.netlify.app
)
```

### 2. Agent-to-Agent (A2A) Record

For direct agent-to-agent communication:

```
_a2a._agents.writty.netlify.app. 3600 IN HTTPS 1 . (
    alpn=h2,h3
    endpoint=writty.netlify.app
    port=443
)
```

### 3. MCP Service Record

For Model Context Protocol discovery:

```
_mcp._agents.writty.netlify.app. 3600 IN HTTPS 1 . (
    alpn=h2,h3
    endpoint=writty.netlify.app
    path=/.well-known/mcp/server-card.json
)
```

### 4. API Catalog Record

For API discovery:

```
_api._agents.writty.netlify.app. 3600 IN HTTPS 1 . (
    alpn=h2,h3
    endpoint=writty.netlify.app
    path=/.well-known/api-catalog
)
```

## DNSSEC Configuration

To ensure authenticated data, sign the public discovery zone with DNSSEC:

### 1. Generate DNSSEC Keys

```bash
# Generate Zone Signing Key (ZSK)
dnssec-keygen -a ECDSAP256SHA256 -n ZONE writty.netlify.app

# Generate Key Signing Key (KSK)
dnssec-keygen -a ECDSAP256SHA256 -n ZONE -f KSK writty.netlify.app
```

### 2. Sign the Zone

```bash
dnssec-signzone -o writty.netlify.app -k Kwritty.netlify.app.+013+12345.key \
  writty.netlify.app.zone Kwritty.netlify.app.+013+54321.key
```

### 3. Upload DS Records

Upload the DS (Delegation Signer) records to your domain registrar:

```
writty.netlify.app. 3600 IN DS 12345 13 2 (
    1234567890ABCDEF1234567890ABCDEF
    1234567890ABCDEF1234567890ABCDEF
)
```

## Testing DNS-AID Records

### Using dig

Test your DNS-AID records:

```bash
# Test index record
dig _index._agents.writty.netlify.app HTTPS

# Test A2A record
dig _a2a._agents.writty.netlify.app HTTPS

# Test MCP record
dig _mcp._agents.writty.netlify.app HTTPS

# Verify DNSSEC
dig +dnssec writty.netlify.app
```

### Using Python

```python
import dns.resolver

# Query DNS-AID records
resolver = dns.resolver.Resolver()
answers = resolver.resolve('_index._agents.writty.netlify.app', 'HTTPS')

for rdata in answers:
    print(f"Priority: {rdata.priority}")
    print(f"Target: {rdata.target}")
    print(f"Params: {rdata.params}")
```

## Service Parameters

### Supported ALPN Values

- `h2` - HTTP/2
- `h3` - HTTP/3
- `http/1.1` - HTTP/1.1

### Custom Parameters

You can add custom parameters for agent-specific configuration:

```
_custom._agents.writty.netlify.app. 3600 IN HTTPS 1 . (
    alpn=h2,h3
    endpoint=writty.netlify.app
    key65000=value  # Custom parameter
)
```

## Netlify DNS Configuration

If using Netlify DNS, configure through the Netlify UI or API:

### Via Netlify UI

1. Go to your site's DNS settings
2. Add new DNS records with type "HTTPS"
3. Configure the SVCB parameters

### Via Netlify API

```bash
curl -X POST https://api.netlify.com/api/v1/dns_zones/ZONE_ID/dns_records \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "HTTPS",
    "hostname": "_index._agents",
    "value": "1 . alpn=h2,h3 endpoint=writty.netlify.app"
  }'
```

## Alternative: Using TXT Records

If your DNS provider doesn't support HTTPS/SVCB records, use TXT records as a fallback:

```
_index._agents.writty.netlify.app. 3600 IN TXT (
    "v=dnsaid1"
    "endpoint=https://writty.netlify.app"
    "alpn=h2,h3"
    "path=/.well-known/agent-skills/index.json"
)
```

## Security Considerations

1. **Always use DNSSEC** to prevent DNS spoofing
2. **Rotate DNSSEC keys** regularly (every 3-6 months)
3. **Monitor DNS queries** for unusual patterns
4. **Use short TTLs** during initial setup for quick updates
5. **Implement rate limiting** on discovery endpoints

## Verification Checklist

- [ ] HTTPS/SVCB records created for all service types
- [ ] DNSSEC enabled and zone signed
- [ ] DS records uploaded to registrar
- [ ] Records resolve correctly via dig
- [ ] DNSSEC validation passes
- [ ] Endpoints return valid responses
- [ ] Rate limiting configured
- [ ] Monitoring alerts set up

## Resources

- [DNS-AID Draft Specification](https://datatracker.ietf.org/doc/draft-mozleywilliams-dnsop-dnsaid/)
- [RFC 9460 - SVCB and HTTPS Records](https://www.rfc-editor.org/rfc/rfc9460)
- [DNSSEC Guide](https://www.icann.org/resources/pages/dnssec-what-is-it-why-important-2019-03-05-en)

## Support

For DNS-AID configuration assistance:
- Check the [Agent Skills Discovery Index](/.well-known/agent-skills/index.json)
- Review the [API Catalog](/.well-known/api-catalog)
- Contact: support@writty.netlify.app