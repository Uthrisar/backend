 const Order = require('../models/order');
 
 const handleOrderConfirmation = async (req, res) => {
  try {
    const order = await Order.findById(req.params.order_id);
    if (!order) {
      return res.status(404).render('error', { 
        message: 'Order not found' 
      });
    }
    res.render('confirmation', { 
      order: order.toObject() 
    });
  } catch (error) {
    console.error('Order lookup error:', error);
    res.status(500).render('error', {
      message: 'Error retrieving order details'
    });
  }
};

module.exports = { handleOrderConfirmation };