const express = require('express');
const router = express.Router();
const Stripe = require('stripe');
const { Order } = require('../models');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// POST /webhook
router.post('/', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    console.log(" Webhook received:", event.type);
  } catch (err) {
    console.error(" Webhook error:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    console.log(" Stripe Session Data:", session);

    try {
     const userId = parseInt(session.metadata.userId);

if (!userId || isNaN(userId)) {
  console.error(" Invalid userId received in webhook:", session.metadata.userId);
  return res.status(400).send("Invalid userId");
}
      const shippingInfo = {
        name: session.metadata.shippingName,
        city: session.metadata.shippingCity,
        zip: session.metadata.shippingZip,
        address: 'N/A' // optional or fill later
      };

      await Order.create({
        userId,
        items: [], // Cannot store full cart now — store later if needed
        totalAmount: session.amount_total / 100,
        shippingInfo,
        paymentStatus: session.payment_status
      });

      console.log(" Order saved to DB!");
    } catch (dbErr) {
      console.error(" DB Error while saving order:", dbErr);
    }
  }

  res.json({ received: true });
});

module.exports = router;
