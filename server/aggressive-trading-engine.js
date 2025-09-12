// Motor de Trading Ultra-Agressivo
// Meta: 0.61% - 1.0% de lucro diário com máxima agressividade

import { EventEmitter } from 'events';
import WebSocket from 'ws';

class AggressiveTradingEngine extends EventEmitter {
  constructor(config) {
    super();
    this.config = {
      dailyTargetMin: 0.0061,  // 0.61% mínimo
      dailyTargetMax: 0.01,    // 1.0% máximo
      hourlyTarget: 0.00025,   // 0.025% por hora base
      maxRiskPerTrade: 0.20,   // 20% do capital por trade (AGRESSIVO)
      maxDailyTrades: 200,     // Até 200 trades por dia
      scalingFactor: 2.5,      // Multiplicador em modo turbo
      emergencyMode: false,
      ...config
    };
    
    this.pairs = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT'];
    this.pairStates = {};
    this.aggregatedMetrics = {
      startTime: new Date(),
      totalProfit: 0,
      hourlyProfit: 0,
      dailyProfit: 0,
      totalTrades: 0,
      successfulTrades: 0
    };
    
    this.initializePairs();
    this.startAggressiveEngine();
  }

  initializePairs() {
    this.pairs.forEach(pair => {
      this.pairStates[pair] = {
        symbol: pair,
        balance: 1000, // USDT inicial por par
        position: 0,
        entryPrice: 0,
        currentPrice: 0,
        hourlyProfit: 0,
        dailyProfit: 0,
        trades: 0,
        successfulTrades: 0,
        lastTradeTime: 0,
        aggressiveMode: false,
        turboMode: false,
        riskMultiplier: 1.0
      };
    });
  }

  startAggressiveEngine() {
    console.log('🔥 MOTOR AGRESSIVO INICIADO - META: 0.61% - 1.0% DIÁRIO');
    
    // Loop principal ultra-rápido (100ms)
    setInterval(() => this.executeAggressiveCycle(), 100);
    
    // Verificação de metas a cada minuto
    setInterval(() => this.checkHourlyTargets(), 60000);
    
    // Rebalanceamento agressivo a cada 5 minutos
    setInterval(() => this.aggressiveRebalancing(), 300000);
    
    // Reset horário
    setInterval(() => this.resetHourlyMetrics(), 3600000);
  }

  async executeAggressiveCycle() {
    try {
      for (const pair of this.pairs) {
        const state = this.pairStates[pair];
        
        // Simular preço atual (integrar com API real)
        state.currentPrice = this.simulatePrice(pair, state.currentPrice);
        
        // Análise ultra-rápida de oportunidades
        const signal = this.generateAggressiveSignal(state);
        
        if (signal.action === 'BUY' && !state.position) {
          await this.executeAggressiveBuy(state, signal);
        } else if (signal.action === 'SELL' && state.position > 0) {
          await this.executeAggressiveSell(state, signal);
        }
        
        // Verificar stop-loss e take-profit agressivos
        this.checkAggressiveExits(state);
      }
      
      this.updateAggregatedMetrics();
      this.emit('metricsUpdate', this.getMetrics());
      
    } catch (error) {
      console.error('Erro no ciclo agressivo:', error);
    }
  }

  generateAggressiveSignal(state) {
    // Simulação de sinais ultra-agressivos
    const volatility = Math.random() * 0.02; // 0-2% volatilidade
    const momentum = (Math.random() - 0.5) * 0.04; // -2% a +2% momentum
    const volume = 0.8 + Math.random() * 0.4; // 80-120% volume normal
    
    // Condições agressivas para entrada
    const buyConditions = [
      momentum > 0.005,  // Momentum positivo >0.5%
      volatility > 0.008, // Volatilidade >0.8%
      volume > 1.1,      // Volume >110% da média
      state.trades < this.config.maxDailyTrades,
      !state.position
    ];
    
    const sellConditions = [
      state.position > 0,
      (state.currentPrice - state.entryPrice) / state.entryPrice > 0.0015, // 0.15% lucro
      momentum < -0.003 // Momentum negativo
    ];
    
    const confidence = (volatility * 10 + Math.abs(momentum) * 25 + (volume - 1) * 50);
    
    return {
      action: buyConditions.every(c => c) ? 'BUY' : 
              sellConditions.every(c => c) ? 'SELL' : 'HOLD',
      confidence: Math.min(100, confidence),
      size: this.calculateAggressivePositionSize(state, confidence),
      stopLoss: state.currentPrice * 0.9992, // 0.08% stop-loss
      takeProfit: state.currentPrice * 1.0015 // 0.15% take-profit
    };
  }

