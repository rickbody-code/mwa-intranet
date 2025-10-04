// src/app/api/links/subsubcategories/route.ts

export const dynamic = 'force-dynamic';
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!(session as any)?.role || (session as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const newSubSubCategory = await prisma.linkSubSubCategory.create({
      data: {
        name: body.name,
        subCategoryId: body.subCategoryId,
        order: 0
      },
    });
    return NextResponse.json(newSubSubCategory);
  } catch (error) {
    return NextResponse.json({ error: "Failed to create sub-subcategory" }, { status: 500 });
  }
}

export async function GET() {
  const data = await prisma.linkSubSubCategory.findMany({ 
    include: { links: true },
    orderBy: { order: 'asc' } 
  });
  return NextResponse.json(data);
}