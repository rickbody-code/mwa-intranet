import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function isAdmin(email?: string): Promise<boolean> {
  if (!email) return false;
  
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { role: true }
    });
    
    return user?.role === 'ADMIN';
  } catch {
    return false;
  }
}

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return null;
  }
  
  return await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, email: true, name: true, role: true }
  });
}

export async function requireAdmin() {
  const user = await getCurrentUser();
  
  if (!user || user.role !== 'ADMIN') {
    throw new Error('Admin access required');
  }
  
  return user;
}

export async function canReadPage(userId: string, pageId: string): Promise<boolean> {
  try {
    const page = await prisma.page.findFirst({
      where: {
        id: pageId,
        OR: [
          { status: 'PUBLISHED' }, // Published pages are readable by all authenticated users
          { createdById: userId }, // User created the page
          { 
            permissions: {
              some: {
                AND: [
                  { userId: userId },
                  { canRead: true }
                ]
              }
            }
          }
        ]
      }
    });

    return !!page;
  } catch {
    return false;
  }
}

export async function canWritePage(userId: string, pageId: string): Promise<boolean> {
  try {
    const page = await prisma.page.findFirst({
      where: {
        id: pageId,
        OR: [
          { createdById: userId }, // User created the page
          { 
            permissions: {
              some: {
                AND: [
                  { userId: userId },
                  { canWrite: true }
                ]
              }
            }
          }
        ]
      }
    });

    return !!page;
  } catch {
    return false;
  }
}