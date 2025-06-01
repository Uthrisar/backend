const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: process.env.MAILTRAP_HOST,
  port: process.env.MAILTRAP_PORT,
  auth: {
    user: process.env.MAILTRAP_USER,
    pass: process.env.MAILTRAP_PASS
  }
});

const handleSendConfirmationEmail = async(order, recipientEmail)=> {
  try {
    const mailOptions = {
      from: '"CodeMaster Store" <no-reply@codemaster.com>',
      to: recipientEmail,
      subject: `Order Confirmation #${order._id}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4361ee;">Thank you for your order!</h2>
          <p>Your order #${order._id} has been confirmed.</p>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Order Details</h3>
            <p><strong>Product:</strong> ${order.product}</p>
            <p><strong>Variant:</strong> ${order.variant.color}, Size ${order.variant.size}</p>
            <p><strong>Amount:</strong> ₹${order.price}</p>
            <p><strong>Payment Method:</strong> Razorpay</p>
            <p><strong>Payment ID:</strong> ${order.razorpayPaymentId}</p>
            <p><strong>Status:</strong> ${order.status}</p>
            <p><strong>Date:</strong> ${order.createdAt.toLocaleString()}</p>
          </div>
          
          <p>Shipping to:</p>
          <address>
            ${order.customer.name}<br>
            ${order.customer.address.street}<br>
            ${order.customer.address.city}, ${order.customer.address.state} ${order.customer.address.zip}<br>
            ${order.customer.address.country}
          </address>
        </div>
      `,
      text: `Thank you for your order #${order._id}\n\n` +
            `Product: ${order.product}\n` +
            `Amount: ₹${order.price}\n` +
            `Payment Method: Razorpay\n` +
            `Payment ID: ${order.razorpayPaymentId}\n` +
            `Status: ${order.status}\n\n` +
            `Shipping to:\n${order.customer.name}\n` +
            `${Object.values(order.customer.address).join('\n')}`
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('📧 Confirmation email sent for order:', order._id);
    return info;
  } catch (error) {
    console.error('❌ Email sending failed for order:', order._id, error);
    throw error;
  }
}

module.exports = { handleSendConfirmationEmail };