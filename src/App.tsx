import React from 'react';
import { LineChart, Wallet, TrendingUp, Calendar, Bell, Settings } from 'lucide-react';
import { createChart, ColorType } from 'lightweight-charts';

function App() {
  const [activeTab, setActiveTab] = React.useState('dashboard');
  const chartContainerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (chartContainerRef.current) {
      const chart = createChart(chartContainerRef.current, {
        layout: {
          background: { type: ColorType.Solid, color: '#1a1b1e' },
          textColor: '#9ca3af',
        },
        grid: {
          vertLines: { color: '#2d2d2d' },
          horzLines: { color: '#2d2d2d' },
        },
        width: chartContainerRef.current.clientWidth,
        height: 400,
      });

      // Cleanup
      return () => {
        chart.remove();
      };
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Sidebar */}
      <div className="fixed h-full w-64 bg-gray-800 border-r border-gray-700 p-4">
        <div className="flex items-center space-x-2 mb-8">
          <TrendingUp className="h-8 w-8 text-blue-400" />
          <h1 className="text-xl font-bold text-white">DividendAI</h1>
        </div>
        
        <nav className="space-y-2">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center space-x-3 px-4 py-2 rounded-lg ${
              activeTab === 'dashboard' ? 'bg-blue-900/50 text-blue-400' : 'text-gray-300 hover:bg-gray-700'
            }`}
          >
            <LineChart className="h-5 w-5" />
            <span>Dashboard</span>
          </button>
          
          <button
            onClick={() => setActiveTab('portfolio')}
            className={`w-full flex items-center space-x-3 px-4 py-2 rounded-lg ${
              activeTab === 'portfolio' ? 'bg-blue-900/50 text-blue-400' : 'text-gray-300 hover:bg-gray-700'
            }`}
          >
            <Wallet className="h-5 w-5" />
            <span>Portfolio</span>
          </button>
          
          <button
            onClick={() => setActiveTab('calendar')}
            className={`w-full flex items-center space-x-3 px-4 py-2 rounded-lg ${
              activeTab === 'calendar' ? 'bg-blue-900/50 text-blue-400' : 'text-gray-300 hover:bg-gray-700'
            }`}
          >
            <Calendar className="h-5 w-5" />
            <span>Dividend Calendar</span>
          </button>
          
          <button
            onClick={() => setActiveTab('alerts')}
            className={`w-full flex items-center space-x-3 px-4 py-2 rounded-lg ${
              activeTab === 'alerts' ? 'bg-blue-900/50 text-blue-400' : 'text-gray-300 hover:bg-gray-700'
            }`}
          >
            <Bell className="h-5 w-5" />
            <span>Alerts</span>
          </button>
          
          <button
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center space-x-3 px-4 py-2 rounded-lg ${
              activeTab === 'settings' ? 'bg-blue-900/50 text-blue-400' : 'text-gray-300 hover:bg-gray-700'
            }`}
          >
            <Settings className="h-5 w-5" />
            <span>Settings</span>
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="ml-64 p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
            <h3 className="text-gray-400 text-sm mb-2">Portfolio Value</h3>
            <p className="text-2xl font-bold text-white">$124,532.89</p>
            <span className="text-green-400 text-sm">+2.4% today</span>
          </div>
          
          <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
            <h3 className="text-gray-400 text-sm mb-2">Annual Dividend Income</h3>
            <p className="text-2xl font-bold text-white">$3,241.67</p>
            <span className="text-blue-400 text-sm">Next payment in 12 days</span>
          </div>
          
          <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
            <h3 className="text-gray-400 text-sm mb-2">Dividend Yield</h3>
            <p className="text-2xl font-bold text-white">4.2%</p>
            <span className="text-gray-400 text-sm">Portfolio average</span>
          </div>
        </div>

        {/* Chart Section */}
        <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700 mb-8">
          <h2 className="text-xl font-bold text-white mb-4">Portfolio Performance</h2>
          <div ref={chartContainerRef} className="w-full h-[400px]" />
        </div>

        {/* AI Insights */}
        <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
          <h2 className="text-xl font-bold text-white mb-4">AI Insights</h2>
          <div className="space-y-4">
            <div className="flex items-start space-x-4 p-4 bg-blue-900/30 rounded-lg border border-blue-800">
              <div className="flex-shrink-0">
                <Bell className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <h4 className="font-semibold text-white">Special Dividend Alert</h4>
                <p className="text-gray-300">Microsoft (MSFT) announced a special dividend of $3.00 per share. Ex-dividend date: March 15, 2024</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4 p-4 bg-green-900/30 rounded-lg border border-green-800">
              <div className="flex-shrink-0">
                <TrendingUp className="h-6 w-6 text-green-400" />
              </div>
              <div>
                <h4 className="font-semibold text-white">Buy Signal</h4>
                <p className="text-gray-300">Johnson & Johnson (JNJ) showing strong buy signals based on technical indicators and upcoming dividend date.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;