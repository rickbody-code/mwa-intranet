import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, BookOpen, Plus } from "lucide-react";
import WikiPageForm from "@/components/wiki/WikiPageForm";

export default async function CreateWikiPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    redirect("/");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email }
  });

  if (!user) {
    redirect("/");
  }

  // Get available tags for the form
  const tags = await prisma.tag.findMany({
    orderBy: { name: "asc" }
  });

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/wiki"
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Wiki
        </Link>
        
        <div className="flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Create New Wiki Page</h1>
        </div>
      </div>

      {/* Create Form */}
      <div className="bg-white rounded-lg border shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold">New Page Details</h2>
          </div>
          <p className="text-gray-600 mt-1">
            Create a new wiki page with rich content and organize it with tags
          </p>
        </div>
        
        <div className="p-6">
          <WikiPageForm />
        </div>
      </div>
    </div>
  );
}