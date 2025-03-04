import React, { useState } from 'react';
import mockPortfolioData from '../mockPortfolioData';

const Portfolio: React.FC = () => {
  const [selectedHolding, setSelectedHolding] = useState(null);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-white mb-6">Portfolio</h1>

      {/* Search and Actions */}
      <div className="flex justify-between items-center mb-6">
        <input
          type="text"
          placeholder="Search stocks..."
          className="bg-gray-800 text-gray-300 px-4 py-2 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="flex space-x-4">
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            Filter
          </button>
          <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
            Add Stock
          </button>
        </div>
      </div>

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
        <div className="overflow-x-auto">
          <table className="w-full text-left text-gray-300">
            <thead>
              <tr>
                <th className="py-2 px-4">Ticker</th>
                <th className="py-2 px-4">Shares</th>
                <th className="py-2 px-4">Price</th>
                <th className="py-2 px-4">Value</th>
                <th className="py-2 px-4">Dividend Yield</th>
                <th className="py-2 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {mockPortfolioData.holdings.map((holding) => (
                <tr
                  key={holding.ticker}
                  className="border-t border-gray-700 cursor-pointer hover:bg-gray-700"
                  onClick={() => setSelectedHolding(holding)}
                >
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
                  <td className="py-2 px-4">
                    <button className="bg-green-600 text-white px-2 py-1 rounded-lg hover:bg-green-700 mr-2">
                      Buy
                    </button>
                    <button className="bg-blue-600 text-white px-2 py-1 rounded-lg hover:bg-blue-700 mr-2">
                      Sell
                    </button>
                    <button className="bg-red-600 text-white px-2 py-1 rounded-lg hover:bg-red-700">
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {selectedHolding && (
          <div className="mt-6 bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-4">
              Details for {selectedHolding.ticker}
            </h3>
            <p className="text-gray-300">
              <strong>Shares:</strong> {selectedHolding.shares}
            </p>
            <p className="text-gray-300">
              <strong>Price:</strong> ${selectedHolding.price.toFixed(2)}
            </p>
            <p className="text-gray-300">
              <strong>Value:</strong> $
              {(selectedHolding.shares * selectedHolding.price).toLocaleString()}
            </p>
            <p className="text-gray-300">
              <strong>Dividend Yield:</strong>{' '}
              {selectedHolding.dividendYield.toFixed(2)}%
            </p>
          </div>
        )}
      </div>

      {/* Technical Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
          <h2 className="text-xl font-bold text-white mb-4">Next Dividend</h2>
          <p className="text-gray-300">
            Your next dividend payment is from <span className="text-white font-semibold">Microsoft (MSFT)</span> on <span className="text-white font-semibold">March 15, 2024</span>.
          </p>
        </div>
        <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
          <h2 className="text-xl font-bold text-white mb-4">Technical Analysis</h2>
          <p className="text-gray-300">
            Johnson & Johnson (JNJ) is showing strong buy signals based on RSI and MACD indicators.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Portfolio;