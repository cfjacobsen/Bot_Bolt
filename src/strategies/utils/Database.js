const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class Database {
  constructor() {
    this.db = null;
  }
  
  async connect() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(path.join(__dirname, '../data/bots.db'), (err) => {
        if (err) {
          reject(err);
        } else {
          this.initializeTables().then(resolve).catch(reject);
        }
      });
    });
  }
  
  // ... implementação completa da classe Database
}

module.exports = Database;