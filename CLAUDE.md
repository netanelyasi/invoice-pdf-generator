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

**Database Schema:**
- SQLite for simplicity in single-instance deployments
- Tables: templates, business_settings, invoice_data (if persistence needed)
- File uploads stored in public/uploads/ with database references

**n8n Integration Points:**
- `/api/generate-pdf` - Primary endpoint for PDF generation
- `/api/templates` - Template management for workflow configuration
- Rate limiting implemented via express-rate-limit for API protection

**Business Logic Requirements:**
- Support for exempt business receipts (current requirement)
- Future tax invoice compliance (GST/VAT ready structure)
- Dynamic template fields for various invoice types
- Logo and branding customization per business profile

## Project Structure Context

The `src/` directory follows MVC pattern:
- `controllers/` - Handle PDF generation, template management, business logic
- `routes/` - Define API endpoints and parameter validation
- `models/` - Database schemas for templates, settings, and invoice data
- `templates/` - Handlebars HTML templates for different invoice types
- `utils/` - PDF generation utilities, template helpers, file management

The `public/` directory serves static assets and user uploads, while `views/` contains the management UI templates for the web interface.

## Development Notes

When adding new invoice types, create corresponding templates in src/templates/ and update the controller logic to handle the new template selection. Template data structure should be consistent across types for n8n integration compatibility.

For Dokploy deployment, the application runs on port 3000 and requires persistent storage for uploads and database files.