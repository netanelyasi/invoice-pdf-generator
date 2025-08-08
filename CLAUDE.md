# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm install` - Install dependencies
- `npm run dev` - Start development server with nodemon auto-restart
- `npm start` - Start production server
- `docker build -t invoice-pdf-generator .` - Build Docker image
- `docker run -p 3000:3000 invoice-pdf-generator` - Run containerized app

## Architecture Overview

This is a Node.js Express application that generates professional PDF invoices and receipts from HTML templates using Puppeteer. The system is designed for business use with n8n workflow integration and Dokploy deployment.

### Core Components

**PDF Generation Pipeline:**
- HTML templates (src/templates/) are rendered with dynamic data using Handlebars
- Puppeteer converts rendered HTML to PDF with proper styling and formatting
- Templates support custom branding (logos, colors, business information)

**Data Flow:**
1. n8n sends POST request to `/api/generate-pdf` with template type and invoice data
2. Controller selects appropriate template from src/templates/
3. Template is populated with customer/business data using Handlebars
4. Puppeteer renders HTML template to PDF buffer
5. PDF is returned as response attachment or saved for email attachment

**Template Management:**
- Web UI allows real-time template editing with live preview
- Templates stored in database with versioning
- Support for multiple invoice types (receipt, tax invoice, exempt business receipt)
- Custom branding settings (logo uploads to public/uploads/logos/)

### Key Technical Considerations

**Puppeteer Configuration:**
- Docker setup includes all necessary Chrome dependencies for headless PDF generation
- Non-root user configuration for security in containerized environments
- Template rendering must account for print CSS media queries
- Windows development uses different launch args than containerized environments

**Database Schema:**
- SQLite for simplicity in single-instance deployments
- Tables: business_settings, templates, invoice_history, app_settings
- File uploads stored in public/uploads/ with database references
- Automatic initialization with default business settings

**n8n Integration Points:**
- `/api/generate-pdf` - Primary endpoint for PDF generation
- `/api/templates` - Template management for workflow configuration
- `/api/preview` - HTML preview endpoint for template testing
- Rate limiting implemented via express-rate-limit (100 requests per 15 minutes)

**Business Logic Requirements:**
- Support for exempt business receipts (current requirement)
- Future tax invoice compliance (GST/VAT ready structure)
- Dynamic template fields for various invoice types
- Logo and branding customization per business profile
- Hebrew language support and RTL text direction

## Key API Endpoints

- `POST /api/generate-pdf` - Generate PDF from template and data
- `GET /api/templates` - List available templates
- `GET /api/templates/:name` - Get specific template content
- `PUT /api/templates/:name` - Update template content
- `POST /api/preview` - Preview template as HTML
- `GET /api/health` - Health check endpoint
- `GET /api/docs` - API documentation

## Handlebars Helpers

The application includes several custom Handlebars helpers in src/controllers/pdfController.js:
- `formatDate` - Format dates with moment.js
- `formatCurrency` - Format currency with proper Hebrew/ILS formatting
- `multiply` - Multiply two numbers for calculations
- `add` - Add two numbers for totals
- `eq` - Equality comparison
- `ifCond` - Conditional helper with operators (==, !=, <, >, etc.)

## Database Models

The SQLite database (database/invoices.db) contains:
- `business_settings` - Company information and branding
- `templates` - Template storage with versioning
- `invoice_history` - Generated invoice tracking
- `app_settings` - Application configuration

## Template Development

Templates are Handlebars (.hbs) files in src/templates/:
- Support for RTL languages (Hebrew) with proper CSS
- Logo handling with business branding
- Responsive design for PDF generation
- Print-optimized CSS with proper margins

When creating new templates:
1. Follow existing naming conventions (e.g., `exempt_business_receipt.hbs`)
2. Include proper meta tags for character encoding
3. Use RTL styling for Hebrew content
4. Test with `/api/preview` endpoint before PDF generation

## File Upload Configuration

- Logo uploads to `public/uploads/logos/`
- 5MB file size limit
- Allowed formats: jpeg, jpg, png, gif
- Multer middleware handles upload processing
- Files renamed with timestamp and random suffix

## Docker Configuration

The Dockerfile:
- Uses Node.js 18 bullseye-slim base
- Installs Chrome dependencies for Puppeteer
- Creates non-root user `pptruser` for security
- Exposes port 3000
- Handles persistent storage for database and uploads

## Project Structure Context

The `src/` directory follows MVC pattern:
- `controllers/` - Handle PDF generation, template management, business logic
- `routes/` - Define API endpoints and parameter validation
- `models/` - Database schemas and connection management
- `templates/` - Handlebars HTML templates for different invoice types
- `utils/` - PDF generation utilities, template helpers, file management
- `middleware/` - Express middleware functions

The `public/` directory serves static assets and user uploads, while `views/` contains the management UI templates (EJS) for the web interface.

## Development Notes

When adding new invoice types, create corresponding templates in src/templates/ and update the controller logic to handle the new template selection. Template data structure should be consistent across types for n8n integration compatibility.

For Dokploy deployment, the application runs on port 3000 and requires persistent storage for uploads and database files.

Error messages and console logs are in Hebrew, reflecting the target market for this invoice system.