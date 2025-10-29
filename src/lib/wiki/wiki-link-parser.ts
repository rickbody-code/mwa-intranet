/**
 * Wiki Link Parser
 * 
 * Parses [[Page Name]] syntax in TipTap content and converts them to actual links.
 * Also handles automatic page creation for non-existent pages.
 */

export interface WikiLink {
  text: string;        // The page title from [[Page Title]]
  slug: string;        // URL-friendly slug
  start: number;       // Start position in text
  end: number;         // End position in text
}

export interface ProcessedWikiLink {
  title: string;
  slug: string;
  pageId: string | null;  // null if needs to be created
  url: string;
}

/**
 * Extract wiki links from plain text
 * Finds all [[Page Name]] patterns
 */
export function extractWikiLinks(text: string): WikiLink[] {
  const wikiLinkRegex = /\[\[([^\]]+)\]\]/g;
  const links: WikiLink[] = [];
  let match;

  while ((match = wikiLinkRegex.exec(text)) !== null) {
    const title = match[1].trim();
    if (title) {
      links.push({
        text: title,
        slug: generateSlug(title),
        start: match.index,
        end: match.index + match[0].length
      });
    }
  }

  return links;
}

/**
 * Generate URL-friendly slug from page title
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-')     // Replace spaces with hyphens
    .replace(/-+/g, '-')      // Replace multiple hyphens with single
    .trim()
    .replace(/^-|-$/g, '');   // Remove leading/trailing hyphens
}

/**
 * Process TipTap JSON content and find all wiki links
 */
export function findWikiLinksInTipTapContent(content: any): WikiLink[] {
  const allLinks: WikiLink[] = [];
  
  function traverse(node: any) {
    if (!node) return;
    
    // Process text nodes
    if (node.type === 'text' && node.text) {
      const links = extractWikiLinks(node.text);
      allLinks.push(...links);
    }
    
    // Recursively process child nodes
    if (node.content && Array.isArray(node.content)) {
      node.content.forEach(traverse);
    }
  }
  
  traverse(content);
  return allLinks;
}

/**
 * Replace wiki links in TipTap content with actual link nodes
 */
export function replaceWikiLinksInContent(
  content: any, 
  linkMap: Map<string, ProcessedWikiLink>
): any {
  if (!content) return content;
  
  function processNode(node: any): any {
    if (!node) return node;
    
    // Process text nodes that might contain wiki links
    if (node.type === 'text' && node.text) {
      const wikiLinks = extractWikiLinks(node.text);
      
      if (wikiLinks.length === 0) {
        return node;
      }
      
      // Split text node into multiple nodes (text + links)
      const newNodes: any[] = [];
      let lastIndex = 0;
      
      wikiLinks.forEach(wikiLink => {
        const processedLink = linkMap.get(wikiLink.text);
        if (!processedLink) return;
        
        // Add text before the wiki link
        if (wikiLink.start > lastIndex) {
          newNodes.push({
            type: 'text',
            text: node.text.substring(lastIndex, wikiLink.start),
            ...(node.marks ? { marks: node.marks } : {})
          });
        }
        
        // Add the link node
        newNodes.push({
          type: 'text',
          text: wikiLink.text,
          marks: [
            ...(node.marks || []),
            {
              type: 'link',
              attrs: {
                href: processedLink.url,
                target: null,
                class: 'wiki-link text-blue-600 hover:text-blue-800 underline'
              }
            }
          ]
        });
        
        lastIndex = wikiLink.end;
      });
      
      // Add remaining text after last wiki link
      if (lastIndex < node.text.length) {
        newNodes.push({
          type: 'text',
          text: node.text.substring(lastIndex),
          ...(node.marks ? { marks: node.marks } : {})
        });
      }
      
      return newNodes;
    }
    
    // Recursively process child nodes
    if (node.content && Array.isArray(node.content)) {
      const newContent: any[] = [];
      
      node.content.forEach((child: any) => {
        const processed = processNode(child);
        if (Array.isArray(processed)) {
          newContent.push(...processed);
        } else {
          newContent.push(processed);
        }
      });
      
      return {
        ...node,
        content: newContent
      };
    }
    
    return node;
  }
  
  return processNode(content);
}

/**
 * Convert markdown text with wiki links to plain text with links replaced
 */
export function replaceWikiLinksInMarkdown(
  markdown: string,
  linkMap: Map<string, ProcessedWikiLink>
): string {
  const wikiLinkRegex = /\[\[([^\]]+)\]\]/g;
  
  return markdown.replace(wikiLinkRegex, (match, title) => {
    const trimmedTitle = title.trim();
    const processedLink = linkMap.get(trimmedTitle);
    
    if (processedLink) {
      return `[${trimmedTitle}](${processedLink.url})`;
    }
    
    return match; // Keep original if not found
  });
}
