const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs-extra');

class Database {
  constructor() {
    this.dbPath = path.join(__dirname, '..', '..', 'database', 'invoices.db');
    this.db = null;
  }

  async initialize() {
    try {
      // Ensure database directory exists
      const dbDir = path.dirname(this.dbPath);
      await fs.ensureDir(dbDir);

      // Initialize database connection
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          console.error('Error opening database:', err.message);
          throw err;
        }
        console.log('Connected to SQLite database.');
      });

      // Create tables
      await this.createTables();
      console.log('Database tables created/verified.');

    } catch (error) {
      console.error('Database initialization error:', error);
      throw error;
    }
  }

  createTables() {
    return new Promise((resolve, reject) => {
      const queries = [
        // Business settings table
        `CREATE TABLE IF NOT EXISTS business_settings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          address TEXT,
          city TEXT,
          state TEXT,
          postal_code TEXT,
          phone TEXT,
          email TEXT,
          website TEXT,
          abn TEXT,
          logo_path TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,

        // Templates table
        `CREATE TABLE IF NOT EXISTS templates (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE,
          type TEXT NOT NULL,
          content TEXT NOT NULL,
          is_active BOOLEAN DEFAULT 1,
          version INTEGER DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,

        // Invoice history table
        `CREATE TABLE IF NOT EXISTS invoice_history (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          invoice_number TEXT NOT NULL,
          template_type TEXT NOT NULL,
          customer_name TEXT NOT NULL,
          customer_email TEXT,
          total_amount DECIMAL(10,2),
          currency TEXT DEFAULT '$',
          status TEXT DEFAULT 'generated',
          pdf_path TEXT,
          data_json TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,

        // Settings table for app configuration
        `CREATE TABLE IF NOT EXISTS app_settings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          setting_key TEXT NOT NULL UNIQUE,
          setting_value TEXT,
          description TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`
      ];

      let completed = 0;
      const total = queries.length;

      queries.forEach((query, index) => {
        this.db.run(query, (err) => {
          if (err) {
            console.error(`Error creating table ${index + 1}:`, err.message);
            return reject(err);
          }

          completed++;
          if (completed === total) {
            // Insert default data if tables are empty
            this.insertDefaultData()
              .then(() => resolve())
              .catch(reject);
          }
        });
      });
    });
  }

  async insertDefaultData() {
    return new Promise((resolve, reject) => {
      // Check if business settings exist
      this.db.get('SELECT COUNT(*) as count FROM business_settings', (err, row) => {
        if (err) {
          console.error('Error checking business settings:', err);
          return reject(err);
        }

        if (row.count === 0) {
          // Insert default business settings
          const defaultBusiness = {
            name: 'Your Business Name',
            address: '123 Business Street',
            city: 'Business City',
            state: 'State',
            postal_code: '12345',
            phone: '+1 (555) 123-4567',
            email: 'info@yourbusiness.com',
            website: 'www.yourbusiness.com',
            abn: ''
          };

          const insertQuery = `
            INSERT INTO business_settings (name, address, city, state, postal_code, phone, email, website, abn)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `;

          this.db.run(insertQuery, [
            defaultBusiness.name,
            defaultBusiness.address,
            defaultBusiness.city,
            defaultBusiness.state,
            defaultBusiness.postal_code,
            defaultBusiness.phone,
            defaultBusiness.email,
            defaultBusiness.website,
            defaultBusiness.abn
          ], (err) => {
            if (err) {
              console.error('Error inserting default business settings:', err);
              return reject(err);
            }
            console.log('Default business settings inserted.');
            resolve();
          });
        } else {
          resolve();
        }
      });
    });
  }

  // Business settings methods
  async getBusinessSettings() {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT * FROM business_settings ORDER BY id DESC LIMIT 1', (err, row) => {
        if (err) {
          return reject(err);
        }
        resolve(row);
      });
    });
  }

  async updateBusinessSettings(settings) {
    return new Promise((resolve, reject) => {
      const updateQuery = `
        UPDATE business_settings 
        SET name = ?, address = ?, city = ?, state = ?, postal_code = ?, 
            phone = ?, email = ?, website = ?, abn = ?, logo_path = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = 1
      `;

      this.db.run(updateQuery, [
        settings.name,
        settings.address,
        settings.city,
        settings.state,
        settings.postal_code,
        settings.phone,
        settings.email,
        settings.website,
        settings.abn,
        settings.logo_path
      ], function(err) {
        if (err) {
          return reject(err);
        }
        resolve({ changes: this.changes });
      });
    });
  }

  // Invoice history methods
  async saveInvoiceRecord(invoiceData) {
    return new Promise((resolve, reject) => {
      const insertQuery = `
        INSERT INTO invoice_history 
        (invoice_number, template_type, customer_name, customer_email, total_amount, currency, data_json)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;

      this.db.run(insertQuery, [
        invoiceData.invoiceNumber,
        invoiceData.templateType,
        invoiceData.customer.name,
        invoiceData.customer.email,
        invoiceData.total,
        invoiceData.currency || '$',
        JSON.stringify(invoiceData)
      ], function(err) {
        if (err) {
          return reject(err);
        }
        resolve({ id: this.lastID, changes: this.changes });
      });
    });
  }

  async getInvoiceHistory(limit = 50, offset = 0) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT * FROM invoice_history 
        ORDER BY created_at DESC 
        LIMIT ? OFFSET ?
      `;

      this.db.all(query, [limit, offset], (err, rows) => {
        if (err) {
          return reject(err);
        }
        resolve(rows);
      });
    });
  }

  async getInvoiceById(id) {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT * FROM invoice_history WHERE id = ?', [id], (err, row) => {
        if (err) {
          return reject(err);
        }
        if (row && row.data_json) {
          row.data_json = JSON.parse(row.data_json);
        }
        resolve(row);
      });
    });
  }

  // App settings methods
  async getSetting(key) {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT setting_value FROM app_settings WHERE setting_key = ?', [key], (err, row) => {
        if (err) {
          return reject(err);
        }
        resolve(row ? row.setting_value : null);
      });
    });
  }

  async setSetting(key, value, description = null) {
    return new Promise((resolve, reject) => {
      const upsertQuery = `
        INSERT OR REPLACE INTO app_settings (setting_key, setting_value, description, updated_at)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      `;

      this.db.run(upsertQuery, [key, value, description], function(err) {
        if (err) {
          return reject(err);
        }
        resolve({ changes: this.changes });
      });
    });
  }

  // Close database connection
  async close() {
    return new Promise((resolve, reject) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) {
            console.error('Error closing database:', err.message);
            return reject(err);
          }
          console.log('Database connection closed.');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  // Get database instance for raw queries if needed
  getDB() {
    return this.db;
  }
}

// Export singleton instance
const database = new Database();
module.exports = database;