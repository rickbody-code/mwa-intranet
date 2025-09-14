// src/app/api/links/subcategories/route.ts
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
    const { name, description, categoryId } = body;

    if (!name?.trim() || !categoryId) {
      return NextResponse.json({ error: "Name and categoryId are required" }, { status: 400 });
    }

    // Verify the category exists
    const category = await prisma.linkCategory.findUnique({
      where: { id: categoryId }
    });

    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    // Get the highest order number within this category and increment
    const lastSubCategory = await prisma.linkSubCategory.findFirst({
      where: { categoryId },
      orderBy: { order: "desc" }
    });

    const subCategory = await prisma.linkSubCategory.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        categoryId,
        order: (lastSubCategory?.order || 0) + 1,
      },
    });

    return NextResponse.json(subCategory);
  } catch (error) {
    console.error("Failed to create subcategory:", error);
    return NextResponse.json({ error: "Failed to create subcategory" }, { status: 500 });
  }
}