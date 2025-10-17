/**
 * Admin Keys Management - Simplified
 * Handles simple key import for admin dashboard
 */

class AdminKeys {
    constructor() {
        this.init();
    }

    init() {
        console.log('🔑 Initializing Admin Keys...');
    }

    // Show import modal
    showImportModal() {
        console.log('🔑 Showing import keys modal...');
        const modal = document.getElementById('import-keys-modal');
        if (modal) {
            modal.style.display = 'flex';
        }
    }

    // Close import modal
    closeImportModal() {
        console.log('🔑 Closing import modal...');
        const modal = document.getElementById('import-keys-modal');
        if (modal) {
            modal.style.display = 'none';
        }
        
        // Reset form
        document.getElementById('key-type').value = 'day';
        document.getElementById('keys-list').value = '';
    }

    // Process key import
    async processImport() {
        try {
            const type = document.getElementById('key-type').value;
            const keysText = document.getElementById('keys-list').value.trim();

            if (!keysText) {
                this.showNotification('Validation Error', 'Please enter at least one key', 'warning');
                return;
            }

            const keys = keysText.split('\n').filter(key => key.trim().length > 0);
            
            if (keys.length === 0) {
                this.showNotification('Validation Error', 'No valid keys found', 'warning');
                return;
            }

            console.log(`🔑 Importing ${keys.length} ${type} keys...`);

            const response = await fetch('/api/admin/unused-keys/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: JSON.stringify({
                    type: type,
                    keys: keys
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.success) {
                this.showNotification('Success', `Successfully imported ${data.addedCount} ${type} keys`, 'success');
                this.closeImportModal();
            } else {
                throw new Error(data.message || 'Failed to import keys');
            }
        } catch (error) {
            console.error('❌ Error importing keys:', error);
            this.showNotification('Error', error.message || 'Failed to import keys', 'error');
        }
    }

    showNotification(title, message, type = 'info') {
        if (window.showNotification) {
            window.showNotification(title, message, type);
        } else {
            alert(`${title}: ${message}`);
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔑 Initializing Admin Keys...');
    window.adminKeys = new AdminKeys();
});