// core/binance-api.js
const Binance = require('binance-api-node').default;

class BinanceConnector {
  constructor(mode) {
    this.mode = mode;
    this.client = null;
    this.init();
  }

  init() {
    const credentials = this.getCredentials();
    this.client = Binance({
      apiKey: credentials.apiKey,
      apiSecret: credentials.apiSecret,
      test: this.mode === 'TESTNET'
    });
  }

  async getAccountInfo() {
    return await this.client.accountInfo();
  }

  async placeOrder(order) {
    // Implementação completa com validações
  }
}