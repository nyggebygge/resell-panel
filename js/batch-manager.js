/**
 * Batch Manager - Document-style key management
 * Manages key batches with document-style selection and copying
 */

class BatchManager {
    constructor() {
        this.batches = [];
        this.currentBatch = null;
        this.selectedKeys = new Set();
        this.searchTerm = '';
        this.viewMode = 'spread'; // 'spread' only
        
        this.init();
    }

    init() {
        this.loadBatches();
        this.setupEventListeners();
    }

    async loadBatches() {
        try {
            // Try to load from backend API first
            if (window.api && window.api.isAuthenticated()) {
                console.log('Loading batches from backend API...');
                // Get all keys from the API
                const response = await window.api.getAllKeys();
                console.log('API response:', response);
                
                if (response && response.success) {
                    // Handle the API response format: response.data.keys
                    let keys = [];
                    if (response.data && Array.isArray(response.data.keys)) {
                        keys = response.data.keys;
                    } else if (Array.isArray(response.data)) {
                        keys = response.data;
                    } else if (response.data && Array.isArray(response.data.data)) {
                        keys = response.data.data;
                    }
                    
                    console.log('Keys found:', keys.length);
                    this.batches = this.groupKeysByBatch(keys);
                    this.renderBatches();
                    return;
                }
            }
            
            // Fallback to local storage
            console.log('Falling back to local storage...');
            const savedData = localStorage.getItem('resellerPanelData');
            if (savedData) {
                const userData = JSON.parse(savedData);
                this.batches = this.groupKeysByBatch(userData.generatedKeys || []);
            }
            
            this.renderBatches();
        } catch (error) {
            console.error('Error loading batches:', error);
            // Don't show notification if notification container doesn't exist
            if (document.getElementById('notification-container')) {
                this.showNotification('Error', 'Failed to load batches', 'error');
            }
        }
    }

    // Method to refresh batches (called after key generation)
    async refreshBatches() {
        console.log('Refreshing batches...');
        await this.loadBatches();
        // Removed notification to avoid spam during key generation
    }

