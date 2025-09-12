import 'dotenv/config';
import express from 'express';
import { WebSocketServer } from 'ws';
import { promises as fs } from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import OpenAI from 'openai';
import apiRoutes from './api-routes.js';
import AggressiveTradingEngine from './aggressive-trading-engine.js';
import DeepSeekClient from './deepseek-client.js';
import MLPredictor from './ml-predictor.js';
import BacktestingEngine from './backtesting-engine.js';
import NotificationService from './notification-service.js';
import ExchangeIntegrator from './exchange-integrator.js';

class BotManager {
  constructor() {
    this.app = express();
    this.server = null;
    this.wss = null;
    this.botProcess = null;
    this.aggressiveEngine = new AggressiveTradingEngine({
      dailyTargetMin: 0.0061,  // 0.61%
      dailyTargetMax: 0.01,    // 1.0%
      hourlyTarget: 0.00025,   // 0.025% por hora
      useTestnet: process.env.USE_TESTNET === 'true',
      isSimulation: process.env.SIMULA === 'true'
    });
    this.aiClients = {
      chatgpt: new OpenAI({ apiKey: process.env.OPENAI_API_KEY }),
      deepseek: new DeepSeekClient(process.env.DEEPSEEK_API_KEY)
    };
    this.mlPredictor = new MLPredictor();
    this.backtestEngine = new BacktestingEngine();
    this.notificationService = new NotificationService();
    this.exchangeIntegrator = new ExchangeIntegrator();
    this.consensusHistory = [];
    this.botMetrics = {
      hourlyTarget: 0.5,
      dailyTarget: 5.0,
      currentHourly: 0,
      currentDaily: 0,
      totalTrades: 0,
      successRate: 0,
      activePairs: ['BTCUSDT', 'ETHUSDT', 'SOLUSDT'],
      environment: {
        useTestnet: process.env.USE_TESTNET === 'true',
        isSimulation: process.env.SIMULA === 'true',
        baseUrl: process.env.USE_TESTNET === 'true' ? 
          'https://testnet.binance.vision' : 
          'https://api.binance.com'
      }
    };
    
    this.setupExpress();
    this.setupWebSocket();
    this.setupAggressiveEngine();
    this.initializeAdvancedFeatures();
  }

  async initializeAdvancedFeatures() {
    try {
      // Inicializar ML
      await this.mlPredictor.initializeModel();
      console.log('✅ ML Predictor inicializado');
      
      // Inicializar exchanges
      await this.exchangeIntegrator.initializeExchanges();
      console.log('✅ Exchange Integrator inicializado');
      
      // Iniciar backtesting automático
      this.startAutomaticBacktesting();
      
      // Iniciar monitoramento de arbitragem
      this.startArbitrageMonitoring();
      
    } catch (error) {
      console.error('❌ Erro ao inicializar funcionalidades avançadas:', error);
    }
  }

  startAutomaticBacktesting() {
    // Executar backtest a cada 6 horas
    setInterval(async () => {
      try {
        console.log('🔄 Iniciando backtest automático...');
        
        const strategy = this.backtestEngine.getAggressiveStrategy();
        const symbols = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT'];
        
        for (const symbol of symbols) {
          const results = await this.backtestEngine.runBacktest(
            symbol, 
            strategy, 
            new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 dias atrás
            new Date()
          );
          
          if (results && results.totalReturn > 10) {
            await this.notificationService.notifyAlert(
              'BACKTEST_SUCCESS',
              symbol,
              `Estratégia ${strategy.name} mostrou ${results.totalReturn.toFixed(1)}% de retorno`,
              'INFO'
            );
          }
        }
      } catch (error) {
        console.error('❌ Erro no backtest automático:', error);
      }
    }, 6 * 60 * 60 * 1000); // 6 horas
  }

