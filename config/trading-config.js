// config/trading-config.js
module.exports = {
  // Metas de lucratividade
  profitabilityTargets: {
    hourly: 0.00042,    // 0.042% por hora (equivalente a ~1% ao dia)
    daily: 0.01,        // 1% ao dia
    dailyMax: 0.02,     // 2% máximo ao dia (para não assumir riscos excessivos)
    monthly: 0.22       // 22% ao mês (considerando dias de trading)
  },
  
  // Parâmetros de ajuste automático
  autoAdjustment: {
    enabled: true,
    checkInterval: 300000, // 5 minutos
    aggressivenessLevels: {
      low: 0.7,
      normal: 1.0,
      high: 1.3,
      extreme: 1.6
    }
  },
  
  // ... outras configurações
};