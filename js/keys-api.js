// Keys API Integration for Resell Panel
class KeysAPIManager {
    constructor() {
        this.currentKeys = [];
        this.currentPage = 1;
        this.totalPages = 1;
        this.currentFilters = {};
        this.isLoading = false;
    }

    // Generate keys - DEPRECATED: Use core.js confirmKeyGeneration instead
    async generateKeys(type, quantity) {
        console.warn('⚠️ KeysAPIManager.generateKeys() is deprecated. Use core.js confirmKeyGeneration() instead.');
        return null;
    }

    // Load keys with filters
    async loadKeys(filters = {}) {
        try {
            this.isLoading = true;
            this.currentFilters = { ...this.currentFilters, ...filters };
            
            const response = await window.api.getKeys(this.currentFilters);
            
            if (response.success) {
                this.currentKeys = response.data.keys;
                this.currentPage = response.data.pagination.currentPage;
                this.totalPages = response.data.pagination.totalPages;
                
                // Update UI
                this.renderKeys();
                this.renderPagination();
                this.updateStats();
                
                return response.data;
            } else {
                this.showNotification('Load Failed', response.message, 'error');
                return null;
            }
        } catch (error) {
            this.showNotification('Load Error', error.message, 'error');
            return null;
        } finally {
            this.isLoading = false;
        }
    }

    // Delete single key
    async deleteKey(keyId) {
        try {
            const response = await window.api.deleteKey(keyId);
            
            if (response.success) {
                this.showNotification('Key Deleted', 'Key has been removed', 'success');
                
                // Remove from current keys
                this.currentKeys = this.currentKeys.filter(key => key._id !== keyId);
                
                // Update UI
                this.renderKeys();
                this.updateStats();
                
                // Update user stats
                if (window.authManager && window.authManager.currentUser) {
                    window.authManager.currentUser.keysGenerated = Math.max(0, window.authManager.currentUser.keysGenerated - 1);
                    window.authManager.updateUI();
                }
                
                return true;
            } else {
                this.showNotification('Delete Failed', response.message, 'error');
                return false;
            }
        } catch (error) {
            this.showNotification('Delete Error', error.message, 'error');
            return false;
        }
    }

    // Delete multiple keys
    async deleteKeys(keyIds) {
        try {
            const response = await window.api.deleteKeys(keyIds);
            
            if (response.success) {
                this.showNotification('Keys Deleted', `Successfully deleted ${response.data.deletedCount} keys`, 'success');
                
                // Remove from current keys
                this.currentKeys = this.currentKeys.filter(key => !keyIds.includes(key._id));
                
                // Update UI
                this.renderKeys();
                this.updateStats();
                
                // Update user stats
                if (window.authManager && window.authManager.currentUser) {
                    window.authManager.currentUser.keysGenerated = Math.max(0, window.authManager.currentUser.keysGenerated - response.data.deletedCount);
                    window.authManager.updateUI();
                }
                
                return true;
            } else {
                this.showNotification('Delete Failed', response.message, 'error');
                return false;
            }
        } catch (error) {
            this.showNotification('Delete Error', error.message, 'error');
            return false;
        }
    }

    // Delete entire generation
    async deleteGeneration(generationId) {
        try {
            const response = await window.api.deleteGeneration(generationId);
            
            if (response.success) {
                this.showNotification('Generation Deleted', `Successfully deleted generation with ${response.data.deletedCount} keys`, 'success');
                
                // Remove from current keys
                this.currentKeys = this.currentKeys.filter(key => key.generationId !== generationId);
                
                // Update UI
                this.renderKeys();
                this.updateStats();
                
                // Update user stats
                if (window.authManager && window.authManager.currentUser) {
                    window.authManager.currentUser.keysGenerated = Math.max(0, window.authManager.currentUser.keysGenerated - response.data.deletedCount);
                    window.authManager.updateUI();
                }
                
                return true;
            } else {
                this.showNotification('Delete Failed', response.message, 'error');
                return false;
            }
        } catch (error) {
            this.showNotification('Delete Error', error.message, 'error');
            return false;
        }
    }

