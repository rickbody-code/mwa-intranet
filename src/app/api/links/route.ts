// src/app/api/links/route.ts (Updated)
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const links = await prisma.link.findMany({
      orderBy: [{ order: "asc" }, { title: "asc" }]
    });
    return NextResponse.json(links);
  } catch (error) {
    console.error("Failed to fetch links:", error);
    return NextResponse.json({ error: "Failed to fetch links" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!(session as any)?.role || (session as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { title, url, description, categoryId, subCategoryId, subSubCategoryId } = body;

    if (!title?.trim() || !url?.trim()) {
      return NextResponse.json({ error: "Title and URL are required" }, { status: 400 });
    }

    // Validate that only one parent is specified
    const parentCount = [categoryId, subCategoryId, subSubCategoryId].filter(Boolean).length;
    if (parentCount !== 1) {
      return NextResponse.json({ error: "Exactly one parent category must be specified" }, { status: 400 });
    }

    // Verify the parent exists
    if (categoryId) {
      const category = await prisma.linkCategory.findUnique({ where: { id: categoryId } });
      if (!category) {
        return NextResponse.json({ error: "Category not found" }, { status: 404 });
      }
    }

    if (subCategoryId) {
      const subCategory = await prisma.linkSubCategory.findUnique({ where: { id: subCategoryId } });
      if (!subCategory) {
        return NextResponse.json({ error: "SubCategory not found" }, { status: 404 });
      }
    }

    if (subSubCategoryId) {
      const subSubCategory = await prisma.linkSubSubCategory.findUnique({ where: { id: subSubCategoryId } });
      if (!subSubCategory) {
        return NextResponse.json({ error: "SubSubCategory not found" }, { status: 404 });
      }
    }

    // Get the highest order number for links in the same parent and increment
    const whereClause: any = {};
    if (categoryId) whereClause.categoryId = categoryId;
    if (subCategoryId) whereClause.subCategoryId = subCategoryId;
    if (subSubCategoryId) whereClause.subSubCategoryId = subSubCategoryId;

    const lastLink = await prisma.link.findFirst({
      where: whereClause,
      orderBy: { order: "desc" }
    });

    const link = await prisma.link.create({
      data: {
        title: title.trim(),
        url: url.trim(),
        description: description?.trim() || null,
        categoryId: categoryId || null,
        subCategoryId: subCategoryId || null,
        subSubCategoryId: subSubCategoryId || null,
        order: (lastLink?.order || 0) + 1,
        createdBy: session?.user?.email || null,
      },
    });

    return NextResponse.json(link);
  } catch (error) {
    console.error("Failed to create link:", error);
    return NextResponse.json({ error: "Failed to create link" }, { status: 500 });
  }
}