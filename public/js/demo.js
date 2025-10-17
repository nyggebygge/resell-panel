// Demo data and utility functions
// Demo data function with enhanced animations
function addDemoData() {
    const oldBalance = userData.balance;
    const oldCredits = userData.credits;
    
    userData.balance = 150.00;
    userData.credits = 15000;
    userData.totalDeposits = 3;
    userData.lastDeposit = new Date().toLocaleDateString();
    
    userData.transactions = [
        {
            id: Date.now() - 1000,
            type: 'deposit',
            amount: 50.00,
            credits: 5000,
            method: 'PayPal',
            date: new Date(Date.now() - 86400000).toISOString(),
            status: 'completed'
        },
        {
            id: Date.now() - 2000,
            type: 'deposit',
            amount: 100.00,
            credits: 10000,
            method: 'Credit Card (Stripe)',
            date: new Date(Date.now() - 172800000).toISOString(),
            status: 'completed'
        }
    ];
    
    saveUserData();
    updateUI();
    showMessage('Demo data loaded with enhanced animations!', 'info');
    createConfetti();
}

// Clear all data function
function clearAllData() {
    localStorage.removeItem('resellerPanelData');
    userData = {
        balance: 0,
        credits: 0,
        totalDeposits: 0,
        lastDeposit: null,
        transactions: [],
        theme: 'dark',
        wishlist: [],
        purchases: []
    };
    updateUI();
    showMessage('All data cleared successfully!', 'info');
}

// Export functions for console testing
window.addDemoData = addDemoData;
window.clearAllData = clearAllData;
