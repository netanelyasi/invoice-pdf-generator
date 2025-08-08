# 🇮🇱 דוגמה מלאה לשימוש בעברית

## 1. העלאת לוגו

### העלאת לוגו חדש:
```bash
curl -X POST https://html2pdf.brainboxai.io/api/upload-logo \
  -H "x-api-key: html2pdf_a59ac4a5278518958937e3091b3f02948f976ce6a997813009b8db76af08905e" \
  -F "logo=@/path/to/your/logo.png"
```

**תגובה מוצפת:**
```json
{
  "success": true,
  "message": "הלוגו הועלה בהצלחה",
  "logo": {
    "filename": "logo-1704123456789-987654321.png",
    "originalName": "logo.png",
    "size": 45678,
    "url": "https://html2pdf.brainboxai.io/uploads/logos/logo-1704123456789-987654321.png"
  }
}
```

## 2. יצירת קבלה בעברית עם לוגו

### דוגמה מלאה לקבלה בעברית:

```bash
curl -X POST https://html2pdf.brainboxai.io/api/generate-pdf \
  -H "Content-Type: application/json" \
  -H "x-api-key: html2pdf_a59ac4a5278518958937e3091b3f02948f976ce6a997813009b8db76af08905e" \
  -d '{
    "templateType": "receipt",
    "invoiceNumber": "קב-2024-001",
    "invoiceDate": "2024-01-15",
    "dueDate": "2024-02-15",
    
    "business": {
      "name": "טכנולוגיות מתקדמות בע״מ",
      "address": "שדרות רוטשילד 45",
      "city": "תל אביב",
      "state": "ישראל", 
      "postalCode": "61000",
      "phone": "+972-3-123-4567",
      "email": "info@tech-company.co.il",
      "website": "www.tech-company.co.il",
      "abn": "ח.פ: 514123456",
      "logo": "https://html2pdf.brainboxai.io/uploads/logos/your-logo-filename.png"
    },
    
    "customer": {
      "name": "אבי כהן",
      "email": "avi.cohen@email.com",
      "address": "רחוב הרצל 123",
      "city": "חיפה",
      "state": "ישראל",
      "postalCode": "33000",
      "phone": "+972-4-987-6543"
    },
    
    "items": [
      {
        "description": "פיתוח אתר אינטרנט מתקדם",
        "quantity": 1,
        "rate": 5000.00,
        "amount": 5000.00
      },
      {
        "description": "עיצוב גרפי ולוגו",
        "quantity": 2,
        "rate": 800.00,
        "amount": 1600.00
      },
      {
        "description": "אחזקה חודשית",
        "quantity": 3,
        "rate": 300.00,
        "amount": 900.00
      }
    ],
    
    "subtotal": 7500.00,
    "taxRate": 17,
    "taxAmount": 1275.00,
    "total": 8775.00,
    
    "currency": "₪",
    "paymentTerms": "30 ימים",
    "paymentMethod": "העברה בנקאית",
    
    "notes": "תודה על בחירתכם בשירותינו! אנו מתחייבים לספק שירות מעולה ותמיכה מלאה."
  }' \
  --output קבלה-בעברית.pdf
```

## 3. דוגמה לקבלה לעסק פטור:

```bash
curl -X POST https://html2pdf.brainboxai.io/api/generate-pdf \
  -H "Content-Type: application/json" \
  -H "x-api-key: html2pdf_a59ac4a5278518958937e3091b3f02948f976ce6a997813009b8db76af08905e" \
  -d '{
    "templateType": "exempt_business_receipt",
    "invoiceNumber": "פטור-2024-001",
    "invoiceDate": "2024-01-15",
    
    "business": {
      "name": "עמותת חינוך מתקדם",
      "address": "רחוב הנביאים 10",
      "city": "ירושלים",
      "state": "ישראל",
      "postalCode": "94000",
      "phone": "+972-2-555-0123",
      "email": "info@education.org.il",
      "abn": "עמותה מס׳ 580123456",
      "logo": "https://html2pdf.brainboxai.io/uploads/logos/your-logo-filename.png"
    },
    
    "customer": {
      "name": "משרד החינוך",
      "email": "payments@education.gov.il",
      "address": "רחוב הכירקור 34",
      "city": "ירושלים",
      "state": "ישראל"
    },
    
    "items": [
      {
        "description": "הדרכה פדגוגית למורים",
        "quantity": 10,
        "rate": 500.00,
        "amount": 5000.00
      },
      {
        "description": "פיתוח חומרי למידה דיגיטליים",
        "quantity": 1,
        "rate": 8000.00,
        "amount": 8000.00
      }
    ],
    
    "total": 13000.00,
    "currency": "₪",
    "paymentMethod": "העברה בנקאית",
    "notes": "עמותה פטורה ממע״מ לפי סעיף 9 לחוק מע״מ"
  }' \
  --output קבלה-עסק-פטור.pdf
```

