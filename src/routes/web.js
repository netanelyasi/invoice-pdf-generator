const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs-extra');
const pdfController = require('../controllers/pdfController');
const templatesDir = path.join(__dirname, '..', 'templates');

// Home page - Simple web interface (Hebrew)
router.get('/', (req, res) => {
  res.render('index', {
    title: 'מחולל חשבוניות וחשבוניות מס - PDF',
    apiEndpoint: '/api/generate-pdf'
  });
});

// API documentation page (Hebrew)
router.get('/docs', (req, res) => {
  res.render('docs', {
    title: 'תיעוד API - מחולל חשבוניות PDF'
  });
});

// Template management page
router.get('/templates', (req, res) => {
  res.render('templates', {
    title: 'ניהול תבניות - מחולל חשבוניות PDF'
  });
});

// Visual template designer (beta)
router.get('/templates/designer', (req, res) => {
  const name = req.query.name || '';
  res.render('designer', {
    title: 'עורך תבניות (בטא) - גרירה ושחרור',
    name
  });
});

// Edit template page
router.get('/templates/edit/:name', async (req, res) => {
  try {
    const name = req.params.name;
    const filePath = path.join(templatesDir, `${name}.hbs`);
    if (!await fs.pathExists(filePath)) {
      return res.status(404).send('Template not found');
    }
    const content = await fs.readFile(filePath, 'utf8');
    res.render('edit-template', { title: `עריכת תבנית - ${name}`, name, content });
  } catch (err) {
    console.error('Edit template page error:', err);
    res.status(500).send('טעינת התבנית נכשלה');
  }
});

module.exports = router;