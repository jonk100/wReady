/**
 * frontmatterUtils.ts
 * 
 * Utilities for converting form data to frontmatter and vice versa.
 */

export interface FrontmatterField {
  name: string;
  value: string | string[] | number | boolean;
  type: 'string' | 'number' | 'boolean' | 'array' | 'date' | 'reference' | 'references';
}

/**
 * Convert form fields to YAML frontmatter string
 */
export function formToFrontmatter(fields: FrontmatterField[]): string {
  let yaml = '---\n';
  
  for (const field of fields) {
    const { name, value, type } = field;
    
    if (value === '' || value === null || value === undefined) {
      continue; // Skip empty fields
    }
    
    switch (type) {
      case 'string':
        yaml += `${name}: "${String(value).replace(/"/g, '\\"')}"\n`;
        break;
        
      case 'number':
        yaml += `${name}: ${value}\n`;
        break;
        
      case 'boolean':
        yaml += `${name}: ${value}\n`;
        break;
        
      case 'date':
        yaml += `${name}: ${value}\n`;
        break;
        
      case 'reference':
        // Single reference like: project: her-majestys-displeasure
        yaml += `${name}: ${value}\n`;
        break;
        
      case 'references':
      case 'array':
        // Array of values
        if (Array.isArray(value)) {
          if (value.length === 0) {
            yaml += `${name}: []\n`;
          } else {
            yaml += `${name}:\n`;
            value.forEach(item => {
              yaml += `  - ${item}\n`;
            });
          }
        } else {
          // Single value treated as array
          yaml += `${name}:\n  - ${value}\n`;
        }
        break;
        
      default:
        yaml += `${name}: "${String(value).replace(/"/g, '\\"')}"\n`;
    }
  }
  
  yaml += '---\n\n';
  return yaml;
}

/**
 * Parse frontmatter from markdown content
 */
export function parseFrontmatter(content: string): { frontmatter: Record<string, any>, body: string } {
  const lines = content.split('\n');
  
  if (lines[0]?.trim() !== '---') {
    return { frontmatter: {}, body: content };
  }
  
  let endIndex = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i]?.trim() === '---') {
      endIndex = i;
      break;
    }
  }
  
  if (endIndex === -1) {
    return { frontmatter: {}, body: content };
  }
  
  const frontmatterLines = lines.slice(1, endIndex);
  const body = lines.slice(endIndex + 1).join('\n');
  
  // Simple YAML parsing (basic implementation)
  const frontmatter: Record<string, any> = {};
  let currentKey = '';
  let currentArray: string[] = [];
  
  for (const line of frontmatterLines) {
    const trimmed = line.trim();
    
    if (!trimmed) continue;
    
    // Array item
    if (trimmed.startsWith('- ')) {
      currentArray.push(trimmed.substring(2).trim());
      continue;
    }
    
    // Key-value pair
    const colonIndex = trimmed.indexOf(':');
    if (colonIndex > 0) {
      // Save previous array if exists
      if (currentKey && currentArray.length > 0) {
        frontmatter[currentKey] = currentArray;
        currentArray = [];
      }
      
      currentKey = trimmed.substring(0, colonIndex).trim();
      let value = trimmed.substring(colonIndex + 1).trim();
      
      // Remove quotes
      if ((value.startsWith('"') && value.endsWith('"')) || 
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      
      // Empty array
      if (value === '[]') {
        frontmatter[currentKey] = [];
        currentKey = '';
      }
      // Boolean
      else if (value === 'true' || value === 'false') {
        frontmatter[currentKey] = value === 'true';
        currentKey = '';
      }
      // Number
      else if (!isNaN(Number(value)) && value !== '') {
        frontmatter[currentKey] = Number(value);
        currentKey = '';
      }
      // String value
      else if (value) {
        frontmatter[currentKey] = value;
        currentKey = '';
      }
      // Else it's an array that will be populated on next lines
    }
  }
  
  // Save last array if exists
  if (currentKey && currentArray.length > 0) {
    frontmatter[currentKey] = currentArray;
  }
  
  return { frontmatter, body };
}

/**
 * Generate a slug from a title
 */
export function titleToSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Create full MDX content from frontmatter fields and body
 */
export function createMDXContent(fields: FrontmatterField[], body: string = ''): string {
  const frontmatter = formToFrontmatter(fields);
  return frontmatter + body;
}

// Made with Bob
