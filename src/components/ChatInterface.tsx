import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Zap, Brain } from 'lucide-react';

interface Message {
  id: string;
  type: 'user' | 'chatgpt' | 'deepseek' | 'consensus';
  content: string;
  timestamp: Date;
}

const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'consensus',
      content: 'Sistema de IA iniciado. ChatGPT e DeepSeek prontos para análise colaborativa do bot de trading.',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const simulateAIResponse = async (userMessage: string) => {
    setIsProcessing(true);
    
    // Simular resposta do ChatGPT
    setTimeout(() => {
      const chatGPTResponse: Message = {
        id: Date.now().toString() + '_gpt',
        type: 'chatgpt',
        content: `[ChatGPT] Analisando "${userMessage}": Recomendo implementar stop-loss dinâmico baseado em volatilidade ATR. Para BTCUSDT, sugiro RSI < 30 para compra e RSI > 70 para venda, com confirmação de volume acima da média de 20 períodos.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, chatGPTResponse]);
    }, 1000);

    // Simular resposta do DeepSeek
    setTimeout(() => {
      const deepSeekResponse: Message = {
        id: Date.now().toString() + '_ds',
        type: 'deepseek',
        content: `[DeepSeek] Concordo parcialmente. Adiciono: usar Bollinger Bands para identificar breakouts. Para múltiplos pares, implementar correlação entre BTCUSDT e altcoins. Sugestão de take-profit escalonado: 50% em 1.5% e 50% em 3% de lucro.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, deepSeekResponse]);
    }, 2000);

    // Simular consenso
    setTimeout(() => {
      const consensusResponse: Message = {
        id: Date.now().toString() + '_consensus',
        type: 'consensus',
        content: `[CONSENSO] ✅ Implementar: Stop-loss ATR dinâmico + RSI + Volume + Bollinger Bands. Take-profit escalonado aprovado. Aplicar correlação BTC/ALTs. Parâmetros otimizados para mercado atual.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, consensusResponse]);
      setIsProcessing(false);
    }, 3500);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    
    await simulateAIResponse(inputMessage);
  };

  const getMessageIcon = (type: string) => {
    switch (type) {
      case 'user': return <User className="w-5 h-5" />;
      case 'chatgpt': return <Bot className="w-5 h-5 text-green-400" />;
      case 'deepseek': return <Brain className="w-5 h-5 text-blue-400" />;
      case 'consensus': return <Zap className="w-5 h-5 text-purple-400" />;
      default: return <Bot className="w-5 h-5" />;
    }
  };

  const getMessageStyle = (type: string) => {
    switch (type) {
      case 'user': return 'bg-purple-500/20 border-purple-500/30 ml-12';
      case 'chatgpt': return 'bg-green-500/10 border-green-500/20 mr-12';
      case 'deepseek': return 'bg-blue-500/10 border-blue-500/20 mr-12';
      case 'consensus': return 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-500/30 mx-4';
      default: return 'bg-gray-500/10 border-gray-500/20';
    }
  };

  return (
    <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-purple-500/20 h-[600px] flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-purple-500/20">
        <h2 className="text-lg font-semibold text-white flex items-center space-x-2">
          <MessageSquare className="w-5 h-5 text-purple-400" />
          <span>Chat com IAs Colaborativas</span>
        </h2>
        <p className="text-sm text-gray-400 mt-1">
          ChatGPT e DeepSeek trabalhando juntos para otimizar seu bot
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`p-4 rounded-lg border ${getMessageStyle(message.type)}`}
          >
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 p-2 bg-white/10 rounded-lg">
                {getMessageIcon(message.type)}
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="font-medium text-white capitalize">
                    {message.type === 'user' ? 'Você' : message.type}
                  </span>
                  <span className="text-xs text-gray-400">
                    {message.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-gray-300 leading-relaxed">{message.content}</p>
              </div>
            </div>
          </div>
        ))}
        
        {isProcessing && (
          <div className="flex items-center justify-center space-x-2 text-purple-400">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-400"></div>
            <span>IAs analisando...</span>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-purple-500/20">
        <div className="flex space-x-3">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Pergunte sobre estratégias, indicadores, melhorias..."
            className="flex-1 bg-white/10 border border-purple-500/30 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-purple-400"
            disabled={isProcessing}
          />
          <button
            onClick={handleSendMessage}
            disabled={isProcessing || !inputMessage.trim()}
            className="bg-purple-500 hover:bg-purple-600 disabled:bg-gray-600 text-white p-2 rounded-lg transition-colors duration-200"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;