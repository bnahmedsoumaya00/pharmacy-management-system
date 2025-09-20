const express = require('express');
const cors = require('cors');
const { sequelize, testConnection } = require('./config/database');
const User = require('./models/User');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
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
    console.log('Request headers:', req.headers);
    console.log('Request body:', req.body);
    next();
  });
}

// Database connection and sync
async function initializeDatabase() {
  try {
    // Test connection
    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error('Database connection failed');
    }

    // Sync models (be careful in production!)
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ 
        alter: true,  // This updates existing tables
        logging: console.log
      });
      console.log('📦 Database models synchronized successfully');
    }

    return true;
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    return false;
  }
}

// Health check route
app.get('/', (req, res) => {
  res.json({
    message: '🏥 Pharmacy Management System API',
    version: '1.0.0',
    status: 'Running',
    developer: 'Soumaya Ben Ahmed',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      database: '/api/test-db',
      users: '/api/users/count'
    }
  });
});

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    await sequelize.authenticate();
    res.json({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Test database connection endpoint
app.get('/api/test-db', async (req, res) => {
  try {
    const userCount = await User.count();
    const activeUserCount = await User.count({ where: { isActive: true } });
    
    res.json({
      message: '✅ Database connection successful',
      data: {
        totalUsers: userCount,
        activeUsers: activeUserCount,
        databaseName: process.env.DB_NAME || 'pharmacy_db'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database test error:', error);
    res.status(500).json({
      message: '❌ Database connection failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// API Routes
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

// Get user count endpoint
app.get('/api/users/count', async (req, res) => {
  try {
    const counts = await Promise.all([
      User.count(),
      User.count({ where: { role: 'admin' } }),
      User.count({ where: { role: 'pharmacist' } }),
      User.count({ where: { role: 'cashier' } }),
      User.count({ where: { isActive: true } })
    ]);

    res.json({
      message: 'User statistics retrieved successfully',
      data: {
        total: counts[0],
        admins: counts[1],
        pharmacists: counts[2],
        cashiers: counts[3],
        active: counts[4]
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('User count error:', error);
    res.status(500).json({
      message: 'Failed to retrieve user statistics',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    message: 'Route not found',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🔄 Gracefully shutting down...');
  try {
    await sequelize.close();
    console.log('📦 Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
});

// Start server
const startServer = async () => {
  try {
    const dbInitialized = await initializeDatabase();
    
    if (!dbInitialized) {
      console.error('❌ Failed to initialize database. Exiting...');
      process.exit(1);
    }

    app.listen(PORT, () => {
      console.log('\n🚀 Pharmacy Management System API');
      console.log(`📍 Server running on: http://localhost:${PORT}`);
      console.log(`🏥 Developer: Soumaya Ben Ahmed`);
      console.log(`📅 Started: ${new Date().toLocaleString()}`);
      console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log('─'.repeat(50));
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

// Start the server
startServer();