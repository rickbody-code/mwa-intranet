import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
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

    const section = await prisma.wikiSection.update({
      where: { id: params.id },
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
    console.error("Error updating wiki section:", error);
    return NextResponse.json({ error: "Failed to update section" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!(session as any)?.role || (session as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    await prisma.wikiSection.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting wiki section:", error);
    return NextResponse.json({ error: "Failed to delete section" }, { status: 500 });
  }
}
