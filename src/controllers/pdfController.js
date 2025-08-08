const puppeteer = require('puppeteer');
const handlebars = require('handlebars');
const fs = require('fs-extra');
const path = require('path');
const moment = require('moment');

class PDFController {
  constructor() {
    this.registerHelpers();
  }

  registerHelpers() {
    // Register Handlebars helpers
    handlebars.registerHelper('formatDate', (date, format) => {
      return moment(date).format(format || 'DD/MM/YYYY');
    });

    handlebars.registerHelper('formatCurrency', (amount, currency) => {
      const numericAmount = Number.isFinite(amount) ? Number(amount) : parseFloat(amount || 0);
      const symbol = currency || '₪';
      try {
        if (symbol === '₪' || symbol === 'ILS') {
          // Proper Hebrew/IL formatting with currency
          return new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS' }).format(numericAmount);
        }
        // Generic fallback keeps provided symbol
        return `${symbol}${numericAmount.toFixed(2)}`;
      } catch {
        return `${symbol}${numericAmount.toFixed(2)}`;
      }
    });

    handlebars.registerHelper('multiply', (a, b) => {
      return (parseFloat(a || 0) * parseFloat(b || 0)).toFixed(2);
    });

    handlebars.registerHelper('add', (a, b) => {
      return (parseFloat(a || 0) + parseFloat(b || 0)).toFixed(2);
    });

    handlebars.registerHelper('eq', (a, b) => {
      return a === b;
    });

    handlebars.registerHelper('ifCond', function (v1, operator, v2, options) {
      switch (operator) {
        case '==':
          return (v1 == v2) ? options.fn(this) : options.inverse(this);
        case '===':
          return (v1 === v2) ? options.fn(this) : options.inverse(this);
        case '!=':
          return (v1 != v2) ? options.fn(this) : options.inverse(this);
        case '!==':
          return (v1 !== v2) ? options.fn(this) : options.inverse(this);
        case '<':
          return (v1 < v2) ? options.fn(this) : options.inverse(this);
        case '<=':
          return (v1 <= v2) ? options.fn(this) : options.inverse(this);
        case '>':
          return (v1 > v2) ? options.fn(this) : options.inverse(this);
        case '>=':
          return (v1 >= v2) ? options.fn(this) : options.inverse(this);
        default:
          return options.inverse(this);
      }
    });
  }

  async generatePDF(templateType, data) {
    try {
      // Load template
      const templatePath = path.join(__dirname, '..', 'templates', `${templateType}.hbs`);
      
      if (!await fs.pathExists(templatePath)) {
        throw new Error(`Template not found: ${templateType}`);
      }

      const templateContent = await fs.readFile(templatePath, 'utf8');
      const template = handlebars.compile(templateContent);

      // Prepare data with defaults
      const templateData = this.prepareTemplateData(data);

      // Render HTML
      const html = template(templateData);

      // Generate PDF using Puppeteer with environment variable support
      const isWindows = process.platform === 'win32';
      const puppeteerArgs = process.env.PUPPETEER_ARGS 
        ? process.env.PUPPETEER_ARGS.split(',')
        : (isWindows ? [] : ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']);
      
      const launchOptions = {
        headless: process.env.PUPPETEER_HEADLESS !== 'false',
        args: puppeteerArgs,
        ...(process.env.PUPPETEER_EXECUTABLE_PATH && { 
          executablePath: process.env.PUPPETEER_EXECUTABLE_PATH 
        })
      };

      const browser = await puppeteer.launch(launchOptions);

      const page = await browser.newPage();
      
      // Set content and wait for load
      await page.setContent(html, { 
        waitUntil: ['load', 'networkidle0'],
        timeout: 30000
      });

      // Generate PDF
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20px',
          right: '20px',
          bottom: '20px',
          left: '20px'
        }
      });

      await browser.close();

