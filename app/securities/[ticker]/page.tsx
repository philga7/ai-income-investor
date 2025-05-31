import { SecurityDetailClient } from "./security-detail-client";

// Add generateStaticParams for static export
export function generateStaticParams() {
  // Return an array of tickers you want to pre-render
  return [
    { ticker: "AAPL" },
    { ticker: "MSFT" },
    { ticker: "GOOGL" },
    { ticker: "AMZN" },
    { ticker: "META" },
  ];
}

type Props = {
  params: Promise<{ ticker: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function SecurityPage({ params, searchParams }: Props) {
  const { ticker } = await params;
  const resolvedSearchParams = await searchParams;
  return <SecurityDetailClient ticker={ticker} />;
}