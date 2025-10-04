import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const sections = await prisma.wikiSection.findMany({
      orderBy: { order: "asc" }
    });
    return NextResponse.json(sections);
  } catch (error) {
    console.error("Error fetching wiki sections:", error);
    return NextResponse.json({ error: "Failed to fetch sections" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!(session as any)?.role || (session as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { title, description, icon, linkText, linkUrl, order } = body;

    if (!title?.trim() || !linkUrl?.trim()) {
      return NextResponse.json({ error: "Title and URL are required" }, { status: 400 });
    }

    const section = await prisma.wikiSection.create({
      data: {
        title: title.trim(),
        description: description?.trim() || "",
        icon: icon || "FileText",
        linkText: linkText?.trim() || "View More →",
        linkUrl: linkUrl.trim(),
        order: parseInt(order) || 0,
      },
    });

    return NextResponse.json(section);
  } catch (error) {
    console.error("Error creating wiki section:", error);
    return NextResponse.json({ error: "Failed to create section" }, { status: 500 });
  }
}
