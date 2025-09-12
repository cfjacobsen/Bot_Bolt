import React, { useState } from 'react';
import { Code, Save, Play, RefreshCw, FileText, AlertTriangle } from 'lucide-react';

const CodeEditor: React.FC = () => {
  const [activeFile, setActiveFile] = useState('bot_agressivo5.mjs');
  const [code, setCode] = useState(`// Bot Agressivo 5 - Versão Otimizada com IA
import { Spot } from '@binance/connector';
import WebSocket from 'ws';

class TradingBot {
  constructor(config) {
    this.client = new Spot(config.apiKey, config.apiSecret);
    this.config = config;
    this.positions = new Map();
    this.indicators = {};
    this.isRunning = false;
  }

  // Análise técnica avançada com múltiplos indicadores
  async analyzeMarket(symbol) {
    const klines = await this.client.klines(symbol, '5m', { limit: 100 });
    const prices = klines.map(k => parseFloat(k[4])); // Close prices
    
    // RSI Calculation
    const rsi = this.calculateRSI(prices, 14);
    
    // MACD Calculation
    const macd = this.calculateMACD(prices);
    
    // Bollinger Bands
    const bb = this.calculateBollingerBands(prices, 20, 2);
    
    // ATR for dynamic stop-loss
    const atr = this.calculateATR(klines, 14);
    
    return {
      rsi: rsi[rsi.length - 1],
      macd: macd[macd.length - 1],
      bb: bb[bb.length - 1],
      atr: atr[atr.length - 1],
      price: prices[prices.length - 1]
    };
  }

  // Estratégia de trading com consenso das IAs
  async executeStrategy(symbol) {
    const analysis = await this.analyzeMarket(symbol);
    const signal = this.generateSignal(analysis);
    
    if (signal.action === 'BUY') {
      await this.executeBuy(symbol, signal);
    } else if (signal.action === 'SELL') {
      await this.executeSell(symbol, signal);
    }
  }

  // Geração de sinais baseada em múltiplos indicadores
  generateSignal(analysis) {
    let score = 0;
    
    // RSI Signal
    if (analysis.rsi < 30) score += 2; // Oversold
    if (analysis.rsi > 70) score -= 2; // Overbought
    
    // MACD Signal
    if (analysis.macd.histogram > 0) score += 1;
    if (analysis.macd.histogram < 0) score -= 1;
    
    // Bollinger Bands Signal
    if (analysis.price < analysis.bb.lower) score += 1;
    if (analysis.price > analysis.bb.upper) score -= 1;
    
    return {
      action: score >= 2 ? 'BUY' : score <= -2 ? 'SELL' : 'HOLD',
      confidence: Math.abs(score) / 4,
      stopLoss: analysis.atr * 2.0 // Dynamic stop-loss
    };
  }

  // Gestão de risco avançada
  calculatePositionSize(signal, balance) {
    const riskPerTrade = 0.03; // 3% risk per trade
    const stopLossDistance = signal.stopLoss;
    
    return (balance * riskPerTrade) / stopLossDistance;
  }

  // Execução de compra com take-profit escalonado
  async executeBuy(symbol, signal) {
    const balance = await this.getBalance();
    const positionSize = this.calculatePositionSize(signal, balance);
    
    try {
      const order = await this.client.newOrder(symbol, 'BUY', 'MARKET', {
        quantity: positionSize
      });
      
      // Set take-profit levels (50% at 1.5%, 50% at 3%)
      await this.setTakeProfitLevels(symbol, order, signal);
      
      console.log(\`Buy order executed: \${JSON.stringify(order)}\`);
    } catch (error) {
      console.error('Buy order failed:', error);
    }
  }

  // Monitoramento em tempo real
  startRealTimeMonitoring() {
    const ws = new WebSocket('wss://stream.binance.com:9443/ws/btcusdt@ticker');
    
    ws.on('message', (data) => {
      const ticker = JSON.parse(data);
      this.updateMarketData(ticker);
    });
  }

  // Inicialização do bot
  async start() {
    console.log('🚀 Bot Agressivo 5 iniciado com otimizações de IA');
    this.isRunning = true;
    this.startRealTimeMonitoring();
    
    // Loop principal
    while (this.isRunning) {
      for (const symbol of this.config.tradingPairs) {
        await this.executeStrategy(symbol);
      }
      
      await this.sleep(5000); // 5 seconds interval
    }
  }
}

// Configuração do bot
const config = {
  apiKey: process.env.BINANCE_API_KEY,
  apiSecret: process.env.BINANCE_API_SECRET,
  tradingPairs: ['BTCUSDT', 'ETHUSDT', 'SOLUSDT'],
  hourlyTarget: 0.5,
  dailyTarget: 5.0
};

const bot = new TradingBot(config);
bot.start();`);

  const [isModified, setIsModified] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const files = [
    { name: 'bot_agressivo5.mjs', type: 'javascript' },
    { name: 'config.json', type: 'json' },
    { name: 'indicators.js', type: 'javascript' },
    { name: 'risk-management.js', type: 'javascript' }
  ];

  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
    setIsModified(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate save operation
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSaving(false);
    setIsModified(false);
  };

  const handleRestart = () => {
    // Simulate bot restart
    console.log('Restarting bot with new code...');
  };

  return (
    <div className="space-y-6">
      {/* File Tabs */}
      <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-purple-500/20 p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white flex items-center space-x-2">
            <Code className="w-6 h-6 text-purple-400" />
            <span>Editor de Código</span>
          </h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleSave}
              disabled={!isModified || isSaving}
              className="bg-green-500 hover:bg-green-600 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Salvando...' : 'Salvar'}</span>
            </button>
            <button
              onClick={handleRestart}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reiniciar Bot</span>
            </button>
          </div>
        </div>

        <div className="flex space-x-2 mb-4">
          {files.map((file) => (
            <button
              key={file.name}
              onClick={() => setActiveFile(file.name)}
              className={`px-4 py-2 rounded-lg transition-colors duration-200 flex items-center space-x-2 ${
                activeFile === file.name
                  ? 'bg-purple-500 text-white'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>{file.name}</span>
              {file.name === activeFile && isModified && (
                <div className="w-2 h-2 bg-yellow-400 rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Code Editor */}
      <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-purple-500/20 overflow-hidden">
        <div className="bg-black/20 px-4 py-2 border-b border-purple-500/20 flex items-center justify-between">
          <span className="text-gray-300 font-mono text-sm">{activeFile}</span>
          {isModified && (
            <div className="flex items-center space-x-2 text-yellow-400">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm">Não salvo</span>
            </div>
          )}
        </div>
        
        <textarea
          value={code}
          onChange={(e) => handleCodeChange(e.target.value)}
          className="w-full h-96 bg-transparent text-gray-300 font-mono text-sm p-4 resize-none focus:outline-none"
          style={{ fontFamily: 'Monaco, Consolas, "Courier New", monospace' }}
        />
      </div>

      {/* AI Suggestions */}
      <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-purple-500/20 p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
          <Play className="w-5 h-5 text-green-400" />
          <span>Sugestões de IA</span>
        </h3>
        
        <div className="space-y-3">
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
            <p className="text-green-400 font-medium mb-2">Otimização Detectada</p>
            <p className="text-gray-300 text-sm">
              Implementar cache para dados de mercado pode reduzir latência em 40%. 
              Adicionar Redis para armazenar indicadores calculados.
            </p>
          </div>
          
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
            <p className="text-blue-400 font-medium mb-2">Melhoria de Segurança</p>
            <p className="text-gray-300 text-sm">
              Adicionar validação de entrada para parâmetros de trading. 
              Implementar rate limiting para chamadas à API.
            </p>
          </div>
          
          <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
            <p className="text-purple-400 font-medium mb-2">Nova Estratégia</p>
            <p className="text-gray-300 text-sm">
              Considerar implementar Mean Reversion Strategy para mercados laterais. 
              Pode aumentar a taxa de sucesso em 15%.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodeEditor;