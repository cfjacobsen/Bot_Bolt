// ==============================================
// BOT MANAGER - SISTEMA AVANÇADO DE GERENCIAMENTO
// ==============================================

require('dotenv').config();
const express = require('express');
const WebSocket = require('ws');
const https = require('https');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Importações de módulos personalizados
const AdvancedTradingBot = require('./core/AdvancedTradingBot');
const ProfitMonitor = require('./core/ProfitMonitor');
const RiskManager = require('./core/RiskManager');
const TradingEngine = require('./core/TradingEngine');
const IACollaborative = require('./ia/IACollaborative');
const Database = require('./utils/Database');
const Logger = require('./utils/Logger');
const Notifier = require('./utils/Notifier');
const Encryption = require('./utils/Encryption');
const { SIMULA, TESTNET, MAINNET } = require('./config/modes');
const tradingConfig = require('./config/trading-config');
const indicatorsConfig = require('./config/indicators-config');

class BotManager {
  constructor() {
    this.app = express();
    this.wss = null;
    this.port = process.env.PORT || 3000;
    this.sslEnabled = process.env.SSL_ENABLED === 'true';
    
    this.bots = new Map();
    this.performanceData = new Map();
    this.iaCollaborative = new IACollaborative();
    this.db = new Database();
    this.logger = new Logger();
    this.notifier = new Notifier();
    
    this.initialize();
  }

  async initialize() {
    try {
      // Inicializar componentes
      await this.initializeDatabase();
      await this.initializeEncryption();
      this.initializeServer();
      this.initializeWebSocket();
      this.initializeRoutes();
      this.initializeEventListeners();
      
      // Carregar bots ativos do banco de dados
      await this.loadActiveBots();
      
      this.logger.info('Bot Manager inicializado com sucesso');
      this.notifier.sendSystemAlert('Bot Manager Iniciado', 'Sistema inicializado e pronto');
      
    } catch (error) {
      this.logger.error('Erro na inicialização do Bot Manager:', error);
      process.exit(1);
    }
  }

  async initializeDatabase() {
    await this.db.connect();
    this.logger.info('Banco de dados inicializado');
  }

  async initializeEncryption() {
    // Verificar se a chave de criptografia existe
    if (!process.env.ENCRYPTION_KEY) {
      const encryptionKey = crypto.randomBytes(32).toString('hex');
      this.logger.warn(`Chave de criptografia não encontrada. Gerando nova chave: ${encryptionKey}`);
      
      // Adicionar ao .env programaticamente (apenas para desenvolvimento)
      if (process.env.NODE_ENV === 'development') {
        fs.appendFileSync('.env', `\nENCRYPTION_KEY=${encryptionKey}`);
      }
      
      process.env.ENCRYPTION_KEY = encryptionKey;
    }
    
    Encryption.initialize(process.env.ENCRYPTION_KEY);
    this.logger.info('Sistema de criptografia inicializado');
  }

  initializeServer() {
    // Middlewares
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.static(path.join(__dirname, 'public')));
    
