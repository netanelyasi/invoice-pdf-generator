const express = require('express');
const router = express.Router();
const pdfController = require('../controllers/pdfController');
const { body, validationResult } = require('express-validator');
const fs = require('fs-extra');
const path = require('path');
const { authenticatedRateLimit, bypassHealthCheck } = require('../middleware/auth');

const templatesDir = path.join(__dirname, '..', 'templates');

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

    // Set response headers for PDF
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="invoice-${data.invoiceNumber || Date.now()}.pdf"`,
      'Content-Length': pdfBuffer.length
    });

    res.send(pdfBuffer);

  } catch (error) {
    console.error('שגיאת API ביצירת PDF:', error);
    res.status(500).json({
      success: false,
      error: 'יצירת ה-PDF נכשלה',
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