      return pdfBuffer;

    } catch (error) {
      console.error('שגיאה ביצירת PDF:', error);
      throw new Error(`יצירת ה-PDF נכשלה: ${error.message}`);
    }
  }

  prepareTemplateData(data) {
    // Set default values and ensure required fields exist
    const defaultData = {
      // Invoice/Receipt information
      invoiceNumber: data.invoiceNumber || `INV-${Date.now()}`,
      invoiceDate: data.invoiceDate || moment().format('YYYY-MM-DD'),
      dueDate: data.dueDate || moment().add(30, 'days').format('YYYY-MM-DD'),
      
      // Business information
      business: {
        name: data.business?.name || 'Your Business Name',
        address: data.business?.address || '123 Business Street',
        city: data.business?.city || 'Business City',
        state: data.business?.state || 'State',
        postalCode: data.business?.postalCode || '12345',
        phone: data.business?.phone || '+1 (555) 123-4567',
        email: data.business?.email || 'info@yourbusiness.com',
        website: data.business?.website || 'www.yourbusiness.com',
        abn: data.business?.abn || '',
        logo: data.business?.logo || null
      },
      
      // Customer information
      customer: {
        name: data.customer?.name || 'Customer Name',
        address: data.customer?.address || '456 Customer Street',
        city: data.customer?.city || 'Customer City',
        state: data.customer?.state || 'State',
        postalCode: data.customer?.postalCode || '67890',
        email: data.customer?.email || 'customer@email.com',
        phone: data.customer?.phone || '+1 (555) 987-6543'
      },
      
      // Items
      items: data.items || [
        {
          description: 'Sample Item',
          quantity: 1,
          rate: 100.00,
          amount: 100.00
        }
      ],
      
      // Financial totals
      subtotal: data.subtotal || 0,
      taxRate: data.taxRate || 0,
      taxAmount: data.taxAmount || 0,
      total: data.total || 0,
      
      // Payment information
      paymentTerms: data.paymentTerms || '30 days',
      paymentMethod: data.paymentMethod || 'Bank Transfer',
      
      // Notes
      notes: data.notes || '',
      
      // Template type
      templateType: data.templateType || 'receipt',
      
      // Currency (ILS by default)
      currency: data.currency || '₪',
      
      // Generated timestamp
      generatedDate: moment().format('YYYY-MM-DD HH:mm:ss')
    };

    // Calculate totals if not provided
    if (!data.subtotal && data.items) {
      defaultData.subtotal = data.items.reduce((sum, item) => {
        return sum + (parseFloat(item.amount) || 0);
      }, 0);
    }

    if (!data.taxAmount && defaultData.subtotal && data.taxRate) {
      defaultData.taxAmount = (defaultData.subtotal * (parseFloat(data.taxRate) / 100));
    }

    if (!data.total) {
      defaultData.total = (defaultData.subtotal || 0) + (defaultData.taxAmount || 0);
    }

    return defaultData;
  }

  async getAvailableTemplates() {
    try {
      const templatesDir = path.join(__dirname, '..', 'templates');
      const files = await fs.readdir(templatesDir);
      
      return files
        .filter(file => file.endsWith('.hbs'))
        .map(file => file.replace('.hbs', ''));
    } catch (error) {
      console.error('Error reading templates:', error);
      return [];
    }
  }

  validateInvoiceData(data) {
    const errors = [];

    // Required fields validation
    if (!data.customer?.name) {
      errors.push('Customer name is required');
    }

    if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
      errors.push('At least one item is required');
    }

    // Validate items
    if (data.items) {
      data.items.forEach((item, index) => {
        if (!item.description) {
          errors.push(`Item ${index + 1}: description is required`);
        }
        if (!item.quantity || item.quantity <= 0) {
          errors.push(`Item ${index + 1}: valid quantity is required`);
        }
        if (!item.rate || item.rate < 0) {
          errors.push(`Item ${index + 1}: valid rate is required`);
        }
      });
    }

    return errors;
  }
}

module.exports = new PDFController();