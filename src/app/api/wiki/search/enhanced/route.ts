import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// Enhanced search with PostgreSQL full-text search and internal link analysis
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
    const query = searchParams.get("q");
    const tags = searchParams.get("tags")?.split(",").filter(Boolean) || [];
    const status = searchParams.get("status");
    const author = searchParams.get("author");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
    const includeContent = searchParams.get("includeContent") === "true";
    const searchMode = searchParams.get("mode") || "relevance"; // relevance, date, popularity

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ error: "Query parameter required" }, { status: 400 });
    }

    const cleanQuery = query.trim().replace(/[^\w\s\-]/g, "").slice(0, 100);
    
    const searchStartTime = Date.now();
    
    const results: any = {
      pages: [],
      query: cleanQuery,
      total: 0,
      searchTime: 0,
      mode: searchMode
    };

    try {
      // Safe ORDER BY whitelist
      const orderByMap = {
        date: 'p."updatedAt" DESC',
        popularity: 'p."viewCount" DESC, search_rank DESC',
        relevance: 'search_rank DESC, p."updatedAt" DESC'
      };
      const orderByClause = orderByMap[searchMode as keyof typeof orderByMap] || orderByMap.relevance;

      // Execute search query with all filters properly implemented
      const pages = await prisma.$queryRaw`
        SELECT 
          p.id,
          p.title,
          p.slug,
          p.path,
          p.status,
          p.summary,
          p."createdAt",
          p."updatedAt",
          p."viewCount",
          u.name as author_name,
          u.email as author_email,
          pv.title as version_title,
          pv."contentMarkdown",
          pv."createdAt" as version_created_at,
          GREATEST(
            ts_rank_cd(
              setweight(to_tsvector('english', COALESCE(p.title, '')), 'A') ||
              setweight(to_tsvector('english', COALESCE(p.summary, '')), 'B') ||
              setweight(to_tsvector('english', COALESCE(pv."contentMarkdown", '')), 'C'),
              plainto_tsquery('english', ${cleanQuery})
            ),
            CASE WHEN LOWER(p.title) LIKE LOWER('%' || ${cleanQuery} || '%') THEN 0.5 ELSE 0 END,
            0.2 / (EXTRACT(EPOCH FROM (NOW() - p."updatedAt")) / 86400 + 1)
          ) as search_rank,
          ts_headline('english', 
            COALESCE(pv."contentMarkdown", ''), 
            plainto_tsquery('english', ${cleanQuery}),
            'StartSel=**,StopSel=**,MaxWords=30,MinWords=10,ShortWord=3'
          ) as snippet,
          (
            SELECT COUNT(*)
            FROM regexp_matches(COALESCE(pv."contentMarkdown", ''), '\\[\\[[^\\]]+\\]\\]', 'g') as links
          ) as internal_links_count
        FROM "Page" p
        LEFT JOIN "PageVersion" pv ON p."currentVersionId" = pv.id
        LEFT JOIN "User" u ON p."createdById" = u.id
        WHERE (
          (
            setweight(to_tsvector('english', COALESCE(p.title, '')), 'A') ||
            setweight(to_tsvector('english', COALESCE(p.summary, '')), 'B') ||
            setweight(to_tsvector('english', COALESCE(pv."contentMarkdown", '')), 'C')
          ) @@ plainto_tsquery('english', ${cleanQuery})
          OR LOWER(p.title) LIKE LOWER('%' || ${cleanQuery} || '%')
          OR LOWER(COALESCE(p.summary, '')) LIKE LOWER('%' || ${cleanQuery} || '%')
          OR LOWER(COALESCE(pv."contentMarkdown", '')) LIKE LOWER('%' || ${cleanQuery} || '%')
        )
        ${user.role !== "ADMIN" ? Prisma.sql`
          AND (
            p.status = 'PUBLISHED'
            OR p."createdById" = ${user.id}
            OR EXISTS (
              SELECT 1 FROM "PagePermission" pp 
              WHERE pp."pageId" = p.id 
              AND (
                (pp."userId" = ${user.id} AND pp."canRead" = true)
                OR (pp.role = ${user.role} AND pp."canRead" = true)
              )
            )
          )
        ` : Prisma.empty}
        ${tags.length > 0 ? Prisma.sql`
          AND EXISTS (
            SELECT 1 FROM "PageTag" pt 
            JOIN "Tag" t ON pt."tagId" = t.id 
            WHERE pt."pageId" = p.id 
            AND LOWER(t.name) = ANY(${tags.map(tag => tag.toLowerCase())}::text[])
          )
        ` : Prisma.empty}
        ${status ? Prisma.sql`AND p.status = ${status}` : Prisma.empty}
        ${author ? Prisma.sql`AND p."createdById" = ${author}` : Prisma.empty}
        ${dateFrom ? Prisma.sql`AND p."createdAt" >= ${dateFrom}::timestamp` : Prisma.empty}
        ${dateTo ? Prisma.sql`AND p."createdAt" <= ${dateTo}::timestamp` : Prisma.empty}
        ORDER BY ${Prisma.raw(orderByClause)}
        LIMIT ${limit}
      `;

      // Process search results
      results.pages = (pages as any[]).map(page => ({
        id: page.id,
        title: page.title,
        slug: page.slug,
        path: page.path,
        status: page.status,
        summary: page.summary,
        snippet: page.snippet || createFallbackSnippet(page.contentMarkdown || '', cleanQuery, 150),
        searchRank: Number(page.search_rank) || 0,
        createdAt: page.createdAt,
        updatedAt: page.updatedAt,
        viewCount: page.viewCount || 0,
        internalLinksCount: page.internal_links_count || 0,
        author: {
          name: page.author_name,
          email: page.author_email
        },
        type: "page",
        ...(includeContent && { content: page.contentMarkdown })
      }));

      results.total = results.pages.length;

    } catch (dbError) {
      console.error("Full-text search failed, falling back to basic search:", dbError);
      
      // Fallback to basic search if full-text search fails
      const basicResults = await basicSearch(user, cleanQuery, tags, status, limit);
      results.pages = basicResults;
      results.total = basicResults.length;
      results.fallback = true;
    }

    // Add search suggestions and analytics
    if (cleanQuery.length >= 2) {
      // Tag suggestions
      const tagSuggestions = await prisma.tag.findMany({
        where: {
          name: { contains: cleanQuery, mode: "insensitive" }
        },
        select: { name: true, _count: { select: { pages: true } } },
        orderBy: { pages: { _count: "desc" } },
        take: 5
      });

      results.tagSuggestions = tagSuggestions.map(tag => ({
        name: tag.name,
        count: tag._count.pages
      }));

      // Related pages (similar titles or content)
      const relatedPages = await prisma.page.findMany({
        where: {
          AND: [
            {
              OR: [
                { title: { contains: cleanQuery, mode: "insensitive" } },
                { summary: { contains: cleanQuery, mode: "insensitive" } }
              ]
            },
            { id: { notIn: results.pages.map((p: any) => p.id) } },
            user.role !== "ADMIN" ? {
              OR: [
                { status: "PUBLISHED" },
                { createdById: user.id }
              ]
            } : {}
          ]
        },
        select: { id: true, title: true, slug: true, path: true, summary: true },
        orderBy: { viewCount: "desc" },
        take: 3
      });

      results.relatedPages = relatedPages;
    }

    results.searchTime = Date.now() - searchStartTime;

    return NextResponse.json(results);

  } catch (error) {
    console.error("Error in enhanced search:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Fallback basic search function
async function basicSearch(user: any, query: string, tags: string[], status: string | null, limit: number) {
  const whereClause: any = {
    OR: [
      { title: { contains: query, mode: "insensitive" } },
      { summary: { contains: query, mode: "insensitive" } },
      { 
        currentVersion: {
          contentMarkdown: { contains: query, mode: "insensitive" }
        }
      }
    ]
  };

  if (user.role !== "ADMIN") {
    whereClause.AND = [{
      OR: [
        { status: "PUBLISHED" },
        { createdById: user.id },
        {
          permissions: {
            some: {
              OR: [
                { userId: user.id, canRead: true },
                { role: user.role, canRead: true }
              ]
            }
          }
        }
      ]
    }];
    
    if (status) {
      whereClause.AND.push({ status });
    }
  } else if (status) {
    whereClause.status = status;
  }

  if (tags.length > 0) {
    whereClause.tags = {
      some: {
        tag: { name: { in: tags, mode: "insensitive" } }
      }
    };
  }

  const pages = await prisma.page.findMany({
    where: whereClause,
    include: {
      createdBy: { select: { name: true, email: true } },
      currentVersion: { 
        select: { 
          title: true, 
          contentMarkdown: true, 
          createdAt: true 
        } 
      },
      tags: { include: { tag: true } }
    },
    orderBy: [
      { viewCount: "desc" },
      { updatedAt: "desc" }
    ],
    take: limit
  });

  return pages.map(page => {
    const content = page.currentVersion?.contentMarkdown || "";
    const snippet = createFallbackSnippet(content, query, 150);
    
    return {
      id: page.id,
      title: page.title,
      slug: page.slug,
      path: page.path,
      status: page.status,
      snippet,
      author: page.createdBy,
      createdAt: page.createdAt,
      updatedAt: page.updatedAt,
      viewCount: page.viewCount,
      internalLinksCount: (content.match(/\[\[[^\]]+\]\]/g) || []).length,
      tags: page.tags.map((pt: any) => pt.tag),
      type: "page"
    };
  });
}

// Fallback snippet generation
function createFallbackSnippet(text: string, query: string, maxLength: number): string {
  if (!text || !query) return "";

  const words = query.toLowerCase().split(/\s+/);
  const lowerText = text.toLowerCase();
  
  let bestPosition = 0;
  let bestScore = 0;
  
  for (const word of words) {
    const position = lowerText.indexOf(word);
    if (position !== -1) {
      const score = (lowerText.match(new RegExp(word, 'g')) || []).length / (position + 1);
      if (score > bestScore) {
        bestScore = score;
        bestPosition = position;
      }
    }
  }

  const start = Math.max(0, bestPosition - Math.floor(maxLength / 2));
  const end = Math.min(text.length, start + maxLength);
  let snippet = text.substring(start, end);

  if (start > 0) snippet = "..." + snippet;
  if (end < text.length) snippet = snippet + "...";

  // Highlight search terms in snippet
  words.forEach(word => {
    const regex = new RegExp(`(${word})`, 'gi');
    snippet = snippet.replace(regex, '**$1**');
  });

  return snippet.trim();
}