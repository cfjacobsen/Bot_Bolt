const express = require('express');
const ConfigManager = require('./config-manager');
const router = express.Router();

const configManager = new ConfigManager();

// Salvar configuração
router.post('/config/save', async (req, res) => {
  try {
    const config = req.body;
    
    // Validar configuração
    const validation = configManager.validateConfig(config);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Configuração inválida',
        errors: validation.errors
      });
    }

    // Salvar configuração
    const result = await configManager.saveEncryptedConfig(config);
    res.json(result);

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Testar conexão Binance
router.post('/binance/test', async (req, res) => {
  try {
    const { apiKey, apiSecret, isTestnet } = req.body;
    
    if (!apiKey || !apiSecret) {
      return res.status(400).json({
        success: false,
        message: 'API Key e Secret são obrigatórios'
      });
    }

    const result = await configManager.testBinanceConnection(apiKey, apiSecret, isTestnet);
    res.json(result);

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Carregar configuração
router.get('/config/load', async (req, res) => {
  try {
    const result = await configManager.loadConfig();
    
    if (result.success) {
      // Remover dados sensíveis antes de enviar
      const safeConfig = {
        ...result.config,
        BINANCE_API_KEY: result.config.BINANCE_API_KEY ? '***' + result.config.BINANCE_API_KEY.slice(-4) : '',
        BINANCE_API_SECRET: result.config.BINANCE_API_SECRET ? '***' + result.config.BINANCE_API_SECRET.slice(-4) : ''
      };
      
      res.json({ success: true, config: safeConfig });
    } else {
      res.json(result);
    }

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Gerar chave de criptografia
router.get('/config/generate-key', (req, res) => {
  try {
    const key = configManager.generateEncryptionKey();
    res.json({
      success: true,
      encryptionKey: key
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Aplicar modo de operação
router.post('/config/apply-mode', async (req, res) => {
  try {
    const { isTestnet, isSimulation } = req.body;
    
    // Atualizar variáveis de ambiente em tempo de execução
    process.env.USE_TESTNET = isTestnet.toString();
    process.env.SIMULA = isSimulation.toString();
    
    // Atualizar arquivo .env se existir
    try {
      const envPath = require('path').join(process.cwd(), '.env');
      const fs = require('fs').promises;
      
      let envContent = '';
      try {
        envContent = await fs.readFile(envPath, 'utf8');
      } catch (e) {
        // Arquivo não existe, criar novo
        envContent = '';
      }
      
      // Atualizar ou adicionar configurações
      const lines = envContent.split('\n');
      const updatedLines = [];
      let foundTestnet = false;
      let foundSimula = false;
      
      for (const line of lines) {
        if (line.startsWith('USE_TESTNET=')) {
          updatedLines.push(`USE_TESTNET=${isTestnet}`);
          foundTestnet = true;
        } else if (line.startsWith('SIMULA=')) {
          updatedLines.push(`SIMULA=${isSimulation}`);
          foundSimula = true;
        } else {
          updatedLines.push(line);
        }
      }
      
      // Adicionar se não encontrou
      if (!foundTestnet) updatedLines.push(`USE_TESTNET=${isTestnet}`);
      if (!foundSimula) updatedLines.push(`SIMULA=${isSimulation}`);
      
      await fs.writeFile(envPath, updatedLines.join('\n'));
      
    } catch (envError) {
      console.warn('Aviso: Não foi possível atualizar .env:', envError.message);
    }
    
    res.json({
      success: true,
      message: `Modo ${isSimulation ? 'Simulação' : isTestnet ? 'Testnet' : 'Mainnet'} aplicado com sucesso!`,
      environment: {
        isTestnet,
        isSimulation,
        baseUrl: isTestnet ? 'https://testnet.binance.vision' : 'https://api.binance.com'
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;