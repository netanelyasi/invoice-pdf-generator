const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const fs = require('fs-extra');
const rateLimit = require('express-rate-limit');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Rate limiting with environment variable support
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes default
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // 100 requests default
  message: 'יותר מדי בקשות מכתובת זו, אנא נסה שוב מאוחר יותר.'
});
app.use('/api/', limiter);

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// File upload configuration with environment variable support
const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, 'public', 'uploads');
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(uploadDir, 'logos');
    fs.ensureDirSync(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { 
    fileSize: parseInt(process.env.UPLOAD_MAX_SIZE) || 5 * 1024 * 1024 // 5MB default
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Ensure required directories exist
const requiredDirs = [
  'public/uploads/logos',
  'database',
  'src/templates'
];

requiredDirs.forEach(dir => {
  fs.ensureDirSync(path.join(__dirname, dir));
});

// Import routes
const apiRoutes = require('./src/routes/api');
const webRoutes = require('./src/routes/web');

// Routes
app.use('/api', apiRoutes);
app.use('/', webRoutes);

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'הקובץ גדול מדי' });
    }
  }
  
  console.error('Error:', error);
  res.status(500).json({ error: 'שגיאת שרת פנימית' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'הנתיב לא נמצא' });
});

// Initialize database
const db = require('./src/models/database');
db.initialize()
  .then(() => {
    console.log('מסד הנתונים אופסן בהצלחה');
    
    // Start server
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server starting...`);
      console.log(`📊 NODE_ENV: ${process.env.NODE_ENV}`);
      console.log(`🔌 PORT: ${PORT}`);
      console.log(`🌍 Listening on 0.0.0.0:${PORT}`);
      console.log(`שרת יצירת ה-PDF לחשבוניות פועל על פורט ${PORT}`);
      console.log(`ממשק וובי: http://localhost:${PORT}`);
      console.log(`נקודת API: http://localhost:${PORT}/api/generate-pdf`);
      console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
    });
  })
  .catch(err => {
    console.error('כשל באתחול מסד הנתונים:', err);
    process.exit(1);
  });

module.exports = app;