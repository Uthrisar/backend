const express = require('express');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const { connectToMongoDB } = require('./connect');
const Razorpay = require('razorpay');
const crypto = require('crypto'); 
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
const port = 8080;

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Configure Mailtrap transporter
const transporter = nodemailer.createTransport({
  host: process.env.MAILTRAP_HOST,
  port: process.env.MAILTRAP_PORT,
  auth: {
    user: process.env.MAILTRAP_USER,
    pass: process.env.MAILTRAP_PASS
  }
});

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

// Order storage (replace with your MongoDB model later)
let orders = [];

// Create Razorpay Order
app.post('/create-order', async (req, res) => {
  try {
    const { amount, currency, receipt } = req.body;

    const options = {
      amount: amount * 100, // Razorpay expects amount in paise (multiply by 100 for INR)
      currency,
      receipt,
      payment_capture: 1 // Auto-capture payment
    };

    const response = await razorpay.orders.create(options);
    
    res.json({
      id: response.id,
      currency: response.currency,
      amount: response.amount
    });

  } catch (error) {
    console.error('Razorpay order error:', error);
    res.status(500).json({ error: 'Error creating payment order' });
  }
});

app.post('/verify-payment', async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      order_data,
      customer_email
    } = req.body;

    // 1. Verify Signature
    const generated_signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generated_signature !== razorpay_signature) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid payment signature' 
      });
    }

    // 2. Save Order to Database
    const order = {
      id: razorpay_order_id,
      payment_id: razorpay_payment_id,
      amount: order_data.amount / 100,
      currency: order_data.currency,
      product: order_data.notes?.product,
      variant: order_data.notes?.variant,
      customer: order_data.notes?.customer,
      status: 'completed',
      created_at: new Date()
    };

    // Save to database (replace with your actual DB logic)
    orders.push(order);
    // Send Confirmation Email
    await sendConfirmationEmail(order, customer_email);

    // 3. Send Response
    res.json({
      success: true,
      redirectUrl: `/confirmation/${razorpay_order_id}`
    });

  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Payment verification failed' 
    });
  }
});

// Email sending function
async function sendConfirmationEmail(order, recipientEmail) {
  try {
    const mailOptions = {
      from: '"CodeMaster Store" <test1234@gmail.com>',
      to: recipientEmail,
      subject: `Order Confirmation #${order.id}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4361ee;">Thank you for your order!</h2>
          <p>Your order has been confirmed and will be processed shortly.</p>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Order Details</h3>
            <p><strong>Order ID:</strong> ${order.id}</p>
            <p><strong>Product:</strong> ${order.product}</p>
            <p><strong>Variant:</strong> ${JSON.stringify(order.variant)}</p>
            <p><strong>Amount:</strong> ${order.amount} ${order.currency}</p>
            <p><strong>Payment ID:</strong> ${order.payment_id}</p>
            <p><strong>Date:</strong> ${order.created_at.toLocaleString()}</p>
          </div>
          
          <p>You can view your order details anytime at our website.</p>
          <p>If you have any questions, please contact our support team.</p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p>Best regards,<br>The CodeMaster Team</p>
          </div>
        </div>
      `,
      text: `Thank you for your order #${order.id}!\n\n` +
            `Product: ${order.product}\n` +
            `Amount: ${order.amount} ${order.currency}\n\n` +
            `You can view your order details at our website.`
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('📧 Confirmation email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('❌ Email sending failed:', error);
    throw error;
  }
}

// Testing mail transport
// app.get('/test-mailtrap', async (req, res) => {
//   try {
//     const info = await transporter.sendMail({
//       from: '"Test" <test@example.com>',
//       to: recipientEmail,
//       subject: 'Mailtrap Test',
//       text: 'This is a test email from Mailtrap'
//     });
//     res.send(`Email sent: ${info.messageId}`);
//   } catch (error) {
//     console.error('Mailtrap test error:', error);
//     res.status(500).send(`Error: ${error.message}`);
//   }
// });

// Order Confirmation Page
app.get('/confirmation/:order_id', (req, res) => {
  const order = orders.find(o => o.id === req.params.order_id);
  if (!order) {
    return res.status(404).send('Order not found');
  }
  res.render('confirmation', { order });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});