const Order = require('../models/order');
const crypto = require('crypto'); 
const { handleSendConfirmationEmail } = require('./handleSendConfirmationEmail');

const handleVarifyPayment = async(req, res)=> {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      order_data,
      customer_email
    } = req.body;

    console.log("Order Data : ", order_data);

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

    // 2. Create and Save Order to MongoDB
    const newOrder = new Order({
      product: order_data.notes?.product || 'Unknown Product',
      price: order_data.amount / 100,
      variant: {
        color: order_data.notes?.variant?.color || 'Unknown',
        size: order_data.notes?.variant?.size || 0
      },
      status: 'completed',
      paymentMethod: 'razorpay',
      razorpayPaymentId: razorpay_payment_id,
      razorpayOrderId: razorpay_order_id,
      razorpaySignature: razorpay_signature,
      customer: {
        name: order_data.notes?.customer?.name || 'Anonymous',
        email: customer_email,
        address: order_data.notes?.customer?.address || {
          street: 'Not provided',
          city: 'Not provided',
          state: 'Not provided',
          zip: 'Not provided',
          country: 'Not provided'
        }
      }
    });

    const savedOrder = await newOrder.save();
    console.log('Order saved to MongoDB:', savedOrder._id);

    // 3. Send Confirmation Email
    await handleSendConfirmationEmail(savedOrder, customer_email);

    // 4. Send Response
    res.json({
      success: true,
      redirectUrl: `/confirmation/${savedOrder._id}`
    });

  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Payment verification failed',
      details: error.message
    });
  }
};

module.exports = {
    handleVarifyPayment,
};