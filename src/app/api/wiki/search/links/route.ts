import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// API for internal link discovery and management
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const pageId = searchParams.get("pageId");
    const action = searchParams.get("action") || "analyze";

    if (action === "analyze" && pageId) {
      // Analyze internal links for a specific page
      const page = await prisma.page.findUnique({
        where: { id: pageId },
        include: {
          currentVersion: {
            select: { contentMarkdown: true }
          }
        }
      });

      if (!page) {
        return NextResponse.json({ error: "Page not found" }, { status: 404 });
      }

      const content = page.currentVersion?.contentMarkdown || "";
      const linkAnalysis = analyzeInternalLinks(content);

      // Find existing pages that match the discovered links
      const existingPages = await Promise.all(
        linkAnalysis.links.map(async (link) => {
          const matchingPage = await prisma.page.findFirst({
            where: {
              OR: [
                { title: { equals: link.text, mode: "insensitive" } },
                { slug: { equals: link.slug, mode: "insensitive" } },
                { path: { equals: `/${link.slug}`, mode: "insensitive" } }
              ]
            },
            select: { id: true, title: true, slug: true, path: true, status: true }
          });

          return {
            ...link,
            target: matchingPage,
            exists: !!matchingPage,
            accessible: matchingPage ? 
              (matchingPage.status === 'PUBLISHED' || user.role === 'ADMIN') : 
              false
          };
        })
      );

      return NextResponse.json({
        pageId,
        analysis: {
          ...linkAnalysis,
          links: existingPages
        }
      });
    }

    if (action === "orphans") {
      // Find orphaned pages (no incoming links)
      const orphanQuery = `
        SELECT 
          p.id,
          p.title,
          p.slug,
          p.path,
          p.status,
          p."createdAt",
          p."updatedAt",
          p."viewCount",
          COALESCE(incoming_count, 0) as incoming_links,
          COALESCE(outgoing_count, 0) as outgoing_links
        FROM "Page" p
        LEFT JOIN (
          SELECT 
            target_page.id as page_id,
            COUNT(*) as incoming_count
          FROM "Page" source_page
          JOIN "PageVersion" pv ON source_page."currentVersionId" = pv.id
          CROSS JOIN LATERAL (
            SELECT unnest(regexp_matches(
              COALESCE(pv."contentMarkdown", ''), 
              '\\[\\[([^\\]]+)\\]\\]', 
              'g'
            )) as link_text
          ) as link_matches
          JOIN "Page" target_page ON (
            LOWER(target_page.title) = LOWER(link_matches.link_text)
            OR target_page.slug = regexp_replace(LOWER(link_matches.link_text), '[^a-z0-9]+', '-', 'g')
          )
          GROUP BY target_page.id
        ) incoming_links ON p.id = incoming_links.page_id
        LEFT JOIN (
          SELECT 
            source_page.id as page_id,
            COUNT(*) as outgoing_count
          FROM "Page" source_page
          JOIN "PageVersion" pv ON source_page."currentVersionId" = pv.id
          CROSS JOIN LATERAL (
            SELECT unnest(regexp_matches(
              COALESCE(pv."contentMarkdown", ''), 
              '\\[\\[([^\\]]+)\\]\\]', 
              'g'
            )) as link_text
          ) as link_matches
          GROUP BY source_page.id
        ) outgoing_links ON p.id = outgoing_links.page_id
        WHERE COALESCE(incoming_count, 0) = 0
        ${user.role !== 'ADMIN' ? `
          AND (
            p.status = 'PUBLISHED' 
            OR p."createdById" = $1
          )
        ` : ''}
        ORDER BY p."viewCount" DESC, p."updatedAt" DESC
        LIMIT 50
      `;

      const orphans = await prisma.$queryRawUnsafe(
        orphanQuery, 
        ...(user.role !== 'ADMIN' ? [user.id] : [])
      );

      return NextResponse.json({ 
        orphans: orphans || [],
        count: (orphans as any[])?.length || 0
      });
    }

    if (action === "broken") {
      // Find broken internal links
      const brokenLinksQuery = `
        WITH link_analysis AS (
          SELECT 
            p.id as source_page_id,
            p.title as source_title,
            p.slug as source_slug,
            unnest(regexp_matches(
              COALESCE(pv."contentMarkdown", ''), 
              '\\[\\[([^\\]]+)\\]\\]', 
              'g'
            )) as link_text
          FROM "Page" p
          JOIN "PageVersion" pv ON p."currentVersionId" = pv.id
          ${user.role !== 'ADMIN' ? `
            WHERE (
              p.status = 'PUBLISHED' 
              OR p."createdById" = $1
            )
          ` : ''}
        )
        SELECT 
          la.source_page_id,
          la.source_title,
          la.source_slug,
          la.link_text,
          CASE 
            WHEN tp.id IS NULL THEN 'missing'
            WHEN tp.status != 'PUBLISHED' AND $${user.role !== 'ADMIN' ? 2 : 1} != 'ADMIN' THEN 'inaccessible'
            ELSE 'valid'
          END as link_status
        FROM link_analysis la
        LEFT JOIN "Page" tp ON (
          LOWER(tp.title) = LOWER(la.link_text)
          OR tp.slug = regexp_replace(LOWER(la.link_text), '[^a-z0-9]+', '-', 'g')
        )
        WHERE tp.id IS NULL 
          OR (tp.status != 'PUBLISHED' AND $${user.role !== 'ADMIN' ? 2 : 1} != 'ADMIN')
        ORDER BY la.source_title, la.link_text
        LIMIT 100
      `;

      const brokenLinks = await prisma.$queryRawUnsafe(
        brokenLinksQuery,
        ...(user.role !== 'ADMIN' ? [user.id, user.role] : [user.role])
      );

      return NextResponse.json({
        brokenLinks: brokenLinks || [],
        count: (brokenLinks as any[])?.length || 0
      });
    }

    if (action === "popular") {
      // Find most linked-to pages
      const popularQuery = `
        SELECT 
          target_page.id,
          target_page.title,
          target_page.slug,
          target_page.path,
          target_page.status,
          target_page."viewCount",
          COUNT(*) as incoming_links_count,
          array_agg(DISTINCT source_page.title) as linking_pages
        FROM "Page" source_page
        JOIN "PageVersion" pv ON source_page."currentVersionId" = pv.id
        CROSS JOIN LATERAL (
          SELECT unnest(regexp_matches(
            COALESCE(pv."contentMarkdown", ''), 
            '\\[\\[([^\\]]+)\\]\\]', 
            'g'
          )) as link_text
        ) as link_matches
        JOIN "Page" target_page ON (
          LOWER(target_page.title) = LOWER(link_matches.link_text)
          OR target_page.slug = regexp_replace(LOWER(link_matches.link_text), '[^a-z0-9]+', '-', 'g')
        )
        ${user.role !== 'ADMIN' ? `
          WHERE (
            target_page.status = 'PUBLISHED' 
            OR target_page."createdById" = $1
          )
        ` : ''}
        GROUP BY target_page.id, target_page.title, target_page.slug, target_page.path, target_page.status, target_page."viewCount"
        ORDER BY incoming_links_count DESC, target_page."viewCount" DESC
        LIMIT 20
      `;

      const popularPages = await prisma.$queryRawUnsafe(
        popularQuery,
        ...(user.role !== 'ADMIN' ? [user.id] : [])
      );

      return NextResponse.json({
        popularPages: popularPages || [],
        count: (popularPages as any[])?.length || 0
      });
    }

    return NextResponse.json({ error: "Invalid action parameter" }, { status: 400 });

  } catch (error) {
    console.error("Error in link analysis API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Helper function to analyze internal links in content
function analyzeInternalLinks(content: string) {
  const wikiLinkRegex = /\[\[([^\]]+)\]\]/g;
  const links: any[] = [];
  const linkCounts = new Map<string, number>();
  let match;

  // Extract all [[wiki links]]
  while ((match = wikiLinkRegex.exec(content)) !== null) {
    const fullMatch = match[0];
    const linkText = match[1].trim();
    
    // Handle links with display text: [[Page Title|Display Text]]
    const [targetPage, displayText] = linkText.includes('|') 
      ? linkText.split('|').map(s => s.trim())
      : [linkText, linkText];

    const slug = targetPage
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-');

    const linkData = {
      text: targetPage,
      displayText,
      slug,
      position: match.index,
      fullMatch
    };

    links.push(linkData);

    // Count occurrences
    const key = targetPage.toLowerCase();
    linkCounts.set(key, (linkCounts.get(key) || 0) + 1);
  }

  // Find potential links (CamelCase words, capitalized phrases)
  const potentialLinkRegex = /\b[A-Z][a-z]+(?:[A-Z][a-z]+)+\b/g;
  const potentialLinks: string[] = [];
  
  while ((match = potentialLinkRegex.exec(content)) !== null) {
    const word = match[0];
    if (!links.some(link => link.text === word)) {
      potentialLinks.push(word);
    }
  }

  return {
    totalLinks: links.length,
    uniqueLinks: linkCounts.size,
    links,
    linkCounts: Object.fromEntries(linkCounts),
    potentialLinks: [...new Set(potentialLinks)].slice(0, 10)
  };
}