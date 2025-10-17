# Stripe Integration Setup Guide

This guide will help you set up Stripe payments in your resell panel project.

## Prerequisites

1. A Stripe account (create one at https://stripe.com)
2. Your project running locally

## Step 1: Get Your Stripe Keys

1. Log in to your Stripe Dashboard
2. Go to **Developers** > **API Keys**
3. Copy your **Publishable key** (starts with `pk_test_` for test mode)
4. Copy your **Secret key** (starts with `sk_test_` for test mode)

## Step 2: Configure Environment Variables

1. Copy `backend/env.example` to `backend/.env`
2. Update the following variables in `backend/.env`:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_actual_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_actual_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

## Step 3: Configure Frontend

1. Open `js/config.js`
2. Update the Stripe publishable key:

```javascript
STRIPE: {
    PUBLISHABLE_KEY: 'pk_test_your_actual_publishable_key_here',
    CURRENCY: 'usd',
    COUNTRY: 'US'
}
```

## Step 4: Set Up Webhooks (Optional but Recommended)

1. In your Stripe Dashboard, go to **Developers** > **Webhooks**
2. Click **Add endpoint**
3. Set the endpoint URL to: `http://localhost:3001/api/webhooks/stripe`
4. Select these events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `payment_intent.canceled`
5. Copy the webhook signing secret and add it to your `.env` file

## Step 5: Test the Integration

1. Start your backend server:
   ```bash
   cd backend
   npm start
   ```

2. Open your frontend in a browser

3. Go to the Store section and try to purchase a product

4. Use Stripe's test card numbers:
   - **Success**: 4242 4242 4242 4242
   - **Decline**: 4000 0000 0000 0002
   - **Requires Authentication**: 4000 0025 0000 3155

## Test Card Numbers

| Card Number | Description |
|-------------|-------------|
| 4242 4242 4242 4242 | Visa (Success) |
| 4000 0000 0000 0002 | Generic Decline |
| 4000 0025 0000 3155 | Requires Authentication |
| 4000 0000 0000 9995 | Insufficient Funds |

Use any future expiry date and any 3-digit CVC.

## Features Included

✅ **Payment Processing**: Secure credit/debit card payments
✅ **Real-time Validation**: Instant card validation
✅ **Error Handling**: Comprehensive error messages
✅ **Webhook Support**: Automatic payment status updates
✅ **Transaction Recording**: All payments logged in database
✅ **Responsive Design**: Works on all devices

## Security Notes

- Never expose your secret key in frontend code
- Always use HTTPS in production
- Validate webhook signatures
- Store sensitive data securely

## Production Deployment

When ready for production:

1. Switch to live mode in Stripe Dashboard
2. Update keys to live keys (remove `_test` suffix)
3. Update webhook endpoint to your production URL
4. Test thoroughly with real payment methods

## Troubleshooting

### Common Issues

1. **"Stripe not initialized" error**
   - Check that your publishable key is correct
   - Ensure Stripe.js is loaded

2. **Payment fails silently**
   - Check browser console for errors
   - Verify backend is running
   - Check network requests in DevTools

3. **Webhook not working**
   - Verify webhook URL is accessible
   - Check webhook secret is correct
   - Ensure events are selected in Stripe Dashboard

### Debug Mode

Enable debug logging by setting in `js/config.js`:
```javascript
DEV: {
    DEBUG_MODE: true
}
```

## Support

For Stripe-specific issues, check:
- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Support](https://support.stripe.com)

For project-specific issues, check the console logs and ensure all dependencies are installed.
