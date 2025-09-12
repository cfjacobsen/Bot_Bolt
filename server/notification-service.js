// Sistema de Notificações Push/Email
import nodemailer from 'nodemailer';
import webpush from 'web-push';

class NotificationService {
  constructor() {
    this.emailTransporter = null;
    this.pushSubscriptions = new Set();
    this.alertThresholds = {
      profit: 0.5, // 0.5% de lucro
      loss: -0.3,  // 0.3% de perda
      volume: 2.0, // Volume 2x acima da média
      volatility: 0.05 // 5% de volatilidade
    };
    
    this.setupEmail();
    this.setupPush();
  }

  setupEmail() {
    try {
      this.emailTransporter = nodemailer.createTransporter({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });
      
      console.log('📧 Serviço de email configurado');
    } catch (error) {
      console.error('❌ Erro ao configurar email:', error);
    }
  }

  setupPush() {
    try {
      webpush.setVapidDetails(
        'mailto:' + (process.env.EMAIL_USER || 'bot@trading.com'),
        process.env.VAPID_PUBLIC_KEY || this.generateVapidKeys().publicKey,
        process.env.VAPID_PRIVATE_KEY || this.generateVapidKeys().privateKey
      );
      
      console.log('📱 Serviço de push configurado');
    } catch (error) {
      console.error('❌ Erro ao configurar push:', error);
    }
  }

  generateVapidKeys() {
    // Gerar chaves VAPID para push notifications
    return {
      publicKey: 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U',
      privateKey: 'UUxI4O8-FbGEJowekiBI2RchQfWCqhOdOLwz5aOhwH0'
    };
  }

  async sendEmail(to, subject, html) {
    if (!this.emailTransporter) {
      console.log('📧 Email não configurado - simulando envio');
      console.log(`Para: ${to} | Assunto: ${subject}`);
      return;
    }

    try {
      await this.emailTransporter.sendMail({
        from: process.env.EMAIL_USER,
        to,
        subject,
        html
      });
      
      console.log(`📧 Email enviado para ${to}: ${subject}`);
    } catch (error) {
      console.error('❌ Erro ao enviar email:', error);
    }
  }

  async sendPushNotification(title, body, data = {}) {
    if (this.pushSubscriptions.size === 0) {
      console.log('📱 Push não configurado - simulando notificação');
      console.log(`${title}: ${body}`);
      return;
    }

    const payload = JSON.stringify({
      title,
      body,
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      data
    });

    const promises = Array.from(this.pushSubscriptions).map(subscription => {
      return webpush.sendNotification(subscription, payload)
        .catch(error => {
          console.error('❌ Erro ao enviar push:', error);
          // Remover subscription inválida
          this.pushSubscriptions.delete(subscription);
        });
    });

    await Promise.all(promises);
  }

  async notifyTrade(symbol, type, price, quantity, profit) {
    const profitPercent = (profit / (price * quantity)) * 100;
    const emoji = type === 'BUY' ? '🟢' : '🔴';
    const profitEmoji = profit > 0 ? '💰' : '📉';
    
    const title = `${emoji} Trade Executado - ${symbol}`;
    const body = `${type}: ${quantity.toFixed(6)} @ $${price.toFixed(2)} ${profitEmoji} ${profitPercent.toFixed(2)}%`;
    
    // Push notification
    await this.sendPushNotification(title, body, {
      symbol,
      type,
      price,
      quantity,
      profit
    });
    
    // Email para trades importantes
    if (Math.abs(profitPercent) > 1) {
      const html = `
        <h2>${title}</h2>
        <p><strong>Tipo:</strong> ${type}</p>
        <p><strong>Quantidade:</strong> ${quantity.toFixed(6)}</p>
        <p><strong>Preço:</strong> $${price.toFixed(2)}</p>
        <p><strong>Lucro:</strong> ${profitEmoji} $${profit.toFixed(2)} (${profitPercent.toFixed(2)}%)</p>
        <p><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
      `;
      
      await this.sendEmail(
        process.env.NOTIFICATION_EMAIL || 'trader@example.com',
        title,
        html
      );
    }
  }

