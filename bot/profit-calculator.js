// Calculadora de Lucro Ultra-Precisa para Bot Agressivo

class ProfitCalculator {
  constructor() {
    this.startTime = new Date();
    this.dailyTarget = 0.0061; // 0.61% mínimo
    this.maxDailyTarget = 0.01; // 1.0% máximo
    this.pairProfits = new Map();
    this.hourlySnapshots = [];
  }

  // Calcular lucro individual por par
  calculatePairProfit(pair, entryPrice, exitPrice, quantity, fees) {
    const grossProfit = (exitPrice - entryPrice) * quantity;
    const netProfit = grossProfit - fees;
    const profitPercent = netProfit / (entryPrice * quantity);
    
    // Atualizar histórico do par
    if (!this.pairProfits.has(pair)) {
      this.pairProfits.set(pair, {
        trades: 0,
        totalProfit: 0,
        hourlyProfit: 0,
        dailyProfit: 0,
        successfulTrades: 0,
        lastResetTime: new Date()
      });
    }
    
    const pairData = this.pairProfits.get(pair);
    pairData.trades++;
    pairData.totalProfit += netProfit;
    pairData.hourlyProfit += profitPercent;
    pairData.dailyProfit += profitPercent;
    
    if (netProfit > 0) {
      pairData.successfulTrades++;
    }
    
    return {
      grossProfit,
      netProfit,
      profitPercent: profitPercent * 100,
      fees,
      pair
    };
  }

  // Calcular lucro agregado de todos os pares
  calculateAggregatedProfit() {
    let totalHourlyProfit = 0;
    let totalDailyProfit = 0;
    let totalTrades = 0;
    let totalSuccessful = 0;
    
    for (const [pair, data] of this.pairProfits) {
      totalHourlyProfit += data.hourlyProfit;
      totalDailyProfit += data.dailyProfit;
      totalTrades += data.trades;
      totalSuccessful += data.successfulTrades;
    }
    
    const avgHourlyProfit = this.pairProfits.size > 0 ? totalHourlyProfit / this.pairProfits.size : 0;
    const avgDailyProfit = this.pairProfits.size > 0 ? totalDailyProfit / this.pairProfits.size : 0;
    const successRate = totalTrades > 0 ? (totalSuccessful / totalTrades) * 100 : 0;
    
    return {
      hourlyProfit: avgHourlyProfit * 100,
      dailyProfit: avgDailyProfit * 100,
      totalTrades,
      successRate,
      profitVelocity: this.calculateProfitVelocity(),
      timeToTarget: this.calculateTimeToTarget(avgDailyProfit)
    };
  }

  // Calcular velocidade de lucro (% por hora)
  calculateProfitVelocity() {
    const hoursRunning = (Date.now() - this.startTime.getTime()) / (1000 * 60 * 60);
    if (hoursRunning === 0) return 0;
    
    const totalProfit = Array.from(this.pairProfits.values())
      .reduce((sum, data) => sum + data.dailyProfit, 0);
    
    return (totalProfit / this.pairProfits.size / hoursRunning) * 100;
  }

  // Calcular tempo estimado para atingir meta
  calculateTimeToTarget(currentDailyProfit) {
    const profitVelocity = this.calculateProfitVelocity() / 100; // Converter para decimal
    
    if (profitVelocity <= 0) return Infinity;
    
    const remainingProfit = this.dailyTarget - currentDailyProfit;
    if (remainingProfit <= 0) return 0; // Meta já atingida
    
    return remainingProfit / profitVelocity; // Horas restantes
  }

  // Verificar se deve ativar modo agressivo
  shouldActivateAggressiveMode() {
    const aggregated = this.calculateAggregatedProfit();
    const hoursRunning = (Date.now() - this.startTime.getTime()) / (1000 * 60 * 60);
    const currentHour = new Date().getHours();
    
    // Ativar se:
    // 1. Abaixo de 50% da meta e já rodando há mais de 2 horas
    // 2. Últimas 6 horas do dia e abaixo de 80% da meta
    // 3. Horário de alta volatilidade e abaixo da meta horária
    
    const condition1 = aggregated.dailyProfit < (this.dailyTarget * 50) && hoursRunning > 2;
    const condition2 = currentHour >= 18 && aggregated.dailyProfit < (this.dailyTarget * 80);
    const condition3 = this.isHighVolatilityHour() && aggregated.hourlyProfit < 0.025;
    
    return condition1 || condition2 || condition3;
  }

