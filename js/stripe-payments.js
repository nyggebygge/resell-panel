// Stripe Payments Integration
class StripePayments {
    constructor() {
        this.stripe = null;
        this.elements = null;
        this.paymentElement = null;
        this.paymentIntent = null;
        this.isInitialized = false;
    }

    async initialize() {
        if (this.isInitialized) return;

        try {
            // Load Stripe.js
            if (!window.Stripe) {
                const script = document.createElement('script');
                script.src = 'https://js.stripe.com/v3/';
                script.onload = () => this.setupStripe();
                document.head.appendChild(script);
            } else {
                this.setupStripe();
            }
        } catch (error) {
            console.error('Failed to initialize Stripe:', error);
            showNotification('Payment Error', 'Failed to initialize payment system', 'error');
        }
    }

    setupStripe() {
        // Get publishable key from config
        const publishableKey = window.CONFIG?.STRIPE?.PUBLISHABLE_KEY || 'pk_live_51PxwPBI64jb3mEnWxbWnCS4PYjiXaPFIEPOTuyC7zSIIGTSWo0Tm5dseh6px3b0EvKZWGBXBfKjQXQTejcCH5IOo00JK0TcyEz';
        
        console.log('🔑 Using Stripe publishable key:', publishableKey ? 'Present' : 'Missing');
        
        if (!publishableKey || publishableKey.includes('your_publishable_key_here')) {
            throw new Error('Stripe publishable key not configured');
        }
        
        this.stripe = Stripe(publishableKey);
        this.isInitialized = true;
        console.log('✅ Stripe initialized successfully');
    }

    async createPaymentIntent(amount, productId, productName) {
        try {
            console.log('💳 Creating payment intent for:', { amount, productId, productName });
            
            // Check if user is authenticated
            const authToken = localStorage.getItem('authToken');
            if (!authToken) {
                throw new Error('User not authenticated. Please login first.');
            }
            
            console.log('🔐 Auth token found:', authToken ? 'Yes' : 'No');
            
            const response = await fetch('/api/payments/create-payment-intent', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({
                    amount: amount,
                    productId: productId,
                    productName: productName
                })
            });

            const data = await response.json();
            console.log('💳 Payment intent response:', data);
            
            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('Authentication failed. Please login again.');
                } else if (response.status === 403) {
                    throw new Error('Access denied. Please check your permissions.');
                } else {
                    throw new Error(data.message || `Server error: ${response.status}`);
                }
            }
            
            if (!data.success) {
                throw new Error(data.message || 'Failed to create payment intent');
            }

            this.paymentIntent = {
                id: data.paymentIntentId,
                clientSecret: data.clientSecret
            };

            return data;
        } catch (error) {
            console.error('Error creating payment intent:', error);
            
            // Handle authentication errors
            if (error.message.includes('Authentication failed') || error.message.includes('Please login')) {
                // Clear invalid token and redirect to login
                localStorage.removeItem('authToken');
                window.location.href = 'login.html';
                return;
            }
            
            throw error;
        }
    }

    async setupPaymentElement(containerId) {
        if (!this.stripe) {
            throw new Error('Stripe not initialized');
        }

        if (!this.paymentIntent) {
            throw new Error('Payment intent not created');
        }

        // Create elements instance
        this.elements = this.stripe.elements({
            clientSecret: this.paymentIntent.clientSecret,
            appearance: {
                theme: 'stripe',
                variables: {
                    colorPrimary: '#6366f1',
                    colorBackground: '#ffffff',
                    colorText: '#30313d',
                    colorDanger: '#df1b41',
                    fontFamily: 'Ideal Sans, system-ui, sans-serif',
                    spacingUnit: '2px',
                    borderRadius: '4px',
                }
            }
        });

        // Create payment element
        this.paymentElement = this.elements.create('payment', {
            layout: 'tabs'
        });

        // Mount the element
        const container = document.getElementById(containerId);
        if (container) {
            this.paymentElement.mount(container);
        } else {
            throw new Error(`Container with id '${containerId}' not found`);
        }

        // Listen for changes
        this.paymentElement.on('change', (event) => {
            const displayError = document.getElementById('card-errors');
            if (event.error) {
                displayError.textContent = event.error.message;
            } else {
                displayError.textContent = '';
            }
        });
    }

    async confirmPayment() {
        if (!this.stripe || !this.paymentElement) {
            throw new Error('Payment element not initialized');
        }

        try {
            const { error, paymentIntent } = await this.stripe.confirmPayment({
                elements: this.elements,
                confirmParams: {
                    return_url: window.location.origin + '/store',
                },
                redirect: 'if_required'
            });

            if (error) {
                throw error;
            }

            return paymentIntent;
        } catch (error) {
            console.error('Payment confirmation error:', error);
            throw error;
        }
    }

    async processPayment(productData) {
        try {
            // Create payment intent
            await this.createPaymentIntent(
                productData.price,
                productData.id,
                productData.name
            );

            // Setup payment element
            await this.setupPaymentElement('stripe-payment-element');

            return true;
        } catch (error) {
            console.error('Error setting up payment:', error);
            showNotification('Payment Error', error.message, 'error');
            return false;
        }
    }

    async finalizePayment(productData) {
        try {
            // Confirm payment with Stripe
            const paymentIntent = await this.confirmPayment();

            if (paymentIntent.status === 'succeeded') {
                // Confirm payment on backend
                const response = await fetch('/api/payments/confirm-payment', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                    },
                    body: JSON.stringify({
                        paymentIntentId: paymentIntent.id,
                        productId: productData.id,
                        productName: productData.name,
                        price: productData.price,
                        credits: productData.credits
                    })
                });

                const data = await response.json();
                
                if (!response.ok) {
                    if (response.status === 401) {
                        throw new Error('Authentication failed. Please login again.');
                    } else if (response.status === 403) {
                        throw new Error('Access denied. Please check your permissions.');
                    } else {
                        throw new Error(data.message || `Server error: ${response.status}`);
                    }
                }
                
                if (!data.success) {
                    throw new Error(data.message || 'Failed to confirm payment');
                }

                return data;
            } else {
                throw new Error('Payment not completed');
            }
        } catch (error) {
            console.error('Error finalizing payment:', error);
            
            // Handle authentication errors
            if (error.message.includes('Authentication failed') || error.message.includes('Please login')) {
                // Clear invalid token and redirect to login
                localStorage.removeItem('authToken');
                window.location.href = 'login.html';
                return;
            }
            
            throw error;
        }
    }

    destroy() {
        if (this.paymentElement) {
            this.paymentElement.destroy();
            this.paymentElement = null;
        }
        if (this.elements) {
            this.elements = null;
        }
        this.paymentIntent = null;
    }
}

// Initialize Stripe payments
const stripePayments = new StripePayments();

// Export for global use
window.stripePayments = stripePayments;
