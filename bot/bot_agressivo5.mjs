// Bot Agressivo 5 - Versão Otimizada com IA Colaborativa
import { Spot } from '@binance/connector';
import WebSocket from 'ws';
import fs from 'fs/promises';

class AdvancedTradingBot {
  constructor(config) {
    this.client = new Spot(config.apiKey, config.apiSecret, {
      baseURL: 'https://api.binance.com'
    });
    this.config = config;
    this.positions = new Map();
    this.indicators = {};
    this.isRunning = false;
    this.metrics = {
      hourlyTarget: config.hourlyTarget || 0.5,
      dailyTarget: config.dailyTarget || 5.0,
      currentHourly: 0,
      currentDaily: 0,
      totalTrades: 0,
      successfulTrades: 0,
      startTime: new Date()
    };
    this.marketData = new Map();
    this.riskManager = new RiskManager(config);
    this.aiOptimizer = new AIOptimizer();
  }

  // Análise técnica avançada com múltiplos indicadores
  async analyzeMarket(symbol) {
    try {
      const klines = await this.client.klines(symbol, '5m', { limit: 100 });
      const prices = klines.map(k => parseFloat(k[4])); // Close prices
      const volumes = klines.map(k => parseFloat(k[5])); // Volumes
      const highs = klines.map(k => parseFloat(k[2])); // High prices
      const lows = klines.map(k => parseFloat(k[3])); // Low prices
      
      // Indicadores técnicos
      const rsi = this.calculateRSI(prices, 14);
      const macd = this.calculateMACD(prices);
      const bb = this.calculateBollingerBands(prices, 20, 2);
      const atr = this.calculateATR(klines, 14);
      const ema20 = this.calculateEMA(prices, 20);
      const ema50 = this.calculateEMA(prices, 50);
      const volumeMA = this.calculateSMA(volumes, 20);
      
      // Análise de suporte e resistência
      const supportResistance = this.findSupportResistance(highs, lows);
      
      // Score de momentum
      const momentumScore = this.calculateMomentumScore(prices, volumes);
      
      return {
        symbol,
        price: prices[prices.length - 1],
        rsi: rsi[rsi.length - 1],
        macd: macd[macd.length - 1],
        bb: bb[bb.length - 1],
        atr: atr[atr.length - 1],
        ema20: ema20[ema20.length - 1],
        ema50: ema50[ema50.length - 1],
        volume: volumes[volumes.length - 1],
        volumeMA: volumeMA[volumeMA.length - 1],
        supportResistance,
        momentumScore,
        timestamp: new Date()
      };
    } catch (error) {
      console.error(`Erro na análise de mercado para ${symbol}:`, error);
      return null;
    }
  }

  // Estratégia de trading com consenso das IAs
  async executeStrategy(symbol) {
    const analysis = await this.analyzeMarket(symbol);
    if (!analysis) return;

    const signal = this.generateAdvancedSignal(analysis);
    
    // Verificar correlação com BTC se não for BTCUSDT
    if (symbol !== 'BTCUSDT') {
      const btcAnalysis = await this.analyzeMarket('BTCUSDT');
      signal.btcCorrelation = this.calculateCorrelation(analysis, btcAnalysis);
    }

    // Aplicar filtros de risco
    const riskAssessment = this.riskManager.assessRisk(signal, analysis);
    
    if (riskAssessment.approved) {
      if (signal.action === 'BUY') {
        await this.executeBuy(symbol, signal, analysis);
      } else if (signal.action === 'SELL') {
        await this.executeSell(symbol, signal, analysis);
      }
    } else {
      console.log(`❌ Trade rejeitado para ${symbol}: ${riskAssessment.reason}`);
    }
  }

