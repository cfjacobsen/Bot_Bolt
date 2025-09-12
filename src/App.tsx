import React, { useState, useEffect } from 'react';
import { Bot, TrendingUp, Shield, Settings, MessageSquare, Activity, AlertTriangle, CheckCircle, Target, Zap, Brain } from 'lucide-react';
import ChatInterface from './components/ChatInterface';
import BotStatus from './components/BotStatus';
import TradingMetrics from './components/TradingMetrics';
import AIConsensus from './components/AIConsensus';
import CodeEditor from './components/CodeEditor';
import SecurityPanel from './components/SecurityPanel';
import AggressiveProfitTracker from './components/AggressiveProfitTracker';
import MLDashboard from './components/MLDashboard';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [botStatus, setBotStatus] = useState('running');
  const [metrics, setMetrics] = useState({
    hourlyTarget: 0.025, // 0.025% por hora para atingir 0.61% ao dia
    dailyTarget: 1.0,    // Meta máxima de 1%
    currentHourly: 0.018,
    currentDaily: 0.73,
    totalTrades: 47,
    successRate: 78.2,
    activePairs: ['BTCUSDT', 'ETHUSDT', 'SOLUSDT'],
    startTime: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 horas atrás
    currentTime: new Date().toISOString(),
    pairProfits: {
      'BTCUSDT': {
        hourlyProfit: 0.032,
        dailyProfit: 0.847,
        trades: 18,
        successRate: 83.3
      },
      'ETHUSDT': {
        hourlyProfit: 0.019,
        dailyProfit: 0.651,
        trades: 15,
        successRate: 73.3
      },
      'SOLUSDT': {
        hourlyProfit: 0.041,
        dailyProfit: 0.692,
        trades: 14,
        successRate: 78.6
      }
    },
    aggregatedProfit: {
      hourly: 0.031, // Média agregada
      daily: 0.73,   // Lucro total agregado
      target: 0.85   // Meta dinâmica entre 0.61% e 1%
    }
  });

  // Atualizar métricas em tempo real
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        currentTime: new Date().toISOString(),
        // Simular pequenas variações nos lucros
        aggregatedProfit: {
          ...prev.aggregatedProfit,
          hourly: prev.aggregatedProfit.hourly + (Math.random() * 0.01 - 0.005),
          daily: prev.aggregatedProfit.daily + (Math.random() * 0.005)
        }
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Activity },
    { id: 'profit', label: 'Profit Tracker', icon: Target },
    { id: 'ml', label: 'ML & Backtest', icon: Brain },
    { id: 'chat', label: 'AI Chat', icon: MessageSquare },
    { id: 'consensus', label: 'AI Consensus', icon: Bot },
    { id: 'editor', label: 'Code Editor', icon: Settings },
    { id: 'security', label: 'Security', icon: Shield }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-lg border-b border-purple-500/20">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Advanced Trading Bot Manager</h1>
                <p className="text-purple-300 text-sm">Sistema Inteligente de Gestão com IA</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${
                botStatus === 'running' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  botStatus === 'running' ? 'bg-green-400' : 'bg-red-400'
                } animate-pulse`} />
                <span className="text-sm font-medium">
                  {botStatus === 'running' ? 'Bot Ativo' : 'Bot Inativo'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-black/10 backdrop-blur-lg border-b border-purple-500/10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-3 border-b-2 transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'border-purple-400 text-purple-400'
                      : 'border-transparent text-gray-400 hover:text-purple-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <BotStatus status={botStatus} metrics={metrics} />
              </div>
              <div>
                <TradingMetrics metrics={metrics} />
              </div>
            </div>
            
            {/* Quick Actions */}
            <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-purple-500/20 p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                <Zap className="w-5 h-5 text-yellow-400" />
                <span>Controles Agressivos</span>
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button className="flex items-center justify-center space-x-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 px-4 py-3 rounded-lg transition-all duration-200 animate-pulse">
                  <CheckCircle className="w-4 h-4" />
                  <span>Modo Turbo</span>
                </button>
                <button className="flex items-center justify-center space-x-2 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 px-4 py-3 rounded-lg transition-all duration-200">
                  <Target className="w-4 h-4" />
                  <span>Force Meta</span>
                </button>
                <button className="flex items-center justify-center space-x-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 px-4 py-3 rounded-lg transition-all duration-200">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Emergency</span>
                </button>
                <button className="flex items-center justify-center space-x-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 px-4 py-3 rounded-lg transition-all duration-200">
                  <Settings className="w-4 h-4" />
                  <span>Rebalance</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'profit' && <AggressiveProfitTracker />}
        {activeTab === 'ml' && <MLDashboard />}
        {activeTab === 'chat' && <ChatInterface />}
        {activeTab === 'consensus' && <AIConsensus />}
        {activeTab === 'editor' && <CodeEditor />}
        {activeTab === 'security' && <SecurityPanel />}
      </main>
    </div>
  );
}

export default App;