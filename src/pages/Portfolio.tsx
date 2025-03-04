import React from 'react';
import mockPortfolioData from '../mockPortfolioData';

const Portfolio: React.FC = () => {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-white mb-6">Portfolio</h1>

      {/* Portfolio Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
          <h3 className="text-gray-400 text-sm mb-2">Total Portfolio Value</h3>
          <p className="text-2xl font-bold text-white">
            ${mockPortfolioData.totalValue.toLocaleString()}
          </p>
          <span
            className={`text-sm ${
              mockPortfolioData.dailyChange > 0
                ? 'text-green-400'
                : 'text-red-400'
            }`}
          >
            {mockPortfolioData.dailyChange > 0 ? '+' : ''}
            {mockPortfolioData.dailyChange.toFixed(2)}% today
          </span>
        </div>

        <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
          <h3 className="text-gray-400 text-sm mb-2">Annual Dividend Income</h3>
          <p className="text-2xl font-bold text-white">
            ${mockPortfolioData.annualDividendIncome.toLocaleString()}
          </p>
          <span className="text-blue-400 text-sm">
            Next payment in {mockPortfolioData.nextPaymentDays} days
          </span>
        </div>

        <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
          <h3 className="text-gray-400 text-sm mb-2">Dividend Yield</h3>
          <p className="text-2xl font-bold text-white">
            {mockPortfolioData.dividendYield.toFixed(2)}%
          </p>
          <span className="text-gray-400 text-sm">Portfolio average</span>
        </div>
      </div>

      {/* Portfolio Holdings */}
      <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
        <h2 className="text-xl font-bold text-white mb-4">Holdings</h2>
        <table className="w-full text-left text-gray-300">
          <thead>
            <tr>
              <th className="py-2 px-4">Ticker</th>
              <th className="py-2 px-4">Shares</th>
              <th className="py-2 px-4">Price</th>
              <th className="py-2 px-4">Value</th>
              <th className="py-2 px-4">Dividend Yield</th>
            </tr>
          </thead>
          <tbody>
            {mockPortfolioData.holdings.map((holding) => (
              <tr key={holding.ticker} className="border-t border-gray-700">
                <td className="py-2 px-4">{holding.ticker}</td>
                <td className="py-2 px-4">{holding.shares}</td>
                <td className="py-2 px-4">
                  ${holding.price.toFixed(2).toLocaleString()}
                </td>
                <td className="py-2 px-4">
                  ${(holding.shares * holding.price).toLocaleString()}
                </td>
                <td className="py-2 px-4">
                  {holding.dividendYield.toFixed(2)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Portfolio;
