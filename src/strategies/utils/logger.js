// utils/logger.js
class Logger {
  constructor() {
    this.logLevel = process.env.LOG_LEVEL || 'info';
  }
  
  // ... implementação completa da classe Logger
}

class AdvancedLogger {
  logTrade(trade) {
    // Registro detalhado com todos os parâmetros
    const logEntry = {
      timestamp: Date.now(),
      trade,
      performance: this.calculatePerformance(trade),
      parameters: this.currentParameters,
      marketConditions: this.currentMarketConditions
    };
    
    this.saveToDatabase(logEntry);
    this.checkPerformanceAlerts(logEntry);
  }

  checkPerformanceAlerts(logEntry) {
    // Alertas em tempo real para desempenho abaixo do esperado
    if (logEntry.performance.hourlyGain < 0.0003) {
      this.sendAlert('Desempenho horário abaixo do esperado');
    }
  }
}