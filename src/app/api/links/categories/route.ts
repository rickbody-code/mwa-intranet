// src/app/api/links/categories/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const categories = await prisma.linkCategory.findMany({
      include: {
        links: {
          orderBy: [{ order: "asc" }, { title: "asc" }]
        },
        subCategories: {
          include: {
            links: {
              orderBy: [{ order: "asc" }, { title: "asc" }]
            },
            subSubCategories: {
              include: {
                links: {
                  orderBy: [{ order: "asc" }, { title: "asc" }]
                }
              },
              orderBy: [{ order: "asc" }, { name: "asc" }]
            }
          },
          orderBy: [{ order: "asc" }, { name: "asc" }]
        }
      },
      orderBy: [{ order: "asc" }, { name: "asc" }]
    });
    
    return NextResponse.json(categories);
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!(session as any)?.role || (session as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { name, description } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    // Get the highest order number and increment
    const lastCategory = await prisma.linkCategory.findFirst({
      orderBy: { order: "desc" }
    });

    const category = await prisma.linkCategory.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        order: (lastCategory?.order || 0) + 1,
      },
    });

    return NextResponse.json(category);
  } catch (error) {
    console.error("Failed to create category:", error);
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
  }
}