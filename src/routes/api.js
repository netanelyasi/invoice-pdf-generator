const express = require('express');
const router = express.Router();
const pdfController = require('../controllers/pdfController');
const { body, validationResult } = require('express-validator');
const fs = require('fs-extra');
const path = require('path');
const multer = require('multer');
const { authenticatedRateLimit, bypassHealthCheck } = require('../middleware/auth');

const templatesDir = path.join(__dirname, '..', 'templates');

// Configure multer for logo uploads
const logoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = process.env.UPLOAD_DIR || path.join(__dirname, '..', '..', 'public', 'uploads', 'logos');
    fs.ensureDirSync(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'logo-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const logoUpload = multer({
  storage: logoStorage,
  limits: { 
    fileSize: parseInt(process.env.UPLOAD_MAX_SIZE) || 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('רק קבצי תמונה מותרים (JPEG, PNG, GIF)'));
    }
  }
});

// PDF Generation endpoint - PROTECTED with API key
router.post('/generate-pdf', 
  ...authenticatedRateLimit,
  [
    body('templateType').notEmpty().withMessage('נדרש סוג תבנית'),
    body('customer.name').notEmpty().withMessage('נדרש שם לקוח'),
    body('items').isArray({ min: 1 }).withMessage('נדרש לפחות פריט אחד')
  ], 
  async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { templateType, ...data } = req.body;

    // Additional validation using controller
    const validationErrors = pdfController.validateInvoiceData(data);
    if (validationErrors.length > 0) {
      return res.status(400).json({ success: false, errors: validationErrors });
    }

    // Generate PDF
    const pdfBuffer = await pdfController.generatePDF(templateType, data);

    // Set response headers for PDF (completely safe filename)
    const timestamp = Date.now();
    const safeFilename = `invoice-${timestamp}`;
    
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${safeFilename}.pdf"`,
      'Content-Length': pdfBuffer.length,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

    // Send PDF buffer directly without JSON wrapper
    res.end(pdfBuffer, 'binary');

  } catch (error) {
    console.error('🚨 PDF Generation Error:', error);
    console.error('🚨 Error Message:', error.message);
    console.error('🚨 Error Stack:', error.stack);
    
    // Send error response without Hebrew characters in headers
    res.status(500).json({
      success: false,
      error: 'PDF generation failed',
      message: error.message
    });
  }
});

// Get available templates - PROTECTED
router.get('/templates', bypassHealthCheck, async (req, res) => {
  try {
    const templates = await pdfController.getAvailableTemplates();
    
    res.json({
      success: true,
      templates: templates
    });
  } catch (error) {
    console.error('שגיאת API ברשימת תבניות:', error);
    res.status(500).json({
      success: false,
      error: 'נכשל בקבלת התבניות'
    });
  }
});

// Get a specific template content - PROTECTED
router.get('/templates/:name', bypassHealthCheck, async (req, res) => {
  try {
    const templateName = req.params.name;
    const filePath = path.join(templatesDir, `${templateName}.hbs`);

    if (!await fs.pathExists(filePath)) {
      return res.status(404).json({ success: false, error: 'התבנית לא נמצאה' });
    }

    const content = await fs.readFile(filePath, 'utf8');
    return res.json({ success: true, name: templateName, content });
  } catch (error) {
    console.error('שגיאה בקריאת תבנית:', error);
    return res.status(500).json({ success: false, error: 'נכשלה קריאת התבנית' });
  }
});

// Update a specific template content - PROTECTED
router.put('/templates/:name', 
  bypassHealthCheck,
  [
    body('content').isString().notEmpty().withMessage('נדרש תוכן לתבנית')
  ], 
  async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const templateName = req.params.name;
    const { content } = req.body;
    const filePath = path.join(templatesDir, `${templateName}.hbs`);

    if (!await fs.pathExists(filePath)) {
      return res.status(404).json({ success: false, error: 'התבנית לא נמצאה' });
    }

    await fs.writeFile(filePath, content, 'utf8');
    return res.json({ success: true, message: 'התבנית עודכנה בהצלחה' });
  } catch (error) {
    console.error('שגיאה בעדכון תבנית:', error);
    return res.status(500).json({ success: false, error: 'נכשל עדכון התבנית' });
  }
});

