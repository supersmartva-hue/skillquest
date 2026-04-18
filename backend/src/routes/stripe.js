/**
 * Stripe Routes — Premium subscription handling
 * POST /api/stripe/create-checkout   Create Stripe checkout session
 * POST /api/stripe/webhook           Handle Stripe webhook events
 */

const router = require('express').Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const prisma = require('../lib/prisma');
const { authenticate } = require('../middleware/auth');

const PREMIUM_PRICE_ID = process.env.STRIPE_PREMIUM_PRICE_ID;

/**
 * POST /api/stripe/create-checkout
 * Creates a Stripe Checkout session for the premium subscription
 */
router.post('/create-checkout', authenticate, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });

    // Retrieve or create Stripe customer
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { userId: user.id },
      });
      customerId = customer.id;
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customerId },
      });
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: PREMIUM_PRICE_ID, quantity: 1 }],
      success_url: `${process.env.FRONTEND_URL}/dashboard?upgrade=success`,
      cancel_url: `${process.env.FRONTEND_URL}/pricing`,
      metadata: { userId: user.id },
    });

    res.json({ url: session.url });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/stripe/webhook
 * Handles subscription lifecycle events from Stripe
 * Uses raw body (configured in index.js before express.json)
 */
router.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const userId = session.metadata.userId;
      await prisma.user.update({
        where: { id: userId },
        data: { isPremium: true },
      });
      break;
    }

    case 'customer.subscription.deleted': {
      // Subscription cancelled or payment failed — revoke premium
      const subscription = event.data.object;
      const customer = await stripe.customers.retrieve(subscription.customer);
      const userId = customer.metadata.userId;
      if (userId) {
        await prisma.user.update({
          where: { id: userId },
          data: { isPremium: false, premiumUntil: null },
        });
      }
      break;
    }

    default:
      // Unhandled event — log and acknowledge
      console.log(`Unhandled Stripe event: ${event.type}`);
  }

  res.json({ received: true });
});

module.exports = router;