  // Verificar horários de alta volatilidade
  isHighVolatilityHour() {
    const hour = new Date().getUTCHours();
    return [8, 9, 10, 14, 15, 16, 20, 21, 22].includes(hour);
  }

  // Calcular tamanho de posição agressivo
  calculateAggressivePositionSize(balance, confidence, isEmergency = false) {
    let baseSize = balance * 0.15; // 15% base
    
    // Multiplicadores baseados na confiança
    if (confidence > 90) baseSize *= 1.8;
    else if (confidence > 80) baseSize *= 1.5;
    else if (confidence > 70) baseSize *= 1.2;
    
    // Multiplicador de emergência
    if (isEmergency) baseSize *= 2.5;
    
    // Multiplicador por horário
    if (this.isHighVolatilityHour()) baseSize *= 1.3;
    
    // Nunca exceder 40% do capital
    return Math.min(baseSize, balance * 0.40);
  }

  // Reset de métricas horárias
  resetHourlyMetrics() {
    for (const [pair, data] of this.pairProfits) {
      data.hourlyProfit = 0;
      data.lastResetTime = new Date();
    }
    
    // Salvar snapshot horário
    this.hourlySnapshots.push({
      timestamp: new Date(),
      aggregatedProfit: this.calculateAggregatedProfit(),
      pairProfits: new Map(this.pairProfits)
    });
    
    // Manter apenas últimas 24 horas
    if (this.hourlySnapshots.length > 24) {
      this.hourlySnapshots.shift();
    }
  }

  // Obter relatório detalhado
  getDetailedReport() {
    const aggregated = this.calculateAggregatedProfit();
    const runtime = (Date.now() - this.startTime.getTime()) / (1000 * 60 * 60);
    
    return {
      summary: {
        runtime: runtime,
        dailyProgress: (aggregated.dailyProfit / this.dailyTarget) * 100,
        hourlyVelocity: aggregated.profitVelocity,
        estimatedDailyFinish: aggregated.dailyProfit + (aggregated.profitVelocity * (24 - runtime)),
        targetAchievementTime: aggregated.timeToTarget
      },
      pairs: Object.fromEntries(this.pairProfits),
      recommendations: this.generateRecommendations(aggregated),
      nextActions: this.getNextActions(aggregated)
    };
  }

  generateRecommendations(aggregated) {
    const recommendations = [];
    
    if (aggregated.dailyProfit < this.dailyTarget * 0.5) {
      recommendations.push({
        type: 'URGENT',
        message: 'Ativar modo turbo imediatamente - muito abaixo da meta',
        action: 'ACTIVATE_TURBO'
      });
    }
    
    if (aggregated.successRate < 60) {
      recommendations.push({
        type: 'WARNING',
        message: 'Taxa de sucesso baixa - ajustar parâmetros de entrada',
        action: 'ADJUST_ENTRY_PARAMS'
      });
    }
    
    if (aggregated.profitVelocity > 0.1) {
      recommendations.push({
        type: 'SUCCESS',
        message: 'Velocidade excelente - manter estratégia atual',
        action: 'MAINTAIN_STRATEGY'
      });
    }
    
    return recommendations;
  }

  getNextActions(aggregated) {
    const actions = [];
    const currentHour = new Date().getHours();
    
    // Ações baseadas no progresso
    if (aggregated.dailyProfit >= this.dailyTarget) {
      actions.push('SWITCH_TO_CONSERVATIVE_MODE');
      actions.push('SECURE_PROFITS');
    } else if (currentHour >= 20) {
      actions.push('ACTIVATE_EMERGENCY_MODE');
      actions.push('INCREASE_RISK_TOLERANCE');
    } else if (aggregated.dailyProfit < this.dailyTarget * 0.3) {
      actions.push('ACTIVATE_AGGRESSIVE_SCALPING');
      actions.push('INCREASE_TRADE_FREQUENCY');
    }
    
    return actions;
  }
}

export default ProfitCalculator;