    // Mark key as used
    async useKey(keyId) {
        try {
            const response = await window.api.useKey(keyId);
            
            if (response.success) {
                this.showNotification('Key Used', 'Key has been marked as used', 'success');
                
                // Update key in current keys
                const keyIndex = this.currentKeys.findIndex(key => key._id === keyId);
                if (keyIndex !== -1) {
                    this.currentKeys[keyIndex].status = 'used';
                    this.currentKeys[keyIndex].usedAt = new Date();
                }
                
                // Update UI
                this.renderKeys();
                
                return true;
            } else {
                this.showNotification('Use Failed', response.message, 'error');
                return false;
            }
        } catch (error) {
            this.showNotification('Use Error', error.message, 'error');
            return false;
        }
    }

    // Get key statistics
    async getStats() {
        try {
            const response = await window.api.getKeyStats();
            
            if (response.success) {
                return response.data;
            } else {
                this.showNotification('Stats Failed', response.message, 'error');
                return null;
            }
        } catch (error) {
            this.showNotification('Stats Error', error.message, 'error');
            return null;
        }
    }

    // Render keys in UI
    renderKeys() {
        const container = document.getElementById('keys-grid');
        if (!container) return;

        if (this.currentKeys.length === 0) {
            container.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; color: #8892b0; padding: 60px 20px;">
                    <i class="fas fa-key" style="font-size: 48px; margin-bottom: 16px; opacity: 0.5;"></i>
                    <h3 style="margin: 0 0 8px 0; color: #ffffff;">No Keys Found</h3>
                    <p style="margin: 0;">Try adjusting your search or filters</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.currentKeys.map(key => this.createKeyCard(key)).join('');
    }

    // Create key card HTML
    createKeyCard(key) {
        const isNew = Date.now() - new Date(key.generatedAt).getTime() < (window.CONFIG?.KEYS?.NEW_KEY_THRESHOLD || 300000);
        
        return `
            <div class="key-card ${isNew ? 'new' : ''}" data-key-id="${key._id}">
                <div class="key-header">
                    <input type="checkbox" class="key-checkbox" onchange="keysAPI.toggleSelection('${key._id}')">
                    <span class="key-type-badge ${key.type}">
                        <i class="fas fa-${this.getKeyTypeIcon(key.type)}"></i>
                        ${key.type.charAt(0).toUpperCase() + key.type.slice(1)}
                    </span>
                </div>
                
                <div class="batch-info">
                    <div class="batch-header">
                        <i class="fas fa-layer-group"></i>
                        <span class="batch-title">Generation Batch</span>
                    </div>
                    <div class="batch-details">
                        <div class="batch-name">${key.generationName}</div>
                        <div class="batch-meta">
                            <span class="batch-date">${this.formatDate(key.generatedAt)}</span>
                            ${key.batchNumber ? `<span class="batch-number">Batch ${key.batchNumber}</span>` : ''}
                        </div>
                    </div>
                </div>
                
                <div class="key-value" onclick="keysAPI.copyKey('${key.key}')" title="Click to copy">
                    ${key.key}
                </div>
                <div class="key-meta">
                    <span class="key-status ${key.status}">${key.status}</span>
                    <span class="key-date">${this.formatDate(key.generatedAt)}</span>
                </div>
                <div class="key-actions">
                    <button class="key-action-btn" onclick="keysAPI.copyKey('${key.key}')" title="Copy key">
                        <i class="fas fa-copy"></i>
                        <span>Copy</span>
                    </button>
                    ${key.status === 'active' ? `
                        <button class="key-action-btn" onclick="keysAPI.useKey('${key._id}')" title="Mark as used">
                            <i class="fas fa-check"></i>
                            <span>Use</span>
                        </button>
                    ` : ''}
                    <button class="key-action-btn" onclick="keysAPI.deleteKey('${key._id}')" title="Delete key">
                        <i class="fas fa-trash"></i>
                        <span>Delete</span>
                    </button>
                </div>
            </div>
        `;
    }

    // Render pagination
    renderPagination() {
        const container = document.getElementById('pagination-container');
        if (!container || this.totalPages <= 1) {
            if (container) container.innerHTML = '';
            return;
        }

        const startPage = Math.max(1, this.currentPage - 2);
        const endPage = Math.min(this.totalPages, this.currentPage + 2);
        
        let paginationHTML = '<div class="pagination-controls">';
        
        // Previous button
        if (this.currentPage > 1) {
            paginationHTML += `<button class="pagination-button" onclick="keysAPI.goToPage(${this.currentPage - 1})">
                <i class="fas fa-chevron-left"></i>
            </button>`;
        }
        
        // Page numbers
        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `<button class="pagination-button ${i === this.currentPage ? 'active' : ''}" onclick="keysAPI.goToPage(${i})">
                ${i}
            </button>`;
        }
        
        // Next button
        if (this.currentPage < this.totalPages) {
            paginationHTML += `<button class="pagination-button" onclick="keysAPI.goToPage(${this.currentPage + 1})">
                <i class="fas fa-chevron-right"></i>
            </button>`;
        }
        
        paginationHTML += '</div>';
        
        // Page info
        const startIndex = (this.currentPage - 1) * 100 + 1; // Set to 100 keys per page
        const endIndex = Math.min(this.currentPage * 100, this.currentKeys.length); // Set to 100 keys per page
        
        paginationHTML += `<div class="pagination-text">
            Showing ${startIndex}-${endIndex} of ${this.currentKeys.length} keys
        </div>`;
        
        container.innerHTML = paginationHTML;
    }

