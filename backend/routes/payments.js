const express = require('express');

// Debug environment variables
console.log('🔍 STRIPE_SECRET_KEY:', process.env.STRIPE_SECRET_KEY ? 'Set' : 'Not set');
console.log('🔍 STRIPE_SECRET_KEY length:', process.env.STRIPE_SECRET_KEY ? process.env.STRIPE_SECRET_KEY.length : 0);

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

// Create payment intent
router.post('/create-payment-intent', authenticateToken, async (req, res) => {
  try {
    const { amount, currency = 'usd', productId, productName } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid amount'
      });
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      metadata: {
        userId: req.user.id,
        productId: productId || '',
        productName: productName || ''
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    console.error('Stripe payment intent creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment intent'
    });
  }
});

// Confirm payment and process purchase
router.post('/confirm-payment', authenticateToken, async (req, res) => {
  try {
    const { paymentIntentId, productId, productName, price, credits } = req.body;
    
    if (!paymentIntentId) {
      return res.status(400).json({
        success: false,
        message: 'Payment intent ID is required'
      });
    }

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({
        success: false,
        message: 'Payment not completed'
      });
    }

    // Get user
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Add credits for successful Stripe payment (they paid with real money)
    user.credits += credits;
    await user.save();

    // Create transaction record
    const transaction = await Transaction.create({
      userId: user.id,
      type: 'purchase',
      amount: price, // Positive amount (money received)
      currency: 'USD',
      status: 'completed',
      paymentMethod: 'stripe',
      paymentId: paymentIntent.id,
      description: `Purchase: ${productName}`,
      productId,
      productName,
      keyCount: credits,
      processedAt: new Date()
    });

    res.json({
      success: true,
      message: 'Payment processed successfully',
      data: {
        transaction: {
          id: transaction.id,
          amount: transaction.amount,
          credits: credits,
          status: transaction.status,
          date: transaction.createdAt
        },
        user: {
          credits: user.credits
        }
      }
    });
  } catch (error) {
    console.error('Payment confirmation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to confirm payment'
    });
  }
});

// Get payment methods for user
router.get('/payment-methods', authenticateToken, async (req, res) => {
  try {
    // In a real implementation, you might store customer IDs
    // For now, we'll return empty array as we're not storing customer data
    res.json({
      success: true,
      paymentMethods: []
    });
  } catch (error) {
    console.error('Get payment methods error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve payment methods'
    });
  }
});

// Create customer (optional - for saving payment methods)
router.post('/create-customer', authenticateToken, async (req, res) => {
  try {
    const { email, name } = req.body;
    
    const customer = await stripe.customers.create({
      email: email || req.user.email,
      name: name || req.user.username,
      metadata: {
        userId: req.user.id
      }
    });

    // Update user with Stripe customer ID
    await User.update({
      stripeCustomerId: customer.id
    }, {
      where: { id: req.user.id }
    });

    res.json({
      success: true,
      customerId: customer.id
    });
  } catch (error) {
    console.error('Create customer error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create customer'
    });
  }
});

