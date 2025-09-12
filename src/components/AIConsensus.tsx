import React, { useState } from 'react';
import { Brain, Zap, CheckCircle, XCircle, Clock, TrendingUp } from 'lucide-react';

interface ConsensusItem {
  id: string;
  topic: string;
  chatgptOpinion: string;
  deepseekOpinion: string;
  consensus: 'agreed' | 'disagreed' | 'pending';
  implementation: 'implemented' | 'pending' | 'rejected';
  priority: 'high' | 'medium' | 'low';
}

const AIConsensus: React.FC = () => {
  const [consensusItems] = useState<ConsensusItem[]>([
    {
      id: '1',
      topic: 'Stop-Loss Dinâmico',
      chatgptOpinion: 'Para atingir 0.61%-1% diário, implementar scalping agressivo com take-profit de 0.15% e stop-loss de 0.08%. Usar alavancagem de posição de 15% do capital por trade.',
      deepseekOpinion: 'Concordo com scalping agressivo. Adicionar: trading de alta frequência com 50-100 trades/dia, correlação entre pares para hedging, e rebalanceamento automático a cada hora.',
      consensus: 'agreed',
      implementation: 'implemented',
      priority: 'high'
    },
    {
      id: '2',
      topic: 'Meta de Lucro Horária',
      chatgptOpinion: 'Implementar sistema de metas escalonadas: 0.025% por hora base, aumentando para 0.05% em horários de alta volatilidade (8h-10h, 14h-16h, 20h-22h UTC).',
      deepseekOpinion: 'Adicionar multiplicador de urgência: se abaixo de 50% da meta horária aos 45min, ativar modo turbo com 3x mais trades e risco 2x maior.',
      consensus: 'agreed',
      implementation: 'implemented',
      priority: 'high'
    },
    {
      id: '3',
      topic: 'Gestão Agressiva de Capital',
      chatgptOpinion: 'Para máxima agressividade: 20% do capital por trade em sinais de alta confiança (>85%), 10% em sinais médios (70-85%), 5% em sinais baixos.',
      deepseekOpinion: 'Implementar pirâmide de posições: entrada inicial 10%, adicionar 5% a cada 0.1% de lucro, máximo 25% por par. Stop-loss conjunto em -2%.',
      consensus: 'agreed',
      implementation: 'pending',
      priority: 'high'
    },
    {
      id: '4',
      topic: 'Arbitragem e Correlação',
      chatgptOpinion: 'Implementar arbitragem estatística entre pares correlacionados. Quando ETHUSDT/BTCUSDT diverge >2% da média, fazer trade de convergência.',
      deepseekOpinion: 'Adicionar hedging dinâmico: long no par mais forte, short no mais fraco quando correlação quebra. Usar funding rate para otimizar posições.',
      consensus: 'agreed',
      implementation: 'pending',
      priority: 'high'
    },
    {
      id: '5',
      topic: 'Execução Ultra-Rápida',
      chatgptOpinion: 'Latência <50ms: WebSocket direto, cache local de orderbook, pre-computação de sinais. Execução paralela em todos os pares.',
      deepseekOpinion: 'Implementar co-location virtual: múltiplas conexões API, load balancing, circuit breakers. Predição de movimentos com ML em tempo real.',
      consensus: 'agreed',
      implementation: 'pending',
      priority: 'high'
    },
    {
      id: '6',
      topic: 'Sistema de Recuperação Agressiva',
      chatgptOpinion: 'Se abaixo da meta diária às 20h UTC, ativar modo "recovery": dobrar tamanho das posições, reduzir take-profit para 0.08%, aumentar frequência para 200 trades/hora.',
      deepseekOpinion: 'Implementar "martingale inteligente": após 3 losses consecutivos, próximo trade com 2.5x o tamanho, mas apenas em sinais >90% confiança.',
      consensus: 'agreed',
      implementation: 'pending',
      priority: 'high'
    }
  ]);

  const getConsensusIcon = (consensus: string) => {
    switch (consensus) {
      case 'agreed': return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'disagreed': return <XCircle className="w-5 h-5 text-red-400" />;
      case 'pending': return <Clock className="w-5 h-5 text-yellow-400" />;
      default: return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getImplementationBadge = (implementation: string) => {
    switch (implementation) {
      case 'implemented':
        return <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium">Implementado</span>;
      case 'pending':
        return <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs font-medium">Pendente</span>;
      case 'rejected':
        return <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded-full text-xs font-medium">Rejeitado</span>;
      default:
        return <span className="px-2 py-1 bg-gray-500/20 text-gray-400 rounded-full text-xs font-medium">Desconhecido</span>;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-l-red-500';
      case 'medium': return 'border-l-yellow-500';
      case 'low': return 'border-l-green-500';
      default: return 'border-l-gray-500';
    }
  };

  const stats = {
    total: consensusItems.length,
    agreed: consensusItems.filter(item => item.consensus === 'agreed').length,
    implemented: consensusItems.filter(item => item.implementation === 'implemented').length,
    pending: consensusItems.filter(item => item.implementation === 'pending').length
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-purple-500/20 p-4 text-center">
          <div className="text-2xl font-bold text-purple-400">{stats.total}</div>
          <div className="text-sm text-gray-400">Total Discussões</div>
        </div>
        <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-purple-500/20 p-4 text-center">
          <div className="text-2xl font-bold text-green-400">{stats.agreed}</div>
          <div className="text-sm text-gray-400">Consensos</div>
        </div>
        <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-purple-500/20 p-4 text-center">
          <div className="text-2xl font-bold text-blue-400">{stats.implemented}</div>
          <div className="text-sm text-gray-400">Implementados</div>
        </div>
        <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-purple-500/20 p-4 text-center">
          <div className="text-2xl font-bold text-yellow-400">{stats.pending}</div>
          <div className="text-sm text-gray-400">Pendentes</div>
        </div>
      </div>

      {/* Consensus Items */}
      <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-purple-500/20 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white flex items-center space-x-2">
            <Brain className="w-6 h-6 text-purple-400" />
            <span>Consenso das IAs</span>
          </h2>
          <button className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center space-x-2">
            <Zap className="w-4 h-4" />
            <span>Nova Discussão</span>
          </button>
        </div>

        <div className="space-y-4">
          {consensusItems.map((item) => (
            <div
              key={item.id}
              className={`bg-white/5 rounded-lg border-l-4 ${getPriorityColor(item.priority)} p-6`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  {getConsensusIcon(item.consensus)}
                  <h3 className="text-lg font-medium text-white">{item.topic}</h3>
                </div>
                <div className="flex items-center space-x-2">
                  {getImplementationBadge(item.implementation)}
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    item.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                    item.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-green-500/20 text-green-400'
                  }`}>
                    {item.priority.toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                    <span className="text-sm font-medium text-green-400">ChatGPT</span>
                  </div>
                  <p className="text-gray-300 text-sm leading-relaxed pl-5">
                    {item.chatgptOpinion}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                    <span className="text-sm font-medium text-blue-400">DeepSeek</span>
                  </div>
                  <p className="text-gray-300 text-sm leading-relaxed pl-5">
                    {item.deepseekOpinion}
                  </p>
                </div>
              </div>

              {item.consensus === 'agreed' && item.implementation === 'pending' && (
                <div className="mt-4 pt-4 border-t border-gray-600">
                  <button className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4" />
                    <span>Implementar Agora</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AIConsensus;