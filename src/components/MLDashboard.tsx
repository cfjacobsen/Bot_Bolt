import React, { useState, useEffect } from 'react';
import { Brain, TrendingUp, Target, Zap, Activity, BarChart3 } from 'lucide-react';

const MLDashboard: React.FC = () => {
  const [mlStats, setMLStats] = useState({
    isTraining: false,
    dataPoints: 0,
    predictions: 0,
    accuracy: 0,
    lastTraining: null
  });

  const [predictions, setPredictions] = useState({
    BTCUSDT: { price: 45250, confidence: 0.87, direction: 'UP', change: 2.3 },
    ETHUSDT: { price: 2485, confidence: 0.92, direction: 'UP', change: 1.8 },
    SOLUSDT: { price: 98.5, confidence: 0.78, direction: 'DOWN', change: -0.5 }
  });

  const [backtestResults, setBacktestResults] = useState([
    {
      strategy: 'Aggressive Scalping',
      symbol: 'BTCUSDT',
      totalReturn: 15.7,
      winRate: 73.2,
      maxDrawdown: 3.1,
      sharpeRatio: 2.34,
      trades: 1247
    },
    {
      strategy: 'Mean Reversion',
      symbol: 'ETHUSDT',
      totalReturn: 12.3,
      winRate: 68.9,
      maxDrawdown: 4.2,
      sharpeRatio: 1.89,
      trades: 892
    },
    {
      strategy: 'Momentum Trading',
      symbol: 'SOLUSDT',
      totalReturn: 18.9,
      winRate: 71.5,
      maxDrawdown: 5.8,
      sharpeRatio: 2.12,
      trades: 1056
    }
  ]);

  useEffect(() => {
    // Simular atualizações em tempo real
    const interval = setInterval(() => {
      setMLStats(prev => ({
        ...prev,
        dataPoints: prev.dataPoints + Math.floor(Math.random() * 5),
        predictions: prev.predictions + Math.floor(Math.random() * 3),
        accuracy: Math.min(95, prev.accuracy + (Math.random() * 0.5))
      }));

      setPredictions(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(symbol => {
          updated[symbol] = {
            ...updated[symbol],
            confidence: Math.max(0.6, Math.min(0.95, updated[symbol].confidence + (Math.random() * 0.1 - 0.05))),
            change: updated[symbol].change + (Math.random() * 0.4 - 0.2)
          };
        });
        return updated;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* ML Model Status */}
      <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 backdrop-blur-lg rounded-xl border border-purple-500/20 p-6">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
          <Brain className="w-6 h-6 text-purple-400" />
          <span>Machine Learning Engine</span>
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/5 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-400">{mlStats.dataPoints.toLocaleString()}</div>
            <div className="text-sm text-gray-400">Pontos de Dados</div>
          </div>
          
          <div className="bg-white/5 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-400">{mlStats.predictions}</div>
            <div className="text-sm text-gray-400">Previsões Hoje</div>
          </div>
          
          <div className="bg-white/5 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-yellow-400">{mlStats.accuracy.toFixed(1)}%</div>
            <div className="text-sm text-gray-400">Precisão</div>
          </div>
          
          <div className="bg-white/5 rounded-lg p-4 text-center">
            <div className={`text-2xl font-bold ${mlStats.isTraining ? 'text-orange-400' : 'text-green-400'}`}>
              {mlStats.isTraining ? '🔄' : '✅'}
            </div>
            <div className="text-sm text-gray-400">Status</div>
          </div>
        </div>
      </div>

      {/* Price Predictions */}
      <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-purple-500/20 p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
          <Target className="w-5 h-5 text-green-400" />
          <span>Previsões de Preço (Próxima Hora)</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(predictions).map(([symbol, pred]) => (
            <div key={symbol} className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-white">{symbol}</h4>
                <div className={`px-2 py-1 rounded-full text-xs font-bold ${
                  pred.direction === 'UP' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                }`}>
                  {pred.direction === 'UP' ? '📈' : '📉'} {pred.change.toFixed(1)}%
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Preço Previsto:</span>
                  <span className="text-white font-bold">${pred.price.toLocaleString()}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-400">Confiança:</span>
                  <span className={`font-bold ${
                    pred.confidence > 0.8 ? 'text-green-400' : 
                    pred.confidence > 0.6 ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {(pred.confidence * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
              
              <div className="mt-3">
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      pred.confidence > 0.8 ? 'bg-green-500' : 
                      pred.confidence > 0.6 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${pred.confidence * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Backtest Results */}
      <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-purple-500/20 p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
          <BarChart3 className="w-5 h-5 text-blue-400" />
          <span>Resultados de Backtesting</span>
        </h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-600">
                <th className="text-left py-2 text-gray-300">Estratégia</th>
                <th className="text-left py-2 text-gray-300">Par</th>
                <th className="text-left py-2 text-gray-300">Retorno</th>
                <th className="text-left py-2 text-gray-300">Win Rate</th>
                <th className="text-left py-2 text-gray-300">Drawdown</th>
                <th className="text-left py-2 text-gray-300">Sharpe</th>
                <th className="text-left py-2 text-gray-300">Trades</th>
              </tr>
            </thead>
            <tbody>
              {backtestResults.map((result, index) => (
                <tr key={index} className="border-b border-gray-700/50">
                  <td className="py-3 text-white font-medium">{result.strategy}</td>
                  <td className="py-3 text-gray-300">{result.symbol}</td>
                  <td className={`py-3 font-bold ${
                    result.totalReturn > 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {result.totalReturn > 0 ? '+' : ''}{result.totalReturn.toFixed(1)}%
                  </td>
                  <td className="py-3 text-blue-400">{result.winRate.toFixed(1)}%</td>
                  <td className="py-3 text-yellow-400">{result.maxDrawdown.toFixed(1)}%</td>
                  <td className="py-3 text-purple-400">{result.sharpeRatio.toFixed(2)}</td>
                  <td className="py-3 text-gray-300">{result.trades}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Training Controls */}
      <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-purple-500/20 p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
          <Zap className="w-5 h-5 text-yellow-400" />
          <span>Controles de ML</span>
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center space-x-2">
            <Brain className="w-4 h-4" />
            <span>Treinar Modelo</span>
          </button>
          
          <button className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center space-x-2">
            <Activity className="w-4 h-4" />
            <span>Executar Backtest</span>
          </button>
          
          <button className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center space-x-2">
            <TrendingUp className="w-4 h-4" />
            <span>Otimizar Estratégia</span>
          </button>
          
          <button className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center space-x-2">
            <Target className="w-4 h-4" />
            <span>Análise Completa</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MLDashboard;