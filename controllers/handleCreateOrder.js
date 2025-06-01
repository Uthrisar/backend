const Razorpay = require('razorpay');
require('dotenv').config();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

const handleCreateOrder = async (req, res) => {
  try {
    const { amount, currency, receipt, notes } = req.body;

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
      amount: response.amount,
      notes
    });

  } catch (error) {
    console.error('Razorpay order error:', error);
    res.status(500).json({ error: 'Error creating payment order' });
  }
};

module.exports = { handleCreateOrder };