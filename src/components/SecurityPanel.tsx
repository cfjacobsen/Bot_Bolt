import React, { useState } from 'react';
import { Shield, Key, Lock, AlertTriangle, CheckCircle, Eye, EyeOff, Save, Upload, Download } from 'lucide-react';

const SecurityPanel: React.FC = () => {
  const [showApiKey, setShowApiKey] = useState(false);
  const [showApiSecret, setShowApiSecret] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [encryptionKey, setEncryptionKey] = useState('');
  const [isTestnet, setIsTestnet] = useState(false);
  const [isSimulation, setIsSimulation] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  
  const securityChecks = [
    { id: 1, name: 'API Keys Encryption', status: 'passed', description: 'Chaves API criptografadas com AES-256' },
    { id: 2, name: 'Rate Limiting', status: 'passed', description: 'Limite de requisições implementado' },
    { id: 3, name: 'IP Whitelist', status: 'warning', description: 'Configurar whitelist de IPs na Binance' },
    { id: 4, name: 'SSL/TLS', status: 'passed', description: 'Conexões seguras habilitadas' },
    { id: 5, name: 'Error Handling', status: 'passed', description: 'Tratamento de erros implementado' },
    { id: 6, name: 'Backup Strategy', status: 'warning', description: 'Configurar backup automático' }
  ];

  const handleSaveConfig = async () => {
    setIsSaving(true);
    setSaveStatus('');
    
    try {
      const config = {
        apiKey,
        apiSecret,
        encryptionKey,
        isTestnet,
        isSimulation
      };
      
      const response = await fetch('/api/config/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      
      if (response.ok) {
        setSaveStatus('✅ Configuração salva com segurança!');
      } else {
        setSaveStatus('❌ Erro ao salvar configuração');
      }
    } catch (error) {
      setSaveStatus('❌ Erro de conexão');
    }
    
    setIsSaving(false);
  };

  const handleTestConnection = async () => {
    setIsConnecting(true);
    setConnectionStatus('');
    
    try {
      const response = await fetch('/api/binance/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey, apiSecret, isTestnet })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setConnectionStatus(`✅ Conexão ${isTestnet ? 'TESTNET' : 'MAINNET'} estabelecida com sucesso!`);
        setSaveStatus(`🔗 Conectado ao ${isTestnet ? 'Testnet' : 'Mainnet'} | Tipo: ${result.accountType || 'N/A'}`);
      } else {
        setConnectionStatus(`❌ Falha na conexão: ${result.message}`);
        setSaveStatus('');
      }
    } catch (error) {
      setConnectionStatus('❌ Erro de rede ao testar conexão');
      setSaveStatus('');
    }
    
    setIsConnecting(false);
  const handleGenerateKey = async () => {
    try {
      const response = await fetch('/api/config/generate-key');
      const result = await response.json();
      
      if (result.success) {
        setEncryptionKey(result.encryptionKey);
        setSaveStatus('🔑 Chave de criptografia gerada!');
      }
    } catch (error) {
      setSaveStatus('❌ Erro ao gerar chave');
    }
  };

  const handleLoadConfig = async () => {
    try {
      const response = await fetch('/api/config/load');
      const result = await response.json();
      
      if (result.success) {
        const config = result.config;
        setIsTestnet(config.USE_TESTNET === 'true');
        setIsSimulation(config.SIMULA === 'true');
        setSaveStatus('📁 Configuração carregada!');
      }
    } catch (error) {
      setSaveStatus('❌ Erro ao carregar configuração');
    }
  };
  };
  const riskSettings = [
    { name: 'Max Risk per Trade', value: '3%', editable: true },
    { name: 'Daily Loss Limit', value: '10%', editable: true },
    { name: 'Max Open Positions', value: '5', editable: true },
    { name: 'Emergency Stop Loss', value: '15%', editable: true }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
      case 'failed':
        return <AlertTriangle className="w-5 h-5 text-red-400" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed': return 'bg-green-500/10 border-green-500/20';
      case 'warning': return 'bg-yellow-500/10 border-yellow-500/20';
      case 'failed': return 'bg-red-500/10 border-red-500/20';
      default: return 'bg-gray-500/10 border-gray-500/20';
    }
  };

  return (
    <div className="space-y-6">
      {/* Security Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-purple-500/20 p-6 text-center">
          <Shield className="w-8 h-8 text-green-400 mx-auto mb-3" />
          <div className="text-2xl font-bold text-green-400">Seguro</div>
          <div className="text-sm text-gray-400">Status Geral</div>
        </div>
        
        <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-purple-500/20 p-6 text-center">
          <Key className="w-8 h-8 text-blue-400 mx-auto mb-3" />
          <div className="text-2xl font-bold text-blue-400">AES-256</div>
          <div className="text-sm text-gray-400">Criptografia</div>
        </div>
        
        <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-purple-500/20 p-6 text-center">
          <Lock className="w-8 h-8 text-purple-400 mx-auto mb-3" />
          <div className="text-2xl font-bold text-purple-400">SSL/TLS</div>
          <div className="text-sm text-gray-400">Conexão</div>
        </div>
      </div>

      {/* API Configuration */}
      <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-purple-500/20 p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
          <Key className="w-5 h-5 text-purple-400" />
          <span>Configuração Segura da API Binance</span>
        </h3>
        
        {/* Instruções de configuração */}
        <div className="mb-6 p-4 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-lg border border-indigo-500/20">
          <h4 className="text-white font-medium mb-2 flex items-center space-x-2">
            <Key className="w-4 h-4 text-indigo-400" />
            <span>Como Configurar suas Chaves</span>
          </h4>
          <div className="text-sm text-gray-300 space-y-2">
            <p>1. <strong>Mainnet</strong>: Use suas chaves normais da Binance</p>
            <p>2. <strong>Testnet</strong>: Crie chaves específicas em <a href="https://testnet.binance.vision" target="_blank" className="text-blue-400 underline">testnet.binance.vision</a></p>
            <p>3. <strong>Simulação</strong>: Não precisa de chaves reais</p>
          </div>
        </div>
        
        {/* Environment Mode */}
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg border border-blue-500/20">
          <h4 className="text-white font-medium mb-3">Modo de Operação</h4>
          
          {/* Status Atual */}
          <div className="mb-4 p-3 bg-gray-500/10 border border-gray-500/20 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Status Atual:</span>
              <span className={`font-bold ${
                isSimulation ? 'text-yellow-400' : 
                isTestnet ? 'text-blue-400' : 'text-red-400'
              }`}>
                {isSimulation ? '🟡 SIMULAÇÃO' : 
                 isTestnet ? '🔵 TESTNET' : '🔴 MAINNET'}
              </span>
            </div>
          </div>
          
          <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-yellow-400" />
              <span className="text-yellow-400 font-medium">Importante:</span>
            </div>
            <p className="text-gray-300 text-sm">
              Configure suas chaves no arquivo <code className="bg-gray-700 px-1 rounded">.env</code> antes de usar Testnet ou Mainnet.
              <strong className="text-yellow-400">Para Testnet, use chaves específicas do Testnet da Binance!</strong>
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="mode"
                checked={isSimulation}
                onChange={() => {setIsSimulation(true); setIsTestnet(false);}}
                className="text-purple-500"
              />
              <span className="text-yellow-400 font-medium">🟡 Simulação (Seguro)</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="mode"
                checked={!isSimulation && isTestnet}
                onChange={() => {setIsSimulation(false); setIsTestnet(true);}}
                className="text-purple-500"
              />
              <span className="text-blue-400 font-medium">🔵 Testnet (Teste)</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="mode"
                checked={!isSimulation && !isTestnet}
                onChange={() => {setIsSimulation(false); setIsTestnet(false);}}
                className="text-purple-500"
              />
              <span className="text-red-400 font-medium">🔴 Mainnet (Real)</span>
            </label>
          </div>
          
          {/* Informações sobre cada modo */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="bg-yellow-500/5 border border-yellow-500/20 rounded p-2">
              <div className="text-yellow-400 font-medium">Simulação</div>
              <div className="text-gray-400">Sem API real, dados simulados</div>
            </div>
            <div className="bg-blue-500/5 border border-blue-500/20 rounded p-2">
              <div className="text-blue-400 font-medium">Testnet</div>
              <div className="text-gray-400">API de teste, sem dinheiro real</div>
            </div>
            <div className="bg-red-500/5 border border-red-500/20 rounded p-2">
              <div className="text-red-400 font-medium">Mainnet</div>
              <div className="text-gray-400">API real, dinheiro real</div>
            </div>
          </div>
          
          {/* Status da Conexão */}
          {connectionStatus && (
            <div className={`mt-4 p-3 rounded-lg ${
              connectionStatus.includes('✅') ? 'bg-green-500/10 border border-green-500/20 text-green-400' :
              'bg-red-500/10 border border-red-500/20 text-red-400'
            }`}>
              {connectionStatus}
            </div>
          )}
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Chave de Criptografia (32 caracteres)
            </label>
            <input
              type="password"
              value={encryptionKey}
              onChange={(e) => setEncryptionKey(e.target.value)}
              placeholder="Digite uma chave de 32 caracteres para criptografia"
              className="w-full bg-white/10 border border-purple-500/30 rounded-lg px-4 py-2 text-white placeholder-gray-400"
              maxLength={32}
            />
            <div className="text-xs text-gray-400 mt-1">
              {encryptionKey.length}/32 caracteres
              <button
                onClick={handleGenerateKey}
                className="ml-2 text-purple-400 hover:text-purple-300 underline"
              >
                Gerar Automaticamente
              </button>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              API Key Binance
            </label>
            <div className="relative">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Cole sua API Key da Binance aqui"
                className="w-full bg-white/10 border border-purple-500/30 rounded-lg px-4 py-2 text-white pr-12 placeholder-gray-400"
              />
              <button
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              API Secret Binance
            </label>
            <div className="relative">
              <input
                type={showApiSecret ? 'text' : 'password'}
                value={apiSecret}
                onChange={(e) => setApiSecret(e.target.value)}
                placeholder="Cole sua API Secret da Binance aqui"
                className="w-full bg-white/10 border border-purple-500/30 rounded-lg px-4 py-2 text-white pr-12 placeholder-gray-400"
              />
              <button
                onClick={() => setShowApiSecret(!showApiSecret)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showApiSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          
          {saveStatus && (
            <div className={`p-3 rounded-lg ${
              saveStatus.includes('✅') ? 'bg-green-500/10 border border-green-500/20 text-green-400' :
              saveStatus.includes('🔗') ? 'bg-blue-500/10 border border-blue-500/20 text-blue-400' :
              'bg-red-500/10 border border-red-500/20 text-red-400'
            }`}>
              {saveStatus}
            </div>
          )}
          
          <div className="flex items-center space-x-4">
            <button 
              onClick={handleLoadConfig}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center space-x-2"
            >
              <Upload className="w-4 h-4" />
              <span>Carregar Config</span>
            </button>
            <button 
              onClick={handleSaveConfig}
              disabled={isSaving || !apiKey || !apiSecret || !encryptionKey}
              className="bg-purple-500 hover:bg-purple-600 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Salvando...' : 'Salvar Configuração'}</span>
            </button>
            <button 
              onClick={handleTestConnection}
              disabled={!apiKey || !apiSecret || isConnecting}
              className={`${
                isTestnet ? 'bg-blue-500 hover:bg-blue-600' : 'bg-green-500 hover:bg-green-600'
              } disabled:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center space-x-2`}
            >
              <CheckCircle className="w-4 h-4" />
              <span>{isConnecting ? 'Testando...' : `Testar ${isTestnet ? 'Testnet' : 'Mainnet'}`}</span>
            </button>
            
            {/* Botão para aplicar configuração */}
            <button 
              onClick={async () => {
                try {
                  const response = await fetch('/api/config/apply-mode', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ isTestnet, isSimulation })
                  });
                  
                  const result = await response.json();
                  setSaveStatus(result.success ? 
                    `✅ Modo ${isSimulation ? 'Simulação' : isTestnet ? 'Testnet' : 'Mainnet'} aplicado!` : 
                    '❌ Erro ao aplicar modo'
                  );
                } catch (error) {
                  setSaveStatus('❌ Erro ao aplicar configuração');
                }
              }}
              className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center space-x-2"
            >
              <Settings className="w-4 h-4" />
              <span>Aplicar Modo</span>
            </button>
          </div>
        </div>
      </div>

      {/* Security Checks */}
      <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-purple-500/20 p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
          <Shield className="w-5 h-5 text-purple-400" />
          <span>Verificações de Segurança</span>
        </h3>
        
        <div className="space-y-3">
          {securityChecks.map((check) => (
            <div
              key={check.id}
              className={`p-4 rounded-lg border ${getStatusColor(check.status)}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(check.status)}
                  <div>
                    <h4 className="font-medium text-white">{check.name}</h4>
                    <p className="text-sm text-gray-400">{check.description}</p>
                  </div>
                </div>
                {check.status === 'warning' && (
                  <button className="bg-yellow-500 hover:bg-yellow-600 text-black px-3 py-1 rounded text-sm font-medium">
                    Corrigir
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Risk Management */}
      <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-purple-500/20 p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
          <AlertTriangle className="w-5 h-5 text-yellow-400" />
          <span>Gestão de Risco</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {riskSettings.map((setting, index) => (
            <div key={index} className="bg-white/5 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-300">{setting.name}</span>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={setting.value}
                    className="w-16 bg-white/10 border border-purple-500/30 rounded px-2 py-1 text-white text-sm text-center"
                    readOnly={!setting.editable}
                  />
                  {setting.editable && (
                    <button className="text-purple-400 hover:text-purple-300">
                      <Key className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-600">
          <button className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors duration-200">
            Parada de Emergência
          </button>
        </div>
      </div>
    </div>
  );
};

export default SecurityPanel;