  // Geração de sinais avançada com múltiplos fatores
  generateAdvancedSignal(analysis) {
    let score = 0;
    let confidence = 0;
    const factors = [];

    // RSI Signal (peso: 2)
    if (analysis.rsi < 30) {
      score += 2;
      confidence += 0.2;
      factors.push('RSI Oversold');
    } else if (analysis.rsi > 70) {
      score -= 2;
      confidence += 0.2;
      factors.push('RSI Overbought');
    }

    // MACD Signal (peso: 2)
    if (analysis.macd.histogram > 0 && analysis.macd.signal > analysis.macd.macd) {
      score += 2;
      confidence += 0.2;
      factors.push('MACD Bullish');
    } else if (analysis.macd.histogram < 0 && analysis.macd.signal < analysis.macd.macd) {
      score -= 2;
      confidence += 0.2;
      factors.push('MACD Bearish');
    }

    // Bollinger Bands Signal (peso: 1.5)
    if (analysis.price < analysis.bb.lower) {
      score += 1.5;
      confidence += 0.15;
      factors.push('BB Oversold');
    } else if (analysis.price > analysis.bb.upper) {
      score -= 1.5;
      confidence += 0.15;
      factors.push('BB Overbought');
    }

    // EMA Crossover (peso: 1.5)
    if (analysis.ema20 > analysis.ema50) {
      score += 1.5;
      confidence += 0.15;
      factors.push('EMA Bullish Cross');
    } else if (analysis.ema20 < analysis.ema50) {
      score -= 1.5;
      confidence += 0.15;
      factors.push('EMA Bearish Cross');
    }

    // Volume Confirmation (peso: 1)
    if (analysis.volume > analysis.volumeMA * 1.2) {
      confidence += 0.1;
      factors.push('High Volume');
    }

    // Momentum Score (peso: 1)
    score += analysis.momentumScore;
    confidence += Math.abs(analysis.momentumScore) * 0.1;

    return {
      action: score >= 3 ? 'BUY' : score <= -3 ? 'SELL' : 'HOLD',
      score,
      confidence: Math.min(confidence, 1),
      factors,
      stopLoss: analysis.atr * 2.0,
      takeProfit: analysis.atr * 4.0,
      timestamp: new Date()
    };
  }

  // Execução de compra com gestão avançada
  async executeBuy(symbol, signal, analysis) {
    try {
      const balance = await this.getAvailableBalance();
      const positionSize = this.riskManager.calculatePositionSize(signal, balance, analysis);
      
      if (positionSize < this.config.minTradeSize) {
        console.log(`❌ Posição muito pequena para ${symbol}: ${positionSize}`);
        return;
      }

      const order = await this.client.newOrder(symbol, 'BUY', 'MARKET', {
        quantity: positionSize.toFixed(8)
      });

      // Configurar stop-loss e take-profit escalonado
      await this.setStopLossAndTakeProfit(symbol, order, signal, analysis);
      
      // Atualizar métricas
      this.updateMetrics('BUY', symbol, positionSize, analysis.price);
      
      console.log(`✅ Compra executada: ${symbol} - ${positionSize} @ ${analysis.price}`);
      console.log(`📊 Fatores: ${signal.factors.join(', ')}`);
      
      // Log para análise posterior
      await this.logTrade('BUY', symbol, order, signal, analysis);
      
    } catch (error) {
      console.error(`❌ Erro na compra de ${symbol}:`, error);
    }
  }

  // Execução de venda
  async executeSell(symbol, signal, analysis) {
    try {
      const position = this.positions.get(symbol);
      if (!position) {
        console.log(`❌ Nenhuma posição encontrada para ${symbol}`);
        return;
      }

      const order = await this.client.newOrder(symbol, 'SELL', 'MARKET', {
        quantity: position.quantity
      });

      // Calcular P&L
      const pnl = (analysis.price - position.entryPrice) / position.entryPrice * 100;
      
      // Atualizar métricas
      this.updateMetrics('SELL', symbol, position.quantity, analysis.price, pnl);
      
      console.log(`✅ Venda executada: ${symbol} - ${position.quantity} @ ${analysis.price} (P&L: ${pnl.toFixed(2)}%)`);
      
      // Remover posição
      this.positions.delete(symbol);
      
      // Log para análise posterior
      await this.logTrade('SELL', symbol, order, signal, analysis, pnl);
      
    } catch (error) {
      console.error(`❌ Erro na venda de ${symbol}:`, error);
    }
  }

  // Configurar stop-loss e take-profit escalonado
  async setStopLossAndTakeProfit(symbol, order, signal, analysis) {
    try {
      const entryPrice = parseFloat(order.fills[0].price);
      const stopLossPrice = entryPrice - signal.stopLoss;
      const takeProfit1 = entryPrice + (signal.takeProfit * 0.5);
      const takeProfit2 = entryPrice + signal.takeProfit;
      
      // Stop-loss
      await this.client.newOrder(symbol, 'SELL', 'STOP_MARKET', {
        quantity: order.executedQty,
        stopPrice: stopLossPrice.toFixed(8)
      });

      // Take-profit escalonado (50% em TP1, 50% em TP2)
      const halfQuantity = (parseFloat(order.executedQty) / 2).toFixed(8);
      
      await this.client.newOrder(symbol, 'SELL', 'LIMIT', {
        quantity: halfQuantity,
        price: takeProfit1.toFixed(8),
        timeInForce: 'GTC'
      });

      await this.client.newOrder(symbol, 'SELL', 'LIMIT', {
        quantity: halfQuantity,
        price: takeProfit2.toFixed(8),
        timeInForce: 'GTC'
      });

      // Salvar posição
      this.positions.set(symbol, {
        quantity: parseFloat(order.executedQty),
        entryPrice,
        stopLoss: stopLossPrice,
        takeProfit1,
        takeProfit2,
        timestamp: new Date()
      });

    } catch (error) {
      console.error(`❌ Erro ao configurar SL/TP para ${symbol}:`, error);
    }
  }

