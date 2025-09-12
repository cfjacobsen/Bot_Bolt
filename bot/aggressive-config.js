// Configuração Ultra-Agressiva para Meta de 0.61% - 1.0% Diário

export const AGGRESSIVE_CONFIG = {
  // 🎯 METAS DE LUCRO
  DAILY_TARGET_MIN: 0.0061,    // 0.61% mínimo diário
  DAILY_TARGET_MAX: 0.01,      // 1.0% máximo diário
  HOURLY_TARGET_BASE: 0.00025, // 0.025% por hora base
  HOURLY_TARGET_AGGRESSIVE: 0.0005, // 0.05% em horários de pico
  
  // ⚡ PARÂMETROS AGRESSIVOS
  MAX_RISK_PER_TRADE: 0.25,    // 25% do capital por trade (EXTREMO)
  MAX_POSITION_SIZE: 0.40,     // 40% do capital total em posições
  MAX_DAILY_TRADES: 300,       // Até 300 trades por dia
  MIN_PROFIT_TARGET: 0.0008,   // 0.08% lucro mínimo por trade
  MAX_LOSS_TOLERANCE: 0.0005,  // 0.05% perda máxima por trade
  
  // 🚀 MODO TURBO
  TURBO_ACTIVATION_THRESHOLD: 0.5, // Ativar se <50% da meta horária
  TURBO_RISK_MULTIPLIER: 3.0,      // 3x mais risco no turbo
  TURBO_FREQUENCY_MULTIPLIER: 5.0, // 5x mais trades no turbo
  TURBO_DURATION_MINUTES: 15,      // 15 minutos de turbo
  
  // 🔥 MODO EMERGÊNCIA (últimas 4 horas do dia)
  EMERGENCY_ACTIVATION_HOUR: 20,   // Ativar às 20h UTC se abaixo da meta
  EMERGENCY_RISK_MULTIPLIER: 5.0, // 5x mais risco (PERIGOSO)
  EMERGENCY_MIN_PROFIT: 0.0003,   // 0.03% lucro mínimo em emergência
  
  // 📊 INDICADORES ULTRA-SENSÍVEIS
  RSI_OVERSOLD_AGGRESSIVE: 35,     // RSI <35 = compra agressiva
  RSI_OVERBOUGHT_AGGRESSIVE: 65,   // RSI >65 = venda agressiva
  MACD_SENSITIVITY: 0.5,           // Sensibilidade MACD aumentada
  VOLUME_THRESHOLD: 1.2,           // Volume >120% da média
  
  // ⏱️ TIMING AGRESSIVO
  MAX_POSITION_HOLD_TIME: 300000,  // 5 minutos máximo em posição
  MIN_TIME_BETWEEN_TRADES: 1000,   // 1 segundo entre trades
  SCALP_EXIT_TIME: 30000,          // 30 segundos para scalping
  
  // 🎲 ESTRATÉGIAS ESPECIAIS
  MARTINGALE_ENABLED: true,        // Martingale inteligente
  MARTINGALE_MULTIPLIER: 2.0,      // 2x após loss
  MARTINGALE_MAX_SEQUENCE: 3,      // Máximo 3 trades em sequência
  
  GRID_TRADING_ENABLED: true,      // Grid trading para consolidação
  GRID_LEVELS: 10,                 // 10 níveis de grid
  GRID_SPACING: 0.001,             // 0.1% entre níveis
  
  ARBITRAGE_ENABLED: true,         // Arbitragem entre pares
  ARBITRAGE_MIN_SPREAD: 0.0005,    // 0.05% spread mínimo
  
  // 🛡️ PROTEÇÕES (mesmo sendo agressivo)
  MAX_DAILY_LOSS: 0.02,           // 2% perda máxima diária
  CIRCUIT_BREAKER_LOSS: 0.005,    // 0.5% perda para circuit breaker
  CORRELATION_LIMIT: 0.8,         // Limite de correlação entre pares
  
  // 🌍 HORÁRIOS DE ALTA PERFORMANCE
  HIGH_VOLATILITY_HOURS: [8, 9, 10, 14, 15, 16, 20, 21, 22], // UTC
  ASIAN_SESSION_MULTIPLIER: 1.2,   // 20% mais agressivo na sessão asiática
  LONDON_SESSION_MULTIPLIER: 1.5,  // 50% mais agressivo na sessão londrina
  NY_SESSION_MULTIPLIER: 1.8,      // 80% mais agressivo na sessão NY
  
  // 🤖 IA AGRESSIVA
  AI_CONFIDENCE_THRESHOLD: 0.6,    // 60% confiança mínima da IA
  AI_OVERRIDE_ENABLED: true,       // IA pode sobrescrever regras
  AI_LEARNING_RATE: 0.1,          // Taxa de aprendizado alta
  
  // 📈 OTIMIZAÇÃO CONTÍNUA
  PARAMETER_ADJUSTMENT_INTERVAL: 300000, // Ajustar parâmetros a cada 5min
  PERFORMANCE_REVIEW_INTERVAL: 900000,   // Review de performance a cada 15min
  AUTO_OPTIMIZATION_ENABLED: true,       // Otimização automática
  
  // 🔄 REBALANCEAMENTO
  REBALANCE_INTERVAL: 600000,      // Rebalancear a cada 10 minutos
  REBALANCE_THRESHOLD: 0.1,        // Rebalancear se diferença >10%
  DYNAMIC_ALLOCATION: true,        // Alocação dinâmica baseada em performance
  
  // 📱 MONITORAMENTO
  REAL_TIME_UPDATES: true,         // Updates em tempo real
  DETAILED_LOGGING: true,          // Log detalhado de todas as operações
  PERFORMANCE_ALERTS: true,        // Alertas de performance
  
  // 🎯 METAS ESPECÍFICAS POR PAR
  PAIR_TARGETS: {
    'BTCUSDT': { daily: 0.008, hourly: 0.00033 },  // 0.8% diário, 0.033% horário
    'ETHUSDT': { daily: 0.007, hourly: 0.00029 },  // 0.7% diário, 0.029% horário  
    'SOLUSDT': { daily: 0.009, hourly: 0.00038 }   // 0.9% diário, 0.038% horário
  }
};

// Função para calcular parâmetros dinâmicos baseados na hora
export function getDynamicParameters() {
  const hour = new Date().getUTCHours();
  const isHighVolatilityHour = AGGRESSIVE_CONFIG.HIGH_VOLATILITY_HOURS.includes(hour);
  
  return {
    riskMultiplier: isHighVolatilityHour ? 1.5 : 1.0,
    frequencyMultiplier: isHighVolatilityHour ? 2.0 : 1.0,
    profitTarget: isHighVolatilityHour ? 
      AGGRESSIVE_CONFIG.HOURLY_TARGET_AGGRESSIVE : 
      AGGRESSIVE_CONFIG.HOURLY_TARGET_BASE,
    maxTradesPerHour: isHighVolatilityHour ? 25 : 15
  };
}

// Função para verificar se deve ativar modo emergência
export function shouldActivateEmergencyMode(currentProfit, hoursRemaining) {
  const requiredProfitRate = (AGGRESSIVE_CONFIG.DAILY_TARGET_MIN - currentProfit) / hoursRemaining;
  return requiredProfitRate > AGGRESSIVE_CONFIG.HOURLY_TARGET_AGGRESSIVE * 2;
}

export default AGGRESSIVE_CONFIG;