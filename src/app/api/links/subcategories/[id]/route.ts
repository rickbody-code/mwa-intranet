// src/app/api/links/subcategories/[id]/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
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

    const subCategory = await prisma.linkSubCategory.update({
      where: { id: params.id },
      data: {
        name: name.trim(),
        ...(description !== undefined && { description: description?.trim() || null }),
      },
    });

    return NextResponse.json(subCategory);
  } catch (error) {
    console.error("Failed to update subcategory:", error);
    return NextResponse.json({ error: "Failed to update subcategory" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!(session as any)?.role || (session as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Check if the subcategory has any links or sub-subcategories
    const subCategory = await prisma.linkSubCategory.findUnique({
      where: { id: params.id },
      include: { links: true, subSubCategories: true }
    });

    if (!subCategory) {
      return NextResponse.json({ error: "SubCategory not found" }, { status: 404 });
    }

    if (subCategory.links.length > 0 || subCategory.subSubCategories.length > 0) {
      return NextResponse.json({ error: "Cannot delete subcategory with content" }, { status: 400 });
    }

    await prisma.linkSubCategory.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to delete subcategory:", error);
    return NextResponse.json({ error: "Failed to delete subcategory" }, { status: 500 });
  }
}