    groupKeysByBatch(keys) {
        const batchMap = new Map();
        
        // Ensure keys is an array
        if (!Array.isArray(keys)) {
            console.log('Keys is not an array:', keys);
            return [];
        }
        
        keys.forEach(key => {
            if (key.generationId && key.generationName) {
                if (!batchMap.has(key.generationId)) {
                    batchMap.set(key.generationId, {
                        id: key.generationId,
                        name: key.generationName,
                        type: key.type || 'unknown',
                        date: key.generatedAt,
                        keys: [],
                        count: 0
                    });
                }
                
                batchMap.get(key.generationId).keys.push(key);
                batchMap.get(key.generationId).count++;
            }
        });
        
        return Array.from(batchMap.values()).sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    renderBatches() {
        const container = document.getElementById('batch-list');
        if (!container) {
            console.log('Batch list container not found');
            return;
        }

        console.log('Rendering batches:', this.batches.length);

        if (this.batches.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">
                        <i class="fas fa-layer-group"></i>
                    </div>
                    <h3>No Key Batches</h3>
                    <p>Generate your first batch of keys to get started</p>
                    <button class="action-btn primary" onclick="showKeyOptions()">
                        <i class="fas fa-plus"></i>
                        <span>Generate New Batch</span>
                    </button>
                </div>
            `;
            this.updateStackInfo();
            return;
        }

        // Update container classes based on view mode
        container.className = `batch-list ${this.viewMode}`;
        
        // Render batches
        container.innerHTML = this.batches.map(batch => this.createBatchCard(batch)).join('');
        
        // Update stack info
        this.updateStackInfo();
    }

    // Removed setViewMode - only spread view is supported

    updateStackInfo() {
        const stackInfo = document.getElementById('stack-info');
        if (!stackInfo) return;

        if (this.batches.length === 0) {
            stackInfo.innerHTML = '';
            return;
        }

        const totalKeys = this.batches.reduce((sum, batch) => sum + batch.count, 0);
        stackInfo.innerHTML = `
            <div class="stack-stats">
                <span><strong>${this.batches.length}</strong> batches</span>
                <span>•</span>
                <span><strong>${totalKeys}</strong> total keys</span>
                <span>•</span>
                <span>Latest: <strong>${this.batches[0]?.name || 'None'}</strong></span>
            </div>
        `;
    }

    createBatchCard(batch) {
        const isLatest = this.batches.indexOf(batch) === 0;
        const activeKeys = batch.keys.filter(key => key.status === 'active').length;
        const usedKeys = batch.keys.filter(key => key.status === 'used').length;
        
        return `
            <div class="batch-card card-enhanced hover-lift key-type-${batch.type} ${isLatest ? 'latest' : ''} fade-in-up" data-batch-id="${batch.id}">
                <div class="batch-card-header">
                    <div class="batch-info">
                        <h3 class="batch-name title-responsive">${batch.name}</h3>
                        <div class="batch-meta">
                            <span class="batch-type status-${batch.type}">${batch.type} Keys</span>
                            <span class="batch-date">${this.formatDate(batch.date)}</span>
                        </div>
                    </div>
                    <div class="batch-status">
                        <div class="status-indicator ${isLatest ? 'latest' : ''}">
                            ${isLatest ? 'Latest' : 'Previous'}
                        </div>
                    </div>
                </div>
                
                <div class="batch-stats">
                    <div class="stat-item">
                        <span class="stat-value">${batch.count}</span>
                        <span class="stat-label">Total Keys</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${activeKeys}</span>
                        <span class="stat-label">Active</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${usedKeys}</span>
                        <span class="stat-label">Used</span>
                    </div>
                </div>
                
                <div class="batch-actions">
                    <button class="batch-action-btn primary btn-enhanced hover-glow" onclick="window.batchManager.openDocument('${batch.id}')">
                        <i class="fas fa-file-text"></i>
                        <span>Open Document</span>
                    </button>
                    <button class="batch-action-btn secondary btn-enhanced hover-glow" onclick="window.batchManager.quickCopy('${batch.id}')">
                        <i class="fas fa-copy"></i>
                        <span>Quick Copy</span>
                    </button>
                    <button class="batch-action-btn secondary btn-enhanced hover-glow" onclick="window.batchManager.exportBatch('${batch.id}')">
                        <i class="fas fa-download"></i>
                        <span>Export</span>
                    </button>
                </div>
            </div>
        `;
    }

    openDocument(batchId) {
        console.log('Opening document for batch:', batchId);
        const batch = this.batches.find(b => b.id === batchId);
        if (!batch) {
            console.log('Batch not found:', batchId);
            return;
        }

        console.log('Found batch:', batch);
        this.currentBatch = batch;
        
        // Update document title only (simplified modal)
        const titleElement = document.getElementById('document-title');
        if (titleElement) {
            titleElement.textContent = `${batch.name} (${batch.count} keys)`;
        }
        
        // Render keys
        this.renderDocumentKeys();
        
        // Show modal
        const modal = document.getElementById('key-document-modal');
        if (modal) {
            modal.style.display = 'flex';
            modal.classList.add('show');
            console.log('Modal shown with display: flex and show class');
        } else {
            console.log('Modal not found');
        }
    }

    renderDocumentKeys() {
        const container = document.getElementById('document-body');
        if (!container || !this.currentBatch) return;

        const keys = this.currentBatch.keys;

        container.innerHTML = keys.map((key, index) => `
            <div class="key-item" onclick="keyDocument.copyKey('${key.key}')" title="Click to copy">
                <div class="key-number">${index + 1}</div>
                <div class="key-value">${key.key}</div>
                <div class="key-status ${key.status || 'active'}">${key.status || 'active'}</div>
            </div>
        `).join('');
    }

    // Simplified - no complex selection or search needed

    copyAll() {
        if (!this.currentBatch) return;
        
        const keyValues = this.currentBatch.keys.map(key => key.key).join('\n');
        this.copyToClipboard(keyValues);
        this.showNotification('Copied All', `Copied ${this.currentBatch.keys.length} keys`, 'success');
    }

    export() {
        if (!this.currentBatch) return;
        
        const csvContent = [
            'Key,Type,Status,Generated At,Generation Name',
            ...this.currentBatch.keys.map(key => [
                key.key,
                key.type || 'Unknown',
                key.status || 'active',
                new Date(key.generatedAt).toISOString(),
                key.generationName || 'Unknown'
            ].join(','))
        ].join('\n');

        this.downloadFile(csvContent, `batch-${this.currentBatch.name}-${new Date().toISOString().split('T')[0]}.csv`);
        this.showNotification('Exported', `Exported ${this.currentBatch.keys.length} keys`, 'success');
    }


    close() {
        document.getElementById('key-document-modal').style.display = 'none';
        this.currentBatch = null;
        this.selectedKeys.clear();
    }

    // Quick actions
    quickCopy(batchId) {
        const batch = this.batches.find(b => b.id === batchId);
        if (!batch) return;
        
        const keyValues = batch.keys.map(key => key.key).join('\n');
        this.copyToClipboard(keyValues);
        this.showNotification('Quick Copy', `Copied ${batch.keys.length} keys to clipboard`, 'success');
    }

    exportBatch(batchId) {
        const batch = this.batches.find(b => b.id === batchId);
        if (!batch) return;
        
        const csvContent = [
            'Key,Type,Status,Generated At,Generation Name',
            ...batch.keys.map(key => [
                key.key,
                key.type || 'Unknown',
                key.status || 'active',
                new Date(key.generatedAt).toISOString(),
                key.generationName || 'Unknown'
            ].join(','))
        ].join('\n');

        this.downloadFile(csvContent, `batch-${batch.name}-${new Date().toISOString().split('T')[0]}.csv`);
        this.showNotification('Exported', `Exported batch "${batch.name}"`, 'success');
    }


    // Utility methods
    copyToClipboard(text) {
        navigator.clipboard.writeText(text).catch(() => {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
        });
    }

    downloadFile(content, filename) {
        const blob = new Blob([content], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    showNotification(title, message, type = 'info') {
        try {
            if (window.showNotification) {
                window.showNotification(title, message, type);
            } else {
                console.log(`${type.toUpperCase()}: ${title} - ${message}`);
            }
        } catch (error) {
            console.log(`${type.toUpperCase()}: ${title} - ${message}`);
        }
    }

    setupEventListeners() {
        // Add any global event listeners here
        document.addEventListener('click', (e) => {
            if (e.target.closest('.batch-action-btn.primary')) {
                const button = e.target.closest('.batch-action-btn.primary');
                const batchCard = button.closest('.batch-card');
                if (batchCard) {
                    const batchId = batchCard.dataset.batchId;
                    console.log('Button clicked, batch ID:', batchId);
                    this.openDocument(batchId);
                }
            }
        });
    }

    refreshBatches() {
        this.loadBatches();
        // Removed notification to avoid spam during key generation
    }

    exportAllBatches() {
        if (this.batches.length === 0) {
            this.showNotification('No Batches', 'No batches to export', 'warning');
            return;
        }

        const allKeys = this.batches.flatMap(batch => batch.keys);
        const csvContent = [
            'Key,Type,Status,Generated At,Generation Name,Batch',
            ...allKeys.map(key => [
                key.key,
                key.type || 'Unknown',
                key.status || 'active',
                new Date(key.generatedAt).toISOString(),
                key.generationName || 'Unknown',
                key.generationId || 'Unknown'
            ].join(','))
        ].join('\n');

        this.downloadFile(csvContent, `all-batches-${new Date().toISOString().split('T')[0]}.csv`);
        this.showNotification('Exported All', `Exported ${allKeys.length} keys from ${this.batches.length} batches`, 'success');
    }
}

// Initialize batch manager
window.batchManager = new BatchManager();

// Key Document handler
window.keyDocument = {
    copyAll: () => window.batchManager.copyAll(),
    export: () => window.batchManager.export(),
    close: () => window.batchManager.close(),
    copyKey: (keyValue) => {
        window.batchManager.copyToClipboard(keyValue);
        window.batchManager.showNotification('Copied', 'Key copied to clipboard', 'success');
    }
};

// Global function for testing
window.testOpenDocument = (batchId) => {
    console.log('Testing openDocument with batchId:', batchId);
    if (window.batchManager) {
        window.batchManager.openDocument(batchId);
    } else {
        console.log('batchManager not found');
    }
};

// Test modal visibility
window.testModal = () => {
    const modal = document.getElementById('key-document-modal');
    if (modal) {
        modal.style.display = 'flex';
        console.log('Modal should be visible now');
    } else {
        console.log('Modal not found');
    }
};
