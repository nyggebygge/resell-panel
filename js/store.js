// Store functionality
// Store products data
let storeProducts = [
    {
        id: 0,
        name: "Test Product (FREE)",
        description: "Perfect for testing the payment system - completely free!",
        category: "software",
        price: 0,
        credits: 10,
        image: "fas fa-flask",
        rating: 5.0,
        stock: 999,
        badge: "FREE",
        inStock: true
    },
    {
        id: 1,
        name: "100 Credits at 50% off",
        description: "",
        category: "software",
        price: 100,
        credits: 9999,
        image: "fas fa-laptop-code",
        rating: 4.8,
        stock: 50,
        badge: "",
        inStock: true
    },
    {
        id: 2,
        name: "200 Credits at 55% off",
        description: "",
        category: "software",
        price: 200,
        credits: 4999,
        image: "fas fa-gamepad",
        rating: 4.6,
        stock: 100,
        badge: "",
        inStock: true
    },
    {
        id: 3,
        name: "300 Credits at 60% off",
        description: "",
        category: "software",
        price: 300,
        credits: 2999,
        image: "fas fa-palette",
        rating: 4.9,
        stock: 25,
        badge: "",
        inStock: true
    },
    {
        id: 4,
        name: "Infinite Gen",
        description: "",
        category: "software",
        price: 400,
        credits: 19999,
        image: "fas fa-briefcase",
        rating: 4.7,
        stock: 10,
        badge: "",
        inStock: true
    }
];

let filteredProducts = [...storeProducts];

// Store functionality
function loadStore() {
    console.log('🏪 Loading store...');
    console.log('🏪 Products available:', storeProducts.length);
    console.log('🏪 Filtered products:', filteredProducts.length);
    
    displayProducts(filteredProducts);
    setupStoreEventListeners();
    
    // Handle Stripe Checkout return
    handleCheckoutReturn();
    
    console.log('✅ Store loaded successfully');
}

