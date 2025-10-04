// src/app/api/links/categories/route.ts

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
    const newCategory = await prisma.linkCategory.create({
      data: {
        name: body.name,
        order: 0
      },
    });
    return NextResponse.json(newCategory);
  } catch (error) {
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
  }
}

export async function GET() {
  const data = await prisma.linkCategory.findMany({ 
    include: {
      links: true,
      subCategories: {
        include: {
          links: true,
          subSubCategories: {
            include: { links: true }
          }
        }
      }
    },
    orderBy: { order: 'asc' } 
  });
  return NextResponse.json(data);
}