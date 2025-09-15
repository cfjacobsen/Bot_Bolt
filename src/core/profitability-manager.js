const profitabilityTargets = require('../config/profitability-targets');

class ProfitabilityManager {
  constructor() {
    this.targets = profitabilityTargets;
    this.deficit = 0;
    this.currentProfit = 0;
  }

  // Atualiza o lucro atual
  updateProfit(profit) {
    this.currentProfit = profit;
  }

  // Verifica se estamos abaixo da meta horária
  isBelowHourlyTarget() {
    return this.currentProfit < this.targets.hourly;
  }

  // Calcula o déficit acumulado
  calculateDeficit() {
    if (this.isBelowHourlyTarget()) {
      this.deficit += this.targets.hourly - this.currentProfit;
    } else {
      // Reduz o déficit se excedeu a meta
      this.deficit = Math.max(0, this.deficit - (this.currentProfit - this.targets.hourly));
    }
    return this.deficit;
  }

  // Retorna os ajustes necessários com base no déficit
  getAdjustments() {
    const deficit = this.calculateDeficit();
    if (deficit > 0) {
      return {
        increaseAggressiveness: true,
        deficit: deficit
      };
    }
    return { increaseAggressiveness: false, deficit: 0 };
  }

  // Ajusta as metas dinamicamente (pode ser chamado pela IA)
  adjustTargets(newTargets) {
    this.targets = { ...this.targets, ...newTargets };
  }
}

module.exports = ProfitabilityManager;