  async notifyAlert(type, symbol, message, severity = 'INFO') {
    const severityEmojis = {
      INFO: 'ℹ️',
      WARNING: '⚠️',
      ERROR: '❌',
      CRITICAL: '🚨'
    };
    
    const emoji = severityEmojis[severity] || 'ℹ️';
    const title = `${emoji} ${type} - ${symbol}`;
    
    await this.sendPushNotification(title, message, {
      type,
      symbol,
      severity,
      timestamp: Date.now()
    });
    
    // Email para alertas críticos
    if (severity === 'CRITICAL' || severity === 'ERROR') {
      const html = `
        <h2 style="color: red;">${title}</h2>
        <p><strong>Mensagem:</strong> ${message}</p>
        <p><strong>Severidade:</strong> ${severity}</p>
        <p><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
        <hr>
        <p><em>Sistema de Trading Bot - Alerta Automático</em></p>
      `;
      
      await this.sendEmail(
        process.env.NOTIFICATION_EMAIL || 'trader@example.com',
        `🚨 ALERTA CRÍTICO - ${symbol}`,
        html
      );
    }
  }

  async notifyDailyReport(symbols, metrics) {
    const totalProfit = Object.values(metrics).reduce((sum, m) => sum + m.dailyProfit, 0);
    const totalTrades = Object.values(metrics).reduce((sum, m) => sum + m.trades, 0);
    const avgSuccessRate = Object.values(metrics).reduce((sum, m) => sum + m.successRate, 0) / symbols.length;
    
    const title = `📊 Relatório Diário - ${totalProfit >= 0 ? '💰' : '📉'} ${totalProfit.toFixed(2)}%`;
    const body = `${totalTrades} trades | ${avgSuccessRate.toFixed(1)}% sucesso`;
    
    await this.sendPushNotification(title, body, {
      type: 'DAILY_REPORT',
      totalProfit,
      totalTrades,
      avgSuccessRate
    });
    
    // Email detalhado
    let html = `
      <h1>📊 Relatório Diário de Trading</h1>
      <h2>Resumo Geral</h2>
      <ul>
        <li><strong>Lucro Total:</strong> ${totalProfit.toFixed(3)}%</li>
        <li><strong>Total de Trades:</strong> ${totalTrades}</li>
        <li><strong>Taxa de Sucesso Média:</strong> ${avgSuccessRate.toFixed(1)}%</li>
      </ul>
      
      <h2>Detalhes por Par</h2>
      <table border="1" style="border-collapse: collapse; width: 100%;">
        <tr>
          <th>Par</th>
          <th>Lucro Diário</th>
          <th>Trades</th>
          <th>Taxa Sucesso</th>
        </tr>
    `;
    
    for (const [symbol, metric] of Object.entries(metrics)) {
      html += `
        <tr>
          <td>${symbol}</td>
          <td>${metric.dailyProfit.toFixed(3)}%</td>
          <td>${metric.trades}</td>
          <td>${metric.successRate.toFixed(1)}%</td>
        </tr>
      `;
    }
    
    html += `
      </table>
      <hr>
      <p><em>Gerado automaticamente pelo Sistema de Trading Bot</em></p>
    `;
    
    await this.sendEmail(
      process.env.NOTIFICATION_EMAIL || 'trader@example.com',
      title,
      html
    );
  }

  subscribeToPush(subscription) {
    this.pushSubscriptions.add(subscription);
    console.log('📱 Nova subscription de push adicionada');
  }

  unsubscribeFromPush(subscription) {
    this.pushSubscriptions.delete(subscription);
    console.log('📱 Subscription de push removida');
  }

  updateAlertThresholds(newThresholds) {
    this.alertThresholds = { ...this.alertThresholds, ...newThresholds };
    console.log('🔔 Thresholds de alerta atualizados:', this.alertThresholds);
  }

  shouldAlert(type, value) {
    const threshold = this.alertThresholds[type];
    if (!threshold) return false;
    
    switch (type) {
      case 'profit':
        return value >= threshold;
      case 'loss':
        return value <= threshold;
      case 'volume':
      case 'volatility':
        return value >= threshold;
      default:
        return false;
    }
  }
}

export default NotificationService;