  calculateAggressivePositionSize(state, confidence) {
    let baseSize = state.balance * this.config.maxRiskPerTrade;
    
    // Multiplicadores agressivos
    if (confidence > 80) baseSize *= 1.5;
    if (state.turboMode) baseSize *= this.config.scalingFactor;
    if (this.isHighVolatilityHour()) baseSize *= 1.3;
    
    // Ajuste baseado na performance
    const hourlyProgress = state.hourlyProfit / this.config.hourlyTarget;
    if (hourlyProgress < 0.5) baseSize *= 1.8; // Dobrar agressividade se abaixo da meta
    
    return Math.min(baseSize, state.balance * 0.25); // Máximo 25% do capital
  }

  async executeAggressiveBuy(state, signal) {
    const cost = signal.size;
    
    if (state.balance >= cost) {
      state.balance -= cost;
      state.position = signal.size / state.currentPrice;
      state.entryPrice = state.currentPrice;
      state.trades++;
      
      console.log(`🟢 COMPRA AGRESSIVA ${state.symbol}: ${state.position.toFixed(6)} @ ${state.currentPrice.toFixed(2)}`);
      
      this.emit('tradeExecuted', {
        pair: state.symbol,
        type: 'BUY',
        amount: state.position,
        price: state.currentPrice,
        confidence: signal.confidence
      });
    }
  }

  async executeAggressiveSell(state, signal) {
    const revenue = state.position * state.currentPrice;
    const profit = revenue - (state.position * state.entryPrice);
    const profitPercent = profit / (state.position * state.entryPrice);
    
    state.balance += revenue;
    state.hourlyProfit += profitPercent;
    state.dailyProfit += profitPercent;
    
    if (profit > 0) state.successfulTrades++;
    
    console.log(`🔴 VENDA AGRESSIVA ${state.symbol}: ${state.position.toFixed(6)} @ ${state.currentPrice.toFixed(2)} | Lucro: ${(profitPercent * 100).toFixed(3)}%`);
    
    state.position = 0;
    state.entryPrice = 0;
    state.trades++;
    
    this.emit('tradeExecuted', {
      pair: state.symbol,
      type: 'SELL',
      amount: state.position,
      price: state.currentPrice,
      profit: profitPercent * 100
    });
  }

  checkAggressiveExits(state) {
    if (state.position === 0) return;
    
    const currentProfit = (state.currentPrice - state.entryPrice) / state.entryPrice;
    const timeInPosition = Date.now() - state.lastTradeTime;
    
    // Take-profit agressivo (0.15%)
    if (currentProfit >= 0.0015) {
      this.executeAggressiveSell(state, { confidence: 100 });
      return;
    }
    
    // Stop-loss agressivo (0.08%)
    if (currentProfit <= -0.0008) {
      this.executeAggressiveSell(state, { confidence: 100 });
      return;
    }
    
    // Exit por tempo (máximo 5 minutos em posição)
    if (timeInPosition > 300000) {
      this.executeAggressiveSell(state, { confidence: 50 });
    }
  }

  checkHourlyTargets() {
    const currentHour = new Date().getHours();
    
    this.pairs.forEach(pair => {
      const state = this.pairStates[pair];
      const hourlyProgress = state.hourlyProfit / this.config.hourlyTarget;
      
      // Ativar modo turbo se abaixo de 50% da meta aos 45 minutos
      const minutes = new Date().getMinutes();
      if (minutes >= 45 && hourlyProgress < 0.5) {
        this.activateTurboMode(state);
      }
      
      // Modo emergência se muito abaixo da meta
      if (hourlyProgress < 0.2 && minutes >= 50) {
        this.activateEmergencyMode(state);
      }
    });
  }

  activateTurboMode(state) {
    if (state.turboMode) return;
    
    state.turboMode = true;
    state.riskMultiplier = 2.5;
    
    console.log(`⚡ MODO TURBO ATIVADO para ${state.symbol} - Risco 2.5x`);
    
    // Desativar após 15 minutos
    setTimeout(() => {
      state.turboMode = false;
      state.riskMultiplier = 1.0;
      console.log(`⚡ MODO TURBO DESATIVADO para ${state.symbol}`);
    }, 900000);
  }

  activateEmergencyMode(state) {
    if (this.config.emergencyMode) return;
    
    this.config.emergencyMode = true;
    state.riskMultiplier = 4.0; // EXTREMAMENTE AGRESSIVO
    
    console.log(`🚨 MODO EMERGÊNCIA ATIVADO para ${state.symbol} - Risco 4x`);
    
    // Executar trades de recuperação ultra-agressivos
    this.executeRecoveryTrades(state);
  }

