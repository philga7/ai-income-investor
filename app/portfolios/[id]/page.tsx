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
  const portfolioData = searchParams?.get('portfolio');
  
  let portfolio = null;
  if (portfolioData) {
    try {
      portfolio = JSON.parse(portfolioData);
    } catch (error) {
      console.error('Error parsing portfolio data:', error);
    }
  }
  
  return <PortfolioDetail portfolioId={id} initialPortfolio={portfolio} />;
}