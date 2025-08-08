/**
 * HTML to PDF Conversion Examples
 * 
 * This file contains examples of how to use the /api/html-to-pdf endpoint
 * to convert any HTML content directly to PDF
 */

const API_BASE_URL = 'https://html2pdf.brainboxai.io';
const API_KEY = 'html2pdf_a59ac4a5278518958937e3091b3f02948f976ce6a997813009b8db76af08905e';

// Example 1: Basic HTML to PDF
async function basicHtmlToPdf() {
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="he" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>מסמך פשוט</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;700&display=swap');
        
        body {
          font-family: 'Heebo', sans-serif;
          direction: rtl;
          text-align: right;
          padding: 40px;
          line-height: 1.6;
        }
        
        h1 {
          color: #2c3e50;
          border-bottom: 3px solid #3498db;
          padding-bottom: 10px;
        }
        
        .content {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <h1>שלום עולם!</h1>
      <div class="content">
        <p>זהו מסמך HTML פשוט שהומר ל-PDF</p>
        <p>התאריך: ${new Date().toLocaleDateString('he-IL')}</p>
      </div>
    </body>
    </html>
  `;

  try {
    const response = await fetch(`${API_BASE_URL}/api/html-to-pdf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY
      },
      body: JSON.stringify({
        html: htmlContent,
        filename: 'basic-hebrew-document'
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const pdfBuffer = await response.arrayBuffer();
    
    // Save to file (Node.js)
    if (typeof require !== 'undefined') {
      const fs = require('fs');
      fs.writeFileSync('basic-hebrew-document.pdf', Buffer.from(pdfBuffer));
      console.log('✅ PDF saved as basic-hebrew-document.pdf');
    }
    
    return pdfBuffer;
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Example 2: Business Report
async function createBusinessReport() {
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="he" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>דוח עסקי</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;600;700&display=swap');
        
        body {
          font-family: 'Heebo', sans-serif;
          direction: rtl;
          margin: 0;
          padding: 30px;
          color: #333;
          line-height: 1.6;
        }
        
        .header {
          text-align: center;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px;
          margin: -30px -30px 30px -30px;
          border-radius: 0 0 15px 15px;
        }
        
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 700;
        }
        
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
          margin: 30px 0;
        }
        
        .stat-card {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 10px;
          border-left: 5px solid #3498db;
          text-align: center;
        }
        
        .stat-number {
          font-size: 32px;
          font-weight: 700;
          color: #2c3e50;
          margin: 0;
        }
        
        .stat-label {
          color: #7f8c8d;
          font-size: 14px;
          margin: 5px 0 0 0;
        }
        
        .table {
          width: 100%;
          border-collapse: collapse;
          margin: 30px 0;
          background: white;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          border-radius: 8px;
          overflow: hidden;
        }
        
        .table th, .table td {
          padding: 15px;
          text-align: right;
          border-bottom: 1px solid #ecf0f1;
        }
        
        .table th {
          background: #34495e;
          color: white;
          font-weight: 600;
        }
        
        .table tbody tr:hover {
          background: #f8f9fa;
        }
        
        .footer {
          margin-top: 40px;
          text-align: center;
          color: #7f8c8d;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>דוח ביצועים חודשי</h1>
        <p>חודש: ${new Date().toLocaleDateString('he-IL', { month: 'long', year: 'numeric' })}</p>
      </div>
      
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-number">₪125,000</div>
          <div class="stat-label">סה"כ הכנסות</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">89</div>
          <div class="stat-label">לקוחות חדשים</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">234</div>
          <div class="stat-label">פרוייקטים</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">94%</div>
          <div class="stat-label">שביעות רצון</div>
        </div>
      </div>
      
      <table class="table">
        <thead>
          <tr>
            <th>שם הפרוייקט</th>
            <th>לקוח</th>
            <th>סטטוס</th>
            <th>סכום</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>פיתוח אתר אינטרנט</td>
            <td>חברת ABC</td>
            <td>הושלם</td>
            <td>₪15,000</td>
          </tr>
          <tr>
            <td>מערכת ניהול</td>
            <td>חברת XYZ</td>
            <td>בתהליך</td>
            <td>₪28,000</td>
          </tr>
          <tr>
            <td>עיצוב לוגו</td>
            <td>סטארט-אפ חדש</td>
            <td>הושלם</td>
            <td>₪3,500</td>
          </tr>
        </tbody>
      </table>
      
      <div class="footer">
        <p>דוח זה נוצר אוטומטית על ידי מערכת ניהול הפרוייקטים</p>
        <p>תאריך יצירה: ${new Date().toLocaleString('he-IL')}</p>
      </div>
    </body>
    </html>
  `;

  try {
    const response = await fetch(`${API_BASE_URL}/api/html-to-pdf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY
      },
      body: JSON.stringify({
        html: htmlContent,
        filename: 'business-report-hebrew',
        options: {
          format: 'A4',
          margin: {
            top: '20px',
            right: '20px',
            bottom: '20px',
            left: '20px'
          }
        }
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const pdfBuffer = await response.arrayBuffer();
    
    if (typeof require !== 'undefined') {
      const fs = require('fs');
      fs.writeFileSync('business-report-hebrew.pdf', Buffer.from(pdfBuffer));
      console.log('✅ Business report saved as business-report-hebrew.pdf');
    }
    
    return pdfBuffer;
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Example 3: Certificate Template
async function createCertificate(recipientName, courseName, date) {
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="he" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>תעודה</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;600;700;900&display=swap');
        
        body {
          font-family: 'Heebo', sans-serif;
          margin: 0;
          padding: 40px;
          background: linear-gradient(45deg, #f7f3ff 0%, #fff 50%, #f0f8ff 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .certificate {
          background: white;
          padding: 60px;
          border-radius: 20px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.1);
          text-align: center;
          border: 5px solid #gold;
          position: relative;
          max-width: 700px;
        }
        
        .certificate::before {
          content: '';
          position: absolute;
          top: 20px;
          left: 20px;
          right: 20px;
          bottom: 20px;
          border: 2px solid #ddd;
          border-radius: 15px;
        }
        
        .title {
          font-size: 48px;
          font-weight: 900;
          color: #2c3e50;
          margin-bottom: 20px;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
        }
        
        .subtitle {
          font-size: 18px;
          color: #7f8c8d;
          margin-bottom: 40px;
        }
        
        .recipient {
          font-size: 36px;
          font-weight: 700;
          color: #e74c3c;
          margin: 30px 0;
          text-decoration: underline;
        }
        
        .course {
          font-size: 24px;
          font-weight: 600;
          color: #2c3e50;
          margin: 30px 0;
          background: #ecf0f1;
          padding: 15px;
          border-radius: 10px;
        }
        
        .date {
          font-size: 16px;
          color: #7f8c8d;
          margin-top: 40px;
        }
        
        .signature-area {
          margin-top: 60px;
          display: flex;
          justify-content: space-around;
          text-align: center;
        }
        
        .signature {
          font-size: 14px;
          color: #7f8c8d;
        }
        
        .signature-line {
          border-bottom: 2px solid #bdc3c7;
          width: 150px;
          margin: 20px auto 10px;
        }
      </style>
    </head>
    <body>
      <div class="certificate">
        <div class="title">תעודת הכרה</div>
        <div class="subtitle">מוענקת בזאת ל</div>
        
        <div class="recipient">${recipientName}</div>
        
        <div>על השלמה מוצלחת של קורס:</div>
        <div class="course">${courseName}</div>
        
        <div class="date">תאריך: ${date}</div>
        
        <div class="signature-area">
          <div class="signature">
            <div class="signature-line"></div>
            <div>מנהל הקורס</div>
          </div>
          <div class="signature">
            <div class="signature-line"></div>
            <div>מנהל המכון</div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const response = await fetch(`${API_BASE_URL}/api/html-to-pdf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY
      },
      body: JSON.stringify({
        html: htmlContent,
        filename: `certificate-${recipientName.replace(/\s+/g, '-')}`,
        options: {
          format: 'A4',
          landscape: true,
          margin: {
            top: '30px',
            right: '30px',
            bottom: '30px',
            left: '30px'
          }
        }
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const pdfBuffer = await response.arrayBuffer();
    
    if (typeof require !== 'undefined') {
      const fs = require('fs');
      const filename = `certificate-${recipientName.replace(/\s+/g, '-')}.pdf`;
      fs.writeFileSync(filename, Buffer.from(pdfBuffer));
      console.log(`✅ Certificate saved as ${filename}`);
    }
    
    return pdfBuffer;
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Example 4: Dynamic Content from Data
async function createDynamicReport(data) {
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="he" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>${data.title}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;600;700&display=swap');
        
        body {
          font-family: 'Heebo', sans-serif;
          direction: rtl;
          padding: 30px;
          color: #333;
          line-height: 1.6;
        }
        
        .header {
          background: #3498db;
          color: white;
          padding: 20px;
          border-radius: 10px;
          margin-bottom: 30px;
          text-align: center;
        }
        
        .item {
          background: #f8f9fa;
          padding: 15px;
          margin: 10px 0;
          border-radius: 8px;
          border-left: 4px solid #3498db;
        }
        
        .total {
          background: #2ecc71;
          color: white;
          padding: 20px;
          border-radius: 10px;
          text-align: center;
          font-size: 20px;
          font-weight: 700;
          margin-top: 30px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${data.title}</h1>
        <p>${data.description}</p>
      </div>
      
      ${data.items.map(item => `
        <div class="item">
          <strong>${item.name}</strong><br>
          <span>${item.description}</span><br>
          <span>כמות: ${item.quantity} | מחיר: ₪${item.price}</span>
        </div>
      `).join('')}
      
      <div class="total">
        סה"כ: ₪${data.total}
      </div>
      
      <p style="margin-top: 40px; text-align: center; color: #7f8c8d;">
        נוצר בתאריך: ${new Date().toLocaleString('he-IL')}
      </p>
    </body>
    </html>
  `;

  try {
    const response = await fetch(`${API_BASE_URL}/api/html-to-pdf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY
      },
      body: JSON.stringify({
        html: htmlContent,
        filename: data.filename || 'dynamic-report'
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const pdfBuffer = await response.arrayBuffer();
    
    if (typeof require !== 'undefined') {
      const fs = require('fs');
      const filename = `${data.filename || 'dynamic-report'}.pdf`;
      fs.writeFileSync(filename, Buffer.from(pdfBuffer));
      console.log(`✅ Dynamic report saved as ${filename}`);
    }
    
    return pdfBuffer;
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Usage Examples:

// Basic usage
// basicHtmlToPdf();

// Business report
// createBusinessReport();

// Certificate
// createCertificate('יוסי כהן', 'פיתוח אתרים מתקדם', '15/01/2024');

// Dynamic report
// createDynamicReport({
//   title: 'הזמנה חדשה',
//   description: 'פירוט המוצרים שהוזמנו',
//   items: [
//     { name: 'מוצר א', description: 'תיאור מוצר א', quantity: 2, price: 100 },
//     { name: 'מוצר ב', description: 'תיאור מוצר ב', quantity: 1, price: 200 }
//   ],
//   total: 400,
//   filename: 'order-report'
// });

// For browser usage (frontend)
if (typeof window !== 'undefined') {
  window.HtmlToPdfExamples = {
    basicHtmlToPdf,
    createBusinessReport,
    createCertificate,
    createDynamicReport
  };
}

// For Node.js usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    basicHtmlToPdf,
    createBusinessReport,
    createCertificate,
    createDynamicReport
  };
}

console.log('📄 HTML to PDF Examples loaded successfully!');
console.log('💡 Usage: Call any of the functions above to generate PDFs');