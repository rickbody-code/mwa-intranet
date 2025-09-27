import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/wiki/search - Full-text search across pages and content
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
    const tags = searchParams.get("tags")?.split(",") || [];
    const status = searchParams.get("status");
    const type = searchParams.get("type") || "all"; // all, pages, attachments
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ error: "Query parameter required" }, { status: 400 });
    }

    const results: any = {
      pages: [],
      attachments: [],
      query: query.trim(),
      total: 0
    };

    // Search pages
    if (type === "all" || type === "pages") {
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

      // Filter by status (non-admins only see published)
      if (user.role !== "ADMIN") {
        whereClause.status = "PUBLISHED";
      } else if (status) {
        whereClause.status = status;
      }

      // Filter by tags
      if (tags.length > 0) {
        whereClause.tags = {
          some: {
            tag: {
              name: { in: tags, mode: "insensitive" }
            }
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
          tags: { include: { tag: true } },
          _count: { select: { views: true } }
        },
        orderBy: [
          { viewCount: "desc" }, // Popular first
          { updatedAt: "desc" }
        ],
        take: limit
      });

      // Create search result snippets
      results.pages = pages.map(page => {
        const content = page.currentVersion?.contentMarkdown || "";
        const snippet = createSearchSnippet(content, query, 150);
        
        return {
          id: page.id,
          title: page.title,
          slug: page.slug,
          path: page.path,
          status: page.status,
          snippet,
          createdBy: page.createdBy,
          createdAt: page.createdAt,
          updatedAt: page.updatedAt,
          viewCount: page.viewCount,
          tags: page.tags.map((pt: any) => pt.tag),
          type: "page"
        };
      });
    }

    // Search attachments (by filename and extracted text)
    if (type === "all" || type === "attachments") {
      const attachments = await prisma.attachment.findMany({
        where: {
          OR: [
            { originalName: { contains: query, mode: "insensitive" } },
            { extractedText: { contains: query, mode: "insensitive" } }
          ],
          page: user.role === "ADMIN" ? {} : { status: "PUBLISHED" }
        },
        include: {
          page: { select: { title: true, slug: true, path: true } },
          uploadedBy: { select: { name: true, email: true } }
        },
        take: Math.floor(limit / 2) // Split limit between pages and attachments
      });

      results.attachments = attachments.map(attachment => {
        const snippet = attachment.extractedText 
          ? createSearchSnippet(attachment.extractedText, query, 100)
          : "";

        return {
          id: attachment.id,
          filename: attachment.filename,
          originalName: attachment.originalName,
          contentType: attachment.contentType,
          size: attachment.size,
          snippet,
          page: attachment.page,
          uploadedBy: attachment.uploadedBy,
          createdAt: attachment.createdAt,
          type: "attachment"
        };
      });
    }

    // Calculate total results
    results.total = results.pages.length + results.attachments.length;

    // Get popular tags for suggestions
    if (query.length >= 2) {
      const tagSuggestions = await prisma.tag.findMany({
        where: {
          name: { contains: query, mode: "insensitive" }
        },
        take: 5,
        select: { name: true, _count: { select: { pages: true } } }
      });

      results.tagSuggestions = tagSuggestions.map(tag => ({
        name: tag.name,
        count: tag._count.pages
      }));
    }

    // Get page suggestions (title matches)
    const pageSuggestions = await prisma.page.findMany({
      where: {
        title: { contains: query, mode: "insensitive" },
        status: user.role === "ADMIN" ? undefined : "PUBLISHED"
      },
      select: { title: true, slug: true, path: true },
      take: 3
    });

    results.suggestions = pageSuggestions;

    return NextResponse.json(results);

  } catch (error) {
    console.error("Error performing search:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Helper function to create search result snippets with highlighting
function createSearchSnippet(text: string, query: string, maxLength: number): string {
  if (!text || !query) return "";

  const words = query.toLowerCase().split(/\s+/);
  const lowerText = text.toLowerCase();
  
  // Find the best match position
  let bestPosition = 0;
  let bestScore = 0;
  
  for (const word of words) {
    const position = lowerText.indexOf(word);
    if (position !== -1) {
      // Score based on word frequency and position (earlier is better)
      const score = (lowerText.match(new RegExp(word, 'g')) || []).length / (position + 1);
      if (score > bestScore) {
        bestScore = score;
        bestPosition = position;
      }
    }
  }

  // Extract snippet around the best match
  const start = Math.max(0, bestPosition - Math.floor(maxLength / 2));
  const end = Math.min(text.length, start + maxLength);
  let snippet = text.substring(start, end);

  // Add ellipsis if truncated
  if (start > 0) snippet = "..." + snippet;
  if (end < text.length) snippet = snippet + "...";

  return snippet.trim();
}