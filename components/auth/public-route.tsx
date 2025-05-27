'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';

export function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <div 
          className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"
          role="status"
          aria-label="Loading"
        >
          <span className="sr-only">Loading...</span>
        </div>
      </div>
    );
  }

  if (user) {
    return null;
  }

  return <>{children}</>;
} 