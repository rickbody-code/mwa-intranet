// src/app/api/marsden-apps/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const apps = await prisma.marsdenApp.findMany({
      orderBy: { order: "asc" }
    });
    return NextResponse.json(apps);
  } catch (error) {
    console.error("Error fetching Marsden apps:", error);
    return NextResponse.json({ error: "Failed to fetch apps" }, { status: 500 });
  }
}

export async function POST(req: Request) {
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

    const app = await prisma.marsdenApp.create({
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
    console.error("Error creating Marsden app:", error);
    return NextResponse.json({ error: "Failed to create app" }, { status: 500 });
  }
}