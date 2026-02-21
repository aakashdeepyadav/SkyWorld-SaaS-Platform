import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Test MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
  }
};

const app = express();

// Basic middleware
app.use(express.json());

// Test routes
app.get('/test', (req, res) => {
  res.json({
    message: 'Server is working!',
    timestamp: new Date().toISOString()
  });
});

// Import auth routes (without email service for now)
app.use('/api/auth', (req, res, next) => {
  console.log(`🔐 Auth route hit: ${req.method} ${req.path}`);
  next();
});

// Mock change-password route for testing
app.post('/api/auth/change-password', (req, res) => {
  console.log('📝 Change password route called');
  res.json({
    success: true,
    message: 'Change password route exists and working'
  });
});

const startServer = async () => {
  await connectDB();
  
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 Test route: http://localhost:${PORT}/test`);
    console.log(`🔐 Change password route: http://localhost:${PORT}/api/auth/change-password`);
  });
};

startServer();
