const express = require('express');
const router = express.Router();
const Stripe = require('stripe');
const { verifyToken } = require('../middlewares/authMiddleware');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// Checkout Route
router.post('/create-checkout-session', verifyToken, async (req, res) => {
  const { cart, shippingInfo } = req.body;
  const userId = req.user.userId; 

  console.log("User from token:", req.user);

 const lineItems = cart.map(item => ({
  price_data: {
    currency: 'pkr', // 
    product_data: {
      name: item.name,
    },
    unit_amount: Math.round(item.price * 100), //  PKR (converted to paisa)
  },
  quantity: item.quantity,
}));

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    line_items: lineItems,
    success_url: `${req.headers.origin}/success.html?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${req.headers.origin}/cart.html`,
    metadata: {
      userId: String(userId),
      shippingName: shippingInfo.name,
      shippingCity: shippingInfo.city,
      shippingZip: shippingInfo.zip,
    },
  });

  res.json({ url: session.url });
});

module.exports = router;
