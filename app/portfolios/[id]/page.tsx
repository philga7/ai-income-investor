'use client';

import { useSearchParams } from 'next/navigation';
import { PortfolioDetail } from './portfolio-detail';
import { use } from 'react';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function Page({ params }: PageProps) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const portfolioParam = searchParams?.get('portfolio');
  
  let portfolio = null;
  if (portfolioParam) {
    try {
      portfolio = JSON.parse(portfolioParam);
    } catch (error) {
      console.error('Error parsing portfolio:', error);
    }
  }
  
  return <PortfolioDetail portfolioId={id} initialPortfolio={portfolio} />;
}