const express = require('express');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const { connectToMongoDB } = require('./connect');
const { handleVarifyPayment } = require('./controllers/handleVerifyPayment');
const { handleCreateOrder } = require('./controllers/handleCreateOrder');
const { handleOrderConfirmation } = require('./controllers/handleOrderConfirmation');
require('dotenv').config();

const app = express();
const port = 8080;

// Configure view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:8080'],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(bodyParser.json());
app.use(express.static('public'));

// Connect to MongoDB
connectToMongoDB('mongodb://localhost:27017/ecom-db');

// Create Razorpay Order
app.post('/create-order', handleCreateOrder);

app.post('/verify-payment', handleVarifyPayment);

// Order Confirmation Page
app.get('/confirmation/:order_id', handleOrderConfirmation);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});