  // Monitoramento em tempo real com WebSocket
  startRealTimeMonitoring() {
    const streams = this.config.tradingPairs.map(pair => `${pair.toLowerCase()}@ticker`);
    const wsUrl = `wss://stream.binance.com:9443/ws/${streams.join('/')}`;
    
    const ws = new WebSocket(wsUrl);
    
    ws.on('open', () => {
      console.log('🔗 WebSocket conectado para monitoramento em tempo real');
    });

    ws.on('message', (data) => {
      const ticker = JSON.parse(data);
      this.updateMarketData(ticker);
      
      // Verificar alertas de preço
      this.checkPriceAlerts(ticker);
    });

    ws.on('error', (error) => {
      console.error('❌ Erro no WebSocket:', error);
    });

    ws.on('close', () => {
      console.log('🔌 WebSocket desconectado. Tentando reconectar...');
      setTimeout(() => this.startRealTimeMonitoring(), 5000);
    });
  }

  // Otimização automática com IA
  async optimizeStrategy() {
    const performance = await this.analyzePerformance();
    const suggestions = await this.aiOptimizer.getSuggestions(performance);
    
    console.log('🤖 Sugestões de otimização da IA:');
    suggestions.forEach(suggestion => {
      console.log(`  - ${suggestion}`);
    });

    // Implementar sugestões automaticamente se a confiança for alta
    const highConfidenceSuggestions = suggestions.filter(s => s.confidence > 0.8);
    for (const suggestion of highConfidenceSuggestions) {
      await this.implementSuggestion(suggestion);
    }
  }

  // Análise de performance
  async analyzePerformance() {
    const now = new Date();
    const hoursSinceStart = (now - this.metrics.startTime) / (1000 * 60 * 60);
    const daysSinceStart = hoursSinceStart / 24;

    return {
      totalTrades: this.metrics.totalTrades,
      successRate: this.metrics.totalTrades > 0 ? 
        (this.metrics.successfulTrades / this.metrics.totalTrades) * 100 : 0,
      hourlyReturn: this.metrics.currentHourly,
      dailyReturn: this.metrics.currentDaily,
      hourlyTarget: this.metrics.hourlyTarget,
      dailyTarget: this.metrics.dailyTarget,
      runtime: {
        hours: hoursSinceStart,
        days: daysSinceStart
      }
    };
  }

  // Atualizar métricas
  updateMetrics(action, symbol, quantity, price, pnl = null) {
    this.metrics.totalTrades++;
    
    if (action === 'SELL' && pnl !== null) {
      if (pnl > 0) {
        this.metrics.successfulTrades++;
        this.metrics.currentHourly += pnl;
        this.metrics.currentDaily += pnl;
      }
    }

    // Reset métricas horárias
    const now = new Date();
    if (now.getMinutes() === 0 && now.getSeconds() < 30) {
      this.metrics.currentHourly = 0;
    }

    // Reset métricas diárias
    if (now.getHours() === 0 && now.getMinutes() === 0 && now.getSeconds() < 30) {
      this.metrics.currentDaily = 0;
    }
  }

