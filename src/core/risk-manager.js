// core/risk-manager.js
class RiskManager {
  constructor() {
    this.maxDailyLoss = 0.1; // 10% máximo
    this.tradeRisk = 0.025; // 2.5% por trade
    this.profitTargets = [0.006, 0.012, 0.018]; // Metas escalonadas
  }

  calculatePositionSize(balance, currentPrice, stopLoss) {
    const riskAmount = balance * this.tradeRisk;
    const riskPerUnit = Math.abs(currentPrice - stopLoss);
    return riskAmount / riskPerUnit;
  }

  dynamicAdjustment(performance) {
    // Ajusta parâmetros baseado no desempenho recente
    if (performance.lastHoursGain < 0.002) {
      this.increaseAggressiveness();
    }
  }
}