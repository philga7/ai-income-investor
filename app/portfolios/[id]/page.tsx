'use client';

import { PortfolioDetail } from './portfolio-detail';
import { PortfolioDetailSkeleton } from '@/components/portfolios/PortfolioDetailSkeleton';
import { useEffect, useState } from 'react';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function Page({ params }: PageProps) {
  const [id, setId] = useState<string | null>(null);
  
  useEffect(() => {
    params.then(({ id }) => setId(id));
  }, [params]);

  // Show skeleton while params are being resolved
  if (!id) {
    return <PortfolioDetailSkeleton />;
  }

  // Always pass initialPortfolio as null to force fresh data fetch
  // This ensures that newly added securities appear after page refresh
  return <PortfolioDetail portfolioId={id} initialPortfolio={null} />;
}