// Motor de Backtesting Automático
import fs from 'fs/promises';
import path from 'path';

class BacktestingEngine {
  constructor() {
    this.strategies = new Map();
    this.results = new Map();
    this.isRunning = false;
  }

  async loadHistoricalData(symbol, timeframe = '1h', days = 30) {
    try {
      // Carregar dados históricos da Binance
      const endTime = Date.now();
      const startTime = endTime - (days * 24 * 60 * 60 * 1000);
      
      const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${timeframe}&startTime=${startTime}&endTime=${endTime}&limit=1000`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      return data.map(candle => ({
        timestamp: candle[0],
        open: parseFloat(candle[1]),
        high: parseFloat(candle[2]),
        low: parseFloat(candle[3]),
        close: parseFloat(candle[4]),
        volume: parseFloat(candle[5]),
        date: new Date(candle[0])
      }));
    } catch (error) {
      console.error(`❌ Erro ao carregar dados históricos para ${symbol}:`, error);
      return [];
    }
  }

  calculateIndicators(data) {
    const indicators = [];
    
    for (let i = 0; i < data.length; i++) {
      const slice = data.slice(Math.max(0, i - 50), i + 1);
      const prices = slice.map(d => d.close);
      
      indicators.push({
        timestamp: data[i].timestamp,
        price: data[i].close,
        rsi: this.calculateRSI(prices, 14),
        macd: this.calculateMACD(prices),
        bb: this.calculateBollingerBands(prices, 20, 2),
        atr: this.calculateATR(slice, 14),
        volume: data[i].volume,
        volumeMA: this.calculateSMA(slice.map(d => d.volume), 20)
      });
    }
    
    return indicators;
  }

  async runBacktest(symbol, strategy, startDate, endDate) {
    console.log(`🔄 Iniciando backtest para ${symbol} com estratégia ${strategy.name}`);
    
    try {
      const historicalData = await this.loadHistoricalData(symbol, '1h', 30);
      const indicators = this.calculateIndicators(historicalData);
      
      let balance = 10000; // Capital inicial
      let position = 0;
      let trades = [];
      let maxDrawdown = 0;
      let peakBalance = balance;
      
      for (let i = 1; i < indicators.length; i++) {
        const current = indicators[i];
        const previous = indicators[i - 1];
        
        // Aplicar estratégia
        const signal = strategy.generateSignal(current, previous);
        
        if (signal.action === 'BUY' && position === 0 && balance > 100) {
          const quantity = (balance * 0.95) / current.price; // 95% do capital
          const cost = quantity * current.price;
          const fee = cost * 0.001; // Taxa de 0.1%
          
          if (balance >= cost + fee) {
            balance -= (cost + fee);
            position = quantity;
            
            trades.push({
              type: 'BUY',
              price: current.price,
              quantity,
              timestamp: current.timestamp,
              balance: balance + (position * current.price)
            });
          }
        } else if (signal.action === 'SELL' && position > 0) {
          const revenue = position * current.price;
          const fee = revenue * 0.001;
          
          balance += (revenue - fee);
          
          const trade = {
            type: 'SELL',
            price: current.price,
            quantity: position,
            timestamp: current.timestamp,
            balance
          };
          
          // Calcular P&L do trade
          const buyTrade = trades.filter(t => t.type === 'BUY').pop();
          if (buyTrade) {
            trade.pnl = ((current.price - buyTrade.price) / buyTrade.price) * 100;
            trade.pnlUSD = revenue - (buyTrade.quantity * buyTrade.price);
          }
          
          trades.push(trade);
          position = 0;
        }
        
        // Calcular drawdown
        const currentValue = balance + (position * current.price);
        if (currentValue > peakBalance) {
          peakBalance = currentValue;
        }
        
        const drawdown = (peakBalance - currentValue) / peakBalance;
        if (drawdown > maxDrawdown) {
          maxDrawdown = drawdown;
        }
      }
      
      // Calcular métricas finais
      const finalBalance = balance + (position * indicators[indicators.length - 1].price);
      const totalReturn = ((finalBalance - 10000) / 10000) * 100;
      
      const profitableTrades = trades.filter(t => t.pnl > 0).length;
      const totalTrades = trades.filter(t => t.type === 'SELL').length;
      const winRate = totalTrades > 0 ? (profitableTrades / totalTrades) * 100 : 0;
      
      const results = {
        symbol,
        strategy: strategy.name,
        startDate,
        endDate,
        initialBalance: 10000,
        finalBalance,
        totalReturn,
        maxDrawdown: maxDrawdown * 100,
        totalTrades,
        profitableTrades,
        winRate,
        trades,
        sharpeRatio: this.calculateSharpeRatio(trades),
        profitFactor: this.calculateProfitFactor(trades)
      };
      
      this.results.set(`${symbol}_${strategy.name}`, results);
      await this.saveBacktestResults(results);
      
      console.log(`✅ Backtest concluído para ${symbol}:`);
      console.log(`   💰 Retorno: ${totalReturn.toFixed(2)}%`);
      console.log(`   📊 Win Rate: ${winRate.toFixed(1)}%`);
      console.log(`   📉 Max Drawdown: ${(maxDrawdown * 100).toFixed(2)}%`);
      
      return results;
    } catch (error) {
      console.error(`❌ Erro no backtest para ${symbol}:`, error);
      return null;
    }
  }

  calculateSharpeRatio(trades) {
    const returns = trades
      .filter(t => t.pnl !== undefined)
      .map(t => t.pnl / 100);
    
    if (returns.length < 2) return 0;
    
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);
    
    return stdDev > 0 ? (avgReturn / stdDev) * Math.sqrt(252) : 0; // Anualizado
  }

  calculateProfitFactor(trades) {
    const profits = trades.filter(t => t.pnlUSD > 0).reduce((sum, t) => sum + t.pnlUSD, 0);
    const losses = Math.abs(trades.filter(t => t.pnlUSD < 0).reduce((sum, t) => sum + t.pnlUSD, 0));
    
    return losses > 0 ? profits / losses : profits > 0 ? 999 : 0;
  }

  async saveBacktestResults(results) {
    try {
      const resultsDir = path.join(process.cwd(), 'backtests');
      await fs.mkdir(resultsDir, { recursive: true });
      
      const filename = `backtest_${results.symbol}_${results.strategy}_${Date.now()}.json`;
      const filepath = path.join(resultsDir, filename);
      
      await fs.writeFile(filepath, JSON.stringify(results, null, 2));
      console.log(`💾 Resultados salvos em: ${filename}`);
    } catch (error) {
      console.error('❌ Erro ao salvar resultados:', error);
    }
  }

  // Estratégias para backtest
  getAggressiveStrategy() {
    return {
      name: 'Aggressive_Scalping',
      generateSignal: (current, previous) => {
        const rsiOversold = current.rsi < 35;
        const rsiOverbought = current.rsi > 65;
        const macdBullish = current.macd.histogram > 0;
        const volumeHigh = current.volume > current.volumeMA * 1.5;
        const priceAboveBB = current.price > current.bb.upper;
        const priceBelowBB = current.price < current.bb.lower;
        
        if (rsiOversold && macdBullish && volumeHigh) {
          return { action: 'BUY', confidence: 0.8 };
        }
        
        if (rsiOverbought || priceAboveBB) {
          return { action: 'SELL', confidence: 0.7 };
        }
        
        return { action: 'HOLD', confidence: 0.5 };
      }
    };
  }

  // Métodos auxiliares para indicadores (simplificados)
  calculateRSI(prices, period) {
    if (prices.length < period + 1) return 50;
    
    let gains = 0, losses = 0;
    for (let i = prices.length - period; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      if (change > 0) gains += change;
      else losses -= change;
    }
    
    const avgGain = gains / period;
    const avgLoss = losses / period;
    
    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  calculateMACD(prices) {
    const ema12 = this.calculateEMA(prices, 12);
    const ema26 = this.calculateEMA(prices, 26);
    const macdLine = ema12 - ema26;
    const signalLine = this.calculateEMA([macdLine], 9);
    
    return {
      macd: macdLine,
      signal: signalLine,
      histogram: macdLine - signalLine
    };
  }

  calculateEMA(prices, period) {
    if (prices.length === 0) return 0;
    const multiplier = 2 / (period + 1);
    let ema = prices[0];
    
    for (let i = 1; i < prices.length; i++) {
      ema = (prices[i] * multiplier) + (ema * (1 - multiplier));
    }
    
    return ema;
  }

  calculateSMA(values, period) {
    if (values.length < period) return 0;
    const slice = values.slice(-period);
    return slice.reduce((sum, val) => sum + val, 0) / period;
  }

  calculateBollingerBands(prices, period, stdDev) {
    const sma = this.calculateSMA(prices, period);
    const slice = prices.slice(-period);
    const variance = slice.reduce((sum, price) => sum + Math.pow(price - sma, 2), 0) / period;
    const std = Math.sqrt(variance);
    
    return {
      upper: sma + (std * stdDev),
      middle: sma,
      lower: sma - (std * stdDev)
    };
  }

  calculateATR(candles, period) {
    if (candles.length < period + 1) return 0;
    
    const trueRanges = [];
    for (let i = 1; i < candles.length; i++) {
      const tr = Math.max(
        candles[i].high - candles[i].low,
        Math.abs(candles[i].high - candles[i - 1].close),
        Math.abs(candles[i].low - candles[i - 1].close)
      );
      trueRanges.push(tr);
    }
    
    return this.calculateSMA(trueRanges, period);
  }
}

export default BacktestingEngine;