    // Go to specific page
    async goToPage(page) {
        if (page >= 1 && page <= this.totalPages) {
            this.currentPage = page;
            await this.loadKeys({ page });
        }
    }

    // Update statistics
    async updateStats() {
        try {
            const stats = await this.getStats();
            if (stats) {
                // Update stats in UI
                const totalKeysEl = document.getElementById('total-keys');
                const activeKeysEl = document.getElementById('active-keys');
                const dayKeysEl = document.getElementById('day-keys');
                const weekKeysEl = document.getElementById('week-keys');
                const lifetimeKeysEl = document.getElementById('lifetime-keys');

                if (totalKeysEl) totalKeysEl.textContent = stats.totalKeys || 0;
                if (activeKeysEl) activeKeysEl.textContent = stats.activeKeys || 0;
                if (dayKeysEl) dayKeysEl.textContent = stats.dayKeys || 0;
                if (weekKeysEl) weekKeysEl.textContent = stats.weekKeys || 0;
                if (lifetimeKeysEl) lifetimeKeysEl.textContent = stats.lifetimeKeys || 0;
            }
        } catch (error) {
            console.error('Stats update error:', error);
        }
    }

    // Copy key to clipboard
    async copyKey(key) {
        try {
            await navigator.clipboard.writeText(key);
            this.showNotification('Copied!', 'Key copied to clipboard', 'success');
        } catch (error) {
            this.showNotification('Copy Failed', 'Failed to copy key', 'error');
        }
    }

    // Toggle key selection
    toggleSelection(keyId) {
        // Implementation for key selection
        console.log('Toggle selection for key:', keyId);
    }

    // Utility functions
    getKeyTypeIcon(type) {
        const icons = {
            'day': 'calendar-day',
            'week': 'calendar-week',
            'lifetime': 'infinity'
        };
        return icons[type] || 'key';
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const config = window.CONFIG?.DATE || {};
        return date.toLocaleDateString(config.LOCALE || 'en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // Show notification
    showNotification(title, message, type = 'info') {
        if (window.showNotification) {
            window.showNotification(title, message, type);
        } else {
            console.log(`${type.toUpperCase()}: ${title} - ${message}`);
        }
    }
}

// Create global keys API manager
window.keysAPI = new KeysAPIManager();

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = KeysAPIManager;
}
