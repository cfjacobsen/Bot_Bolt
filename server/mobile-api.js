// API Mobile para Dashboard Responsivo
import express from 'express';
import cors from 'cors';

class MobileAPI {
  constructor(botManager) {
    this.app = express();
    this.botManager = botManager;
    this.setupMiddleware();
    this.setupRoutes();
  }

  setupMiddleware() {
    this.app.use(cors());
    this.app.use(express.json());
    
    // Middleware de autenticação simples
    this.app.use('/api/mobile', (req, res, next) => {
      const token = req.headers.authorization?.replace('Bearer ', '');
      
      // Validação simples de token (implementar JWT em produção)
      if (!token || token !== process.env.MOBILE_API_TOKEN) {
        return res.status(401).json({ error: 'Token inválido' });
      }
      
      next();
    });
  }

  setupRoutes() {
    // Dashboard resumido para mobile
    this.app.get('/api/mobile/dashboard', (req, res) => {
      try {
        const metrics = this.botManager.getMetrics();
        
        const mobileData = {
          summary: {
            totalProfit: metrics.aggregatedProfit.daily,
            target: metrics.aggregatedProfit.target,
            progress: (metrics.aggregatedProfit.daily / metrics.aggregatedProfit.target) * 100,
            totalTrades: metrics.totalTrades,
            successRate: metrics.successRate,
            runtime: this.calculateRuntime(metrics.startTime)
          },
          pairs: Object.entries(metrics.pairProfits).map(([symbol, data]) => ({
            symbol,
            profit: data.dailyProfit,
            trades: data.trades,
            successRate: data.successRate,
            status: data.dailyProfit >= 0.61 ? 'TARGET_MET' : 'ACTIVE'
          })),
          alerts: this.getActiveAlerts(),
          lastUpdate: new Date().toISOString()
        };
        
        res.json(mobileData);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Controles básicos
    this.app.post('/api/mobile/bot/start', async (req, res) => {
      try {
        await this.botManager.startBot();
        res.json({ success: true, message: 'Bot iniciado' });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.post('/api/mobile/bot/stop', async (req, res) => {
      try {
        await this.botManager.stopBot();
        res.json({ success: true, message: 'Bot parado' });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Métricas em tempo real
    this.app.get('/api/mobile/metrics/live', (req, res) => {
      const metrics = this.botManager.getMetrics();
      
      res.json({
        timestamp: Date.now(),
        aggregatedProfit: metrics.aggregatedProfit,
        pairProfits: metrics.pairProfits,
        totalTrades: metrics.totalTrades,
        successRate: metrics.successRate,
        runtime: this.calculateRuntime(metrics.startTime)
      });
    });

    // Histórico de performance
    this.app.get('/api/mobile/history/:symbol', (req, res) => {
      const { symbol } = req.params;
      const { timeframe = '1h', limit = 24 } = req.query;
      
      // Simular dados históricos (implementar com banco de dados real)
      const history = this.generateHistoryData(symbol, timeframe, parseInt(limit));
      
      res.json({
        symbol,
        timeframe,
        data: history
      });
    });

    // Configurações rápidas
    this.app.post('/api/mobile/settings/risk', (req, res) => {
      try {
        const { riskPerTrade, maxTrades, emergencyStop } = req.body;
        
        // Validar e aplicar configurações
        if (riskPerTrade >= 0.1 && riskPerTrade <= 5.0) {
          process.env.RISK_PER_TRADE = riskPerTrade.toString();
        }
        
        if (maxTrades >= 10 && maxTrades <= 500) {
          process.env.MAX_TRADES_DIA = maxTrades.toString();
        }
        
        res.json({ 
          success: true, 
          message: 'Configurações atualizadas',
          applied: { riskPerTrade, maxTrades, emergencyStop }
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
  }

  calculateRuntime(startTime) {
    const start = new Date(startTime);
    const now = new Date();
    const diff = now.getTime() - start.getTime();
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    return {
      total: diff,
      formatted: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`,
      hours,
      minutes,
      seconds
    };
  }

  getActiveAlerts() {
    // Simular alertas ativos (implementar com sistema real)
    return [
      {
        id: 1,
        type: 'HIGH_VOLATILITY',
        symbol: 'BTCUSDT',
        message: 'Volatilidade acima de 5%',
        severity: 'WARNING',
        timestamp: Date.now() - 300000 // 5 minutos atrás
      },
      {
        id: 2,
        type: 'TARGET_ACHIEVED',
        symbol: 'ETHUSDT',
        message: 'Meta diária de 0.61% atingida',
        severity: 'SUCCESS',
        timestamp: Date.now() - 600000 // 10 minutos atrás
      }
    ];
  }

  generateHistoryData(symbol, timeframe, limit) {
    const data = [];
    const now = Date.now();
    const interval = timeframe === '1h' ? 3600000 : 
                    timeframe === '15m' ? 900000 : 
                    timeframe === '5m' ? 300000 : 60000;
    
    for (let i = limit - 1; i >= 0; i--) {
      const timestamp = now - (i * interval);
      data.push({
        timestamp,
        profit: (Math.random() - 0.4) * 2, // -0.8% a +1.2%
        trades: Math.floor(Math.random() * 10) + 1,
        volume: Math.random() * 1000000,
        price: 45000 + (Math.random() - 0.5) * 10000 // Simular preço BTC
      });
    }
    
    return data;
  }

  start(port = 3002) {
    this.app.listen(port, () => {
      console.log(`📱 API Mobile rodando na porta ${port}`);
    });
  }
}

export default MobileAPI;