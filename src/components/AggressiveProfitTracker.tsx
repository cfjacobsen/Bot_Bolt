import React, { useState, useEffect } from 'react';
import { Target, Zap, TrendingUp, Clock, DollarSign, Activity } from 'lucide-react';

interface ProfitData {
  timestamp: string;
  hourlyProfit: number;
  dailyProfit: number;
  trades: number;
}

const AggressiveProfitTracker: React.FC = () => {
  const [profitHistory, setProfitHistory] = useState<ProfitData[]>([]);
  const [currentMetrics, setCurrentMetrics] = useState({
    aggregatedHourly: 0.031,
    aggregatedDaily: 0.847,
    targetDaily: 0.85,
    hoursRunning: 4.2,
    totalTrades: 156,
    avgProfitPerTrade: 0.0054
  });

  useEffect(() => {
    // Simular dados históricos de lucro
    const generateHistoricalData = () => {
      const data: ProfitData[] = [];
      const now = new Date();
      
      for (let i = 23; i >= 0; i--) {
        const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
        data.push({
          timestamp: timestamp.toISOString(),
          hourlyProfit: Math.random() * 0.08 - 0.01, // -1% a +7% por hora
          dailyProfit: Math.random() * 1.2,
          trades: Math.floor(Math.random() * 15) + 5
        });
      }
      
      setProfitHistory(data);
    };

    generateHistoricalData();
    
    // Atualizar métricas a cada 5 segundos
    const interval = setInterval(() => {
      setCurrentMetrics(prev => ({
        ...prev,
        aggregatedHourly: prev.aggregatedHourly + (Math.random() * 0.01 - 0.005),
        aggregatedDaily: prev.aggregatedDaily + (Math.random() * 0.005),
        hoursRunning: prev.hoursRunning + (5 / 3600), // +5 segundos
        totalTrades: prev.totalTrades + Math.floor(Math.random() * 2)
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const formatDuration = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.floor((hours - h) * 60);
    const s = Math.floor(((hours - h) * 60 - m) * 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const profitVelocity = currentMetrics.hoursRunning > 0 ? 
    (currentMetrics.aggregatedDaily / currentMetrics.hoursRunning) : 0;

  return (
    <div className="space-y-6">
      {/* Header com métricas principais */}
      <div className="bg-gradient-to-r from-green-500/10 via-emerald-500/10 to-teal-500/10 backdrop-blur-lg rounded-xl border border-green-500/20 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
            <Target className="w-8 h-8 text-green-400" />
            <span>TRACKER DE LUCRO AGRESSIVO</span>
          </h2>
          <div className="text-right">
            <div className="text-3xl font-bold text-green-400">
              {currentMetrics.aggregatedDaily.toFixed(3)}%
            </div>
            <div className="text-sm text-gray-400">Lucro Diário Atual</div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/5 rounded-lg p-4 text-center">
            <Clock className="w-6 h-6 text-blue-400 mx-auto mb-2" />
            <div className="text-xl font-bold text-blue-400">
              {formatDuration(currentMetrics.hoursRunning)}
            </div>
            <div className="text-sm text-gray-400">Tempo Execução</div>
          </div>

          <div className="bg-white/5 rounded-lg p-4 text-center">
            <Zap className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
            <div className="text-xl font-bold text-yellow-400">
              {profitVelocity.toFixed(4)}%
            </div>
            <div className="text-sm text-gray-400">Velocidade/Hora</div>
          </div>

          <div className="bg-white/5 rounded-lg p-4 text-center">
            <Activity className="w-6 h-6 text-purple-400 mx-auto mb-2" />
            <div className="text-xl font-bold text-purple-400">
              {currentMetrics.totalTrades}
            </div>
            <div className="text-sm text-gray-400">Total Trades</div>
          </div>

          <div className="bg-white/5 rounded-lg p-4 text-center">
            <DollarSign className="w-6 h-6 text-green-400 mx-auto mb-2" />
            <div className="text-xl font-bold text-green-400">
              {(currentMetrics.avgProfitPerTrade * 100).toFixed(3)}%
            </div>
            <div className="text-sm text-gray-400">Lucro/Trade</div>
          </div>
        </div>
      </div>

      {/* Gráfico de progresso horário */}
      <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-purple-500/20 p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
          <TrendingUp className="w-5 h-5 text-green-400" />
          <span>Progresso Horário - Últimas 24h</span>
        </h3>
        
        <div className="grid grid-cols-12 gap-1 h-32">
          {profitHistory.map((data, index) => {
            const height = Math.max(5, Math.abs(data.hourlyProfit) * 1000);
            const isProfit = data.hourlyProfit >= 0;
            
            return (
              <div key={index} className="flex flex-col justify-end items-center">
                <div
                  className={`w-full rounded-t transition-all duration-300 ${
                    isProfit ? 'bg-green-500' : 'bg-red-500'
                  }`}
                  style={{ height: `${Math.min(height, 100)}%` }}
                  title={`${new Date(data.timestamp).getHours()}h: ${(data.hourlyProfit * 100).toFixed(2)}%`}
                />
                <div className="text-xs text-gray-400 mt-1">
                  {new Date(data.timestamp).getHours()}h
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="mt-4 flex justify-between text-sm text-gray-400">
          <span>📈 Verde: Lucro | 📉 Vermelho: Prejuízo</span>
          <span>Meta: 0.025% por hora</span>
        </div>
      </div>

      {/* Alertas de performance */}
      <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-purple-500/20 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">🚨 Alertas de Performance Agressiva</h3>
        
        <div className="space-y-3">
          {currentMetrics.aggregatedDaily >= 0.61 ? (
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <Target className="w-5 h-5 text-green-400" />
                <span className="text-green-400 font-bold">META DIÁRIA ATINGIDA!</span>
              </div>
              <p className="text-gray-300 text-sm mt-2">
                Lucro atual de {currentMetrics.aggregatedDaily.toFixed(3)}% superou a meta mínima de 0.61%. 
                Continuando em modo agressivo para atingir 1.0%.
              </p>
            </div>
          ) : (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <Zap className="w-5 h-5 text-red-400" />
                <span className="text-red-400 font-bold">ABAIXO DA META - MODO TURBO ATIVO</span>
              </div>
              <p className="text-gray-300 text-sm mt-2">
                Faltam {(0.61 - currentMetrics.aggregatedDaily).toFixed(3)}% para atingir a meta mínima. 
                Ativando estratégias ultra-agressivas.
              </p>
            </div>
          )}
          
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-blue-400" />
              <span className="text-blue-400 font-bold">VELOCIDADE DE EXECUÇÃO</span>
            </div>
            <p className="text-gray-300 text-sm mt-2">
              Executando {(currentMetrics.totalTrades / currentMetrics.hoursRunning).toFixed(1)} trades por hora. 
              Latência média: &lt;50ms. Sistema operando em máxima eficiência.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AggressiveProfitTracker;