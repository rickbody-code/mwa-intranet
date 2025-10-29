/**
 * Wiki Link Processor
 * 
 * Processes wiki links during page save:
 * - Finds existing pages
 * - Creates new child pages
 * - Converts [[Page Name]] to actual links
 */

import { PrismaClient } from '@prisma/client';
import {
  findWikiLinksInTipTapContent,
  replaceWikiLinksInContent,
  replaceWikiLinksInMarkdown,
  generateSlug,
  type ProcessedWikiLink,
  type WikiLink
} from './wiki-link-parser';

interface ProcessWikiLinksOptions {
  content: any;
  contentMarkdown: string;
  parentPageId: string;
  userId: string;
  tx: any; // Prisma transaction client
}

interface ProcessWikiLinksResult {
  processedContent: any;
  processedMarkdown: string;
  createdPages: Array<{ id: string; title: string; slug: string }>;
}

/**
 * Process wiki links in content during page save
 * 
 * Steps:
 * 1. Find all [[Page Name]] patterns
 * 2. Check if pages exist (child pages first, then all pages)
 * 3. Create new child pages for non-existent links
 * 4. Replace wiki links with actual links
 */
export async function processWikiLinks(
  options: ProcessWikiLinksOptions
): Promise<ProcessWikiLinksResult> {
  const { content, contentMarkdown, parentPageId, userId, tx } = options;
  
  // Find all wiki links in content
  const wikiLinks = findWikiLinksInTipTapContent(content);
  
  if (wikiLinks.length === 0) {
    return {
      processedContent: content,
      processedMarkdown: contentMarkdown,
      createdPages: []
    };
  }
  
  // Remove duplicates (same page title)
  const uniqueLinks = Array.from(
    new Map(wikiLinks.map(link => [link.text, link])).values()
  );
  
  const linkMap = new Map<string, ProcessedWikiLink>();
  const createdPages: Array<{ id: string; title: string; slug: string }> = [];
  
  // Process each unique wiki link
  for (const wikiLink of uniqueLinks) {
    const { text: title, slug } = wikiLink;
    
    // 1. First, check if a child page exists with this title/slug
    let existingPage = await tx.page.findFirst({
      where: {
        parentId: parentPageId,
        OR: [
          { title: { equals: title, mode: 'insensitive' } },
          { slug }
        ]
      },
      select: { id: true, slug: true, title: true }
    });
    
    // 2. If not a child, check if ANY page exists with this title/slug
    if (!existingPage) {
      existingPage = await tx.page.findFirst({
        where: {
          OR: [
            { title: { equals: title, mode: 'insensitive' } },
            { slug }
          ]
        },
        select: { id: true, slug: true, title: true }
      });
    }
    
    if (existingPage) {
      // Link to existing page
      linkMap.set(title, {
        title: existingPage.title,
        slug: existingPage.slug,
        pageId: existingPage.id,
        url: `/wiki/pages/${existingPage.slug}`
      });
    } else {
      // Create new child page as DRAFT
      const newPage = await tx.page.create({
        data: {
          title,
          slug: await generateUniqueSlug(tx, slug),
          path: `/${slug}`,
          parentId: parentPageId,
          status: 'DRAFT',
          summary: `Auto-created from wiki link`,
          createdById: userId,
          updatedById: userId
        }
      });
      
      // Create initial version for the new page
      const initialVersion = await tx.pageVersion.create({
        data: {
          pageId: newPage.id,
          title: newPage.title,
          contentJSON: { type: 'doc', content: [] },
          contentMarkdown: '',
          changeNote: 'Auto-created from wiki link',
          createdById: userId
        }
      });
      
      // Update page with current version
      await tx.page.update({
        where: { id: newPage.id },
        data: { currentVersionId: initialVersion.id }
      });
      
      // Log activity
      await tx.activityLog.create({
        data: {
          pageId: newPage.id,
          versionId: initialVersion.id,
          actorId: userId,
          type: 'CREATE',
          data: { source: 'wiki-link', parentPageId }
        }
      });
      
      linkMap.set(title, {
        title: newPage.title,
        slug: newPage.slug,
        pageId: newPage.id,
        url: `/wiki/pages/${newPage.slug}`
      });
      
      createdPages.push({
        id: newPage.id,
        title: newPage.title,
        slug: newPage.slug
      });
    }
  }
  
  // Replace wiki links in content
  const processedContent = replaceWikiLinksInContent(content, linkMap);
  const processedMarkdown = replaceWikiLinksInMarkdown(contentMarkdown, linkMap);
  
  return {
    processedContent,
    processedMarkdown,
    createdPages
  };
}

/**
 * Generate a unique slug by appending numbers if needed
 */
async function generateUniqueSlug(tx: any, baseSlug: string): Promise<string> {
  let slug = baseSlug;
  let counter = 1;
  
  while (true) {
    const existing = await tx.page.findUnique({
      where: { slug }
    });
    
    if (!existing) {
      return slug;
    }
    
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}
