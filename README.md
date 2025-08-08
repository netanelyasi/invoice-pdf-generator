# Invoice PDF Generator

Professional invoice and receipt PDF generator with customizable templates and management UI.

## Features

- 🧾 **Dynamic PDF Generation** - Convert HTML templates to professional PDFs
- 🎨 **Template Customization** - Web-based editor for invoice/receipt templates
- 🏢 **Brand Customization** - Upload logos, set colors, business information
- 📊 **Receipt Types** - Support for exempt receipts and tax invoices
- 🔗 **n8n Integration** - REST API endpoints for workflow automation
- 🚀 **Dokploy Ready** - Docker configuration included

## Project Structure

```
invoice-pdf-generator/
├── src/
│   ├── controllers/     # Business logic controllers
│   ├── routes/         # API route definitions
│   ├── models/         # Data models and database schemas
│   ├── middleware/     # Express middleware functions
│   ├── templates/      # HTML templates for PDFs
│   └── utils/          # Utility functions
├── public/
│   ├── css/           # Frontend stylesheets
│   ├── js/            # Frontend JavaScript
│   └── uploads/       # User uploaded files (logos, etc.)
├── views/             # Web UI templates
├── database/          # Database files and migrations
├── Dockerfile         # Docker configuration
└── server.js         # Main server entry point
```

## API Endpoints

### PDF Generation
- `POST /api/generate-pdf` - Generate PDF from template and data
- `GET /api/templates` - List available templates
- `POST /api/templates` - Create new template

### Management UI
- `GET /` - Template management interface
- `GET /settings` - Business settings and branding

## Quick Start

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start development server:
   ```bash
   npm run dev
   ```

3. Access management UI at `http://localhost:3000`

## n8n Integration

Send POST request to `/api/generate-pdf` with:

```json
{
  "template": "receipt",
  "data": {
    "customerName": "John Doe",
    "amount": 99.99,
    "date": "2024-01-01",
    "items": [...]
  }
}
```

## Docker Deployment

Build and run with Docker:

```bash
docker build -t invoice-pdf-generator .
docker run -p 3000:3000 invoice-pdf-generator
```

## License

MIT