import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { cors } from 'hono/cors'
import auth from './routes/auth'
import transactions from './routes/transactions'
import categories from './routes/categories'
import reports from './routes/reports'
import openapi from './routes/openapi'
import swaggerui from './routes/swaggerui'
import { logger } from 'hono/logger'
import mock from './routes/mock'
import account from './routes/account'

const app = new Hono()

// Enable CORS
app.use('*', cors())
app.use('*', logger())

// Health check endpoint
app.get("/api/health", (c) => {
  return c.json({ status: "ok", message: "Server is running" });
});

// API Routes
app.route('/api/auth', auth)
app.route('/api/transactions', transactions)
app.route('/api/categories', categories)
app.route('/api/reports', reports)
app.route('/openapi.json', openapi)
app.route('/docs', swaggerui)
app.route('/api/mock', mock)
app.route('/api/account', account)

// Health check
app.get('/health', (c) => c.json({ status: 'ok' }))

serve({
  fetch: app.fetch,
  port: 3000
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})

export default app
