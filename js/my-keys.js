// Smart Keys System - Complete Rebuild
class SmartKeysManager {
    constructor() {
        this.allKeys = [];
        this.filteredKeys = [];
        this.selectedKeys = new Set();
        this.currentFilter = 'all';
        this.currentSearch = '';
        this.currentGeneration = null;
        this.currentPage = 1;
        this.itemsPerPage = 100; // Set to 100 keys per page
        this.totalPages = 1;
        this.searchTimeout = null;
        this.isLoading = false;
        this.latestGeneration = null;
        this.viewMode = 'grid'; // 'grid' or 'list'
        this.sortBy = 'date'; // 'date', 'type', 'status', 'user'
        this.sortOrder = 'desc'; // 'asc' or 'desc'
        this.showFilters = false;
    }

    init() {
        this.loadKeys();
        this.setupEventListeners();
        this.updateGenerationOverview();
        this.applyFilters();
        this.checkForGeneratedKeys();
    }

    checkForGeneratedKeys() {
        // Check if we have any keys and log batch information
        if (this.allKeys.length > 0) {
            console.log('=== BATCH DETECTION ===');
            console.log('Total keys found:', this.allKeys.length);
            
            const batches = this.getUniqueGenerations();
            console.log('Unique batches found:', batches.length);
            
            batches.forEach((batch, index) => {
                console.log(`Batch ${index + 1}:`, {
                    name: batch.name,
                    count: batch.count,
                    type: batch.type,
                    date: batch.date
                });
            });
            
            // Show batch summary if we have multiple batches
            if (batches.length > 1) {
                this.showBatchSummary(batches);
            }
        } else {
            console.log('No generated keys found');
        }
    }

    showBatchSummary(batches) {
        const summaryElement = document.getElementById('batch-summary');
        const detailsElement = document.getElementById('batch-details');
        
        if (summaryElement && detailsElement) {
            summaryElement.style.display = 'block';
            
            detailsElement.innerHTML = batches.map((batch, index) => `
                <div class="batch-item">
                    <div class="batch-name">${batch.name}</div>
                    <div class="batch-count">${batch.count} keys</div>
                    <div class="batch-type">${batch.type} Keys</div>
                    <div class="batch-date">${this.formatDate(batch.date)}</div>
                </div>
            `).join('');
        }
    }

    async loadKeys() {
        console.log('=== LOADING KEYS FROM BACKEND API ===');
        
        // Show skeleton loading
        this.showSkeleton();
        
        try {
            // Use backend API to load keys
            if (window.api && window.api.isAuthenticated()) {
                const response = await window.api.getKeys();
                
                if (response && response.success) {
                    this.allKeys = response.data.keys || [];
                    this.findLatestGeneration();
                    // Keys loaded from backend
                    
                    // Keys loaded successfully
                    
                    // Update UI
                    this.renderKeys();
                    this.updateGenerationOverview();
                    this.applyFilters();
                    
                    return;
                } else {
                    console.log('Backend API failed, falling back to local storage');
                }
            } else {
                console.log('Not authenticated, falling back to local storage');
            }
        } catch (error) {
            console.log('Backend API error:', error);
        }
        
        // Fallback: Check localStorage directly (for offline mode)
        console.log('=== FALLBACK: CHECKING LOCALSTORAGE ===');
        try {
            const storedData = localStorage.getItem('resellerPanelData');
            if (storedData) {
                const parsedData = JSON.parse(storedData);
                if (parsedData.generatedKeys && Array.isArray(parsedData.generatedKeys)) {
                    this.allKeys = parsedData.generatedKeys;
                    console.log('Loaded from localStorage:', this.allKeys.length);
                    this.findLatestGeneration();
                    
                    // Update UI
                    this.renderKeys();
                    this.updateGenerationOverview();
                    this.applyFilters();
                }
            }
        } catch (error) {
            console.log('Error parsing localStorage:', error);
        }
        
        // If still no keys, initialize empty array
        if (this.allKeys.length === 0) {
            console.log('No keys found, initializing empty array');
            this.allKeys = [];
            this.renderKeys();
        }
        
        // Hide skeleton loading
        this.hideSkeleton();
    }

