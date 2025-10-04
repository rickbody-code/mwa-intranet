import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Improved markdown conversion function - handles all TipTap node types
function convertToMarkdown(doc: any): string {
  if (!doc || !doc.content || doc.content.length === 0) return '';
  
  function extractText(node: any): string {
    if (!node) return '';
    
    if (node.type === 'text') {
      return node.text || '';
    }
    
    if (node.type === 'hardBreak') {
      return '\n';
    }
    
    if (node.content && Array.isArray(node.content)) {
      return node.content.map(extractText).join('');
    }
    
    return '';
  }
  
  function processNode(node: any, indent: string = ''): string {
    if (!node) return '';
    
    switch (node.type) {
      case 'heading':
        const level = '#'.repeat(node.attrs?.level || 1);
        const headingText = extractText(node);
        return `${level} ${headingText}\n\n`;
        
      case 'paragraph':
        const paragraphText = extractText(node);
        return paragraphText ? `${paragraphText}\n\n` : '\n';
        
      case 'bulletList':
        return (node.content || []).map((item: any) => {
          const itemText = extractText(item);
          return `${indent}- ${itemText}`;
        }).join('\n') + '\n\n';
        
      case 'orderedList':
        return (node.content || []).map((item: any, index: number) => {
          const itemText = extractText(item);
          return `${indent}${index + 1}. ${itemText}`;
        }).join('\n') + '\n\n';
        
      case 'taskList':
        return (node.content || []).map((item: any) => {
          const checked = item.attrs?.checked ? '[x]' : '[ ]';
          const itemText = extractText(item);
          return `${indent}- ${checked} ${itemText}`;
        }).join('\n') + '\n\n';
        
      case 'blockquote':
        const quoteText = extractText(node);
        return `> ${quoteText}\n\n`;
        
      case 'codeBlock':
        const codeText = extractText(node);
        const language = node.attrs?.language || '';
        return `\`\`\`${language}\n${codeText}\n\`\`\`\n\n`;
        
      case 'table':
        const rows = node.content || [];
        const tableText = rows.map((row: any) => {
          const cells = row.content || [];
          return '| ' + cells.map((cell: any) => {
            const cellText = extractText(cell).replace(/\n/g, ' ').trim();
            return cellText || ' ';
          }).join(' | ') + ' |';
        }).join('\n');
        return tableText + '\n\n';
        
      case 'horizontalRule':
        return '---\n\n';
        
      case 'image':
        const src = node.attrs?.src || '';
        const alt = node.attrs?.alt || 'image';
        return `![${alt}](${src})\n\n`;
        
      case 'hardBreak':
        return '\n';
        
      case 'text':
        return node.text || '';
        
      default:
        // For unknown types, try to extract text content recursively
        if (node.content && Array.isArray(node.content)) {
          return node.content.map((child: any) => processNode(child, indent)).join('');
        }
        return extractText(node);
    }
  }
  
  return doc.content.map((node: any) => processNode(node)).join('');
}

async function regenerateAllMarkdown() {
  try {
    console.log('Starting markdown regeneration...');
    
    // Get all page versions
    const versions = await prisma.pageVersion.findMany({
      select: {
        id: true,
        contentJSON: true,
        contentMarkdown: true,
      }
    });
    
    console.log(`Found ${versions.length} versions to process`);
    
    let updated = 0;
    let skipped = 0;
    
    for (const version of versions) {
      try {
        const newMarkdown = convertToMarkdown(version.contentJSON);
        
        // Only update if markdown actually changed
        if (newMarkdown !== version.contentMarkdown) {
          await prisma.pageVersion.update({
            where: { id: version.id },
            data: { contentMarkdown: newMarkdown }
          });
          updated++;
          console.log(`✓ Updated version ${version.id}`);
        } else {
          skipped++;
        }
      } catch (err) {
        console.error(`✗ Failed to update version ${version.id}:`, err);
      }
    }
    
    console.log('\n=== Regeneration Complete ===');
    console.log(`Updated: ${updated}`);
    console.log(`Skipped: ${skipped}`);
    console.log(`Total: ${versions.length}`);
    
  } catch (error) {
    console.error('Error regenerating markdown:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

regenerateAllMarkdown();
