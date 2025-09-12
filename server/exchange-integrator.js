// Integrador Multi-Exchange
import ccxt from 'ccxt';

class ExchangeIntegrator {
  constructor() {
    this.exchanges = new Map();
    this.supportedExchanges = ['binance', 'bybit', 'okx', 'kucoin'];
    this.arbitrageOpportunities = [];
    this.crossExchangeData = new Map();
  }

  async initializeExchanges() {
    try {
      // Binance (principal)
      const binance = new ccxt.binance({
        apiKey: process.env.BINANCE_API_KEY,
        secret: process.env.BINANCE_API_SECRET,
        sandbox: process.env.USE_TESTNET === 'true',
        enableRateLimit: true
      });
      
      this.exchanges.set('binance', binance);
      console.log('✅ Binance conectada');

      // Bybit (se configurado)
      if (process.env.BYBIT_API_KEY) {
        const bybit = new ccxt.bybit({
          apiKey: process.env.BYBIT_API_KEY,
          secret: process.env.BYBIT_API_SECRET,
          sandbox: process.env.USE_TESTNET === 'true',
          enableRateLimit: true
        });
        
        this.exchanges.set('bybit', bybit);
        console.log('✅ Bybit conectada');
      }

      // OKX (se configurado)
      if (process.env.OKX_API_KEY) {
        const okx = new ccxt.okx({
          apiKey: process.env.OKX_API_KEY,
          secret: process.env.OKX_API_SECRET,
          password: process.env.OKX_PASSPHRASE,
          sandbox: process.env.USE_TESTNET === 'true',
          enableRateLimit: true
        });
        
        this.exchanges.set('okx', okx);
        console.log('✅ OKX conectada');
      }

      return true;
    } catch (error) {
      console.error('❌ Erro ao inicializar exchanges:', error);
      return false;
    }
  }

  async fetchPricesAllExchanges(symbol) {
    const prices = new Map();
    
    for (const [name, exchange] of this.exchanges) {
      try {
        const ticker = await exchange.fetchTicker(symbol);
        prices.set(name, {
          bid: ticker.bid,
          ask: ticker.ask,
          last: ticker.last,
          volume: ticker.baseVolume,
          timestamp: ticker.timestamp
        });
      } catch (error) {
        console.error(`❌ Erro ao obter preço de ${name}:`, error.message);
      }
    }
    
    return prices;
  }

  async findArbitrageOpportunities(symbols) {
    const opportunities = [];
    
    for (const symbol of symbols) {
      try {
        const prices = await this.fetchPricesAllExchanges(symbol);
        
        if (prices.size < 2) continue;
        
        const priceArray = Array.from(prices.entries());
        
        // Encontrar maior e menor preço
        let maxPrice = { exchange: '', price: 0 };
        let minPrice = { exchange: '', price: Infinity };
        
        for (const [exchange, data] of priceArray) {
          if (data.bid > maxPrice.price) {
            maxPrice = { exchange, price: data.bid };
          }
          if (data.ask < minPrice.price) {
            minPrice = { exchange, price: data.ask };
          }
        }
        
        // Calcular spread de arbitragem
        const spread = (maxPrice.price - minPrice.price) / minPrice.price;
        const minSpread = 0.005; // 0.5% mínimo para ser lucrativo
        
        if (spread > minSpread) {
          opportunities.push({
            symbol,
            buyExchange: minPrice.exchange,
            sellExchange: maxPrice.exchange,
            buyPrice: minPrice.price,
            sellPrice: maxPrice.price,
            spread: spread * 100,
            estimatedProfit: spread - 0.002, // Descontar taxas
            timestamp: Date.now()
          });
        }
      } catch (error) {
        console.error(`❌ Erro na arbitragem para ${symbol}:`, error);
      }
    }
    
    this.arbitrageOpportunities = opportunities;
    return opportunities;
  }

  async executeArbitrage(opportunity) {
    try {
      const buyExchange = this.exchanges.get(opportunity.buyExchange);
      const sellExchange = this.exchanges.get(opportunity.sellExchange);
      
      if (!buyExchange || !sellExchange) {
        throw new Error('Exchanges não disponíveis');
      }
      
      // Verificar saldos
      const buyBalance = await buyExchange.fetchBalance();
      const sellBalance = await sellExchange.fetchBalance();
      
      const baseAsset = opportunity.symbol.replace('USDT', '');
      const quoteAsset = 'USDT';
      
      const availableQuote = buyBalance[quoteAsset]?.free || 0;
      const availableBase = sellBalance[baseAsset]?.free || 0;
      
      // Calcular quantidade máxima
      const maxQuantityBuy = availableQuote / opportunity.buyPrice;
      const maxQuantitySell = availableBase;
      const quantity = Math.min(maxQuantityBuy, maxQuantitySell) * 0.95; // 95% para segurança
      
      if (quantity < 0.001) {
        throw new Error('Quantidade insuficiente para arbitragem');
      }
      
      // Executar ordens simultaneamente
      const [buyOrder, sellOrder] = await Promise.all([
        buyExchange.createMarketBuyOrder(opportunity.symbol, quantity),
        sellExchange.createMarketSellOrder(opportunity.symbol, quantity)
      ]);
      
      const profit = (sellOrder.average - buyOrder.average) * quantity;
      
      console.log(`💰 Arbitragem executada: ${opportunity.symbol}`);
      console.log(`   Compra: ${buyOrder.average} em ${opportunity.buyExchange}`);
      console.log(`   Venda: ${sellOrder.average} em ${opportunity.sellExchange}`);
      console.log(`   Lucro: $${profit.toFixed(2)}`);
      
      return {
        success: true,
        profit,
        buyOrder,
        sellOrder
      };
    } catch (error) {
      console.error('❌ Erro na execução de arbitragem:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getExchangeStatus() {
    const status = {};
    
    for (const [name, exchange] of this.exchanges) {
      try {
        const balance = await exchange.fetchBalance();
        const markets = await exchange.loadMarkets();
        
        status[name] = {
          connected: true,
          balance: {
            USDT: balance.USDT?.total || 0,
            BTC: balance.BTC?.total || 0,
            ETH: balance.ETH?.total || 0
          },
          markets: Object.keys(markets).length,
          lastUpdate: Date.now()
        };
      } catch (error) {
        status[name] = {
          connected: false,
          error: error.message,
          lastUpdate: Date.now()
        };
      }
    }
    
    return status;
  }

  async syncBalances() {
    const balances = {};
    
    for (const [name, exchange] of this.exchanges) {
      try {
        const balance = await exchange.fetchBalance();
        balances[name] = balance;
      } catch (error) {
        console.error(`❌ Erro ao sincronizar saldo de ${name}:`, error);
      }
    }
    
    return balances;
  }

  getArbitrageOpportunities() {
    return this.arbitrageOpportunities.filter(opp => 
      Date.now() - opp.timestamp < 30000 // Últimos 30 segundos
    );
  }

  start(port = 3003) {
    this.app.listen(port, () => {
      console.log(`🌐 Exchange Integrator API rodando na porta ${port}`);
    });
  }
}

export default ExchangeIntegrator;