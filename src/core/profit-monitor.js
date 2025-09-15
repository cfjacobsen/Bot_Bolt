// core/profit-monitor.js
const config = require('../config/trading-config');

class ProfitMonitor {
  constructor() {
    this.profitTargets = config.profitabilityTargets;
    this.performanceLog = [];
    this.currentHourlyGain = 0;
    this.currentDailyGain = 0;
    this.deficit = 0;
  }

  // Método para atualizar o desempenho
  updatePerformance(tradeResult) {
    const gain = tradeResult.profitLoss;
    this.currentHourlyGain += gain;
    this.currentDailyGain += gain;
    
    this.performanceLog.push({
      timestamp: Date.now(),
      gain: gain,
      balance: tradeResult.balance,
      tradeCount: this.performanceLog.length + 1
    });
    
    // Limitar o log às últimas 1000 entradas
    if (this.performanceLog.length > 1000) {
      this.performanceLog.shift();
    }
    
    this.checkPerformance();
  }

  // Verificar desempenho contra metas
  checkPerformance() {
    const now = new Date();
    const currentHour = now.getHours();
    
    // Reiniciar contagem horária se mudou a hora
    if (this.lastCheckHour !== currentHour) {
      if (this.currentHourlyGain < this.profitTargets.hourly) {
        this.deficit += this.profitTargets.hourly - this.currentHourlyGain;
      }
      this.currentHourlyGain = 0;
      this.lastCheckHour = currentHour;
    }
    
    // Ajustar agressividade com base no desempenho
    this.adjustAggressiveness();
  }

  // Ajustar agressividade com base no desempenho
  adjustAggressiveness() {
    const hourlyTarget = this.profitTargets.hourly;
    const performanceRatio = this.currentHourlyGain / hourlyTarget;
    const adjustmentConfig = config.autoAdjustment;
    
    let newLevel = adjustmentConfig.aggressivenessLevels.normal;
    
    if (performanceRatio < 0.5) {
      newLevel = adjustmentConfig.aggressivenessLevels.extreme;
    } else if (performanceRatio < 0.8) {
      newLevel = adjustmentConfig.aggressivenessLevels.high;
    } else if (performanceRatio >= 1.2) {
      newLevel = adjustmentConfig.aggressivenessLevels.low;
    }
    
    // Aplicar o novo nível de agressividade
    this.applyAggressivenessLevel(newLevel);
  }

  applyAggressivenessLevel(level) {
    // Aqui você implementaria a lógica para ajustar:
    // - Tamanho das posições
    // - Frequência de trading
    // - Pares negociados
    // - Stop-loss e take-profit
    console.log(`Ajustando agressividade para nível: ${level}`);
    
    // Exemplo: comunicar com o gerenciador de risco
    if (global.riskManager) {
      global.riskManager.setAggressiveness(level);
    }
  }

  // Compensar déficit acumulado
  compensateDeficit() {
    if (this.deficit > 0) {
      const compensationFactor = 1 + (this.deficit / this.profitTargets.hourly) * 0.5;
      this.applyAggressivenessLevel(compensationFactor);
      
      // Reduzir o déficit gradualmente conforme é compensado
      this.deficit *= 0.8;
      if (this.deficit < 0.0001) this.deficit = 0;
    }
  }

  // Relatório de desempenho
  getPerformanceReport() {
    return {
      currentHourlyGain: this.currentHourlyGain,
      currentDailyGain: this.currentDailyGain,
      hourlyTarget: this.profitTargets.hourly,
      dailyTarget: this.profitTargets.daily,
      deficit: this.deficit,
      performanceRatio: this.currentHourlyGain / this.profitTargets.hourly,
      status: this.currentHourlyGain >= this.profitTargets.hourly ? 'ON_TARGET' : 'BELOW_TARGET'
    };
  }
}

module.exports = ProfitMonitor;