// Preview endpoint (returns HTML instead of PDF) - PROTECTED
router.post('/preview', 
  bypassHealthCheck,
  [
    body('templateType').notEmpty().withMessage('נדרש סוג תבנית')
  ], 
  async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { templateType, ...data } = req.body;
    
    // Load and render template for preview
    const handlebars = require('handlebars');
    const fs = require('fs-extra');
    const path = require('path');

    const templatePath = path.join(__dirname, '..', 'templates', `${templateType}.hbs`);
    
    if (!await fs.pathExists(templatePath)) {
      return res.status(404).json({ success: false, error: 'התבנית לא נמצאה' });
    }

    const templateContent = await fs.readFile(templatePath, 'utf8');
    const template = handlebars.compile(templateContent);
    const templateData = pdfController.prepareTemplateData(data);
    const html = template(templateData);

    res.set('Content-Type', 'text/html');
    res.send(html);

  } catch (error) {
    console.error('שגיאת API בתצוגה מקדימה:', error);
    res.status(500).json({ success: false, error: 'יצירת התצוגה נכשלה', message: error.message });
  }
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ success: true, status: 'תקין', timestamp: new Date().toISOString(), service: 'מחולל חשבוניות PDF' });
});

// Direct HTML to PDF conversion endpoint
router.post('/html-to-pdf', 
  bypassHealthCheck,
  [
    body('html').isString().notEmpty().withMessage('HTML content is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { html, filename, options } = req.body;

      // Ensure UTF-8 + Hebrew-ready HTML by injecting meta charset, Hebrew-capable fonts, and RTL when needed
      const ensureHebrewSupport = (rawHtml) => {
        if (!rawHtml || typeof rawHtml !== 'string') return rawHtml;

        const hasHebrewText = /[\u0590-\u05FF]/.test(rawHtml);
        const hasHeadTag = /<head[\s\S]*?>/i.test(rawHtml);
        const hasMetaUTF8 = /<meta[^>]*charset\s*=\s*["']?utf-?8["']?/i.test(rawHtml);
        const hasHebrewFont = /(Noto\s+Sans\s+Hebrew|Heebo)/i.test(rawHtml);
        const hasHtmlTag = /<html[^>]*>/i.test(rawHtml);
        const hasDirAttr = /<html[^>]*\sdir\s*=\s*['"][^'"]+['"]/i.test(rawHtml);
        const hasLangAttr = /<html[^>]*\slang\s*=\s*['"][^'"]+['"]/i.test(rawHtml);

        const fontLinks = `\n<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Hebrew:wght@300;400;600;700;900&family=Heebo:wght@300;400;600;700;900&display=swap" rel="stylesheet">`;
        const fontStyle = `\n<style> body { font-family: 'Heebo','Noto Sans Hebrew','Arial Unicode MS','Segoe UI',Arial,sans-serif; } </style>`;
        const rtlStyle = hasHebrewText ? `\n<style> html { direction: rtl; } body { direction: rtl; text-align: right; } </style>` : '';

        let output = rawHtml;

        // If no <head>, wrap with a minimal HTML skeleton optimized for Hebrew
        if (!hasHeadTag) {
          const htmlAttrs = hasHebrewText ? ` lang="he" dir="rtl"` : '';
          return `<!DOCTYPE html><html${htmlAttrs}><head>${hasMetaUTF8 ? '' : '<meta charset="UTF-8">'}${hasHebrewFont ? '' : fontLinks + fontStyle}${rtlStyle}</head><body>${rawHtml}</body></html>`;
        }

        // Ensure meta charset UTF-8
        if (!hasMetaUTF8) {
          output = output.replace(/<head(\s*[^>]*)>/i, '<head$1>\n<meta charset="UTF-8">');
        }

        // Ensure Hebrew-capable fonts
        if (!hasHebrewFont) {
          output = output.replace(/<head(\s*[^>]*)>/i, `<head$1>${fontLinks}${fontStyle}`);
        }

        // If HTML tag exists and there is Hebrew text, ensure lang/dir hints
        if (hasHebrewText && hasHtmlTag) {
          if (!hasLangAttr) {
            output = output.replace(/<html(\s*[^>]*)>/i, (m, attrs) => `<html lang="he"${attrs}>`);
          }
          if (!hasDirAttr) {
            output = output.replace(/<html(\s*[^>]*)>/i, (m, attrs) => `<html dir="rtl"${attrs}>`);
          }
          // Additionally ensure RTL via CSS to override conflicting styles
          output = output.replace(/<head(\s*[^>]*)>/i, `<head$1>${rtlStyle}`);
        }

        return output;
      };
      
      console.log('🔄 Converting HTML to PDF...');
      console.log('📝 HTML length:', html.length);

      // Launch browser
      const puppeteer = require('puppeteer');
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
      
      // Set UTF-8 encoding
      await page.setExtraHTTPHeaders({
        'Accept-Charset': 'utf-8',
        'Accept-Language': 'he-IL,he;q=0.9,en;q=0.8'
      });
      
      // Add UTF-8 BOM and set content
      const preparedHtml = ensureHebrewSupport(html);
      const htmlWithBOM = '\ufeff' + preparedHtml;
      await page.setContent(htmlWithBOM, { 
        waitUntil: ['load', 'networkidle0'],
        timeout: 30000
      });
      
      // Wait for fonts to load
      await page.evaluateHandle('document.fonts.ready');

      // Generate PDF with options
      const pdfOptions = {
        format: options?.format || 'A4',
        printBackground: true,
        margin: options?.margin || {
          top: '20px',
          right: '20px',
          bottom: '20px',
          left: '20px'
        },
        preferCSSPageSize: true,
        displayHeaderFooter: false,
        timeout: 30000,
        pageRanges: '1',
        ...options
      };

      const pdfBuffer = await page.pdf(pdfOptions);
      await browser.close();

      // Validate PDF
      if (!pdfBuffer || pdfBuffer.length === 0) {
        throw new Error('Generated PDF buffer is empty');
      }

      console.log(`✅ HTML converted to PDF. Size: ${pdfBuffer.length} bytes`);

      // Send PDF
      const safeFilename = filename ? filename.replace(/[^\w\-\.]/g, '_') : `html-pdf-${Date.now()}`;
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${safeFilename}.pdf"`,
        'Content-Length': pdfBuffer.length
      });
      
      res.end(pdfBuffer, 'binary');

    } catch (error) {
      console.error('🚨 HTML to PDF Error:', error);
      res.status(500).json({
        success: false,
        error: 'HTML to PDF conversion failed',
        message: error.message
      });
    }
  }
);

