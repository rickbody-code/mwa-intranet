// src/app/api/links/subsubcategories/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!(session as any)?.role || (session as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { name, description, subCategoryId } = body;

    if (!name?.trim() || !subCategoryId) {
      return NextResponse.json({ error: "Name and subCategoryId are required" }, { status: 400 });
    }

    // Verify the subcategory exists
    const subCategory = await prisma.linkSubCategory.findUnique({
      where: { id: subCategoryId }
    });

    if (!subCategory) {
      return NextResponse.json({ error: "SubCategory not found" }, { status: 404 });
    }

    // Get the highest order number within this subcategory and increment
    const lastSubSubCategory = await prisma.linkSubSubCategory.findFirst({
      where: { subCategoryId },
      orderBy: { order: "desc" }
    });

    const subSubCategory = await prisma.linkSubSubCategory.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        subCategoryId,
        order: (lastSubSubCategory?.order || 0) + 1,
      },
    });

    return NextResponse.json(subSubCategory);
  } catch (error) {
    console.error("Failed to create sub-subcategory:", error);
    return NextResponse.json({ error: "Failed to create sub-subcategory" }, { status: 500 });
  }
}