    showSkeleton() {
        const container = document.getElementById('keys-grid');
        if (!container) return;
        
        container.innerHTML = `
            <div class="skeleton-card"></div>
            <div class="skeleton-card"></div>
            <div class="skeleton-card"></div>
            <div class="skeleton-card"></div>
        `;
    }

    hideSkeleton() {
        // Skeleton will be replaced by actual content
    }

    findLatestGeneration() {
        if (this.allKeys.length === 0) return;
        
        const generations = this.getUniqueGenerations();
        if (generations.length > 0) {
            this.latestGeneration = generations[0].id;
        }
    }

    setupEventListeners() {
        // Search input with debouncing
        const searchInput = document.getElementById('smart-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                clearTimeout(this.searchTimeout);
                this.searchTimeout = setTimeout(() => {
                    this.currentSearch = e.target.value.toLowerCase();
                    this.applyFilters();
                }, 300);
            });
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });
    }

    handleKeyboardShortcuts(e) {
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case 'a':
                    e.preventDefault();
                    this.selectAll();
                    break;
                case 'c':
                    if (this.selectedKeys.size > 0) {
                        e.preventDefault();
                        this.copySelected();
                    }
                    break;
                case 'Delete':
                case 'Backspace':
                    if (this.selectedKeys.size > 0) {
                        e.preventDefault();
                        this.deleteSelected();
                    }
                    break;
            }
        }
        
        if (e.key === 'Escape') {
            this.clearSelection();
        }
    }

    applyFilters() {
        this.showLoading(true);
        
        requestAnimationFrame(() => {
            this.filteredKeys = this.allKeys.filter(key => {
                const matchesSearch = !this.currentSearch || 
                    key.key.toLowerCase().includes(this.currentSearch) ||
                    key.type?.toLowerCase().includes(this.currentSearch) ||
                    key.generationName?.toLowerCase().includes(this.currentSearch) ||
                    new Date(key.generatedAt).toLocaleDateString().toLowerCase().includes(this.currentSearch);
                
                const matchesFilter = this.getFilterCondition(key);
                
                return matchesSearch && matchesFilter;
            });

            this.sortKeys();
            this.updateStats();
            this.renderKeys();
            this.updateSelectionCount();
            this.showLoading(false);
        });
    }

    getFilterCondition(key) {
        switch (this.currentFilter) {
            case 'all':
                return true;
            case 'latest':
                return key.generationId === this.latestGeneration;
            case 'day':
                return key.type === 'day';
            case 'week':
                return key.type === 'week';
            case 'lifetime':
                return key.type === 'lifetime';
            case 'active':
                return key.status === 'active';
            default:
                return true;
        }
    }

    sortKeys() {
        this.filteredKeys.sort((a, b) => {
            // Sort by generation (latest first), then by date
            if (a.generationId !== b.generationId) {
                return b.generatedAt.localeCompare(a.generatedAt);
            }
            return new Date(b.generatedAt) - new Date(a.generatedAt);
        });
    }

    updateStats() {
        // Update generation overview
        this.updateGenerationOverview();
    }

    updateGenerationOverview() {
        const overview = document.getElementById('generation-overview');
        if (!overview) return;

        const generations = this.getUniqueGenerations();
        
        if (generations.length === 0) {
            overview.innerHTML = `
                <div style="text-align: center; color: #8892b0; padding: 40px;">
                    <i class="fas fa-key" style="font-size: 48px; margin-bottom: 16px; opacity: 0.5;"></i>
                    <h3 style="margin: 0 0 8px 0; color: #ffffff;">No Keys Generated</h3>
                    <p style="margin: 0;">Generate your first keys to get started</p>
                </div>
            `;
            return;
        }

        overview.innerHTML = generations.map((gen, index) => `
            <div class="generation-batch ${index === 0 ? 'latest' : ''}" onclick="smartKeys.filterByGeneration('${gen.id}')">
                <div class="generation-header">
                    <div>
                        <div class="generation-name">${gen.name}</div>
                        <div class="generation-date">${this.formatDate(gen.date)}</div>
                    </div>
                </div>
                <div class="generation-stats">
                    <div class="generation-count">${gen.count}</div>
                    <div class="generation-type">${gen.type} Keys</div>
                </div>
                <div class="generation-actions">
                    <button class="generation-btn primary" onclick="event.stopPropagation(); smartKeys.openBatchViewer('${gen.id}')">
                        <i class="fas fa-layer-group"></i>
                        View Batch
                    </button>
                    <button class="generation-btn" onclick="event.stopPropagation(); smartKeys.filterByGeneration('${gen.id}')">
                        <i class="fas fa-eye"></i>
                        Filter
                    </button>
                    <button class="generation-btn danger" onclick="event.stopPropagation(); smartKeys.deleteGeneration('${gen.id}')">
                        <i class="fas fa-trash"></i>
                        Delete
                    </button>
                </div>
            </div>
        `).join('');
    }

    getUniqueGenerations() {
        const generationMap = new Map();
        
        this.allKeys.forEach(key => {
            if (key.generationId && key.generationName) {
                if (!generationMap.has(key.generationId)) {
                    generationMap.set(key.generationId, {
                        id: key.generationId,
                        name: key.generationName,
                        count: 0,
                        date: key.generatedAt,
                        type: key.type
                    });
                }
                generationMap.get(key.generationId).count++;
            }
        });
        
        return Array.from(generationMap.values()).sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    filterByGeneration(generationId) {
        this.currentGeneration = generationId;
        this.currentFilter = 'generation';
        this.applyFilters();
        
        // Update filter tabs
        document.querySelectorAll('.filter-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        
        this.showNotification('Filter Applied', 'Showing keys from selected generation.', 'success');
    }

    deleteGeneration(generationId) {
        const generation = this.getUniqueGenerations().find(g => g.id === generationId);
        if (!generation) return;

        if (confirm(`Delete entire generation "${generation.name}" with ${generation.count} keys? This action cannot be undone.`)) {
            this.allKeys = this.allKeys.filter(key => key.generationId !== generationId);
            
            if (window.userData && window.userData.generatedKeys) {
                window.userData.generatedKeys = this.allKeys;
                window.userData.keysGenerated = this.allKeys.length;
                window.saveUserData();
            }
            
            this.findLatestGeneration();
            this.applyFilters();
            this.updateGenerationOverview();
            
            this.showNotification('Generation Deleted', `Deleted ${generation.count} keys from generation.`, 'success');
        }
    }

    setFilter(filter) {
        this.currentFilter = filter;
        this.currentGeneration = null;
        
        // Update filter tabs
        document.querySelectorAll('.filter-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        
        const activeTab = document.querySelector(`[data-filter="${filter}"]`);
        if (activeTab) {
            activeTab.classList.add('active');
        }
        
        this.applyFilters();
    }

    renderKeys() {
        const container = document.getElementById('keys-grid');
        if (!container) return;

        if (this.filteredKeys.length === 0) {
            container.innerHTML = `
                <div class="fade-in-up" style="grid-column: 1 / -1; text-align: center; color: #8892b0; padding: 60px 20px;">
                    <i class="fas fa-search" style="font-size: 48px; margin-bottom: 16px; opacity: 0.5;"></i>
                    <h3 style="margin: 0 0 8px 0; color: #ffffff;">No Keys Found</h3>
                    <p style="margin: 0;">Try adjusting your search or filters</p>
                </div>
            `;
            return;
        }

        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const pageKeys = this.filteredKeys.slice(startIndex, endIndex);

        // Apply view mode class
        container.className = `keys-container ${this.viewMode}-view`;
        
        if (this.viewMode === 'list') {
            container.innerHTML = pageKeys.map(key => this.createKeyListItem(key)).join('');
        } else {
            container.innerHTML = pageKeys.map(key => this.createKeyCard(key)).join('');
        }
        
        this.renderPagination();
    }

    createKeyCard(key) {
        const isSelected = this.selectedKeys.has(key.id);
        const isLatestGeneration = key.generationId === this.latestGeneration;
        const isNew = Date.now() - new Date(key.generatedAt).getTime() < (window.CONFIG?.KEYS?.NEW_KEY_THRESHOLD || 300000);

        // Determine batch info
        const batchInfo = this.getBatchInfo(key);
        
        return `
            <div class="key-card card-enhanced hover-lift key-type-${key.type} ${isSelected ? 'selected' : ''} ${isLatestGeneration ? 'latest-generation' : ''} ${isNew ? 'new' : ''} fade-in-up" data-key-id="${key.id}">
                <div class="key-header">
                    <input type="checkbox" class="key-checkbox focus-enhanced" ${isSelected ? 'checked' : ''} 
                           onchange="smartKeys.toggleSelection('${key.id}')">
                    <span class="key-type-badge ${key.type || ''} status-${key.status}">
                        <i class="fas fa-${this.getKeyTypeIcon(key.type)}"></i>
                        ${key.type ? key.type.charAt(0).toUpperCase() + key.type.slice(1) : 'Generated'}
                    </span>
                </div>
                
                <!-- Batch Information - Always Show -->
                <div class="batch-info">
                    <div class="batch-header">
                        <i class="fas fa-layer-group"></i>
                        <span class="batch-title">Generation Batch</span>
                    </div>
                <div class="batch-details">
                    <div class="batch-name">${batchInfo.name}</div>
                    <div class="batch-meta">
                        <span class="batch-date">${batchInfo.date}</span>
                        ${batchInfo.batchNumber ? `<span class="batch-number">Batch ${batchInfo.batchNumber}</span>` : ''}
                        ${key.userId && key.userId.username ? `<span class="user-info">Generated by: ${key.userId.username}</span>` : ''}
                    </div>
                </div>
                </div>
                
                <div class="key-value hover-scale transition-smooth" onclick="smartKeys.copyKey('${key.key}')" title="Click to copy">
                    ${key.key}
                </div>
                <div class="key-meta">
                    <span class="key-status status-${key.status}">${key.status}</span>
                    <span class="key-date">${this.formatDate(key.generatedAt)}</span>
                </div>
                <div class="key-actions">
                    <button class="key-action-btn btn-enhanced hover-glow" onclick="smartKeys.copyKey('${key.key}')" title="Copy key">
                        <i class="fas fa-copy"></i>
                        <span>Copy</span>
                    </button>
                </div>
            </div>
        `;
    }

    createKeyListItem(key) {
        const isSelected = this.selectedKeys.has(key.id);
        const isLatestGeneration = key.generationId === this.latestGeneration;
        const isNew = Date.now() - new Date(key.generatedAt).getTime() < (window.CONFIG?.KEYS?.NEW_KEY_THRESHOLD || 300000);
        const batchInfo = this.getBatchInfo(key);

        return `
            <div class="key-list-item ${isSelected ? 'selected' : ''} ${isLatestGeneration ? 'latest-generation' : ''} ${isNew ? 'new' : ''}" data-key-id="${key.id}">
                <div class="list-item-checkbox">
                    <input type="checkbox" class="key-checkbox" ${isSelected ? 'checked' : ''} 
                           onchange="smartKeys.toggleSelection('${key.id}')">
                </div>
                
                <div class="list-item-type">
                    <span class="key-type-badge ${key.type || ''}">
                        <i class="fas fa-${this.getKeyTypeIcon(key.type)}"></i>
                        ${key.type ? key.type.charAt(0).toUpperCase() + key.type.slice(1) : 'Generated'}
                    </span>
                </div>
                
                <div class="list-item-key" onclick="smartKeys.copyKey('${key.key}')" title="Click to copy">
                    <div class="key-value">${key.key}</div>
                    <div class="key-generation">${batchInfo.name}</div>
                </div>
                
                <div class="list-item-status">
                    <span class="key-status ${key.status || 'active'}">${key.status || 'active'}</span>
                </div>
                
                <div class="list-item-date">
                    <div class="key-date">${this.formatDate(key.generatedAt)}</div>
                    ${key.userId && key.userId.username ? `<div class="user-info">${key.userId.username}</div>` : ''}
                </div>
                
                <div class="list-item-actions">
                    <button class="key-action-btn" onclick="smartKeys.copyKey('${key.key}')" title="Copy Key">
                        <i class="fas fa-copy"></i>
                    </button>
                </div>
            </div>
        `;
    }

    getBatchInfo(key) {
        if (key.generationName) {
            return {
                name: key.generationName,
                date: this.formatDate(key.generatedAt),
                batchNumber: key.batchNumber
            };
        } else {
            // Fallback for keys without generation info
            return {
                name: `${key.type ? key.type.charAt(0).toUpperCase() + key.type.slice(1) : 'Generated'} Keys - ${new Date(key.generatedAt).toLocaleDateString()}`,
                date: this.formatDate(key.generatedAt),
                batchNumber: null
            };
        }
    }

    // View mode toggle
    toggleViewMode() {
        this.viewMode = this.viewMode === 'grid' ? 'list' : 'grid';
        this.renderKeys();
        this.showNotification('View Changed', `Switched to ${this.viewMode} view`, 'info');
    }

    // Sorting functionality
    sortKeys() {
        this.filteredKeys.sort((a, b) => {
            let aValue, bValue;
            
            switch (this.sortBy) {
                case 'date':
                    aValue = new Date(a.generatedAt);
                    bValue = new Date(b.generatedAt);
                    break;
                case 'type':
                    aValue = a.type || '';
                    bValue = b.type || '';
                    break;
                case 'status':
                    aValue = a.status || 'active';
                    bValue = b.status || 'active';
                    break;
                case 'user':
                    aValue = a.userId?.username || '';
                    bValue = b.userId?.username || '';
                    break;
                default:
                    return 0;
            }
            
            if (this.sortOrder === 'asc') {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });
    }

    setSorting(sortBy, sortOrder = 'desc') {
        this.sortBy = sortBy;
        this.sortOrder = sortOrder;
        this.sortKeys();
        this.renderKeys();
        this.showNotification('Sorted', `Sorted by ${sortBy} (${sortOrder})`, 'info');
    }

    toggleSortOrder() {
        this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
        this.sortKeys();
        this.renderKeys();
    }

    // Filter toggle
    toggleFilters() {
        this.showFilters = !this.showFilters;
        const filterPanel = document.getElementById('filter-panel');
        if (filterPanel) {
            filterPanel.style.display = this.showFilters ? 'block' : 'none';
        }
        this.showNotification('Filters', this.showFilters ? 'Filters shown' : 'Filters hidden', 'info');
    }

    // Bulk operations
    updateSelectionCount() {
        const bulkActions = document.getElementById('bulk-actions');
        const selectionCount = document.querySelector('.selection-count');
        
        if (bulkActions && selectionCount) {
            const count = this.selectedKeys.size;
            selectionCount.textContent = `${count} selected`;
            bulkActions.style.display = count > 0 ? 'flex' : 'none';
        }
    }

    bulkCopy() {
        if (this.selectedKeys.size === 0) {
            this.showNotification('No Selection', 'Please select keys to copy', 'warning');
            return;
        }

        const selectedKeys = Array.from(this.selectedKeys);
        const keysToCopy = this.allKeys.filter(key => selectedKeys.includes(key.id));
        const keyValues = keysToCopy.map(key => key.key).join('\n');
        
        navigator.clipboard.writeText(keyValues).then(() => {
            this.showNotification('Copied', `Copied ${keysToCopy.length} keys to clipboard`, 'success');
        }).catch(() => {
            this.showNotification('Copy Failed', 'Failed to copy keys to clipboard', 'error');
        });
    }


    bulkExport() {
        if (this.selectedKeys.size === 0) {
            this.showNotification('No Selection', 'Please select keys to export', 'warning');
            return;
        }

        const selectedKeys = Array.from(this.selectedKeys);
        const keysToExport = this.allKeys.filter(key => selectedKeys.includes(key.id));
        
        const csvContent = [
            'Key,Type,Status,Generated At,Generation Name,User',
            ...keysToExport.map(key => [
                key.key,
                key.type || 'Unknown',
                key.status || 'active',
                new Date(key.generatedAt).toISOString(),
                key.generationName || 'Unknown',
                key.userId?.username || 'Unknown'
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `selected-keys-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        this.showNotification('Exported', `Exported ${keysToExport.length} keys`, 'success');
    }

    // Batch Viewer functionality
    openBatchViewer(generationId) {
        const batchKeys = this.allKeys.filter(key => key.generationId === generationId);
        if (batchKeys.length === 0) {
            this.showNotification('No Keys', 'No keys found in this batch', 'warning');
            return;
        }

        this.currentBatchId = generationId;
        this.currentBatchKeys = batchKeys;
        this.batchSelectedKeys = new Set();

        // Update modal title and stats
        document.getElementById('batch-viewer-title').textContent = batchKeys[0].generationName || 'Batch Viewer';
        document.getElementById('batch-total-keys').textContent = batchKeys.length;
        document.getElementById('batch-type').textContent = batchKeys[0].type ? batchKeys[0].type.charAt(0).toUpperCase() + batchKeys[0].type.slice(1) : 'Unknown';
        document.getElementById('batch-date').textContent = this.formatDate(batchKeys[0].generatedAt);
        
        // Calculate batch status
        const activeKeys = batchKeys.filter(key => key.status === 'active').length;
        const usedKeys = batchKeys.filter(key => key.status === 'used').length;
        document.getElementById('batch-status').textContent = `${activeKeys} active, ${usedKeys} used`;

        // Render keys
        this.renderBatchKeys();
        
        // Show modal
        document.getElementById('batch-viewer-modal').style.display = 'flex';
        
        // Setup search
        this.setupBatchSearch();
    }

    closeBatchViewer() {
        document.getElementById('batch-viewer-modal').style.display = 'none';
        this.currentBatchId = null;
        this.currentBatchKeys = [];
        this.batchSelectedKeys = new Set();
    }

    renderBatchKeys() {
        const container = document.getElementById('batch-keys-list');
        if (!container || !this.currentBatchKeys) return;

        container.innerHTML = this.currentBatchKeys.map(key => this.createBatchKeyItem(key)).join('');
    }

    createBatchKeyItem(key) {
        const isSelected = this.batchSelectedKeys.has(key.id);
        
        return `
            <div class="batch-key-item ${isSelected ? 'selected' : ''}" data-key-id="${key.id}">
                <div class="batch-key-checkbox">
                    <input type="checkbox" class="key-checkbox" ${isSelected ? 'checked' : ''} 
                           onchange="smartKeys.toggleBatchKeySelection('${key.id}')">
                </div>
                <div class="batch-key-value" onclick="smartKeys.copyKey('${key.key}')" title="Click to copy">
                    ${key.key}
                </div>
                <div class="batch-key-actions">
                    <button class="batch-key-action-btn" onclick="smartKeys.copyKey('${key.key}')" title="Copy Key">
                        <i class="fas fa-copy"></i>
                    </button>
                </div>
            </div>
        `;
    }

    toggleBatchKeySelection(keyId) {
        if (this.batchSelectedKeys.has(keyId)) {
            this.batchSelectedKeys.delete(keyId);
        } else {
            this.batchSelectedKeys.add(keyId);
        }
        
        // Update visual state
        const keyItem = document.querySelector(`[data-key-id="${keyId}"]`);
        if (keyItem) {
            keyItem.classList.toggle('selected', this.batchSelectedKeys.has(keyId));
        }
        
        this.updateBatchSelectionCount();
    }

    selectAllBatchKeys() {
        this.currentBatchKeys.forEach(key => {
            this.batchSelectedKeys.add(key.id);
        });
        this.renderBatchKeys();
        this.updateBatchSelectionCount();
        this.showNotification('Selected All', `Selected ${this.currentBatchKeys.length} keys`, 'info');
    }

    clearBatchSelection() {
        this.batchSelectedKeys.clear();
        this.renderBatchKeys();
        this.updateBatchSelectionCount();
        this.showNotification('Cleared Selection', 'All keys deselected', 'info');
    }

    updateBatchSelectionCount() {
        const count = this.batchSelectedKeys.size;
        // You can add a selection counter in the batch viewer if needed
    }

    setupBatchSearch() {
        const searchInput = document.getElementById('batch-search');
        if (!searchInput) return;

        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const keyItems = document.querySelectorAll('.batch-key-item');
            
            keyItems.forEach(item => {
                const keyValue = item.querySelector('.batch-key-value').textContent.toLowerCase();
                const matches = keyValue.includes(searchTerm);
                item.style.display = matches ? 'flex' : 'none';
            });
        });
    }

    copyAllBatchKeys() {
        if (!this.currentBatchKeys || this.currentBatchKeys.length === 0) {
            this.showNotification('No Keys', 'No keys to copy', 'warning');
            return;
        }

        const keyValues = this.currentBatchKeys.map(key => key.key).join('\n');
        
        navigator.clipboard.writeText(keyValues).then(() => {
            this.showNotification('Copied All', `Copied ${this.currentBatchKeys.length} keys to clipboard`, 'success');
        }).catch(() => {
            this.showNotification('Copy Failed', 'Failed to copy keys to clipboard', 'error');
        });
    }

    exportBatchKeys() {
        if (!this.currentBatchKeys || this.currentBatchKeys.length === 0) {
            this.showNotification('No Keys', 'No keys to export', 'warning');
            return;
        }

        const csvContent = [
            'Key,Type,Status,Generated At,Generation Name,User',
            ...this.currentBatchKeys.map(key => [
                key.key,
                key.type || 'Unknown',
                key.status || 'active',
                new Date(key.generatedAt).toISOString(),
                key.generationName || 'Unknown',
                key.userId?.username || 'Unknown'
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `batch-keys-${this.currentBatchId}-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        this.showNotification('Exported', `Exported ${this.currentBatchKeys.length} keys from batch`, 'success');
    }

    deleteBatchKeys() {
        if (!this.currentBatchKeys || this.currentBatchKeys.length === 0) {
            this.showNotification('No Keys', 'No keys to delete', 'warning');
            return;
        }

        if (confirm(`Delete entire batch "${this.currentBatchKeys[0].generationName}" with ${this.currentBatchKeys.length} keys? This action cannot be undone.`)) {
            // Remove keys from main array
            this.allKeys = this.allKeys.filter(key => key.generationId !== this.currentBatchId);
            
            // Update local storage
            if (window.userData && window.userData.generatedKeys) {
                window.userData.generatedKeys = this.allKeys;
                window.userData.keysGenerated = this.allKeys.length;
                window.saveUserData();
            }
            
            // Close modal and refresh
            this.closeBatchViewer();
            this.applyFilters();
            this.updateGenerationOverview();
            this.showNotification('Batch Deleted', `Deleted ${this.currentBatchKeys.length} keys from batch`, 'success');
        }
    }

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

    copyKey(key) {
        navigator.clipboard.writeText(key).then(() => {
            this.showNotification('Copied!', 'Key copied to clipboard.', 'success');
        }).catch(() => {
            this.showNotification('Error', 'Failed to copy key.', 'error');
        });
    }


    toggleSelection(keyId) {
        if (this.selectedKeys.has(keyId)) {
            this.selectedKeys.delete(keyId);
        } else {
            this.selectedKeys.add(keyId);
        }
        
        this.updateSelectionCount();
        this.updateActionControls();
    }

    selectAll() {
        this.filteredKeys.forEach(key => {
            this.selectedKeys.add(key.id);
        });
        this.updateSelectionCount();
        this.updateActionControls();
        this.showNotification('All Selected', `Selected ${this.filteredKeys.length} keys.`, 'success');
    }

    clearSelection() {
        this.selectedKeys.clear();
        this.updateSelectionCount();
        this.updateActionControls();
    }

    updateSelectionCount() {
        const countElement = document.getElementById('selection-count');
        if (countElement) {
            countElement.textContent = `${this.selectedKeys.size} selected`;
        }
    }

    updateActionControls() {
        const actionControls = document.getElementById('action-controls');
        if (actionControls) {
            actionControls.style.display = this.selectedKeys.size > 0 ? 'flex' : 'none';
        }
    }

    copySelected() {
        if (this.selectedKeys.size === 0) {
            this.showNotification('No Selection', 'Please select keys to copy.', 'warning');
            return;
        }

        const selectedKeys = this.filteredKeys.filter(key => this.selectedKeys.has(key.id));
        const keysText = selectedKeys.map(key => key.key).join('\n');
        
        navigator.clipboard.writeText(keysText).then(() => {
            this.showNotification('Copied!', `${selectedKeys.length} keys copied to clipboard.`, 'success');
        }).catch(() => {
            this.showNotification('Error', 'Failed to copy keys.', 'error');
        });
    }

    deleteSelected() {
        if (this.selectedKeys.size === 0) {
            this.showNotification('No Selection', 'Please select keys to delete.', 'warning');
            return;
        }

        if (confirm(`Are you sure you want to delete ${this.selectedKeys.size} selected keys? This action cannot be undone.`)) {
            const keysToDelete = Array.from(this.selectedKeys);
            
            this.allKeys = this.allKeys.filter(key => !keysToDelete.includes(key.id));
            this.selectedKeys.clear();
            
            if (window.userData) {
                window.userData.generatedKeys = this.allKeys;
                window.userData.keysGenerated = this.allKeys.length;
                window.saveUserData();
                
                // Update dashboard counter
                if (window.updateUI) {
                    window.updateUI();
                }
            }
            
            this.applyFilters();
            this.updateSelectionCount();
            this.updateActionControls();
            
            this.showNotification('Keys Deleted', `Successfully deleted ${keysToDelete.length} keys.`, 'success');
        }
    }

    exportAllKeys() {
        if (this.allKeys.length === 0) {
            this.showNotification('No Keys', 'No keys to export.', 'info');
            return;
        }

        const keysText = this.allKeys.map(key => `${key.key} | ${key.type} | ${key.generationName || 'Unknown'} | ${this.formatDate(key.generatedAt)}`).join('\n');
        const blob = new Blob([keysText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `keys_export_${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showNotification('Exported!', `Exported ${this.allKeys.length} keys.`, 'success');
    }

    clearSearch() {
        const searchInput = document.getElementById('smart-search');
        if (searchInput) {
            searchInput.value = '';
        }
        this.currentSearch = '';
        this.applyFilters();
    }

    renderPagination() {
        const container = document.getElementById('pagination-container');
        if (!container) return;

        this.totalPages = Math.ceil(this.filteredKeys.length / this.itemsPerPage);
        
        if (this.totalPages <= 1) {
            container.innerHTML = '';
            return;
        }

        const startPage = Math.max(1, this.currentPage - 2);
        const endPage = Math.min(this.totalPages, this.currentPage + 2);
        
        let paginationHTML = '<div class="pagination-controls">';
        
        // Previous button
        if (this.currentPage > 1) {
            paginationHTML += `<button class="pagination-button" onclick="smartKeys.goToPage(${this.currentPage - 1})">
                <i class="fas fa-chevron-left"></i>
            </button>`;
        }
        
        // Page numbers
        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `<button class="pagination-button ${i === this.currentPage ? 'active' : ''}" onclick="smartKeys.goToPage(${i})">
                ${i}
            </button>`;
        }
        
        // Next button
        if (this.currentPage < this.totalPages) {
            paginationHTML += `<button class="pagination-button" onclick="smartKeys.goToPage(${this.currentPage + 1})">
                <i class="fas fa-chevron-right"></i>
            </button>`;
        }
        
        paginationHTML += '</div>';
        
        // Page info
        const startIndex = (this.currentPage - 1) * this.itemsPerPage + 1;
        const endIndex = Math.min(this.currentPage * this.itemsPerPage, this.filteredKeys.length);
        
        paginationHTML += `<div class="pagination-text">
            Showing ${startIndex}-${endIndex} of ${this.filteredKeys.length} keys
        </div>`;
        
        container.innerHTML = paginationHTML;
    }

    goToPage(page) {
        if (page >= 1 && page <= this.totalPages) {
            this.currentPage = page;
            this.renderKeys();
        }
    }

    showLoading(show) {
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = show ? 'flex' : 'none';
        }
    }

    refreshKeys() {
        console.log('=== REFRESHING KEYS ===');
        this.loadKeys();
        this.updateGenerationOverview();
        this.applyFilters();
        this.showNotification('Refreshed', 'Keys have been refreshed.', 'success');
    }

    // Demo keys function removed - use backend API instead


    showNotification(title, message, type = 'info') {
        if (window.showNotification) {
            window.showNotification(title, message, type);
        } else {
            console.log(`${type.toUpperCase()}: ${title} - ${message}`);
        }
    }
}

// Initialize the smart keys manager
let smartKeys;

document.addEventListener('DOMContentLoaded', function() {
    smartKeys = new SmartKeysManager();
    smartKeys.init();
});

// Export functions for global access
window.smartKeys = smartKeys;