// Create Stripe Checkout Session (NEW - for hosted checkout)
router.post('/create-checkout-session', authenticateToken, async (req, res) => {
  try {
    const { productId, productName, price, credits } = req.body;
    
    console.log('Creating checkout session:', { productId, productName, price, credits });
    
    if (!productName || price === undefined || !credits) {
      return res.status(400).json({
        success: false,
        message: 'Product name, price, and credits are required'
      });
    }
    
    // Handle free products through Stripe (for testing)
    if (price === 0) {
      console.log('🎉 Free product detected, creating Stripe session for testing...');
      console.log('🔍 Free product details:', { productId, productName, price, credits });
      
      try {
        // Create a Stripe checkout session even for free products
        // This allows testing the full Stripe flow
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          line_items: [
            {
              price_data: {
                currency: 'usd',
                product_data: {
                  name: productName,
                  description: `${credits} credits for your account (FREE TEST PRODUCT)`
                },
                unit_amount: 50, // 50 cents for free test product
              },
              quantity: 1,
            },
          ],
          mode: 'payment',
          success_url: `${process.env.FRONTEND_URL || process.env.RAILWAY_PUBLIC_DOMAIN || 'http://localhost:3001'}/store?success=true&session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${process.env.FRONTEND_URL || process.env.RAILWAY_PUBLIC_DOMAIN || 'http://localhost:3001'}/store?canceled=true`,
          metadata: {
            productId: productId,
            productName: productName,
            credits: credits,
            userId: req.user.id,
            isFreeProduct: 'true' // Flag to identify free products
          }
        });
        
        console.log('✅ Free product Stripe session created:', session.id);
        
        return res.json({
          success: true,
          sessionId: session.id,
          url: session.url,
          isFreeProduct: true
        });
      } catch (stripeError) {
        console.error('❌ Free product Stripe session creation failed:', stripeError);
        return res.status(500).json({
          success: false,
          message: 'Failed to create Stripe checkout session for free product',
          error: stripeError.message
        });
      }
    }
    
    // Handle paid products with Stripe Checkout
    try {
      console.log('💰 Creating Stripe session for paid product:', { productName, price, credits });
      
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: productName,
                description: `${credits} credits for your account`
              },
              unit_amount: Math.round(price * 100), // Convert to cents
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${process.env.FRONTEND_URL || process.env.RAILWAY_PUBLIC_DOMAIN || 'http://localhost:3001'}/store?success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FRONTEND_URL || process.env.RAILWAY_PUBLIC_DOMAIN || 'http://localhost:3001'}/store?canceled=true`,
        metadata: {
          productId: productId,
          productName: productName,
          credits: credits,
          userId: req.user.id
        }
      });
      
      console.log('✅ Paid product Stripe session created:', session.id);
      
      res.json({
        success: true,
        sessionId: session.id,
        url: session.url
      });
    } catch (stripeError) {
      console.error('❌ Paid product Stripe session creation failed:', stripeError);
      res.status(500).json({
        success: false,
        message: 'Failed to create Stripe checkout session for paid product',
        error: stripeError.message
      });
    }
  } catch (error) {
    console.error('Checkout session creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create checkout session'
    });
  }
});

// Handle successful checkout (webhook or direct call)
router.post('/checkout-success', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'Session ID is required'
      });
    }
    
    // Retrieve the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (session.payment_status !== 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Payment not completed'
      });
    }
    
    // Get user
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Add credits
    const credits = parseInt(session.metadata.credits);
    user.credits += credits;
    await user.save();
    
    // Determine if this was a free product
    const isFreeProduct = session.metadata.isFreeProduct === 'true';
    const actualAmount = isFreeProduct ? 0 : (session.amount_total / 100); // Free products show as $0 in our system
    
    // Create transaction record
    const transaction = await Transaction.create({
      userId: user.id,
      type: 'purchase',
      amount: actualAmount, // $0 for free products, actual amount for paid
      currency: 'USD',
      status: 'completed',
      paymentMethod: isFreeProduct ? 'stripe_free' : 'stripe',
      paymentId: session.payment_intent,
      description: isFreeProduct ? `Free Test Product: ${session.metadata.productName}` : `Purchase: ${session.metadata.productName}`,
      productId: session.metadata.productId,
      productName: session.metadata.productName,
      keyCount: credits,
      processedAt: new Date()
    });
    
    res.json({
      success: true,
      message: 'Payment processed successfully',
      data: {
        transaction: {
          id: transaction.id,
          amount: transaction.amount,
          credits: credits,
          status: transaction.status,
          date: transaction.createdAt
        },
        user: {
          credits: user.credits
        }
      }
    });
  } catch (error) {
    console.error('Checkout success error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process checkout success'
    });
  }
});

module.exports = router;