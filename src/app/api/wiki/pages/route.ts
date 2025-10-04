import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createPageSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.object({}).passthrough().transform(val => val || { type: 'doc', content: [] }), // TipTap JSON content, provide default if null/undefined
  contentMarkdown: z.string().optional(),
  parentId: z.string().optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(["DRAFT", "PUBLISHED"]).default("DRAFT"),
  changeNote: z.string().optional(),
});

// GET /api/wiki/pages - List pages with search and filters
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const status = searchParams.get("status");
    const tag = searchParams.get("tag");
    const parentId = searchParams.get("parentId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
    const offset = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    
    // Basic text search across title and current version content
    if (query) {
      where.OR = [
        { title: { contains: query, mode: "insensitive" } },
        { summary: { contains: query, mode: "insensitive" } },
        {
          currentVersion: {
            contentMarkdown: { contains: query, mode: "insensitive" }
          }
        }
      ];
    }

    if (status) {
      where.status = status;
    }

    if (parentId) {
      where.parentId = parentId === "null" ? null : parentId;
    }

    if (tag) {
      where.tags = {
        some: {
          tag: {
            name: { equals: tag, mode: "insensitive" }
          }
        }
      };
    }

    // Get user for permission checking
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Apply permission-based filtering for non-admin users
    if (user.role !== "ADMIN") {
      where.OR = [
        // Published pages that everyone can read
        { status: "PUBLISHED" },
        // Pages user created (can see their own drafts)
        { createdById: user.id },
        // Pages with explicit user permissions
        {
          permissions: {
            some: {
              userId: user.id,
              canRead: true
            }
          }
        },
        // Pages with role-based permissions
        {
          permissions: {
            some: {
              role: user.role,
              canRead: true
            }
          }
        }
      ];
      
      // Remove the status filter as it's now part of OR clause
      if (status && where.status) {
        delete where.status;
        // Add status to all OR conditions if specified
        where.OR = where.OR.map((condition: any) => ({
          ...condition,
          status: status
        }));
      }
    } else if (status) {
      where.status = status;
    }

    const [pages, total] = await Promise.all([
      prisma.page.findMany({
        where,
        include: {
          createdBy: { select: { name: true, email: true } },
          updatedBy: { select: { name: true, email: true } },
          currentVersion: { select: { title: true, changeNote: true, createdAt: true } },
          tags: { include: { tag: true } },
          parent: { select: { title: true, slug: true } },
          // Filter children by permissions too
          children: { 
            select: { id: true, title: true, slug: true, status: true },
            where: user.role === "ADMIN" ? {} : {
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
            }
          },
          permissions: {
            include: {
              user: { select: { name: true, email: true } }
            }
          },
          _count: {
            select: { views: true, versions: true, attachments: true }
          }
        },
        orderBy: [{ updatedAt: "desc" }],
        skip: offset,
        take: limit,
      }),
      prisma.page.count({ where })
    ]);

    return NextResponse.json({
      pages,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error("Error fetching pages:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/wiki/pages - Create new page
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const validatedData = createPageSchema.parse(body);

    // Generate slug from title
    const baseSlug = validatedData.title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .trim();

    // Ensure unique slug
    let slug = baseSlug;
    let counter = 1;
    while (await prisma.page.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Generate hierarchical path
    let path = `/${slug}`;
    if (validatedData.parentId) {
      const parent = await prisma.page.findUnique({
        where: { id: validatedData.parentId },
        select: { path: true }
      });
      if (parent) {
        path = `${parent.path}/${slug}`;
      }
    }

    // Create page and first version in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the page
      const page = await tx.page.create({
        data: {
          title: validatedData.title,
          slug,
          path,
          parentId: validatedData.parentId,
          status: validatedData.status,
          summary: validatedData.contentMarkdown?.substring(0, 200),
          createdById: user.id,
          updatedById: user.id,
        }
      });

      // Create initial version
      const version = await tx.pageVersion.create({
        data: {
          pageId: page.id,
          title: validatedData.title,
          contentJSON: validatedData.content,
          contentMarkdown: validatedData.contentMarkdown || "",
          changeNote: validatedData.changeNote || "Initial version",
          createdById: user.id,
        }
      });

      // Update page to reference current version
      const updatedPage = await tx.page.update({
        where: { id: page.id },
        data: { currentVersionId: version.id },
        include: {
          createdBy: { select: { name: true, email: true } },
          currentVersion: true,
          tags: { include: { tag: true } }
        }
      });

      // Handle tags if provided
      if (validatedData.tags && validatedData.tags.length > 0) {
        for (const tagName of validatedData.tags) {
          const tag = await tx.tag.upsert({
            where: { name: tagName },
            update: {},
            create: { name: tagName }
          });

          await tx.pageTag.create({
            data: {
              pageId: page.id,
              tagId: tag.id
            }
          });
        }
      }

      // Log activity
      await tx.activityLog.create({
        data: {
          pageId: page.id,
          versionId: version.id,
          actorId: user.id,
          type: "CREATE",
          data: { title: validatedData.title, status: validatedData.status }
        }
      });

      // Fetch and return page with updated tags
      return await tx.page.findUnique({
        where: { id: page.id },
        include: {
          createdBy: { select: { name: true, email: true } },
          updatedBy: { select: { name: true, email: true } },
          currentVersion: true,
          tags: { include: { tag: true } }
        }
      });
    });

    return NextResponse.json(result, { status: 201 });

  } catch (error) {
    console.error("Error creating page:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}