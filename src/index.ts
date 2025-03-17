import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import nodemailer from 'nodemailer'

// Load environment variables
dotenv.config()

const app = express()
const port = process.env.PORT || 3000

// Handle CORS - explicitly handle OPTIONS preflight
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
  res.header(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, Content-Length, X-Requested-With',
  )
  res.sendStatus(200)
})

// Global CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
  res.header(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, Content-Length, X-Requested-With',
  )
  next()
})

// Apply regular CORS middleware as well
app.use(cors({ origin: '*' }))
app.use(express.json())

// Email configuration type
interface EmailConfig {
  host: string
  port: number
  secure: boolean
  auth: {
    user: string
    pass: string
  }
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
} as EmailConfig)

// Health check endpoint
app.get('/health', (_, res) => {
  res.json({ status: 'ok' })
})

// Send email endpoint
app.post('/api/send-email', async (req, res) => {
  try {
    const { to, subject, text, html }: EmailRequest = req.body

    if (!to || !subject || !text) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    const mailOptions = {
      from: process.env.SMTP_FROM,
      to,
      subject,
      text,
      html: html || text,
    }

    await transporter.sendMail(mailOptions)
    res.json({ message: 'Email sent successfully' })
  } catch (error) {
    console.error('Error sending email:', error)
    res.status(500).json({ error: 'Failed to send email' })
  }
})

app.listen(port, () => {
  console.log(`Server running on port ${port}`)
})