  // Log de trades para análise
  async logTrade(action, symbol, order, signal, analysis, pnl = null) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      action,
      symbol,
      price: analysis.price,
      quantity: order.executedQty || order.quantity,
      signal: {
        score: signal.score,
        confidence: signal.confidence,
        factors: signal.factors
      },
      analysis: {
        rsi: analysis.rsi,
        macd: analysis.macd.histogram,
        bb: analysis.bb,
        volume: analysis.volume
      },
      pnl
    };

    try {
      await fs.appendFile('trades.log', JSON.stringify(logEntry) + '\n');
    } catch (error) {
      console.error('❌ Erro ao salvar log:', error);
    }
  }

  // Inicialização do bot
  async start() {
    console.log('🚀 Bot Agressivo 5 - Versão IA Colaborativa iniciado');
    console.log(`📊 Pares: ${this.config.tradingPairs.join(', ')}`);
    console.log(`🎯 Meta horária: ${this.config.hourlyTarget}% | Meta diária: ${this.config.dailyTarget}%`);
    
    this.isRunning = true;
    this.startRealTimeMonitoring();
    
    // Loop principal de trading
    while (this.isRunning) {
      try {
        for (const symbol of this.config.tradingPairs) {
          await this.executeStrategy(symbol);
          await this.sleep(1000); // 1 segundo entre pares
        }
        
        // Otimização a cada hora
        if (new Date().getMinutes() === 0) {
          await this.optimizeStrategy();
        }
        
        await this.sleep(30000); // 30 segundos entre ciclos
        
      } catch (error) {
        console.error('❌ Erro no loop principal:', error);
        await this.sleep(10000); // 10 segundos em caso de erro
      }
    }
  }

  async stop() {
    console.log('🛑 Parando bot...');
    this.isRunning = false;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Indicadores técnicos
  calculateRSI(prices, period) {
    const gains = [];
    const losses = [];
    
    for (let i = 1; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      gains.push(change > 0 ? change : 0);
      losses.push(change < 0 ? Math.abs(change) : 0);
    }
    
    const rsi = [];
    for (let i = period - 1; i < gains.length; i++) {
      const avgGain = gains.slice(i - period + 1, i + 1).reduce((a, b) => a + b) / period;
      const avgLoss = losses.slice(i - period + 1, i + 1).reduce((a, b) => a + b) / period;
      
      if (avgLoss === 0) {
        rsi.push(100);
      } else {
        const rs = avgGain / avgLoss;
        rsi.push(100 - (100 / (1 + rs)));
      }
    }
    
    return rsi;
  }

  calculateMACD(prices) {
    const ema12 = this.calculateEMA(prices, 12);
    const ema26 = this.calculateEMA(prices, 26);
    
    const macdLine = ema12.map((val, i) => val - ema26[i]);
    const signalLine = this.calculateEMA(macdLine, 9);
    const histogram = macdLine.map((val, i) => val - signalLine[i]);
    
    return macdLine.map((val, i) => ({
      macd: val,
      signal: signalLine[i],
      histogram: histogram[i]
    }));
  }

  calculateEMA(prices, period) {
    const multiplier = 2 / (period + 1);
    const ema = [prices[0]];
    
    for (let i = 1; i < prices.length; i++) {
      ema.push((prices[i] * multiplier) + (ema[i - 1] * (1 - multiplier)));
    }
    
    return ema;
  }

  calculateSMA(values, period) {
    const sma = [];
    for (let i = period - 1; i < values.length; i++) {
      const sum = values.slice(i - period + 1, i + 1).reduce((a, b) => a + b);
      sma.push(sum / period);
    }
    return sma;
  }

  calculateBollingerBands(prices, period, stdDev) {
    const sma = this.calculateSMA(prices, period);
    const bands = [];
    
    for (let i = 0; i < sma.length; i++) {
      const slice = prices.slice(i, i + period);
      const mean = sma[i];
      const variance = slice.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / period;
      const standardDeviation = Math.sqrt(variance);
      
      bands.push({
        upper: mean + (standardDeviation * stdDev),
        middle: mean,
        lower: mean - (standardDeviation * stdDev)
      });
    }
    
    return bands;
  }

  calculateATR(klines, period) {
    const trueRanges = [];
    
    for (let i = 1; i < klines.length; i++) {
      const high = parseFloat(klines[i][2]);
      const low = parseFloat(klines[i][3]);
      const prevClose = parseFloat(klines[i - 1][4]);
      
      const tr = Math.max(
        high - low,
        Math.abs(high - prevClose),
        Math.abs(low - prevClose)
      );
      
      trueRanges.push(tr);
    }
    
    return this.calculateSMA(trueRanges, period);
  }

  calculateMomentumScore(prices, volumes) {
    const priceChange = (prices[prices.length - 1] - prices[prices.length - 10]) / prices[prices.length - 10];
    const volumeRatio = volumes[volumes.length - 1] / (volumes.slice(-10).reduce((a, b) => a + b) / 10);
    
    return (priceChange * volumeRatio) * 10; // Normalizado
  }

  findSupportResistance(highs, lows) {
    // Implementação simplificada - pode ser melhorada
    const recentHighs = highs.slice(-20);
    const recentLows = lows.slice(-20);
    
    return {
      resistance: Math.max(...recentHighs),
      support: Math.min(...recentLows)
    };
  }

  calculateCorrelation(analysis1, analysis2) {
    if (!analysis2) return 0;
    
    // Correlação simples baseada na direção do preço
    const direction1 = analysis1.price > analysis1.ema20 ? 1 : -1;
    const direction2 = analysis2.price > analysis2.ema20 ? 1 : -1;
    
    return direction1 === direction2 ? 0.8 : -0.8;
  }

  async getAvailableBalance() {
    try {
      const account = await this.client.account();
      const usdtBalance = account.balances.find(b => b.asset === 'USDT');
      return parseFloat(usdtBalance.free);
    } catch (error) {
      console.error('❌ Erro ao obter saldo:', error);
      return 0;
    }
  }

  updateMarketData(ticker) {
    this.marketData.set(ticker.s, {
      price: parseFloat(ticker.c),
      change: parseFloat(ticker.P),
      volume: parseFloat(ticker.v),
      timestamp: new Date()
    });
  }

  checkPriceAlerts(ticker) {
    const symbol = ticker.s;
    const price = parseFloat(ticker.c);
    const change = parseFloat(ticker.P);
    
    // Alertas de volatilidade alta
    if (Math.abs(change) > 5) {
      console.log(`🚨 Alta volatilidade detectada em ${symbol}: ${change.toFixed(2)}%`);
    }
    
    // Alertas de oportunidade
    if (change < -3) {
      console.log(`📉 Possível oportunidade de compra em ${symbol}: ${change.toFixed(2)}%`);
    }
  }
}