    // Configuração de CORS
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      next();
    });
    
    // Iniciar servidor HTTP ou HTTPS
    if (this.sslEnabled) {
      const options = {
        key: fs.readFileSync(process.env.SSL_KEY_PATH),
        cert: fs.readFileSync(process.env.SSL_CERT_PATH)
      };
      this.server = https.createServer(options, this.app);
    } else {
      this.server = require('http').createServer(this.app);
    }
    
    this.server.listen(this.port, () => {
      this.logger.info(`Servidor iniciado na porta ${this.port} (SSL: ${this.sslEnabled})`);
    });
  }

  initializeWebSocket() {
    this.wss = new WebSocket.Server({ server: this.server });
    
    this.wss.on('connection', (ws) => {
      this.logger.info('Nova conexão WebSocket estabelecida');
      
      // Enviar dados iniciais para o cliente
      this.sendInitialData(ws);
      
      ws.on('message', (message) => {
        this.handleWebSocketMessage(ws, message);
      });
      
      ws.on('close', () => {
        this.logger.info('Conexão WebSocket fechada');
      });
    });
    
    // Atualizar dados via WebSocket a cada segundo
    setInterval(() => {
      this.broadcastData();
    }, 1000);
  }

  initializeRoutes() {
    // Rota de saúde da API
    this.app.get('/api/health', (req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });
    
    // Rotas de gerenciamento de bots
    this.app.post('/api/bots', (req, res) => this.createBot(req, res));
    this.app.get('/api/bots', (req, res) => this.getBots(req, res));
    this.app.get('/api/bots/:id', (req, res) => this.getBot(req, res));
    this.app.put('/api/bots/:id', (req, res) => this.updateBot(req, res));
    this.app.delete('/api/bots/:id', (req, res) => this.deleteBot(req, res));
    this.app.post('/api/bots/:id/start', (req, res) => this.startBot(req, res));
    this.app.post('/api/bots/:id/stop', (req, res) => this.stopBot(req, res));
    
    // Rotas de performance
    this.app.get('/api/performance', (req, res) => this.getPerformance(req, res));
    this.app.get('/api/performance/:id', (req, res) => this.getBotPerformance(req, res));
    
    // Rotas de IA
    this.app.post('/api/ia/analyze', (req, res) => this.analyzeWithIA(req, res));
    this.app.post('/api/ia/optimize', (req, res) => this.optimizeWithIA(req, res));
    
    // Rotas de configuração
    this.app.get('/api/config', (req, res) => this.getConfig(req, res));
    this.app.put('/api/config', (req, res) => this.updateConfig(req, res));
    
    // Rota para servir a interface
    this.app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'public', 'index.html'));
    });
    
    // Manipulador de erros
    this.app.use((error, req, res, next) => {
      this.logger.error('Erro na API:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    });
  }

  initializeEventListeners() {
    // Ouvinte para eventos do sistema
    process.on('SIGINT', () => this.shutdown());
    process.on('SIGTERM', () => this.shutdown());
    
    // Ouvinte para eventos de todos os bots
    process.on('bot-event', (data) => {
      this.handleBotEvent(data);
    });
  }

  async loadActiveBots() {
    try {
      const activeBots = await this.db.getActiveBots();
      
      for (const botData of activeBots) {
        await this.createBotInstance(botData);
      }
      
      this.logger.info(`${activeBots.length} bots ativos carregados`);
    } catch (error) {
      this.logger.error('Erro ao carregar bots ativos:', error);
    }
  }

  async createBotInstance(botData) {
    try {
      const bot = new AdvancedTradingBot(botData);
      this.bots.set(botData.id, bot);
      
      // Registrar ouvintes de eventos do bot
      bot.on('trade', (data) => this.handleBotTrade(botData.id, data));
      bot.on('performance', (data) => this.handleBotPerformance(botData.id, data));
      bot.on('error', (error) => this.handleBotError(botData.id, error));
      
      // Iniciar bot se estava ativo
      if (botData.status === 'active') {
        await bot.start();
      }
      
      this.logger.info(`Bot ${botData.id} inicializado (${botData.mode})`);
      return bot;
    } catch (error) {
      this.logger.error(`Erro ao criar instância do bot ${botData.id}:`, error);
      throw error;
    }
  }

  async createBot(req, res) {
    try {
      const botConfig = req.body;
      
      // Validação básica
      if (!botConfig.mode || !botConfig.pairs || botConfig.pairs.length === 0) {
        return res.status(400).json({ error: 'Configuração inválida' });
      }
      
      // Adicionar ID e timestamp
      botConfig.id = crypto.randomUUID();
      botConfig.createdAt = new Date().toISOString();
      botConfig.updatedAt = new Date().toISOString();
      botConfig.status = 'inactive';
      
      // Salvar no banco de dados
      await this.db.saveBot(botConfig);
      
      // Criar instância do bot
      const bot = await this.createBotInstance(botConfig);
      
      res.status(201).json({
        id: botConfig.id,
        message: 'Bot criado com sucesso'
      });
    } catch (error) {
      this.logger.error('Erro ao criar bot:', error);
      res.status(500).json({ error: 'Erro ao criar bot' });
    }
  }

  async getBots(req, res) {
    try {
      const bots = Array.from(this.bots.values()).map(bot => bot.getConfig());
      res.json(bots);
    } catch (error) {
      this.logger.error('Erro ao obter bots:', error);
      res.status(500).json({ error: 'Erro ao obter bots' });
    }
  }

  async getBot(req, res) {
    try {
      const { id } = req.params;
      const bot = this.bots.get(id);
      
      if (!bot) {
        return res.status(404).json({ error: 'Bot não encontrado' });
      }
      
      res.json(bot.getConfig());
    } catch (error) {
      this.logger.error('Erro ao obter bot:', error);
      res.status(500).json({ error: 'Erro ao obter bot' });
    }
  }

  async updateBot(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const bot = this.bots.get(id);
      if (!bot) {
        return res.status(404).json({ error: 'Bot não encontrado' });
      }
      
      // Atualizar configuração
      await bot.updateConfig(updates);
      
      // Salvar no banco de dados
      updates.updatedAt = new Date().toISOString();
      await this.db.updateBot(id, updates);
      
      res.json({ message: 'Bot atualizado com sucesso' });
    } catch (error) {
      this.logger.error('Erro ao atualizar bot:', error);
      res.status(500).json({ error: 'Erro ao atualizar bot' });
    }
  }

  async deleteBot(req, res) {
    try {
      const { id } = req.params;
      const bot = this.bots.get(id);
      
      if (!bot) {
        return res.status(404).json({ error: 'Bot não encontrado' });
      }
      
      // Parar bot se estiver ativo
      if (bot.isRunning()) {
        await bot.stop();
      }
      
      // Remover do mapa e do banco de dados
      this.bots.delete(id);
      await this.db.deleteBot(id);
      
      res.json({ message: 'Bot removido com sucesso' });
    } catch (error) {
      this.logger.error('Erro ao remover bot:', error);
      res.status(500).json({ error: 'Erro ao remover bot' });
    }
  }

  async startBot(req, res) {
    try {
      const { id } = req.params;
      const bot = this.bots.get(id);
      
      if (!bot) {
        return res.status(404).json({ error: 'Bot não encontrado' });
      }
      
      // Iniciar bot
      await bot.start();
      
      // Atualizar status no banco de dados
      await this.db.updateBot(id, { 
        status: 'active',
        updatedAt: new Date().toISOString()
      });
      
      res.json({ message: 'Bot iniciado com sucesso' });
    } catch (error) {
      this.logger.error('Erro ao iniciar bot:', error);
      res.status(500).json({ error: 'Erro ao iniciar bot' });
    }
  }

  async stopBot(req, res) {
    try {
      const { id } = req.params;
      const bot = this.bots.get(id);
      
      if (!bot) {
        return res.status(404).json({ error: 'Bot não encontrado' });
      }
      
      // Parar bot
      await bot.stop();
      
      // Atualizar status no banco de dados
      await this.db.updateBot(id, { 
        status: 'inactive',
        updatedAt: new Date().toISOString()
      });
      
      res.json({ message: 'Bot parado com sucesso' });
    } catch (error) {
      this.logger.error('Erro ao parar bot:', error);
      res.status(500).json({ error: 'Erro ao parar bot' });
    }
  }

  async getPerformance(req, res) {
    try {
      const performanceData = {};
      
      for (const [id, bot] of this.bots) {
        performanceData[id] = bot.getPerformance();
      }
      
      // Calcular performance agregada
      const aggregated = this.calculateAggregatedPerformance(performanceData);
      
      res.json({
        bots: performanceData,
        aggregated: aggregated
      });
    } catch (error) {
      this.logger.error('Erro ao obter performance:', error);
      res.status(500).json({ error: 'Erro ao obter performance' });
    }
  }

  async getBotPerformance(req, res) {
    try {
      const { id } = req.params;
      const bot = this.bots.get(id);
      
      if (!bot) {
        return res.status(404).json({ error: 'Bot não encontrado' });
      }
      
      res.json(bot.getPerformance());
    } catch (error) {
      this.logger.error('Erro ao obter performance do bot:', error);
      res.status(500).json({ error: 'Erro ao obter performance do bot' });
    }
  }

  async analyzeWithIA(req, res) {
    try {
      const { botId, data } = req.body;
      
      let bot = null;
      if (botId) {
        bot = this.bots.get(botId);
        if (!bot) {
          return res.status(404).json({ error: 'Bot não encontrado' });
        }
      }
      
      // Analisar com IA colaborativa
      const analysis = await this.iaCollaborative.analyze(data, bot);
      
      res.json(analysis);
    } catch (error) {
      this.logger.error('Erro na análise com IA:', error);
      res.status(500).json({ error: 'Erro na análise com IA' });
    }
  }

  async optimizeWithIA(req, res) {
    try {
      const { botId, parameters } = req.body;
      
      const bot = this.bots.get(botId);
      if (!bot) {
        return res.status(404).json({ error: 'Bot não encontrado' });
      }
      
      // Otimizar com IA colaborativa
      const optimization = await this.iaCollaborative.optimize(bot, parameters);
      
      res.json(optimization);
    } catch (error) {
      this.logger.error('Erro na otimização com IA:', error);
      res.status(500).json({ error: 'Erro na otimização com IA' });
    }
  }

  async getConfig(req, res) {
    try {
      const config = {
        trading: tradingConfig,
        indicators: indicatorsConfig,
        modes: { SIMULA, TESTNET, MAINNET }
      };
      
      res.json(config);
    } catch (error) {
      this.logger.error('Erro ao obter configuração:', error);
      res.status(500).json({ error: 'Erro ao obter configuração' });
    }
  }

  async updateConfig(req, res) {
    try {
      const { trading, indicators } = req.body;
      
      // Atualizar configurações (implementar lógica de validação e persistência)
      this.logger.warn('Atualização de configuração solicitada, mas não totalmente implementada');
      
      res.json({ message: 'Configuração atualizada com sucesso' });
    } catch (error) {
      this.logger.error('Erro ao atualizar configuração:', error);
      res.status(500).json({ error: 'Erro ao atualizar configuração' });
    }
  }

  handleBotTrade(botId, tradeData) {
    // Registrar trade
    this.logger.trade(botId, tradeData);
    
    // Atualizar performance
    this.performanceData.set(botId, {
      ...this.performanceData.get(botId),
      lastTrade: tradeData,
      updatedAt: Date.now()
    });
    
    // Enviar notificação se for um trade significativo
    if (Math.abs(tradeData.profitLoss) > tradingConfig.notificationThreshold) {
      this.notifier.sendTradeAlert(botId, tradeData);
    }
    
    // Broadcast via WebSocket
    this.broadcastData();
  }

  handleBotPerformance(botId, performanceData) {
    // Atualizar dados de performance
    this.performanceData.set(botId, {
      ...performanceData,
      updatedAt: Date.now()
    });
    
    // Verificar se está abaixo da meta e ajustar se necessário
    if (performanceData.status === 'BELOW_TARGET') {
      const bot = this.bots.get(botId);
      if (bot) {
        bot.adjustForPerformance();
      }
    }
    
    // Broadcast via WebSocket
    this.broadcastData();
  }

  handleBotError(botId, error) {
    this.logger.error(`Erro no bot ${botId}:`, error);
    
    // Enviar notificação de erro
    this.notifier.sendErrorAlert(botId, error);
    
    // Parar bot se for um erro crítico
    if (error.isCritical) {
      const bot = this.bots.get(botId);
      if (bot) {
        bot.stop();
        
        // Atualizar status no banco de dados
        this.db.updateBot(botId, { 
          status: 'error',
          updatedAt: new Date().toISOString()
        });
      }
    }
  }

  handleBotEvent(data) {
    // Processar eventos genéricos de bots
    this.logger.info(`Evento de bot: ${data.type}`, data);
    
    // Broadcast via WebSocket se necessário
    if (data.broadcast) {
      this.broadcastData();
    }
  }

  handleWebSocketMessage(ws, message) {
    try {
      const data = JSON.parse(message);
      
      switch (data.type) {
        case 'subscribe':
          this.handleSubscribe(ws, data);
          break;
        case 'unsubscribe':
          this.handleUnsubscribe(ws, data);
          break;
        case 'command':
          this.handleCommand(ws, data);
          break;
        default:
          this.logger.warn('Tipo de mensagem WebSocket desconhecido:', data.type);
      }
    } catch (error) {
      this.logger.error('Erro ao processar mensagem WebSocket:', error);
    }
  }

  handleSubscribe(ws, data) {
    // Implementar lógica de subscription para updates específicos
    ws.subscriptions = ws.subscriptions || {};
    
    if (data.channel) {
      ws.subscriptions[data.channel] = true;
      this.logger.info(`Cliente inscrito no canal: ${data.channel}`);
    }
  }

  handleUnsubscribe(ws, data) {
    if (ws.subscriptions && data.channel) {
      delete ws.subscriptions[data.channel];
      this.logger.info(`Cliente removido do canal: ${data.channel}`);
    }
  }

  handleCommand(ws, data) {
    // Implementar execução de comandos via WebSocket
    this.logger.info(`Comando recebido: ${data.command}`, data);
    
    // Exemplo: reiniciar um bot específico
    if (data.command === 'restart' && data.botId) {
      const bot = this.bots.get(data.botId);
      if (bot) {
        bot.restart();
        ws.send(JSON.stringify({ type: 'command_result', success: true }));
      } else {
        ws.send(JSON.stringify({ type: 'command_result', success: false, error: 'Bot não encontrado' }));
      }
    }
  }

  sendInitialData(ws) {
    // Enviar dados iniciais para o cliente recém-conectado
    const initialData = {
      type: 'initial_data',
      bots: Array.from(this.bots.values()).map(bot => bot.getConfig()),
      performance: Object.fromEntries(this.performanceData),
      timestamp: Date.now()
    };
    
    ws.send(JSON.stringify(initialData));
  }

  broadcastData() {
    if (!this.wss) return;
    
    const data = {
      type: 'update',
      bots: Array.from(this.bots.values()).map(bot => ({
        id: bot.id,
        status: bot.getStatus(),
        performance: bot.getPerformanceSummary()
      })),
      performance: Object.fromEntries(this.performanceData),
      timestamp: Date.now()
    };
    
    this.wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  }

  calculateAggregatedPerformance(performanceData) {
    if (Object.keys(performanceData).length === 0) {
      return {
        totalGain: 0,
        dailyGain: 0,
        hourlyGain: 0,
        tradeCount: 0,
        successRate: 0
      };
    }
    
    let totalGain = 0;
    let dailyGain = 0;
    let hourlyGain = 0;
    let tradeCount = 0;
    let successfulTrades = 0;
    
    for (const botId in performanceData) {
      const perf = performanceData[botId];
      totalGain += perf.totalGain || 0;
      dailyGain += perf.dailyGain || 0;
      hourlyGain += perf.hourlyGain || 0;
      tradeCount += perf.tradeCount || 0;
      successfulTrades += perf.successfulTrades || 0;
    }
    
    return {
      totalGain,
      dailyGain,
      hourlyGain,
      tradeCount,
      successRate: tradeCount > 0 ? successfulTrades / tradeCount : 0
    };
  }

  async shutdown() {
    this.logger.info('Iniciando desligamento do Bot Manager');
    
    try {
      // Parar todos os bots
      for (const [id, bot] of this.bots) {
        if (bot.isRunning()) {
          await bot.stop();
          
          // Atualizar status no banco de dados
          await this.db.updateBot(id, { 
            status: 'inactive',
            updatedAt: new Date().toISOString()
          });
        }
      }
      
      // Fechar conexões
      if (this.wss) {
        this.wss.close();
      }
      
      if (this.server) {
        this.server.close();
      }
      
      await this.db.disconnect();
      
      this.logger.info('Bot Manager desligado com sucesso');
      process.exit(0);
    } catch (error) {
      this.logger.error('Erro durante o desligamento:', error);
      process.exit(1);
    }
  }
}

// Inicializar o Bot Manager
const botManager = new BotManager();

module.exports = BotManager;