const express = require('express');
const ConfigManager = require('./config-manager');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const router = express.Router();
const configManager = new ConfigManager();

// =========================================================
// 🔹 Funções auxiliares para Deploy
// =========================================================
let botProcess = null;

function startBot() {
  if (botProcess) {
    botProcess.kill('SIGTERM');
  }
  botProcess = spawn('node', ['./bot/bot_agressivo5.mjs'], { stdio: 'inherit' });
  console.log('🚀 Bot reiniciado com sucesso');
}

function backupFile(filePath) {
  const backupDir = path.resolve('backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir);
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const base = path.basename(filePath);
  const backupName = `${base}_${timestamp}`;
  const backupPath = path.join(backupDir, backupName);

  fs.copyFileSync(filePath, backupPath);
  console.log(`📦 Backup criado: ${backupPath}`);

  return backupPath;
}

// =========================================================
// 🔹 Endpoints originais do projeto
// =========================================================

// Salvar configuração
router.post('/config/save', async (req, res) => {
  try {
    const config = req.body;
    const validation = configManager.validateConfig(config);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Configuração inválida',
        errors: validation.errors
      });
    }
    const result = await configManager.saveEncryptedConfig(config);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Testar conexão Binance
router.post('/binance/test', async (req, res) => {
  try {
    const { apiKey, apiSecret, isTestnet } = req.body;
    if (!apiKey || !apiSecret) {
      return res.status(400).json({ success: false, message: 'API Key e Secret são obrigatórios' });
    }
    const result = await configManager.testBinanceConnection(apiKey, apiSecret, isTestnet);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Carregar configuração
router.get('/config/load', async (req, res) => {
  try {
    const result = await configManager.loadConfig();
    if (result.success) {
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
    res.status(500).json({ success: false, message: error.message });
  }
});

// Gerar chave de criptografia
router.get('/config/generate-key', (req, res) => {
  try {
    const key = configManager.generateEncryptionKey();
    res.json({ success: true, encryptionKey: key });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Aplicar modo de operação
router.post('/config/apply-mode', async (req, res) => {
  try {
    const { isTestnet, isSimulation } = req.body;
    process.env.USE_TESTNET = isTestnet.toString();
    process.env.SIMULA = isSimulation.toString();

    try {
      const envPath = path.join(process.cwd(), '.env');
      let envContent = '';
      try {
        envContent = await fs.promises.readFile(envPath, 'utf8');
      } catch (e) {
        envContent = '';
      }
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
      if (!foundTestnet) updatedLines.push(`USE_TESTNET=${isTestnet}`);
      if (!foundSimula) updatedLines.push(`SIMULA=${isSimulation}`);

      await fs.promises.writeFile(envPath, updatedLines.join('\n'));
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
    res.status(500).json({ success: false, message: error.message });
  }
});

// =========================================================
// 🔹 Novo endpoint: Implementar Agora
// =========================================================
router.post('/deploy', (req, res) => {
  const { tipo, variaveis, arquivo, patch } = req.body;

  try {
    if (tipo === 'parametro') {
      const envPath = path.resolve('.env');
      let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf-8') : '';
      for (const [k, v] of Object.entries(variaveis)) {
        const regex = new RegExp(`^${k}=.*$`, 'm');
        if (regex.test(envContent)) {
          envContent = envContent.replace(regex, `${k}=${v}`);
        } else {
          envContent += `\n${k}=${v}`;
        }
      }
      fs.writeFileSync(envPath, envContent);
      startBot();
      return res.json({ status: 'ok', message: 'Bot reiniciado com novos parâmetros' });
    }

    if (tipo === 'codigo') {
      const targetFile = path.resolve(arquivo);
      if (!fs.existsSync(targetFile)) {
        return res.status(404).json({ status: 'erro', message: 'Arquivo não encontrado' });
      }
      backupFile(targetFile);
      fs.writeFileSync(targetFile, patch, 'utf-8');
      startBot();
      return res.json({ status: 'ok', message: 'Bot atualizado, backup salvo e reiniciado' });
    }

    return res.status(400).json({ status: 'erro', message: 'Tipo inválido' });
  } catch (err) {
    console.error('❌ Erro em /deploy:', err);
    return res.status(500).json({ status: 'erro', message: 'Falha ao implementar' });
  }
});

module.exports = router;
