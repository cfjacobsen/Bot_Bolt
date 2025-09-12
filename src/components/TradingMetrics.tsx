import React from 'react';
import { BarChart3, PieChart, TrendingUp, AlertCircle } from 'lucide-react';

interface TradingMetricsProps {
  metrics: {
    hourlyTarget: number;
    dailyTarget: number;
    currentHourly: number;
    currentDaily: number;
    totalTrades: number;
    successRate: number;
    activePairs: string[];
  };
}

const TradingMetrics: React.FC<TradingMetricsProps> = ({ metrics }) => {
  // Calcular performance agregada
  const totalTrades = Object.values(metrics.pairProfits || {}).reduce((sum, p) => sum + p.trades, 0);
  const profitableTrades = Object.values(metrics.pairProfits || {}).reduce((sum, p) => sum + (p.trades * p.successRate / 100), 0);
  const breakEvenTrades = totalTrades * 0.1; // Estimativa de 10% empate
  const lossTrades = totalTrades - profitableTrades - breakEvenTrades;

  const performanceData = [
    { label: 'Trades Lucrativos', value: (profitableTrades / totalTrades * 100) || 0, color: 'bg-green-500' },
    { label: 'Trades Empate', value: (breakEvenTrades / totalTrades * 100) || 0, color: 'bg-yellow-500' },
    { label: 'Trades Prejuízo', value: (lossTrades / totalTrades * 100) || 0, color: 'bg-red-500' }
  ];

  const riskMetrics = [
    { label: 'Drawdown Máximo', value: '1.8%', status: 'excellent' },
    { label: 'Sharpe Ratio', value: '2.34', status: 'excellent' },
    { label: 'Win Rate Agregada', value: `${((profitableTrades / totalTrades * 100) || 0).toFixed(1)}%`, status: 'excellent' },
    { label: 'Profit Factor', value: '3.21', status: 'excellent' },
    { label: 'Meta Diária Progress', value: `${((metrics.aggregatedProfit?.daily / metrics.aggregatedProfit?.target * 100) || 0).toFixed(1)}%`, status: 'excellent' },
    { label: 'Velocidade Lucro/Hora', value: `${(metrics.aggregatedProfit?.hourly || 0).toFixed(3)}%`, status: 'excellent' }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-400';
      case 'good': return 'text-blue-400';
      case 'warning': return 'text-yellow-400';
      case 'danger': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Performance Chart */}
      <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-purple-500/20 p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
          <PieChart className="w-5 h-5 text-purple-400" />
          <span>Performance</span>
        </h3>
        
        <div className="space-y-4">
          {performanceData.map((item) => (
            <div key={item.label} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">{item.label}</span>
                <span className="text-white font-medium">{item.value}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${item.color} transition-all duration-500`}
                  style={{ width: `${item.value}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Risk Metrics */}
      <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-purple-500/20 p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
          <BarChart3 className="w-5 h-5 text-purple-400" />
          <span>Métricas de Risco</span>
        </h3>
        
        <div className="space-y-4">
          {riskMetrics.map((metric) => (
            <div key={metric.label} className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
              <span className="text-gray-300">{metric.label}</span>
              <span className={`font-bold ${getStatusColor(metric.status)}`}>
                {metric.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Alerts */}
      <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-purple-500/20 p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-yellow-400" />
          <span>Alertas</span>
        </h3>
        
        <div className="space-y-3">
          <div className="flex items-start space-x-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-yellow-400 font-medium">Volatilidade Alta</p>
              <p className="text-gray-300 text-sm">BTCUSDT apresenta volatilidade acima do normal</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
            <TrendingUp className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-green-400 font-medium">Oportunidade</p>
              <p className="text-gray-300 text-sm">ETHUSDT mostra sinal de compra forte</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradingMetrics;