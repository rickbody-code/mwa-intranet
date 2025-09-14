// src/app/api/links/subcategories/route.ts
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
    const newSubCategory = await prisma.linkSubCategory.create({
      data: {
        name: body.name,
        categoryId: body.categoryId,
        order: 0
      },
    });
    return NextResponse.json(newSubCategory);
  } catch (error) {
    return NextResponse.json({ error: "Failed to create subcategory" }, { status: 500 });
  }
}

export async function GET() {
  const data = await prisma.linkSubCategory.findMany({ 
    include: {
      links: true,
      subSubCategories: {
        include: { links: true }
      }
    },
    orderBy: { order: 'asc' } 
  });
  return NextResponse.json(data);
}