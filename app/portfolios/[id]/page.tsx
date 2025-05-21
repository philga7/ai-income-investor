import { PortfolioDetail } from "./portfolio-detail";

export async function generateStaticParams() {
  // Return an array of portfolio IDs you want to pre-render
  return [
    { id: 'core-dividend' },
    { id: 'growth-income' },
    { id: 'retirement' }
  ];
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  
  return <PortfolioDetail portfolioId={id} />;
}