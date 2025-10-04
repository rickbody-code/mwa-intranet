import type { NextAuthOptions } from "next-auth";
import AzureADProvider from "next-auth/providers/azure-ad";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";

// Check if development authentication is enabled
const isDevelopment = process.env.NODE_ENV !== "production";
const devAuthEnabled = isDevelopment && process.env.DEV_AUTH_ENABLED === "true";

// Admin email lists
const adminList = (process.env.ADMIN_EMAILS || "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

const devAdminList = isDevelopment ? (process.env.DEV_ADMIN_EMAILS || "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean) : [];

// Only include dev admin emails in development
const allAdminEmails = isDevelopment ? [...adminList, ...devAdminList] : adminList;

// Production safety check - only run at runtime, not during build
if (process.env.NODE_ENV === "production" && typeof window !== "undefined") {
  const requiredAzureVars = ["AZURE_AD_CLIENT_ID", "AZURE_AD_CLIENT_SECRET", "AZURE_AD_TENANT_ID"];
  const missingVars = requiredAzureVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error(`Missing required Azure AD environment variables in production: ${missingVars.join(", ")}`);
  }

  // Prevent dev environment variables from affecting production
  if (process.env.DEV_AUTH_ENABLED) {
    console.error("⚠️  WARNING: DEV_AUTH_ENABLED must not be set in production!");
  }
  if (process.env.DEV_ADMIN_EMAILS) {
    console.error("⚠️  WARNING: DEV_ADMIN_EMAILS is set in production but will be ignored for security!");
  }
}

// Log development authentication status
if (devAuthEnabled) {
  console.warn("⚠️  Development authentication is ENABLED. This should NEVER be used in production!");
}

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  providers: [
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID as string,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET as string,
      tenantId: process.env.AZURE_AD_TENANT_ID as string,
    }),
    // Development-only Credentials provider
    ...(devAuthEnabled ? [
      CredentialsProvider({
        id: "development",
        name: "Development Login",
        credentials: {
          email: { label: "Email", type: "email", required: true },
          name: { label: "Name", type: "text", required: false }
        },
        async authorize(credentials) {
          if (!credentials?.email) return null;
          
          const email = credentials.email.toLowerCase();
          const name = credentials.name || email.split("@")[0];
          
          // Determine role based on admin email lists
          const isAdmin = allAdminEmails.includes(email);
          const role = isAdmin ? "ADMIN" : "STAFF";
          
          return {
            id: email,
            email,
            name,
            role
          };
        }
      })
    ] : [])
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!user?.email) return false;
      const email = user.email.toLowerCase();

      // Determine role based on all admin email lists
      const isAdmin = allAdminEmails.includes(email);
      const role = isAdmin ? "ADMIN" : "STAFF";

      // Ensure a user exists in DB or update existing user
      const existing = await prisma.user.findUnique({ where: { email } });
      if (!existing) {
        await prisma.user.create({
          data: {
            email,
            name: user.name ?? "",
            image: user.image ?? "",
            role,
          },
        });
      } else {
        // Update role in case admin lists have changed
        await prisma.user.update({
          where: { email },
          data: { role }
        });
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user?.email) {
        const dbUser = await prisma.user.findUnique({ where: { email: user.email.toLowerCase() } });
        if (dbUser) {
          token.role = dbUser.role;
          token.name = dbUser.name || token.name;
          token.picture = dbUser.image || token.picture;
        }
      }
      return token;
    },
    async session({ session, token }) {
      (session as any).role = token.role;
      return session;
    },
  },
  pages: {
    signIn: "/signin",
  },
};
