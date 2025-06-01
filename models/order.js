const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  product: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  variant: {
    color: {
      type: String,
      required: [true, 'Color is required']
    },
    size: {
      type: Number,
      required: [true, 'Size is required']
    }
  },
  date: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'cancelled', 'shipped'],
    default: 'pending'
  },
  customer: {
    name: String,
    email: {
      type: String,
      match: [/.+\@.+\..+/, 'Please enter a valid email']
    },
    address: {
      street: String,
      city: String,
      state: String,
      zip: String,
      country: String
    }
  },
  paymentMethod: {
    type: String,
    enum: ['credit_card', 'paypal', 'bank_transfer', 'cash_on_delivery'],
    required: true
  }
}, {
  timestamps: true // Adds createdAt and updatedAt fields
});

// Add indexes for better query performance
orderSchema.index({ product: 'text' });
orderSchema.index({ 'variant.color': 1 });
orderSchema.index({ date: -1 });

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;