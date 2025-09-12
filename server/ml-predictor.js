// Sistema de Machine Learning para Previsão de Preços
import * as tf from '@tensorflow/tfjs-node';
import fs from 'fs/promises';
import path from 'path';

class MLPredictor {
  constructor() {
    this.model = null;
    this.isTraining = false;
    this.predictions = new Map();
    this.trainingData = [];
    this.features = ['price', 'volume', 'rsi', 'macd', 'bb_upper', 'bb_lower', 'atr'];
  }

  async initializeModel() {
    try {
      // Tentar carregar modelo existente
      const modelPath = path.join(process.cwd(), 'models', 'price-predictor');
      
      try {
        this.model = await tf.loadLayersModel(`file://${modelPath}/model.json`);
        console.log('✅ Modelo ML carregado com sucesso');
        return true;
      } catch (loadError) {
        console.log('📦 Criando novo modelo ML...');
        return await this.createNewModel();
      }
    } catch (error) {
      console.error('❌ Erro ao inicializar modelo ML:', error);
      return false;
    }
  }

  async createNewModel() {
    try {
      // Arquitetura LSTM para séries temporais
      this.model = tf.sequential({
        layers: [
          tf.layers.lstm({
            units: 128,
            returnSequences: true,
            inputShape: [60, this.features.length] // 60 períodos, 7 features
          }),
          tf.layers.dropout({ rate: 0.2 }),
          tf.layers.lstm({
            units: 64,
            returnSequences: false
          }),
          tf.layers.dropout({ rate: 0.2 }),
          tf.layers.dense({ units: 32, activation: 'relu' }),
          tf.layers.dense({ units: 16, activation: 'relu' }),
          tf.layers.dense({ units: 1, activation: 'linear' }) // Previsão de preço
        ]
      });

      this.model.compile({
        optimizer: tf.train.adam(0.001),
        loss: 'meanSquaredError',
        metrics: ['mae']
      });

      console.log('✅ Novo modelo ML criado');
      return true;
    } catch (error) {
      console.error('❌ Erro ao criar modelo:', error);
      return false;
    }
  }

  async collectTrainingData(symbol, marketData) {
    try {
      const dataPoint = {
        timestamp: Date.now(),
        symbol,
        price: marketData.price,
        volume: marketData.volume24h,
        rsi: marketData.rsi,
        macd: marketData.macd.histogram,
        bb_upper: marketData.bb?.upper || marketData.price * 1.02,
        bb_lower: marketData.bb?.lower || marketData.price * 0.98,
        atr: marketData.atr
      };

      this.trainingData.push(dataPoint);

      // Manter apenas últimos 10000 pontos
      if (this.trainingData.length > 10000) {
        this.trainingData.shift();
      }

      // Salvar dados periodicamente
      if (this.trainingData.length % 100 === 0) {
        await this.saveTrainingData();
      }
    } catch (error) {
      console.error('❌ Erro ao coletar dados de treino:', error);
    }
  }

  async trainModel() {
    if (this.isTraining || this.trainingData.length < 1000) {
      return false;
    }

    this.isTraining = true;
    console.log('🧠 Iniciando treinamento do modelo ML...');

    try {
      const sequences = this.prepareSequences();
      
      if (sequences.length < 100) {
        console.log('⚠️ Dados insuficientes para treinamento');
        this.isTraining = false;
        return false;
      }

      const { xs, ys } = this.createTensors(sequences);

      await this.model.fit(xs, ys, {
        epochs: 50,
        batchSize: 32,
        validationSplit: 0.2,
        shuffle: true,
        callbacks: {
          onEpochEnd: (epoch, logs) => {
            if (epoch % 10 === 0) {
              console.log(`Época ${epoch}: loss=${logs.loss.toFixed(4)}, val_loss=${logs.val_loss.toFixed(4)}`);
            }
          }
        }
      });

      // Salvar modelo
      await this.saveModel();
      
      console.log('✅ Modelo ML treinado com sucesso');
      this.isTraining = false;
      return true;
    } catch (error) {
      console.error('❌ Erro no treinamento:', error);
      this.isTraining = false;
      return false;
    }
  }

