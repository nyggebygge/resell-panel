const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const router = express.Router();
const User = require('../models/User');
const Transaction = require('../models/Transaction');

// Stripe webhook endpoint
router.post('/stripe', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        console.log('PaymentIntent succeeded:', paymentIntent.id);
        
        // Update transaction status if needed
        await Transaction.findOneAndUpdate(
          { paymentId: paymentIntent.id },
          { 
            status: 'completed',
            processedAt: new Date()
          }
        );
        break;

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object;
        console.log('PaymentIntent failed:', failedPayment.id);
        
        // Update transaction status
        await Transaction.findOneAndUpdate(
          { paymentId: failedPayment.id },
          { 
            status: 'failed',
            processedAt: new Date()
          }
        );
        break;

      case 'payment_intent.canceled':
        const canceledPayment = event.data.object;
        console.log('PaymentIntent canceled:', canceledPayment.id);
        
        // Update transaction status
        await Transaction.findOneAndUpdate(
          { paymentId: canceledPayment.id },
          { 
            status: 'cancelled',
            processedAt: new Date()
          }
        );
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
});

module.exports = router;
