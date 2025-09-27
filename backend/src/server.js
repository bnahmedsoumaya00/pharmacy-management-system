const express = require('express');
const cors = require('cors');
const { sequelize, testConnection } = require('./config/database');
const { helmet, generalLimiter, authLimiter } = require('./middleware/security');

// Import models with relationships
const { User, Medicine, Category, Customer, Sale, SaleItem } = require('./models/index');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security Middleware
app.use(helmet);
app.use(generalLimiter);

// CORS Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware (development only)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// Database connection and sync
async function initializeDatabase() {
  try {
    await testConnection();
    await sequelize.sync({ alter: true }); // ✅ Changed from false to true
    console.log('✅ Database connected and synchronized');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
}

// Health check routes
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Pharmacy Management System API is running!',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', async (req, res) => {
  try {
    await sequelize.authenticate();
    res.json({
      success: true,
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message
    });
  }
});

app.get('/api/test-db', async (req, res) => {
  try {
    await sequelize.authenticate();
    const userCount = await User.count();
    const medicineCount = await Medicine.count();
    
    res.json({
      success: true,
      message: 'Database connection successful',
      counts: {
        users: userCount,
        medicines: medicineCount
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Database connection failed',
      error: error.message
    });
  }
});

// API Routes
const authRoutes = require('./routes/authRoutes');
const medicineRoutes = require('./routes/medicineRoutes');
const customerRoutes = require('./routes/customerRoutes');
const salesRoutes = require('./routes/salesRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const supplierRoutes = require('./routes/supplierRoutes'); // UNCOMMENT THIS LINE

// Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/medicines', medicineRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/categories', categoryRoutes);       // ✅ Working
app.use('/api/suppliers', supplierRoutes);       // 🚀 ADD THIS LINE
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/reports', require('./routes/reportsRoutes'));

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  
  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// Handle 404 routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await sequelize.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  await sequelize.close();
  process.exit(0);
});

// Start server
const startServer = async () => {
  await initializeDatabase();
  
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Dashboard: http://localhost:${PORT}`);
    console.log(`🔗 API Base: http://localhost:${PORT}/api`);
    console.log(`💚 Health Check: http://localhost:${PORT}/health`);
  });
};

startServer().catch(console.error);