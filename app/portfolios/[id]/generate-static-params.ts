export async function generateStaticParams() {
  // Return an array of portfolio IDs you want to pre-render
  return [
    { id: 'core-dividend' },
    { id: 'growth-income' },
    { id: 'retirement' }
  ];
} 