  async executeRecoveryTrades(state) {
    // Executar 5 trades rápidos com alta agressividade
    for (let i = 0; i < 5; i++) {
      const signal = this.generateAggressiveSignal(state);
      signal.size *= 3; // Triplicar tamanho da posição
      
      if (signal.action === 'BUY') {
        await this.executeAggressiveBuy(state, signal);
        
        // Aguardar 30 segundos e vender
        setTimeout(() => {
          if (state.position > 0) {
            this.executeAggressiveSell(state, { confidence: 100 });
          }
        }, 30000);
      }
      
      await new Promise(resolve => setTimeout(resolve, 5000)); // 5s entre trades
    }
  }

  aggressiveRebalancing() {
    // Rebalancear capital entre pares baseado na performance
    const totalBalance = Object.values(this.pairStates).reduce((sum, state) => sum + state.balance, 0);
    const avgBalance = totalBalance / this.pairs.length;
    
    this.pairs.forEach(pair => {
      const state = this.pairStates[pair];
      const performance = state.dailyProfit;
      
      // Realocar mais capital para pares performantes
      if (performance > 0.5) {
        state.balance = Math.min(state.balance * 1.2, avgBalance * 1.5);
      } else if (performance < 0) {
        state.balance = Math.max(state.balance * 0.8, avgBalance * 0.5);
      }
    });
    
    console.log('💰 REBALANCEAMENTO AGRESSIVO EXECUTADO');
  }

  resetHourlyMetrics() {
    this.pairs.forEach(pair => {
      this.pairStates[pair].hourlyProfit = 0;
    });
    console.log('🔄 MÉTRICAS HORÁRIAS RESETADAS');
  }

  isHighVolatilityHour() {
    const hour = new Date().getUTCHours();
    // Horários de alta volatilidade: 8-10h, 14-16h, 20-22h UTC
    return (hour >= 8 && hour <= 10) || 
           (hour >= 14 && hour <= 16) || 
           (hour >= 20 && hour <= 22);
  }

  simulatePrice(pair, currentPrice) {
    if (!currentPrice) {
      const basePrices = { BTCUSDT: 45000, ETHUSDT: 2500, SOLUSDT: 100 };
      currentPrice = basePrices[pair] || 1000;
    }
    
    // Simular movimento de preço com volatilidade realista
    const volatility = this.isHighVolatilityHour() ? 0.002 : 0.001;
    const change = (Math.random() - 0.5) * volatility * 2;
    
    return currentPrice * (1 + change);
  }

  updateAggregatedMetrics() {
    let totalHourlyProfit = 0;
    let totalDailyProfit = 0;
    let totalTrades = 0;
    let totalSuccessful = 0;
    
    this.pairs.forEach(pair => {
      const state = this.pairStates[pair];
      totalHourlyProfit += state.hourlyProfit;
      totalDailyProfit += state.dailyProfit;
      totalTrades += state.trades;
      totalSuccessful += state.successfulTrades;
    });
    
    this.aggregatedMetrics.hourlyProfit = totalHourlyProfit / this.pairs.length;
    this.aggregatedMetrics.dailyProfit = totalDailyProfit / this.pairs.length;
    this.aggregatedMetrics.totalTrades = totalTrades;
    this.aggregatedMetrics.successfulTrades = totalSuccessful;
  }

  getMetrics() {
    return {
      startTime: this.aggregatedMetrics.startTime.toISOString(),
      currentTime: new Date().toISOString(),
      hourlyTarget: this.config.hourlyTarget * 100, // Converter para %
      dailyTarget: this.config.dailyTargetMax * 100,
      totalTrades: this.aggregatedMetrics.totalTrades,
      successRate: this.aggregatedMetrics.totalTrades > 0 ? 
        (this.aggregatedMetrics.successfulTrades / this.aggregatedMetrics.totalTrades * 100) : 0,
      activePairs: this.pairs,
      pairProfits: Object.fromEntries(
        this.pairs.map(pair => [
          pair,
          {
            hourlyProfit: this.pairStates[pair].hourlyProfit * 100,
            dailyProfit: this.pairStates[pair].dailyProfit * 100,
            trades: this.pairStates[pair].trades,
            successRate: this.pairStates[pair].trades > 0 ? 
              (this.pairStates[pair].successfulTrades / this.pairStates[pair].trades * 100) : 0
          }
        ])
      ),
      aggregatedProfit: {
        hourly: this.aggregatedMetrics.hourlyProfit * 100,
        daily: this.aggregatedMetrics.dailyProfit * 100,
        target: this.config.dailyTargetMax * 100
      }
    };
  }

  // Método para integração com o bot real
  async connectToRealBot(botPath) {
    try {
      // Aqui você integraria com o bot_agressivo5.mjs real
      console.log(`🔗 Conectando ao bot real: ${botPath}`);
      
      // Implementar comunicação via IPC ou WebSocket com o bot real
      // const botProcess = spawn('node', [botPath]);
      
      return true;
    } catch (error) {
      console.error('Erro ao conectar com bot real:', error);
      return false;
    }
  }
}

export default AggressiveTradingEngine;