const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

class ConfigManager {
  constructor() {
    this.configPath = path.join(__dirname, '..', '.env');
    this.encryptedConfigPath = path.join(__dirname, 'encrypted-config.json');
  }

  // Criptografar dados sensíveis
  encrypt(text, key) {
    const algorithm = 'aes-256-cbc';
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(algorithm, key);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return {
      iv: iv.toString('hex'),
      encryptedData: encrypted
    };
  }

  // Descriptografar dados
  decrypt(encryptedData, key) {
    const algorithm = 'aes-256-cbc';
    const decipher = crypto.createDecipher(algorithm, key);
    
    let decrypted = decipher.update(encryptedData.encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  // Salvar configuração criptografada
  async saveEncryptedConfig(config) {
    try {
      const { apiKey, apiSecret, encryptionKey, isTestnet, isSimulation } = config;
      
      // Validar entrada
      if (!apiKey || !apiSecret || !encryptionKey) {
        throw new Error('Dados obrigatórios faltando');
      }
      
      if (encryptionKey.length !== 32) {
        throw new Error('Chave de criptografia deve ter 32 caracteres');
      }

      // Criptografar dados sensíveis
      const encryptedApiKey = this.encrypt(apiKey, encryptionKey);
      const encryptedApiSecret = this.encrypt(apiSecret, encryptionKey);

      // Criar arquivo .env
      const envContent = `# Configuração Gerada Automaticamente - ${new Date().toISOString()}
BINANCE_API_KEY=${apiKey}
BINANCE_API_SECRET=${apiSecret}
USE_TESTNET=${isTestnet}
SIMULA=${isSimulation}

# ===== CONFIGURAÇÕES DE REDE =====
BINANCE_TESTNET_URL=https://testnet.binance.vision
BINANCE_MAINNET_URL=https://api.binance.com

# ===== CONFIGURAÇÕES DE TRADING AGRESSIVO =====
DAILY_TARGET_MIN=0.61
DAILY_TARGET_MAX=1.0
HOURLY_TARGET_BASE=0.025
MAX_RISK_PER_TRADE=25
MAX_TRADES_PER_DAY=300

TIMEZONE=America/Sao_Paulo
INTERVALO_MS=1000
RISK_PER_TRADE=2.5
MAX_TRADES_DIA=300
ATIVOS=BTCUSDT,ETHUSDT,SOLUSDT
SALDO_INICIAL_USDT=1000
SALDO_INICIAL_BTC=0
SALDO_INICIAL_ETH=0
SALDO_INICIAL_SOL=0
SALDO_INICIAL_BNB=0
USAR_BNB_PARA_TAXAS=true
MINIMO_BNB_TAXAS=0.25
USE_AI=true
ENCRYPTION_KEY=${encryptionKey}
`;

      // Salvar .env
      await fs.writeFile(this.configPath, envContent);

      // Salvar backup criptografado
      const encryptedConfig = {
        timestamp: new Date().toISOString(),
        mode: isSimulation ? 'SIMULATION' : isTestnet ? 'TESTNET' : 'MAINNET',
        apiKey: encryptedApiKey,
        apiSecret: encryptedApiSecret,
        settings: {
          isTestnet,
          isSimulation
        }
      };

      await fs.writeFile(
        this.encryptedConfigPath, 
        JSON.stringify(encryptedConfig, null, 2)
      );

      console.log('✅ Configuração salva com segurança');
      return { success: true, message: 'Configuração salva com segurança!' };

    } catch (error) {
      console.error('❌ Erro ao salvar configuração:', error);
      return { success: false, message: error.message };
    }
  }

  // Testar conexão com a Binance
  async testBinanceConnection(apiKey, apiSecret, isTestnet = false) {
    try {
      // URLs específicas para cada ambiente
      const baseUrl = isTestnet ? 
        'https://testnet.binance.vision' : 
        'https://api.binance.com';
      
      console.log(`Testando conexão com: ${baseUrl} (${isTestnet ? 'TESTNET' : 'MAINNET'})`);

      const timestamp = Date.now();
      const query = `timestamp=${timestamp}`;
      const signature = crypto
        .createHmac('sha256', apiSecret)
        .update(query)
        .digest('hex');

      const url = `${baseUrl}/api/v3/account?${query}&signature=${signature}`;
      
      
      const response = await fetch(url, {
        headers: {
          'X-MBX-APIKEY': apiKey,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          message: `Conexão ${isTestnet ? 'TESTNET' : 'MAINNET'} estabelecida com sucesso!`,
          accountType: data.accountType,
          permissions: data.permissions,
          environment: isTestnet ? 'TESTNET' : 'MAINNET',
          canTrade: data.canTrade,
          canWithdraw: data.canWithdraw,
          canDeposit: data.canDeposit,
          balanceCount: data.balances ? data.balances.length : 0,
          serverTime: data.updateTime
        };
      } else {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          message: `Erro ${response.status}: ${errorData.msg || response.statusText}`
        };
      }

    } catch (error) {
      return {
        success: false,
        message: `Erro de conexão: ${error.message}`
      };
    }
  }

  // Carregar configuração
  async loadConfig() {
    try {
      const envExists = await fs.access(this.configPath).then(() => true).catch(() => false);
      
      if (envExists) {
        const envContent = await fs.readFile(this.configPath, 'utf8');
        const config = this.parseEnvContent(envContent);
        return { success: true, config };
      }

      return { success: false, message: 'Arquivo .env não encontrado' };

    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  parseEnvContent(content) {
    const config = {};
    const lines = content.split('\n');
    
    for (const line of lines) {
      if (line.trim() && !line.startsWith('#')) {
        const [key, value] = line.split('=');
        if (key && value) {
          config[key.trim()] = value.trim();
        }
      }
    }
    
    return config;
  }

  // Gerar chave de criptografia segura
  generateEncryptionKey() {
    return crypto.randomBytes(16).toString('hex');
  }

  // Validar configuração
  validateConfig(config) {
    const errors = [];
    
    if (!config.apiKey || config.apiKey.length < 20) {
      errors.push('API Key inválida');
    }
    
    if (!config.apiSecret || config.apiSecret.length < 20) {
      errors.push('API Secret inválida');
    }
    
    if (!config.encryptionKey || config.encryptionKey.length !== 32) {
      errors.push('Chave de criptografia deve ter 32 caracteres');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

module.exports = ConfigManager;