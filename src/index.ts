import express, { Request, Response, RequestHandler } from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import nodemailer from 'nodemailer'

// Load environment variables
dotenv.config()

const app = express()
const port = process.env.PORT || 3000

// CORS Configuration
const corsOptions = {
  origin: true, // Reflect the request origin, or use '*'
  credentials: true,
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
  ],
  preflightContinue: false,
  optionsSuccessStatus: 204,
}

// Apply CORS globally - this must come before routes
app.use(cors(corsOptions))

// Pre-flight OPTIONS handler
app.options('*', cors(corsOptions))

// Parse JSON body
app.use(express.json())

// Root endpoint
app.get('/', (_, res) => {
  res.json({ message: 'NodeMailer API is running' })
})

// Health check endpoint
app.get('/health', (_, res) => {
  res.json({ status: 'ok' })
})

// Email configuration type
interface EmailConfig {
  host: string
  port: number
  secure: boolean
  auth: {
    user: string
    pass: string
  }
  connectionTimeout?: number
  greetingTimeout?: number
  socketTimeout?: number
  debug?: boolean
  tls?: {
    rejectUnauthorized: boolean
  }
  pool?: boolean
  maxConnections?: number
  maxMessages?: number
}

// Email request type
interface EmailRequest {
  to: string
  subject: string
  text: string
  html?: string
}

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  // Add timeouts to prevent hanging connections
  connectionTimeout: 10000, // 10 seconds
  greetingTimeout: 10000, // 10 seconds
  socketTimeout: 10000, // 10 seconds
  debug: true, // Enable debug output
  tls: {
    rejectUnauthorized: false, // Don't reject self-signed or invalid certs
  },
  pool: true, // Use connection pooling
  maxConnections: 5, // Limit concurrent connections
  maxMessages: 100, // Limit messages per connection
} as EmailConfig)

// Verify transporter connection at startup
transporter
  .verify()
  .then(() => console.log('SMTP connection verified'))
  .catch((err) => console.error('SMTP connection failed:', err))

// Send email endpoint
const sendEmailHandler: RequestHandler = async (req, res) => {
  // Add CORS headers explicitly
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  try {
    const { to, subject, text, html }: EmailRequest = req.body

    if (!to || !subject || !text) {
      res.status(400).json({ error: 'Missing required fields' })
      return
    }

    const mailOptions = {
      from: process.env.SMTP_FROM,
      to,
      subject,
      text,
      html: html || text,
    }

    // Retry logic for sending email
    const maxRetries = 3
    let retryCount = 0
    let lastError: any = null

    while (retryCount < maxRetries) {
      try {
        console.log(`Attempt ${retryCount + 1} to send email to: ${to}`)
        const info = await transporter.sendMail(mailOptions)
        console.log('Email sent successfully, messageId:', info.messageId)
        res.json({
          message: 'Email sent successfully',
          messageId: info.messageId,
          attempts: retryCount + 1,
        })
        return // Exit on success
      } catch (error) {
        console.error(`Attempt ${retryCount + 1} failed:`, error)
        lastError = error
        retryCount++

        if (retryCount < maxRetries) {
          // Wait before retry (exponential backoff)
          const delay = retryCount * 1000
          console.log(`Waiting ${delay}ms before retry...`)
          await new Promise((resolve) => setTimeout(resolve, delay))
        }
      }
    }

    // If we get here, all retries failed
    throw lastError
  } catch (error) {
    console.error('Error sending email after all retries:', error)

    // Enhanced error reporting
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'
    const errorName = error instanceof Error ? error.name : 'Error'
    const errorCode =
      error instanceof Error && 'code' in error
        ? (error as any).code
        : 'UNKNOWN'

    res.status(500).json({
      error: 'Failed to send email',
      details: errorMessage,
      type: errorName,
      code: errorCode,
      smtp: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
    })
  }
}

app.post('/api/send-email', sendEmailHandler)

app.listen(port, () => {
  console.log(`Server running on port ${port}`)
})