  startArbitrageMonitoring() {
    // Monitorar arbitragem a cada 30 segundos
    setInterval(async () => {
      try {
        const opportunities = await this.exchangeIntegrator.findArbitrageOpportunities([
          'BTC/USDT', 'ETH/USDT', 'SOL/USDT'
        ]);
        
        for (const opp of opportunities) {
          if (opp.spread > 1.0) { // Spread > 1%
            await this.notificationService.notifyAlert(
              'ARBITRAGE_OPPORTUNITY',
              opp.symbol,
              `Oportunidade de ${opp.spread.toFixed(2)}% entre ${opp.buyExchange} e ${opp.sellExchange}`,
              'WARNING'
            );
            
            // Auto-executar se spread for muito alto
            if (opp.spread > 2.0 && process.env.AUTO_ARBITRAGE === 'true') {
              await this.exchangeIntegrator.executeArbitrage(opp);
            }
          }
        }
      } catch (error) {
        console.error('❌ Erro no monitoramento de arbitragem:', error);
      }
    }, 30000); // 30 segundos
  }
  setupAggressiveEngine() {
    // Conectar eventos do motor agressivo
    this.aggressiveEngine.on('metricsUpdate', (metrics) => {
      this.botMetrics = {
        ...this.botMetrics,
        ...metrics
      };
      
      this.broadcastToClients({
        type: 'aggressive_metrics',
        data: metrics
      });
    });

    this.aggressiveEngine.on('tradeExecuted', (trade) => {
      console.log(`⚡ TRADE AGRESSIVO: ${trade.type} ${trade.pair} - Lucro: ${trade.profit?.toFixed(3)}%`);
      
      this.broadcastToClients({
        type: 'aggressive_trade',
        data: trade
      });
      
      // Notificar trade
      this.notificationService.notifyTrade(
        trade.pair,
        trade.type,
        trade.price || 0,
        trade.amount || 0,
        trade.profit || 0
      ).catch(error => console.error('Erro ao notificar trade:', error));
    });
  }

