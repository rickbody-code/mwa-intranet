import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  
  const adminEmailsRaw = process.env.ADMIN_EMAILS;
  const adminList = (adminEmailsRaw || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  const currentUserEmail = session?.user?.email?.toLowerCase();
  const isInAdminList = adminList.includes(currentUserEmail || '');

  return NextResponse.json({
    debug: {
      adminEmailsRaw: adminEmailsRaw,
      adminEmailsList: adminList,
      currentUserEmail: currentUserEmail,
      currentUserRole: (session as any)?.role,
      isCurrentUserInAdminList: isInAdminList,
      sessionExists: !!session
    }
  });
}
