import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

// Test route
app.get('/test', (req, res) => {
  res.json({
    message: 'Server is working!',
    timestamp: new Date().toISOString()
  });
});

// Test auth routes
app.post('/api/auth/change-password', (req, res) => {
  res.json({
    success: true,
    message: 'Change password route exists'
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Test server running on port ${PORT}`);
  console.log(`📡 Test route: http://localhost:${PORT}/test`);
  console.log(`🔐 Change password route: http://localhost:${PORT}/api/auth/change-password`);
});
