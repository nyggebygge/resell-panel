// Transactions functionality
let filteredTransactions = [];

// Enhanced transaction loading with filtering support
function loadTransactions() {
    const transactionsList = document.getElementById('transactions-list');
    
    // Initialize filtered transactions
    filteredTransactions = userData.transactions;
    
    // Setup filter event listeners if not already done
    if (!document.getElementById('apply-filters').hasEventListener) {
        document.getElementById('apply-filters').addEventListener('click', applyFilters);
        document.getElementById('clear-filters').addEventListener('click', clearFilters);
        document.getElementById('export-transactions').addEventListener('click', exportTransactions);
        document.getElementById('refresh-transactions').addEventListener('click', () => {
            filteredTransactions = userData.transactions;
            displayTransactions(filteredTransactions);
            showNotification('Transactions Refreshed', 'Transaction list has been updated', 'info', 2000);
        });
        
        // Mark as having event listeners
        document.getElementById('apply-filters').hasEventListener = true;
    }
    
    // Display transactions using the new function
    displayTransactions(filteredTransactions);
}

// Transaction Filtering System
function applyFilters() {
    const dateFrom = document.getElementById('date-from').value;
    const dateTo = document.getElementById('date-to').value;
    const amountMin = parseFloat(document.getElementById('amount-min').value) || 0;
    const amountMax = parseFloat(document.getElementById('amount-max').value) || Infinity;
    
    filteredTransactions = userData.transactions.filter(transaction => {
        const transactionDate = new Date(transaction.date).toISOString().split('T')[0];
        const amount = transaction.amount;
        
        // Date filtering
        if (dateFrom && transactionDate < dateFrom) return false;
        if (dateTo && transactionDate > dateTo) return false;
        
        // Amount filtering
        if (amount < amountMin || amount > amountMax) return false;
        
        return true;
    });
    
    displayTransactions(filteredTransactions);
    
    const filterCount = filteredTransactions.length;
    const totalCount = userData.transactions.length;
    
    showNotification(
        'Filters Applied',
        `Showing ${filterCount} of ${totalCount} transactions`,
        'info',
        2000
    );
}

function clearFilters() {
    document.getElementById('date-from').value = '';
    document.getElementById('date-to').value = '';
    document.getElementById('amount-min').value = '';
    document.getElementById('amount-max').value = '';
    
    filteredTransactions = userData.transactions;
    displayTransactions(filteredTransactions);
    
    showNotification(
        'Filters Cleared',
        'Showing all transactions',
        'info',
        2000
    );
}

// Export Functionality
function exportTransactions() {
    const transactionsToExport = filteredTransactions.length > 0 ? filteredTransactions : userData.transactions;
    
    if (transactionsToExport.length === 0) {
        showNotification(
            'Export Failed',
            'No transactions to export',
            'warning'
        );
        return;
    }
    
    // Create CSV content
    const headers = ['Date', 'Time', 'Type', 'Amount', 'Credits', 'Payment Method', 'Status'];
    const csvContent = [
        headers.join(','),
        ...transactionsToExport.map(transaction => {
            const date = new Date(transaction.date);
            return [
                date.toLocaleDateString(),
                date.toLocaleTimeString(),
                transaction.type,
                transaction.amount.toFixed(2),
                transaction.credits,
                transaction.method,
                transaction.status
            ].join(',');
        })
    ].join('\n');
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `transactions_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification(
        'Export Successful',
        `Exported ${transactionsToExport.length} transactions to CSV`,
        'success'
    );
}

function displayTransactions(transactions) {
    const transactionsList = document.getElementById('transactions-list');
    
    if (transactions.length === 0) {
        transactionsList.innerHTML = `
            <div class="no-transactions">
                <i class="fas fa-receipt floating-icon"></i>
                <p>No transactions found</p>
            </div>
        `;
    } else {
        const transactionsHTML = transactions.map((transaction, index) => {
            const date = new Date(transaction.date).toLocaleDateString();
            const time = new Date(transaction.date).toLocaleTimeString();
            
            return `
                <div class="transaction-item" style="animation-delay: ${index * 0.1}s">
                    <div class="transaction-info">
                        <div class="transaction-icon">
                            <i class="fas fa-${transaction.type === 'deposit' ? 'plus' : 'minus'}"></i>
                        </div>
                        <div class="transaction-details">
                            <h4>${transaction.type === 'deposit' ? 'Deposit' : 'Purchase'} via ${transaction.method}</h4>
                            <p>${date} at ${time}</p>
                            ${transaction.productName ? `<small>Product: ${transaction.productName}</small>` : ''}
                        </div>
                    </div>
                    <div class="transaction-amount">
                        ${transaction.amount > 0 ? '+' : ''}$${transaction.amount.toFixed(2)} (${transaction.credits} credits)
                    </div>
                </div>
            `;
        }).join('');
        
        transactionsList.innerHTML = transactionsHTML;
    }
}

// Export functions
window.loadTransactions = loadTransactions;
window.applyFilters = applyFilters;
window.clearFilters = clearFilters;
window.exportTransactions = exportTransactions;
