// src/app/api/marsden-apps/[id]/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!(session as any)?.role || (session as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { name, description, icon, url, order } = body;

    if (!name?.trim() || !url?.trim()) {
      return NextResponse.json({ error: "Name and URL are required" }, { status: 400 });
    }

    const app = await prisma.marsdenApp.update({
      where: { id: params.id },
      data: {
        name: name.trim(),
        description: description?.trim() || "",
        icon: icon || "Square",
        url: url.trim(),
        order: parseInt(order) || 0,
      },
    });

    return NextResponse.json(app);
  } catch (error) {
    console.error("Error updating Marsden app:", error);
    return NextResponse.json({ error: "Failed to update app" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!(session as any)?.role || (session as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    await prisma.marsdenApp.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting Marsden app:", error);
    return NextResponse.json({ error: "Failed to delete app" }, { status: 500 });
  }
}