function displayProducts(products) {
    console.log('🏪 Displaying products:', products.length);
    const productsGrid = document.getElementById('products-grid');
    
    if (!productsGrid) {
        console.error('❌ Products grid not found');
        return;
    }
    
    if (products.length === 0) {
        console.log('🏪 No products to display');
        productsGrid.innerHTML = `
            <div class="no-products">
                <i class="fas fa-store floating-icon"></i>
                <h3>No Products Found</h3>
                <p>Try adjusting your search or filter criteria</p>
            </div>
        `;
        return;
    }
    
    const productsHTML = products.map((product, index) => {
        const isInWishlist = userData.wishlist.includes(product.id);
        const stockStatus = product.inStock ? 'In Stock' : 'Out of Stock';
        const stockClass = product.inStock ? 'product-stock' : 'product-stock out-of-stock';
        
        return `
            <div class="product-card" style="animation-delay: ${index * 0.1}s" data-product-id="${product.id}">
                ${product.badge ? `<div class="product-badge ${product.badge}">${product.badge}</div>` : ''}
                <div class="product-image">
                    <i class="${product.image}"></i>
                </div>
                <div class="product-info">
                    <h3>${product.name}</h3>
                    <p class="product-description">${product.description}</p>
                    <div class="product-meta">
                        <span class="product-category">${product.category}</span>
                    </div>
                    <div class="product-price">
                        <div class="price-info">
                            <div class="price-amount">$${product.price.toFixed(2)}</div>
                        </div>
                    </div>
                    <div class="product-actions">
                        <button class="buy-btn magnetic-btn" onclick="purchaseProduct(${product.id})" ${!product.inStock ? 'disabled' : ''}>
                            <i class="fas fa-shopping-cart"></i>
                            <span>${product.inStock ? 'Buy Now' : 'Out of Stock'}</span>
                            <div class="btn-ripple"></div>
                        </button>
                        <button class="wishlist-btn magnetic-btn ${isInWishlist ? 'active' : ''}" onclick="toggleWishlist(${product.id})">
                            <i class="fas fa-heart"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    productsGrid.innerHTML = productsHTML;
    
    // Add magnetic effects to new buttons
    addMagneticEffect();
}

function setupStoreEventListeners() {
    // Search functionality
    const searchInput = document.getElementById('store-search');
    if (searchInput && !searchInput.hasEventListener) {
        searchInput.addEventListener('input', () => {
            searchProducts();
        });
        searchInput.hasEventListener = true;
    }
    
    // Category filter
    const categoryFilter = document.getElementById('category-filter');
    if (categoryFilter && !categoryFilter.hasEventListener) {
        categoryFilter.addEventListener('change', () => {
            filterByCategory();
        });
        categoryFilter.hasEventListener = true;
    }
}

function searchProducts() {
    const searchTerm = document.getElementById('store-search').value.toLowerCase();
    
    if (searchTerm === '') {
        filteredProducts = [...storeProducts];
    } else {
        filteredProducts = storeProducts.filter(product => 
            product.name.toLowerCase().includes(searchTerm) ||
            product.description.toLowerCase().includes(searchTerm) ||
            product.category.toLowerCase().includes(searchTerm)
        );
    }
    
    displayProducts(filteredProducts);
}

function filterByCategory() {
    const category = document.getElementById('category-filter').value;
    
    if (category === '') {
        filteredProducts = [...storeProducts];
    } else {
        filteredProducts = storeProducts.filter(product => product.category === category);
    }
    
    displayProducts(filteredProducts);
}

function purchaseProduct(productId) {
    console.log('🛒 Purchase requested for product ID:', productId);
    
    // Check if user is authenticated
    if (!window.authManager || !window.authManager.getIsLoggedIn()) {
        console.log('❌ User not authenticated');
        showNotification('Authentication Required', 'Please login to make a purchase.', 'warning');
        return;
    }
    
    const product = storeProducts.find(p => p.id === productId);
    console.log('🛒 Product found:', product);
    
    if (!product) {
        console.log('❌ Product not found');
        showNotification('Product Not Found', 'The selected product could not be found.', 'error');
        return;
    }
    
    if (!product.inStock) {
        console.log('❌ Product out of stock');
        showNotification('Out of Stock', 'This product is currently out of stock.', 'warning');
        return;
    }
    
    console.log('✅ Showing purchase modal for:', product.name);
    // Show purchase modal
    showPurchaseModal(product);
}

// Modal functionality
let currentProduct = null;
let selectedPaymentMethod = null;

function showPurchaseModal(product) {
    console.log('🛒 Showing purchase modal for:', product);
    currentProduct = product;
    selectedPaymentMethod = null;
    
    // Update modal content
    document.getElementById('modal-product-name').textContent = product.name;
    document.getElementById('modal-product-price').textContent = `$${product.price.toFixed(2)}`;
    console.log('✅ Modal content updated');
    
    // Reset payment method selection
    document.querySelectorAll('.payment-option').forEach(option => {
        option.classList.remove('selected');
    });
    
    // Disable confirm button
    document.getElementById('confirm-purchase').disabled = true;
    
    // Show modal
    const modal = document.getElementById('purchase-modal');
    modal.classList.add('show');
    
    // Add magnetic effects to new buttons
    addMagneticEffect();
}

function closePurchaseModal() {
    const modal = document.getElementById('purchase-modal');
    modal.classList.remove('show');
    currentProduct = null;
    selectedPaymentMethod = null;
}

async function selectPaymentMethod(method) {
    selectedPaymentMethod = method;
    
    // Check if user is authenticated
    if (!window.authManager || !window.authManager.getIsLoggedIn()) {
        showNotification('Authentication Required', 'Please login to make a purchase.', 'warning');
        closePurchaseModal();
        return;
    }
    
    // Update visual selection
    document.querySelectorAll('.payment-option').forEach(option => {
        option.classList.remove('selected');
    });
    
    event.target.closest('.payment-option').classList.add('selected');
    
    // Handle Stripe payment setup
    if (method === 'stripe') {
        try {
            console.log('💳 Setting up Stripe Checkout for authenticated user');
            console.log('💳 Current product:', currentProduct);
            
            // Enable confirm button for Stripe Checkout
            document.getElementById('confirm-purchase').disabled = false;
            console.log('✅ Stripe Checkout setup complete');
        } catch (error) {
            console.error('❌ Error setting up Stripe Checkout:', error);
            showNotification('Payment Setup Error', error.message, 'error');
            document.getElementById('confirm-purchase').disabled = true;
        }
    } else {
        // Hide Stripe container for other payment methods
        const stripeContainer = document.getElementById('stripe-payment-container');
        if (stripeContainer) {
            stripeContainer.style.display = 'none';
        }
        
        // Enable confirm button
        document.getElementById('confirm-purchase').disabled = false;
    }
}

async function confirmPurchase() {
    if (!currentProduct || !selectedPaymentMethod) {
        showNotification('Selection Required', 'Please select a payment method.', 'warning');
        return;
    }
    
    // For Stripe payments, we don't check credits upfront since they're paying with real money
    // Credits will be added after successful payment
    if (selectedPaymentMethod !== 'stripe') {
        // Check if user has enough credits for non-Stripe payments
        if (userData.credits < currentProduct.credits) {
            showNotification('Insufficient Credits', `You need ${currentProduct.credits} credits to purchase this item. You have ${userData.credits} credits.`, 'error');
            closePurchaseModal();
            return;
        }
    }
    
    // Handle different payment methods
    if (selectedPaymentMethod === 'stripe') {
        await handleStripeCheckout();
    } else {
        // Handle other payment methods (crypto, etc.)
        handleOtherPayment();
    }
}

async function handleStripeCheckout() {
    try {
        console.log('💳 Starting checkout for:', currentProduct);
        
        // Show loading state
        const confirmBtn = document.getElementById('confirm-purchase');
        const originalText = confirmBtn.innerHTML;
        
        if (currentProduct.price === 0) {
            confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Processing Free Product...</span>';
        } else {
            confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Redirecting to Stripe...</span>';
        }
        confirmBtn.disabled = true;

        // Create checkout session
        const response = await fetch('/api/payments/create-checkout-session', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify({
                productId: currentProduct.id,
                productName: currentProduct.name,
                price: currentProduct.price,
                credits: currentProduct.credits
            })
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Failed to create checkout session');
        }
        
        if (data.success && data.url) {
            console.log('✅ Checkout session created, redirecting to Stripe...');
            
            if (currentProduct.price === 0) {
                console.log('🧪 Free test product - going through Stripe for testing');
            }
            
            // Close modal first
            closePurchaseModal();
            
            // Redirect to Stripe Checkout (for both free and paid products)
            window.location.href = data.url;
        } else {
            throw new Error('Invalid response from server');
        }
        
    } catch (error) {
        console.error('Checkout error:', error);
        showNotification('Checkout Failed', error.message || 'Could not process checkout', 'error');
        
        // Reset button state
        const confirmBtn = document.getElementById('confirm-purchase');
        confirmBtn.innerHTML = '<i class="fas fa-check"></i><span>Confirm Purchase</span>';
        confirmBtn.disabled = false;
    }
}

function handleOtherPayment() {
    // Process purchase for non-Stripe methods
    userData.credits -= currentProduct.credits;
    userData.purchases.push({
        id: Date.now(),
        productId: currentProduct.id,
        productName: currentProduct.name,
        price: currentProduct.price,
        credits: currentProduct.credits,
        paymentMethod: selectedPaymentMethod,
        date: new Date().toISOString(),
        status: 'completed'
    });
    
    // Add transaction record
    userData.transactions.unshift({
        id: Date.now(),
        type: 'purchase',
        amount: -currentProduct.price,
        credits: -currentProduct.credits,
        method: selectedPaymentMethod,
        date: new Date().toISOString(),
        status: 'completed',
        productName: currentProduct.name
    });
    
    // Update stock
    currentProduct.stock -= 1;
    if (currentProduct.stock <= 0) {
        currentProduct.inStock = false;
    }
    
    // Save data and update UI
    saveUserData();
    updateUI();
    displayProducts(filteredProducts);
    
    // Close modal
    closePurchaseModal();
    
    // Show success notification
    showNotification(
        'Purchase Successful!',
        `You have successfully purchased "${currentProduct.name}" using ${selectedPaymentMethod === 'card' ? 'Credit Card' : 'Cryptocurrency'}.`,
        'success'
    );
    
    // Create confetti effect
    createConfetti();
}

function toggleWishlist(productId) {
    const product = storeProducts.find(p => p.id === productId);
    const wishlistIndex = userData.wishlist.indexOf(productId);
    
    if (wishlistIndex > -1) {
        // Remove from wishlist
        userData.wishlist.splice(wishlistIndex, 1);
        showNotification('Removed from Wishlist', `${product.name} has been removed from your wishlist.`, 'info');
    } else {
        // Add to wishlist
        userData.wishlist.push(productId);
        showNotification('Added to Wishlist', `${product.name} has been added to your wishlist.`, 'success');
    }
    
    saveUserData();
    displayProducts(filteredProducts);
}

// Debug function to check authentication status
function debugAuthStatus() {
    console.log('🔍 Authentication Debug Info:');
    console.log('- Auth Manager:', !!window.authManager);
    console.log('- Is Logged In:', window.authManager ? window.authManager.getIsLoggedIn() : false);
    console.log('- Auth Token:', localStorage.getItem('authToken') ? 'Present' : 'Missing');
    console.log('- Current User:', window.authManager ? window.authManager.getCurrentUser() : null);
}

// Handle Stripe Checkout return
async function handleCheckoutReturn() {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const sessionId = urlParams.get('session_id');
    const canceled = urlParams.get('canceled');
    
    if (success === 'true' && sessionId) {
        console.log('🎉 Stripe Checkout successful, processing payment...');
        
        try {
            // Process the successful checkout
            const response = await fetch('/api/payments/checkout-success', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: JSON.stringify({
                    sessionId: sessionId
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Update local data
                if (data.data && data.data.user) {
                    userData.credits = data.data.user.credits;
                }
                
                // Add transaction record
                userData.transactions.unshift({
                    id: Date.now(),
                    type: 'purchase',
                    amount: data.data.transaction.amount,
                    credits: data.data.transaction.credits,
                    method: data.data.transaction.paymentMethod || 'stripe',
                    date: new Date().toISOString(),
                    status: 'completed',
                    productName: data.data.transaction.description || 'Stripe Purchase'
                });
                
                // Save data and update UI
                saveUserData();
                updateUI();
                
                // Show success notification
                const isFreeProduct = data.data.transaction.paymentMethod === 'stripe_free';
                const notificationTitle = isFreeProduct ? 'Free Test Product Claimed!' : 'Payment Successful!';
                const notificationMessage = isFreeProduct 
                    ? `You successfully claimed the free test product and received ${data.data.transaction.credits} credits!`
                    : `Your payment was processed successfully. You received ${data.data.transaction.credits} credits!`;
                
                showNotification(notificationTitle, notificationMessage, 'success');
                
                // Create confetti effect
                createConfetti();
                
                // Clean up URL
                window.history.replaceState({}, document.title, window.location.pathname);
            } else {
                throw new Error(data.message || 'Failed to process payment');
            }
        } catch (error) {
            console.error('Error processing checkout success:', error);
            showNotification('Payment Processing Error', error.message || 'Failed to process payment', 'error');
        }
    } else if (canceled === 'true') {
        console.log('❌ Stripe Checkout was canceled');
        showNotification('Payment Canceled', 'You canceled the payment process.', 'info');
        
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
    }
}

// Export functions
window.loadStore = loadStore;
window.searchProducts = searchProducts;
window.filterByCategory = filterByCategory;
window.purchaseProduct = purchaseProduct;
window.toggleWishlist = toggleWishlist;
window.showPurchaseModal = showPurchaseModal;
window.closePurchaseModal = closePurchaseModal;
window.selectPaymentMethod = selectPaymentMethod;
window.confirmPurchase = confirmPurchase;
window.handleCheckoutReturn = handleCheckoutReturn;
window.debugAuthStatus = debugAuthStatus;
