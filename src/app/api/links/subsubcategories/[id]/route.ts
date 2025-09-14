// src/app/api/links/subsubcategories/[id]/route.ts
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

    const subSubCategory = await prisma.linkSubSubCategory.update({
      where: { id: params.id },
      data: {
        name: name.trim(),
        ...(description !== undefined && { description: description?.trim() || null }),
      },
    });

    return NextResponse.json(subSubCategory);
  } catch (error) {
    console.error("Failed to update sub-subcategory:", error);
    return NextResponse.json({ error: "Failed to update sub-subcategory" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!(session as any)?.role || (session as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Check if the sub-subcategory has any links
    const subSubCategory = await prisma.linkSubSubCategory.findUnique({
      where: { id: params.id },
      include: { links: true }
    });

    if (!subSubCategory) {
      return NextResponse.json({ error: "SubSubCategory not found" }, { status: 404 });
    }

    if (subSubCategory.links.length > 0) {
      return NextResponse.json({ error: "Cannot delete sub-subcategory with links" }, { status: 400 });
    }

    await prisma.linkSubSubCategory.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to delete sub-subcategory:", error);
    return NextResponse.json({ error: "Failed to delete sub-subcategory" }, { status: 500 });
  }
}