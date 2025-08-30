import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").toLowerCase();
  const items = await prisma.staff.findMany({ orderBy: { name: "asc" } });
  if (!q) return NextResponse.json(items);
  const filtered = items.filter(s =>
    s.name.toLowerCase().includes(q) ||
    (s.department || "").toLowerCase().includes(q) ||
    (s.title || "").toLowerCase().includes(q) ||
    (s.location || "").toLowerCase().includes(q)
  );
  return NextResponse.json(filtered);
}
