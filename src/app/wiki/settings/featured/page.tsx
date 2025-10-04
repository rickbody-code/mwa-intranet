import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, Edit2 } from "lucide-react";
import FeaturedContentEditor from "@/components/wiki/FeaturedContentEditor";

export default async function FeaturedSettingsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    redirect("/");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email }
  });

  if (!user || user.role !== "ADMIN") {
    redirect("/wiki");
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/wiki"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Wiki
        </Link>
        
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Edit2 className="w-8 h-8 text-blue-600" />
          Edit Featured Content
        </h1>
        <p className="text-gray-600 mt-2">
          Customize the featured pages section on the wiki homepage
        </p>
      </div>

      {/* Editor */}
      <FeaturedContentEditor />
    </div>
  );
}
