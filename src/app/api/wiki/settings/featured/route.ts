import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const FeaturedContentSchema = z.object({
  introText: z.string(),
  contentHTML: z.string(),
});

export async function GET() {
  try {
    const setting = await prisma.wikiSetting.findUnique({
      where: { key: "wiki_featured_content" },
    });

    if (!setting) {
      // Return default content
      return NextResponse.json({
        introText: "Welcome to the MWA Knowledge Base! Get started with these key pages:",
        contentHTML: "<p>Click the edit icon to customize this section.</p>",
      });
    }

    return NextResponse.json(setting.value);
  } catch (error) {
    console.error("Error fetching featured content:", error);
    return NextResponse.json(
      { error: "Failed to fetch featured content" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const validated = FeaturedContentSchema.parse(body);

    const setting = await prisma.wikiSetting.upsert({
      where: { key: "wiki_featured_content" },
      update: {
        value: validated,
        updatedBy: user.id,
      },
      create: {
        key: "wiki_featured_content",
        value: validated,
        updatedBy: user.id,
      },
    });

    return NextResponse.json(setting.value);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error saving featured content:", error);
    return NextResponse.json(
      { error: "Failed to save featured content" },
      { status: 500 }
    );
  }
}