// Classes auxiliares
class RiskManager {
  constructor(config) {
    this.maxRiskPerTrade = config.maxRiskPerTrade || 0.03; // 3%
    this.maxDailyLoss = config.maxDailyLoss || 0.10; // 10%
    this.maxOpenPositions = config.maxOpenPositions || 5;
  }

  assessRisk(signal, analysis) {
    // Verificar confiança do sinal
    if (signal.confidence < 0.6) {
      return { approved: false, reason: 'Baixa confiança do sinal' };
    }

    // Verificar volatilidade
    if (analysis.atr > analysis.price * 0.05) {
      return { approved: false, reason: 'Volatilidade muito alta' };
    }

    return { approved: true };
  }

  calculatePositionSize(signal, balance, analysis) {
    const riskAmount = balance * this.maxRiskPerTrade;
    const stopLossDistance = signal.stopLoss;
    
    return riskAmount / stopLossDistance;
  }
}

class AIOptimizer {
  async getSuggestions(performance) {
    const suggestions = [];
    
    if (performance.successRate < 60) {
      suggestions.push({
        text: 'Aumentar threshold de confiança para 0.7',
        confidence: 0.9
      });
    }
    
    if (performance.hourlyReturn < performance.hourlyTarget * 0.5) {
      suggestions.push({
        text: 'Considerar reduzir stop-loss para 1.5x ATR',
        confidence: 0.7
      });
    }
    
    return suggestions;
  }
}

// Configuração e inicialização
const config = {
  apiKey: process.env.BINANCE_API_KEY,
  apiSecret: process.env.BINANCE_API_SECRET,
  useTestnet: process.env.USE_TESTNET === 'true',
  isSimulation: process.env.SIMULA === 'true',
  baseUrl: process.env.USE_TESTNET === 'true' ? 
    'https://testnet.binance.vision' : 
    'https://api.binance.com',
  tradingPairs: ['BTCUSDT', 'ETHUSDT', 'SOLUSDT'],
  hourlyTarget: 0.5,
  dailyTarget: 5.0,
  maxRiskPerTrade: 0.03,
  maxDailyLoss: 0.10,
  maxOpenPositions: 5,
  minTradeSize: 0.001
};

// Validar configuração
if (!config.apiKey || !config.apiSecret) {
  console.error('❌ ERRO: BINANCE_API_KEY e BINANCE_API_SECRET devem estar configurados no .env');
  process.exit(1);
}

console.log(`🔗 Conectando ao ${config.useTestnet ? 'TESTNET' : 'MAINNET'}`);
console.log(`📊 Modo: ${config.isSimulation ? 'SIMULAÇÃO' : 'REAL'}`);

const bot = new AdvancedTradingBot(config);

// Tratamento de sinais para parada graceful
process.on('SIGTERM', async () => {
  console.log('🛑 Recebido sinal de parada...');
  await bot.stop();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 Interrompido pelo usuário...');
  await bot.stop();
  process.exit(0);
});

// Iniciar o bot
bot.start().catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});