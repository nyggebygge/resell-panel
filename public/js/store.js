// Store functionality
// Store products data
let storeProducts = [
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
    displayProducts(filteredProducts);
    setupStoreEventListeners();
}

function displayProducts(products) {
    const productsGrid = document.getElementById('products-grid');
    
    if (products.length === 0) {
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
    const product = storeProducts.find(p => p.id === productId);
    
    if (!product) {
        showNotification('Product Not Found', 'The selected product could not be found.', 'error');
        return;
    }
    
    if (!product.inStock) {
        showNotification('Out of Stock', 'This product is currently out of stock.', 'warning');
        return;
    }
    
    // Show purchase modal
    showPurchaseModal(product);
}

// Modal functionality
let currentProduct = null;
let selectedPaymentMethod = null;

function showPurchaseModal(product) {
    currentProduct = product;
    selectedPaymentMethod = null;
    
    // Update modal content
    document.getElementById('modal-product-name').textContent = product.name;
    document.getElementById('modal-product-price').textContent = `$${product.price.toFixed(2)}`;
    
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
    
    // Update visual selection
    document.querySelectorAll('.payment-option').forEach(option => {
        option.classList.remove('selected');
    });
    
    event.target.closest('.payment-option').classList.add('selected');
    
    // Handle Stripe payment setup
    if (method === 'stripe') {
        try {
            // Show Stripe payment container
            const stripeContainer = document.getElementById('stripe-payment-container');
            stripeContainer.style.display = 'block';
            
            // Initialize Stripe payments
            await stripePayments.initialize();
            
            // Setup payment element
            await stripePayments.processPayment(currentProduct);
            
            // Enable confirm button
            document.getElementById('confirm-purchase').disabled = false;
        } catch (error) {
            console.error('Error setting up Stripe payment:', error);
            showNotification('Payment Setup Error', error.message, 'error');
            document.getElementById('confirm-purchase').disabled = true;
        }
    } else {
        // Hide Stripe container for other payment methods
        const stripeContainer = document.getElementById('stripe-payment-container');
        stripeContainer.style.display = 'none';
        
        // Enable confirm button
        document.getElementById('confirm-purchase').disabled = false;
    }
}

async function confirmPurchase() {
    if (!currentProduct || !selectedPaymentMethod) {
        showNotification('Selection Required', 'Please select a payment method.', 'warning');
        return;
    }
    
    // Check if user has enough credits
    if (userData.credits < currentProduct.credits) {
        showNotification('Insufficient Credits', `You need ${currentProduct.credits} credits to purchase this item. You have ${userData.credits} credits.`, 'error');
        closePurchaseModal();
        return;
    }
    
    // Handle different payment methods
    if (selectedPaymentMethod === 'stripe') {
        await handleStripePayment();
    } else {
        // Handle other payment methods (crypto, etc.)
        handleOtherPayment();
    }
}

async function handleStripePayment() {
    try {
        // Show loading state
        const confirmBtn = document.getElementById('confirm-purchase');
        const originalText = confirmBtn.innerHTML;
        confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Processing...</span>';
        confirmBtn.disabled = true;

        // Initialize Stripe if not already done
        await stripePayments.initialize();

        // Process payment with Stripe
        const result = await stripePayments.finalizePayment(currentProduct);
        
        if (result.success) {
            // Update local data
            userData.credits -= currentProduct.credits;
            userData.purchases.push({
                id: Date.now(),
                productId: currentProduct.id,
                productName: currentProduct.name,
                price: currentProduct.price,
                credits: currentProduct.credits,
                paymentMethod: 'stripe',
                date: new Date().toISOString(),
                status: 'completed'
            });
            
            // Add transaction record
            userData.transactions.unshift({
                id: Date.now(),
                type: 'purchase',
                amount: -currentProduct.price,
                credits: -currentProduct.credits,
                method: 'stripe',
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
                `You have successfully purchased "${currentProduct.name}" using Stripe.`,
                'success'
            );
            
            // Create confetti effect
            createConfetti();
        }
    } catch (error) {
        console.error('Stripe payment error:', error);
        showNotification('Payment Failed', error.message || 'Payment could not be processed', 'error');
        
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
