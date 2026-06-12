/**
 * Astro Middleware
 * Handles Link headers for agent discovery and Markdown content negotiation
 */

import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware(async (context, next) => {
  const { request, url } = context;
  const baseUrl = 'https://writty.netlify.app';
  
  // Get the response
  const response = await next();
  
  // Clone response to modify headers
  const newResponse = response.clone();
  
  // Add Link headers for agent discovery on homepage
  if (url.pathname === '/' || url.pathname === '/index.html') {
    const linkHeaders = [
      `<${baseUrl}/.well-known/api-catalog>; rel="api-catalog"`,
      `<${baseUrl}/.well-known/openid-configuration>; rel="openid-configuration"`,
      `<${baseUrl}/.well-known/oauth-protected-resource>; rel="oauth-protected-resource"`,
      `<${baseUrl}/.well-known/mcp/server-card.json>; rel="mcp-server-card"`,
      `<${baseUrl}/.well-known/agent-skills/index.json>; rel="agent-skills"`,
      `<${baseUrl}/auth.md>; rel="service-doc"; type="text/markdown"`,
      `<${baseUrl}/api.md>; rel="service-doc"; type="text/markdown"`,
      `<${baseUrl}/sitemap-index.xml>; rel="sitemap"; type="application/xml"`
    ];
    
    // Add each Link header
    linkHeaders.forEach(link => {
      newResponse.headers.append('Link', link);
    });
  }
  
  // Handle Markdown for Agents content negotiation
  const acceptHeader = request.headers.get('Accept') || '';
  const isHtmlResponse = newResponse.headers.get('Content-Type')?.includes('text/html');
  
  if (acceptHeader.includes('text/markdown') && isHtmlResponse) {
    // Agent requested markdown, convert HTML to markdown
    const html = await newResponse.text();
    const markdown = convertHtmlToMarkdown(html);
    
    return new Response(markdown, {
      status: newResponse.status,
      statusText: newResponse.statusText,
      headers: {
        ...Object.fromEntries(newResponse.headers),
        'Content-Type': 'text/markdown; charset=utf-8',
        'X-Markdown-Tokens': 'true', // Indicate token support
        'Vary': 'Accept' // Important for caching
      }
    });
  }
  
  return newResponse;
});

/**
 * Convert HTML to Markdown
 * Basic conversion for agent consumption
 */
function convertHtmlToMarkdown(html: string): string {
  let markdown = html;
  
  // Remove script and style tags
  markdown = markdown.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  markdown = markdown.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  
  // Convert headings
  markdown = markdown.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n');
  markdown = markdown.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n');
  markdown = markdown.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n');
  markdown = markdown.replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n\n');
  markdown = markdown.replace(/<h5[^>]*>(.*?)<\/h5>/gi, '##### $1\n\n');
  markdown = markdown.replace(/<h6[^>]*>(.*?)<\/h6>/gi, '###### $1\n\n');
  
  // Convert paragraphs
  markdown = markdown.replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n');
  
  // Convert links
  markdown = markdown.replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)');
  
  // Convert strong/bold
  markdown = markdown.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**');
  markdown = markdown.replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**');
  
  // Convert emphasis/italic
  markdown = markdown.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*');
  markdown = markdown.replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*');
  
  // Convert lists
  markdown = markdown.replace(/<ul[^>]*>(.*?)<\/ul>/gis, (match, content) => {
    return content.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n') + '\n';
  });
  
  markdown = markdown.replace(/<ol[^>]*>(.*?)<\/ol>/gis, (match, content) => {
    let counter = 1;
    return content.replace(/<li[^>]*>(.*?)<\/li>/gi, () => {
      return `${counter++}. $1\n`;
    }) + '\n';
  });
  
  // Convert code blocks
  markdown = markdown.replace(/<pre[^>]*><code[^>]*>(.*?)<\/code><\/pre>/gis, '```\n$1\n```\n\n');
  markdown = markdown.replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`');
  
  // Convert line breaks
  markdown = markdown.replace(/<br\s*\/?>/gi, '\n');
  
  // Remove remaining HTML tags
  markdown = markdown.replace(/<[^>]+>/g, '');
  
  // Decode HTML entities
  markdown = markdown.replace(/&nbsp;/g, ' ');
  markdown = markdown.replace(/&/g, '&');
  markdown = markdown.replace(/</g, '<');
  markdown = markdown.replace(/>/g, '>');
  markdown = markdown.replace(/"/g, '"');
  markdown = markdown.replace(/'/g, "'");
  
  // Clean up excessive whitespace
  markdown = markdown.replace(/\n{3,}/g, '\n\n');
  markdown = markdown.trim();
  
  return markdown;
}

// Made with Bob
