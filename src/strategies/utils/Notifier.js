class Notifier {
  constructor() {
    this.emailEnabled = process.env.EMAIL_NOTIFICATIONS === 'true';
    this.pushEnabled = process.env.PUSH_NOTIFICATIONS === 'true';
  }
  
  // ... implementação completa da classe Notifier
}

module.exports = Notifier;