## 4. דוגמה לחשבונית מס:

```bash
curl -X POST https://html2pdf.brainboxai.io/api/generate-pdf \
  -H "Content-Type: application/json" \
  -H "x-api-key: html2pdf_a59ac4a5278518958937e3091b3f02948f976ce6a997813009b8db76af08905e" \
  -d '{
    "templateType": "tax_invoice",
    "invoiceNumber": "חש-2024-001",
    "invoiceDate": "2024-01-15",
    "dueDate": "2024-02-15",
    
    "business": {
      "name": "חברת הייטק ישראלית בע״מ",
      "address": "פארק תעשיות עידן החדש 15",
      "city": "הרצליה",
      "state": "ישראל",
      "postalCode": "46000",
      "phone": "+972-9-876-5432",
      "email": "billing@hitech.co.il",
      "website": "www.hitech.co.il",
      "abn": "ח.פ: 515987654",
      "logo": "https://html2pdf.brainboxai.io/uploads/logos/your-logo-filename.png"
    },
    
    "customer": {
      "name": "חברת הלקוח בע״מ",
      "email": "accounts@client.co.il",
      "address": "רחוב הבנקים 50",
      "city": "רמת גן",
      "state": "ישראל",
      "postalCode": "52000"
    },
    
    "items": [
      {
        "description": "פיתוח תוכנה מותאמת אישית",
        "quantity": 100,
        "rate": 450.00,
        "amount": 45000.00
      },
      {
        "description": "ייעוץ טכנולוגי ואדריכלות מערכות",
        "quantity": 20,
        "rate": 800.00,
        "amount": 16000.00
      },
      {
        "description": "הטמעה ואימונים",
        "quantity": 5,
        "rate": 1200.00,
        "amount": 6000.00
      }
    ],
    
    "subtotal": 67000.00,
    "taxRate": 17,
    "taxAmount": 11390.00,
    "total": 78390.00,
    
    "currency": "₪",
    "paymentTerms": "שוטף+30",
    "paymentMethod": "העברה בנקאית",
    "notes": "תודה על שיתוף הפעולה! מספר עוסק מורשה: 123456789"
  }' \
  --output חשבונית-מס.pdf
```

## 5. שימוש בשפת תכנות (JavaScript):

```javascript
async function createHebrewInvoice() {
  const invoiceData = {
    templateType: 'receipt',
    invoiceNumber: 'קב-2024-' + Math.floor(Math.random() * 1000).toString().padStart(3, '0'),
    invoiceDate: new Date().toISOString().split('T')[0],
    
    business: {
      name: 'החברה שלי בע״מ',
      address: 'רחוב העסקים 123',
      city: 'תל אביב',
      phone: '+972-3-123-4567',
      email: 'info@mycompany.co.il',
      logo: 'https://html2pdf.brainboxai.io/uploads/logos/my-logo.png'
    },
    
    customer: {
      name: 'הלקוח שלי',
      email: 'client@email.com'
    },
    
    items: [
      {
        description: 'שירותי ייעוץ',
        quantity: 5,
        rate: 300,
        amount: 1500
      }
    ],
    
    subtotal: 1500,
    taxRate: 17,
    taxAmount: 255,
    total: 1755,
    currency: '₪'
  };

  try {
    const response = await fetch('https://html2pdf.brainboxai.io/api/generate-pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'html2pdf_a59ac4a5278518958937e3091b3f02948f976ce6a997813009b8db76af08905e'
      },
      body: JSON.stringify(invoiceData)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const pdfBlob = await response.blob();
    
    // הורדה אוטומטית
    const url = URL.createObjectURL(pdfBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `קבלה-${invoiceData.invoiceNumber}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log('✅ קבלה נוצרה בהצלחה!');
    
  } catch (error) {
    console.error('❌ שגיאה ביצירת הקבלה:', error);
  }
}

// שימוש
createHebrewInvoice();
```

## 6. מחיקת לוגו:

```bash
curl -X DELETE https://html2pdf.brainboxai.io/api/logo/logo-1704123456789-987654321.png \
  -H "x-api-key: html2pdf_a59ac4a5278518958937e3091b3f02948f976ce6a997813009b8db76af08905e"
```

## טיפים חשובים:

1. **לוגו**: העלה תמונת לוגו קודם והשתמש ב-URL שמתקבל
2. **כיוון טקסט**: כל הטקסט יהיה אוטומטית מימין לשמאל
3. **מטבע**: השתמש ב-₪ עבור שקלים או כל מטבע אחר
4. **תאריכים**: פורמט YYYY-MM-DD
5. **מספרי חשבונית**: תוכל להשתמש בעברית + מספרים