// Debug template rendering (returns HTML)
router.post('/debug-template', 
  bypassHealthCheck,
  async (req, res) => {
    try {
      const { templateType, ...data } = req.body;
      
      console.log('🐛 Debug template rendering...');
      console.log('🐛 Template type:', templateType);
      console.log('🐛 Data keys:', Object.keys(data));
      
      // Use the same logic as generate-pdf
      const templateData = pdfController.prepareTemplateData(data);
      console.log('🐛 Prepared data keys:', Object.keys(templateData));
      console.log('🐛 Business name:', templateData.business?.name);
      console.log('🐛 Customer name:', templateData.customer?.name);
      
      // Load template
      const path = require('path');
      const fs = require('fs-extra');
      const handlebars = require('handlebars');
      
      const templatePath = path.join(__dirname, '..', 'templates', `${templateType}.hbs`);
      console.log('🐛 Template path:', templatePath);
      
      if (!await fs.pathExists(templatePath)) {
        return res.status(404).json({ success: false, error: `Template not found: ${templateType}` });
      }

      const templateContent = await fs.readFile(templatePath, { encoding: 'utf8' });
      const template = handlebars.compile(templateContent);
      const html = template(templateData);
      
      console.log('🐛 Generated HTML length:', html.length);
      
      // Return HTML for inspection
      res.set('Content-Type', 'text/html; charset=utf-8');
      res.send(html);

    } catch (error) {
      console.error('🐛 Debug template error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

// Simple Hebrew test endpoint
router.post('/test-hebrew', 
  bypassHealthCheck,
  async (req, res) => {
    try {
      const testData = {
        templateType: 'receipt',
        invoiceNumber: 'TEST-001', // Safe filename
        customer: { name: 'Test User Hebrew עברית', email: 'test@example.com' },
        business: { name: 'Test Business עסק', phone: '123-456-7890' },
        items: [{ description: 'שירות בדיקה', quantity: 1, rate: 100, amount: 100 }],
        subtotal: 100,
        total: 100,
        currency: '₪'
      };

      console.log('🧪 Testing Hebrew PDF generation...');
      const pdfBuffer = await pdfController.generatePDF(testData.templateType, testData);
      
      // Ultra-simple headers
      res.set('Content-Type', 'application/pdf');
      res.set('Content-Length', pdfBuffer.length.toString());
      res.end(pdfBuffer);

    } catch (error) {
      console.error('🧪 Hebrew test error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

// Debug endpoint for PDF generation
router.post('/debug-pdf', 
  bypassHealthCheck,
  async (req, res) => {
    try {
      const testData = {
        templateType: 'receipt',
        customer: { name: 'Debug Test', email: 'debug@test.com' },
        business: { name: 'Debug Business', phone: '123-456-7890' },
        items: [{ description: 'Debug Item', quantity: 1, rate: 100, amount: 100 }],
        subtotal: 100,
        total: 100,
        invoiceNumber: 'DEBUG-001'
      };

      console.log('🔧 Generating debug PDF...');
      const pdfBuffer = await pdfController.generatePDF(testData.templateType, testData);
      
      console.log(`🔧 Debug PDF size: ${pdfBuffer.length} bytes`);
      console.log(`🔧 Debug PDF first 20 bytes: ${pdfBuffer.slice(0, 20).toString('hex')}`);
      
      // Check if it starts with PDF header
      const pdfHeader = pdfBuffer.slice(0, 4).toString();
      console.log(`🔧 PDF header: ${pdfHeader}`);
      
      if (pdfHeader !== '%PDF') {
        console.error('❌ PDF buffer does not start with %PDF header!');
        return res.status(500).json({ 
          success: false, 
          error: 'Invalid PDF generated',
          header: pdfHeader,
          size: pdfBuffer.length 
        });
      }

      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="debug-test.pdf"',
        'Content-Length': pdfBuffer.length,
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      });
      
      res.end(pdfBuffer, 'binary');

    } catch (error) {
      console.error('🔧 Debug PDF error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

// Logo upload endpoint - PROTECTED
router.post('/upload-logo', 
  bypassHealthCheck,
  logoUpload.single('logo'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'לא הועלה קובץ',
          message: 'אנא בחר קובץ תמונה להעלאה'
        });
      }

      // Get the file URL
      const baseUrl = process.env.DOMAIN ? `https://${process.env.DOMAIN}` : `http://localhost:${process.env.PORT || 3000}`;
      const logoUrl = `${baseUrl}/uploads/logos/${req.file.filename}`;

      console.log(`✅ Logo uploaded: ${req.file.filename} (${req.file.size} bytes)`);

      res.json({
        success: true,
        message: 'הלוגו הועלה בהצלחה',
        logo: {
          filename: req.file.filename,
          originalName: req.file.originalname,
          size: req.file.size,
          url: logoUrl,
          path: req.file.path
        }
      });

    } catch (error) {
      console.error('שגיאה בהעלאת לוגו:', error);
      res.status(500).json({
        success: false,
        error: 'העלאת הלוגו נכשלה',
        message: error.message
      });
    }
  }
);

// Delete logo endpoint - PROTECTED
router.delete('/logo/:filename',
  bypassHealthCheck,
  async (req, res) => {
    try {
      const filename = req.params.filename;
      const uploadPath = process.env.UPLOAD_DIR || path.join(__dirname, '..', '..', 'public', 'uploads', 'logos');
      const filePath = path.join(uploadPath, filename);

      if (await fs.pathExists(filePath)) {
        await fs.remove(filePath);
        console.log(`🗑️ Logo deleted: ${filename}`);
        
        res.json({
          success: true,
          message: 'הלוגו נמחק בהצלחה'
        });
      } else {
        res.status(404).json({
          success: false,
          error: 'הלוגו לא נמצא'
        });
      }

    } catch (error) {
      console.error('שגיאה במחיקת לוגו:', error);
      res.status(500).json({
        success: false,
        error: 'מחיקת הלוגו נכשלה',
        message: error.message
      });
    }
  }
);

// API documentation endpoint
router.get('/docs', (req, res) => {
  const docs = {
    title: 'API מחולל חשבוניות PDF',
    version: '1.0.0',
    endpoints: {
      'POST /api/generate-pdf': {
        description: 'יצירת חשבונית/קבלה כקובץ PDF',
        required_fields: ['templateType', 'customer.name', 'items'],
        example: {
          templateType: 'receipt',
          customer: { name: 'ישראל ישראלי', email: 'israel@example.com', address: 'רחוב הראשי 1', city: 'תל אביב', state: 'מרכז', postalCode: '61000' },
          business: { name: 'העסק שלי', address: 'רחוב העסקים 2', phone: '+972-50-1234567', email: 'info@business.co.il' },
          items: [{ description: 'מוצר/שירות', quantity: 1, rate: 100.0, amount: 100.0 }],
          subtotal: 100.0,
          taxRate: 10,
          taxAmount: 10.0,
          total: 110.0
        }
      },
      'GET /api/templates': { description: 'קבלת רשימת תבניות זמינות', response: ['receipt', 'tax_invoice', 'exempt_business_receipt'] },
      'POST /api/preview': { description: 'תצוגה מקדימה של תבנית כ-HTML', required_fields: ['templateType'] },
      'GET /api/health': { description: 'בדיקת תקינות השירות' }
    }
  };

  res.json(docs);
});

module.exports = router;