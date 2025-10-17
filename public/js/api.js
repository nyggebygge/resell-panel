// Frontend API Integration for Resell Panel
class ResellPanelAPI {
    constructor() {
        this.baseURL = window.CONFIG?.API?.BASE_URL || 'http://localhost:3001/api';
        this.token = localStorage.getItem('authToken');
    }

    // Set authentication token
    setToken(token) {
        this.token = token;
        localStorage.setItem('authToken', token);
    }

    // Clear authentication token
    clearToken() {
        this.token = null;
        localStorage.removeItem('authToken');
    }

    // Get headers for API requests
    getHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };
        
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
            console.log('API request with token:', this.token.substring(0, 20) + '...');
        } else {
            console.log('API request without token');
        }
        
        return headers;
    }

    // Make API request
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: this.getHeaders(),
            ...options
        };

        // Show global loading indicator for long requests
        this.showGlobalLoading();

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'API request failed');
            }

            return data;
        } catch (error) {
            console.error('API request error:', error);
            
            // Enhanced error handling
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new Error('Network Error: Unable to connect to server. Please check your internet connection.');
            } else if (error.message.includes('401')) {
                throw new Error('Authentication Error: Please login again.');
            } else if (error.message.includes('403')) {
                throw new Error('Access Denied: You do not have permission to perform this action.');
            } else if (error.message.includes('404')) {
                throw new Error('Not Found: The requested resource was not found.');
            } else if (error.message.includes('500')) {
                throw new Error('Server Error: Something went wrong on our end. Please try again later.');
            } else if (error.message.includes('timeout')) {
                throw new Error('Request Timeout: The server is taking too long to respond. Please try again.');
            }
            
            throw error;
        } finally {
            this.hideGlobalLoading();
        }
    }

    // Show global loading indicator
    showGlobalLoading() {
        let loader = document.getElementById('global-loader');
        if (!loader) {
            loader = document.createElement('div');
            loader.id = 'global-loader';
            loader.innerHTML = `
                <div class="global-loader-overlay">
                    <div class="global-loader-content">
                        <i class="fas fa-spinner fa-spin"></i>
                        <span>Loading...</span>
                    </div>
                </div>
            `;
            document.body.appendChild(loader);
        }
        loader.style.display = 'flex';
    }

    // Hide global loading indicator
    hideGlobalLoading() {
        const loader = document.getElementById('global-loader');
        if (loader) {
            loader.style.display = 'none';
        }
    }

    // Authentication API
    async register(userData) {
        return this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    }

    async login(credentials) {
        const response = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials)
        });
        
        if (response.success && response.data.token) {
            this.setToken(response.data.token);
        }
        
        return response;
    }

    async logout() {
        const response = await this.request('/auth/logout', {
            method: 'POST'
        });
        
        this.clearToken();
        return response;
    }

    async getProfile() {
        return this.request('/auth/profile');
    }

    async updateProfile(profileData) {
        return this.request('/auth/profile', {
            method: 'PUT',
            body: JSON.stringify(profileData)
        });
    }

    async changePassword(passwordData) {
        return this.request('/auth/change-password', {
            method: 'PUT',
            body: JSON.stringify(passwordData)
        });
    }

    // Keys API
    async generateKeys(keyData) {
        return this.request('/keys/generate', {
            method: 'POST',
            body: JSON.stringify(keyData)
        });
    }

    async getKeys(filters = {}) {
        const queryParams = new URLSearchParams();
        
        Object.keys(filters).forEach(key => {
            if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
                queryParams.append(key, filters[key]);
            }
        });
        
        const endpoint = queryParams.toString() ? `/keys?${queryParams}` : '/keys';
        return this.request(endpoint);
    }

    async getKey(keyId) {
        return this.request(`/keys/${keyId}`);
    }

    async deleteKey(keyId) {
        return this.request(`/keys/${keyId}`, {
            method: 'DELETE'
        });
    }

    async deleteKeys(keyIds) {
        return this.request('/keys/batch/delete', {
            method: 'DELETE',
            body: JSON.stringify({ keyIds })
        });
    }

    async deleteGeneration(generationId) {
        return this.request(`/keys/generation/${generationId}`, {
            method: 'DELETE'
        });
    }

    async useKey(keyId) {
        return this.request(`/keys/${keyId}/use`, {
            method: 'PUT'
        });
    }

    async getKeyStats() {
        return this.request('/keys/stats/overview');
    }

    async getAllKeys() {
        return this.request('/keys');
    }

    // Check if user is authenticated
    isAuthenticated() {
        return !!this.token;
    }

    // Initialize API with stored token
    init() {
        const storedToken = localStorage.getItem('authToken');
        if (storedToken) {
            this.setToken(storedToken);
        }
    }
}

// Create global API instance
window.api = new ResellPanelAPI();
window.api.init();

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ResellPanelAPI;
}
