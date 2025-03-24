# NodeMailer Service

//Version 2

A simple and type-safe Node.js service for sending emails using Nodemailer.

## Features

- TypeScript support with strict type checking
- Express server with CORS enabled
- Environment variable configuration
- Health check endpoint
- Simple email sending API

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env` and fill in your SMTP credentials:
   ```bash
   cp .env.example .env
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

## API Endpoints

### Health Check

```
GET /health
```

### Send Email

```
POST /api/send-email
Content-Type: application/json

{
  "to": "recipient@example.com",
  "subject": "Test Email",
  "text": "This is a test email",
  "html": "<p>This is a test email</p>" // Optional
}
```

## Deployment to Vercel

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add your environment variables in the Vercel dashboard
4. Deploy!

## Environment Variables

- `PORT`: Server port (default: 3000)
- `SMTP_HOST`: SMTP server host
- `SMTP_PORT`: SMTP server port
- `SMTP_SECURE`: Use SSL/TLS (true/false)
- `SMTP_USER`: SMTP username
- `SMTP_PASS`: SMTP password
- `SMTP_FROM`: Default sender email address