  prepareSequences() {
    const sequences = [];
    const sequenceLength = 60;

    for (let i = sequenceLength; i < this.trainingData.length; i++) {
      const sequence = this.trainingData.slice(i - sequenceLength, i);
      const target = this.trainingData[i].price;

      const features = sequence.map(point => [
        this.normalize(point.price, 'price'),
        this.normalize(point.volume, 'volume'),
        this.normalize(point.rsi, 'rsi'),
        this.normalize(point.macd, 'macd'),
        this.normalize(point.bb_upper, 'price'),
        this.normalize(point.bb_lower, 'price'),
        this.normalize(point.atr, 'atr')
      ]);

      sequences.push({ features, target });
    }

    return sequences;
  }

  normalize(value, type) {
    const ranges = {
      price: { min: 0, max: 100000 },
      volume: { min: 0, max: 1000000000 },
      rsi: { min: 0, max: 100 },
      macd: { min: -1000, max: 1000 },
      atr: { min: 0, max: 1000 }
    };

    const range = ranges[type] || { min: 0, max: 1 };
    return (value - range.min) / (range.max - range.min);
  }

  createTensors(sequences) {
    const xs = sequences.map(seq => seq.features);
    const ys = sequences.map(seq => seq.target);

    return {
      xs: tf.tensor3d(xs),
      ys: tf.tensor2d(ys, [ys.length, 1])
    };
  }

  async predict(symbol, currentData) {
    if (!this.model || this.isTraining) {
      return null;
    }

    try {
      const sequence = this.prepareCurrentSequence(symbol, currentData);
      if (!sequence) return null;

      const prediction = this.model.predict(tf.tensor3d([sequence]));
      const result = await prediction.data();
      
      const predictedPrice = result[0];
      const confidence = this.calculateConfidence(currentData, predictedPrice);

      this.predictions.set(symbol, {
        price: predictedPrice,
        confidence,
        timestamp: Date.now(),
        currentPrice: currentData.price
      });

      return {
        predictedPrice,
        confidence,
        direction: predictedPrice > currentData.price ? 'UP' : 'DOWN',
        change: ((predictedPrice - currentData.price) / currentData.price) * 100
      };
    } catch (error) {
      console.error(`❌ Erro na previsão para ${symbol}:`, error);
      return null;
    }
  }

  prepareCurrentSequence(symbol, currentData) {
    const symbolData = this.trainingData.filter(d => d.symbol === symbol);
    if (symbolData.length < 60) return null;

    const recent = symbolData.slice(-60);
    return recent.map(point => [
      this.normalize(point.price, 'price'),
      this.normalize(point.volume, 'volume'),
      this.normalize(point.rsi, 'rsi'),
      this.normalize(point.macd, 'macd'),
      this.normalize(point.bb_upper, 'price'),
      this.normalize(point.bb_lower, 'price'),
      this.normalize(point.atr, 'atr')
    ]);
  }

  calculateConfidence(currentData, predictedPrice) {
    const priceChange = Math.abs(predictedPrice - currentData.price) / currentData.price;
    const volatility = currentData.atr / currentData.price;
    
    // Confiança baseada na volatilidade e magnitude da previsão
    let confidence = Math.max(0.1, 1 - (priceChange / volatility));
    return Math.min(0.95, confidence);
  }

  async saveModel() {
    try {
      const modelDir = path.join(process.cwd(), 'models', 'price-predictor');
      await fs.mkdir(modelDir, { recursive: true });
      await this.model.save(`file://${modelDir}`);
      console.log('💾 Modelo ML salvo');
    } catch (error) {
      console.error('❌ Erro ao salvar modelo:', error);
    }
  }

  async saveTrainingData() {
    try {
      const dataPath = path.join(process.cwd(), 'data', 'training-data.json');
      await fs.mkdir(path.dirname(dataPath), { recursive: true });
      await fs.writeFile(dataPath, JSON.stringify(this.trainingData, null, 2));
    } catch (error) {
      console.error('❌ Erro ao salvar dados de treino:', error);
    }
  }

  getModelStats() {
    return {
      isTraining: this.isTraining,
      dataPoints: this.trainingData.length,
      predictions: this.predictions.size,
      lastTraining: this.lastTraining || null,
      modelLoaded: !!this.model
    };
  }
}

export default MLPredictor;