import { Metadata } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import DiffViewer from '@/components/wiki/DiffViewer';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface PageProps {
  params: { id: string };
  searchParams: { from?: string; to?: string };
}

export const metadata: Metadata = {
  title: 'Version Comparison | MWA Wiki',
  description: 'Compare different versions of a wiki page'
};

export default async function DiffPage({ params, searchParams }: PageProps) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/login');
  }

  const { from, to } = searchParams;
  
  if (!from || !to) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Invalid Comparison Parameters
            </h1>
            <p className="text-gray-600 mb-6">
              Both 'from' and 'to' version parameters are required.
            </p>
            <Link 
              href={`/wiki/pages/${params.id}`}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Page</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Link 
            href={`/wiki/pages/${params.id}`}
            className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Page</span>
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <DiffViewer 
          pageId={params.id}
          fromVersionId={from}
          toVersionId={to}
        />
      </div>
    </div>
  );
}