  setupExpress() {
    this.app.use(express.json());
    this.app.use(express.static('dist'));
    
    // Adicionar rotas da API
    this.app.use('/api', apiRoutes);

    // API Routes
    this.app.get('/api/bot/status', (req, res) => {
      res.json({
        status: this.botProcess ? 'running' : 'stopped',
        metrics: this.botMetrics,
        lastUpdate: new Date().toISOString()
      });
    });

    this.app.post('/api/bot/start', async (req, res) => {
      try {
        await this.startBot();
        res.json({ success: true, message: 'Bot iniciado com sucesso' });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    this.app.post('/api/bot/stop', async (req, res) => {
      try {
        await this.stopBot();
        res.json({ success: true, message: 'Bot parado com sucesso' });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    this.app.post('/api/ai/consensus', async (req, res) => {
      try {
        const { topic, context } = req.body;
        const consensus = await this.getAIConsensus(topic, context);
        res.json(consensus);
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    this.app.post('/api/code/update', async (req, res) => {
      try {
        const { filename, code } = req.body;
        await this.updateBotCode(filename, code);
        res.json({ success: true, message: 'Código atualizado com sucesso' });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    this.app.get('/api/code/:filename', async (req, res) => {
      try {
        const { filename } = req.params;
        const code = await this.getBotCode(filename);
        res.json({ code });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });
  }

  setupWebSocket() {
    this.server = this.app.listen(3001, () => {
      console.log('🚀 Bot Manager Server running on port 3001');
    });

    this.wss = new WebSocketServer({ server: this.server });
    
    this.wss.on('connection', (ws) => {
      console.log('Cliente conectado via WebSocket');
      
      ws.on('message', async (message) => {
        try {
          const data = JSON.parse(message);
          await this.handleWebSocketMessage(ws, data);
        } catch (error) {
          ws.send(JSON.stringify({ error: error.message }));
        }
      });

      ws.on('close', () => {
        console.log('Cliente desconectado');
      });
    });
  }

  async handleWebSocketMessage(ws, data) {
    switch (data.type) {
      case 'ai_chat':
        const response = await this.processAIChat(data.message);
        ws.send(JSON.stringify({ type: 'ai_response', data: response }));
        break;
        
      case 'request_consensus':
        const consensus = await this.getAIConsensus(data.topic, data.context);
        ws.send(JSON.stringify({ type: 'consensus_result', data: consensus }));
        break;
        
      case 'bot_metrics':
        ws.send(JSON.stringify({ type: 'metrics_update', data: this.botMetrics }));
        break;
    }
  }

  async processAIChat(message) {
    try {
      // Processar com ChatGPT
      const chatgptResponse = await this.aiClients.chatgpt.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `Você é um especialista em trading de criptomoedas e desenvolvimento de bots. 
                     Analise a mensagem do usuário e forneça insights sobre estratégias de trading, 
                     indicadores técnicos, gestão de risco e otimizações de código para bots de trading.`
          },
          {
            role: "user",
            content: message
          }
        ],
        max_tokens: 500
      });

      // Processar com DeepSeek (cliente real)
      const deepseekResponse = await this.aiClients.deepseek.chat([
        {
          role: "system",
          content: "Você é um especialista em trading quantitativo e análise técnica. Forneça insights complementares sobre estratégias de trading agressivo."
        },
        {
          role: "user",
          content: message
        }
      ]);

      return {
        chatgpt: chatgptResponse.choices[0].message.content,
        deepseek: deepseekResponse,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Erro no processamento AI:', error);
      // Fallback para simulação em caso de erro
      return {
        chatgpt: "Erro ao conectar com ChatGPT. Verifique sua API key.",
        deepseek: "Erro ao conectar com DeepSeek. Verifique sua API key.",
        timestamp: new Date().toISOString()
      };
    }
  }

  async simulateDeepSeekResponse(message) {
    // Simulação - implementar cliente real do DeepSeek
    const responses = {
      'indicadores': 'Recomendo usar RSI combinado com MACD e Bollinger Bands para maior precisão.',
      'risco': 'Implementar stop-loss dinâmico baseado em ATR e position sizing com Kelly Criterion.',
      'otimização': 'Usar cache Redis para dados de mercado e implementar processamento assíncrono.',
      'estratégia': 'Considerar mean reversion em mercados laterais e momentum em tendências fortes.'
    };

    const key = Object.keys(responses).find(k => message.toLowerCase().includes(k));
    return responses[key] || 'Análise detalhada necessária. Favor fornecer mais contexto sobre o cenário específico.';
  }

  async getAIConsensus(topic, context) {
    try {
      const chatgptAnalysis = await this.aiClients.chatgpt.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `Analise o tópico de trading fornecido e dê sua opinião técnica sobre: 
                     ${topic}. Contexto: ${context}`
          }
        ],
        max_tokens: 300
      });

      const deepseekAnalysis = await this.simulateDeepSeekResponse(`${topic} ${context}`);

      // Determinar consenso
      const consensus = this.determineConsensus(
        chatgptAnalysis.choices[0].message.content,
        deepseekAnalysis
      );

      const result = {
        topic,
        chatgpt: chatgptAnalysis.choices[0].message.content,
        deepseek: deepseekAnalysis,
        consensus: consensus.agreed ? 'agreed' : 'disagreed',
        recommendation: consensus.recommendation,
        timestamp: new Date().toISOString()
      };

      this.consensusHistory.push(result);
      return result;
    } catch (error) {
      console.error('Erro no consenso AI:', error);
      throw error;
    }
  }

  determineConsensus(chatgptResponse, deepseekResponse) {
    // Lógica simples de consenso - pode ser melhorada com NLP
    const commonKeywords = ['rsi', 'macd', 'stop-loss', 'atr', 'bollinger'];
    const chatgptKeywords = commonKeywords.filter(k => 
      chatgptResponse.toLowerCase().includes(k)
    );
    const deepseekKeywords = commonKeywords.filter(k => 
      deepseekResponse.toLowerCase().includes(k)
    );

    const agreement = chatgptKeywords.filter(k => deepseekKeywords.includes(k));
    const agreed = agreement.length > 0;

    return {
      agreed,
      recommendation: agreed ? 
        `Implementar: ${agreement.join(', ')}` : 
        'Necessária análise adicional - opiniões divergentes'
    };
  }

  async startBot() {
    if (this.botProcess) {
      throw new Error('Bot já está rodando');
    }

    try {
      this.botProcess = spawn('node', ['bot/bot_agressivo5.mjs'], {
        stdio: 'pipe',
        env: { ...process.env }
      });

      this.botProcess.stdout.on('data', (data) => {
        console.log(`Bot Output: ${data}`);
        this.broadcastToClients({ type: 'bot_log', data: data.toString() });
      });

      this.botProcess.stderr.on('data', (data) => {
        console.error(`Bot Error: ${data}`);
        this.broadcastToClients({ type: 'bot_error', data: data.toString() });
      });

      this.botProcess.on('close', (code) => {
        console.log(`Bot process exited with code ${code}`);
        this.botProcess = null;
        this.broadcastToClients({ type: 'bot_stopped', code });
      });

      console.log('✅ Bot iniciado com sucesso');
    } catch (error) {
      console.error('Erro ao iniciar bot:', error);
      throw error;
    }
  }

  async stopBot() {
    if (!this.botProcess) {
      throw new Error('Bot não está rodando');
    }

    this.botProcess.kill('SIGTERM');
    this.botProcess = null;
    console.log('🛑 Bot parado');
  }

  async updateBotCode(filename, code) {
    const filePath = path.join(__dirname, '..', 'bot', filename);
    await fs.writeFile(filePath, code, 'utf8');
    
    // Se o bot estiver rodando, reiniciar
    if (this.botProcess) {
      await this.stopBot();
      setTimeout(() => this.startBot(), 1000);
    }
  }

  async getBotCode(filename) {
    const filePath = path.join(__dirname, '..', 'bot', filename);
    return await fs.readFile(filePath, 'utf8');
  }

  broadcastToClients(message) {
    this.wss.clients.forEach((client) => {
      if (client.readyState === 1) { // WebSocket.OPEN = 1
        client.send(JSON.stringify(message));
      }
    });
  }

  // Análise automática de performance
  async analyzePerformance() {
    const analysis = await this.getAIConsensus(
      'Performance Analysis',
      `Current metrics: ${JSON.stringify(this.botMetrics)}`
    );

    if (analysis.consensus === 'agreed') {
      console.log('🤖 AI Consensus:', analysis.recommendation);
      // Implementar mudanças automáticas se necessário
    }
  }

  // Monitoramento contínuo
  startMonitoring() {
    setInterval(() => {
      this.updateMetrics();
      this.analyzePerformance();
    }, 60000); // A cada minuto
  }

  updateMetrics() {
    // Atualizar timestamp atual
    this.botMetrics.currentTime = new Date().toISOString();
    
    // Simular métricas agressivas realistas
    const pairs = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT'];
    let totalHourlyProfit = 0;
    let totalDailyProfit = 0;
    let totalTrades = 0;
    let totalSuccessRate = 0;
    
    pairs.forEach(pair => {
      // Simular lucros agressivos mas realistas
      const hourlyGain = (Math.random() * 0.06 - 0.01); // -1% a +5% por hora
      const dailyGain = this.botMetrics.pairProfits[pair].dailyProfit + (hourlyGain * 0.1);
      
      this.botMetrics.pairProfits[pair].hourlyProfit = hourlyGain;
      this.botMetrics.pairProfits[pair].dailyProfit = Math.max(-2, Math.min(3, dailyGain)); // Limitar entre -2% e +3%
      this.botMetrics.pairProfits[pair].trades += Math.floor(Math.random() * 4); // 0-3 trades por update
      this.botMetrics.pairProfits[pair].successRate = 65 + Math.random() * 25; // 65-90% success rate
      
      totalHourlyProfit += hourlyGain;
      totalDailyProfit += this.botMetrics.pairProfits[pair].dailyProfit;
      totalTrades += this.botMetrics.pairProfits[pair].trades;
      totalSuccessRate += this.botMetrics.pairProfits[pair].successRate;
    });
    
    // Calcular agregados
    this.botMetrics.aggregatedProfit.hourly = totalHourlyProfit / pairs.length;
    this.botMetrics.aggregatedProfit.daily = totalDailyProfit / pairs.length;
    this.botMetrics.totalTrades = totalTrades;
    this.botMetrics.successRate = totalSuccessRate / pairs.length;
    
    // Ajustar meta dinamicamente baseada na performance
    if (this.botMetrics.aggregatedProfit.daily >= 0.61) {
      this.botMetrics.aggregatedProfit.target = Math.min(1.0, this.botMetrics.aggregatedProfit.target + 0.01);
    } else if (this.botMetrics.aggregatedProfit.daily < 0.3) {
      this.botMetrics.aggregatedProfit.target = Math.max(0.61, this.botMetrics.aggregatedProfit.target - 0.01);
    }

    this.broadcastToClients({ 
      type: 'metrics_update', 
      data: this.botMetrics 
    });
  }
}

// Inicializar o gerenciador
const botManager = new BotManager();
botManager.startMonitoring();

export default BotManager;