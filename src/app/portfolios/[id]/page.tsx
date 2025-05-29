import { notFound } from 'next/navigation';
import { portfolioService } from '@/services/portfolioService';
import { PortfolioHeader } from '@/components/portfolios/PortfolioHeader';
import { PortfolioSecurities } from '@/components/portfolios/PortfolioSecurities';

interface PortfolioPageProps {
  params: {
    id: string;
  };
}

export default async function PortfolioPage({ params }: PortfolioPageProps) {
  const portfolio = await portfolioService.getPortfolio(params.id);

  if (!portfolio) {
    notFound();
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <PortfolioHeader portfolio={portfolio} />
      <PortfolioSecurities securities={portfolio.securities} portfolioId={params.id} />
    </div>
  );
} 