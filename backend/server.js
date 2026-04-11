import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import jwt from "jsonwebtoken";
import { pool, initDB } from "./db.js";
import authRoutes from "./routes/auth.js";
import * as emailService from "./emailService.js";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "changeme";

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database tables
initDB().catch(err => console.error('DB init error:', err));

// Import order routes
import orderRoutes from "./routes/orders.js";

// Auth routes
app.use("/api/auth", authRoutes);

// Order routes (protected with authentication)
app.use("/api/orders", orderRoutes);

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Database connection error:', err);
  } else {
    console.log('✓ Database connected successfully');
  }
});

// ==================== PRODUCTS API ====================

// Get all products
app.get('/api/products', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM products WHERE active = true ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get single product by ID
app.get('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM products WHERE id = $1 AND active = true',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// Get products by category
app.get('/api/products/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const result = await pool.query(
      'SELECT * FROM products WHERE category = $1 AND active = true ORDER BY created_at DESC',
      [category]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching products by category:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// ==================== CUSTOM ORDERS API ====================

// Submit custom order request
app.post('/api/custom-orders', async (req, res) => {
  try {
    const { name: bodyName, email: bodyEmail, phone: bodyPhone, description, budget, urgency } = req.body;

    // If Authorization header present, try to use authenticated user's email
    let email = bodyEmail;
    try {
      const authHeader = req.headers.authorization;
      if (authHeader) {
        const token = authHeader.split(' ')[1];
        if (token) {
          const decoded = jwt.verify(token, JWT_SECRET);
          if (decoded && decoded.email) email = decoded.email;
        }
      }
    } catch (err) {
      // ignore token errors and fall back to provided email
    }

    const name = bodyName || 'Customer';
    const phone = bodyPhone || '';

    if (!name || !email || !description) {
      return res.status(400).json({ error: 'Name, email, and description are required' });
    }

    const requestId = `REQ-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const result = await pool.query(
      `INSERT INTO custom_orders (request_id, name, email, phone, description, budget, urgency, status, created_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW()) 
       RETURNING *`,
      [requestId, name, email, phone, description, budget || null, urgency || 'normal', 'pending']
    );

    const customOrder = result.rows[0];

    // Send confirmation emails
    await emailService.sendCustomOrderConfirmation(customOrder);
    await emailService.sendOwnerCustomOrderNotification(customOrder);

    res.status(201).json({
      success: true,
      message: 'Custom order request submitted successfully',
      requestId: customOrder.request_id
    });

  } catch (error) {
    console.error('Error creating custom order:', error);
    res.status(500).json({ error: 'Failed to submit custom order request' });
  }
});

// ==================== HEALTH CHECK ====================

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server with proper error handling and SO_REUSEADDR (local only)
let server;

if (!process.env.VERCEL) {
  server = http.createServer(app);

  server.listen(
    {
      port: PORT,
      host: '0.0.0.0',
      reuseAddr: true
    },
    () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📍 http://localhost:${PORT}`);
    }
  );

  // Handle EADDRINUSE error - port already in use
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`❌ Port ${PORT} is already in use`);
      console.error(`   Try killing existing processes:`);
      console.error(`   Get-Process -Name node | Stop-Process -Force`);
      process.exit(1);
    } else {
      console.error('Server error:', err);
      process.exit(1);
    }
  });

  // Graceful shutdown on signals
  const shutdown = () => {
    console.log('\n⏹️  Shutting down gracefully...');
    server.close(() => {
      console.log('✓ Server closed');
      pool.end().catch(console.error);
      process.exit(0);
    });
    
    // Force exit after 10 seconds
    setTimeout(() => {
      console.error('❌ Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

export default app;
