/**
 * Admin Users Management
 * Handles user management operations for admin dashboard
 */

class AdminUsers {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    init() {
        console.log('Admin Users Manager initialized');
    }

    async createUser() {
        const modal = document.getElementById('create-user-modal');
        if (modal) {
            modal.style.display = 'flex';
        }
    }

    closeCreateModal() {
        const modal = document.getElementById('create-user-modal');
        if (modal) {
            modal.style.display = 'none';
            this.resetCreateForm();
        }
    }

    resetCreateForm() {
        const form = document.getElementById('create-user-form');
        if (form) {
            form.reset();
        }
    }

    async handleCreateUser(event) {
        event.preventDefault();
        
        const formData = {
            username: document.getElementById('new-username').value,
            email: document.getElementById('new-email').value,
            password: document.getElementById('new-password').value,
            role: document.getElementById('new-role').value,
            balance: parseFloat(document.getElementById('new-balance').value) || 0
        };

        try {
            const response = await window.api.request('/admin/users', {
                method: 'POST',
                body: JSON.stringify(formData)
            });

            if (response && response.success) {
                window.adminDashboard.showNotification('Success', 'User created successfully', 'success');
                this.closeCreateModal();
                await window.adminDashboard.loadUsers();
            } else {
                window.adminDashboard.showNotification('Error', response.message || 'Failed to create user', 'error');
            }
        } catch (error) {
            console.error('Create user error:', error);
            window.adminDashboard.showNotification('Error', 'Failed to create user', 'error');
        }
    }

    async editUser(userId) {
        try {
            const response = await window.api.request(`/admin/users/${userId}`);
            if (response && response.success) {
                this.currentUser = response.data;
                this.populateEditForm();
                this.showEditModal();
            } else {
                window.adminDashboard.showNotification('Error', 'Failed to load user data', 'error');
            }
        } catch (error) {
            console.error('Edit user error:', error);
            window.adminDashboard.showNotification('Error', 'Failed to load user data', 'error');
        }
    }

    populateEditForm() {
        if (!this.currentUser) return;

        document.getElementById('edit-user-id').value = this.currentUser._id;
        document.getElementById('edit-username').value = this.currentUser.username;
        document.getElementById('edit-email').value = this.currentUser.email;
        document.getElementById('edit-role').value = this.currentUser.role || 'user';
        document.getElementById('edit-balance').value = this.currentUser.balance || 0;
        document.getElementById('edit-credits').value = this.currentUser.credits || 0;
        document.getElementById('edit-status').value = this.currentUser.isActive ? 'true' : 'false';
    }

    showEditModal() {
        const modal = document.getElementById('edit-user-modal');
        if (modal) {
            modal.style.display = 'flex';
        }
    }

    closeEditModal() {
        const modal = document.getElementById('edit-user-modal');
        if (modal) {
            modal.style.display = 'none';
            this.currentUser = null;
        }
    }

    async handleEditUser(event) {
        event.preventDefault();
        
        if (!this.currentUser) return;

        const formData = {
            username: document.getElementById('edit-username').value,
            email: document.getElementById('edit-email').value,
            role: document.getElementById('edit-role').value,
            balance: parseFloat(document.getElementById('edit-balance').value) || 0,
            credits: parseInt(document.getElementById('edit-credits').value) || 0,
            isActive: document.getElementById('edit-status').value === 'true'
        };

        try {
            const response = await window.api.request(`/admin/users/${this.currentUser._id}`, {
                method: 'PUT',
                body: JSON.stringify(formData)
            });

            if (response && response.success) {
                window.adminDashboard.showNotification('Success', 'User updated successfully', 'success');
                this.closeEditModal();
                await window.adminDashboard.loadUsers();
            } else {
                window.adminDashboard.showNotification('Error', response.message || 'Failed to update user', 'error');
            }
        } catch (error) {
            console.error('Update user error:', error);
            window.adminDashboard.showNotification('Error', 'Failed to update user', 'error');
        }
    }

    async toggleUserStatus(userId) {
        try {
            const user = window.adminDashboard.users.find(u => u._id === userId);
            if (!user) return;

            const newStatus = !user.isActive;
            const response = await window.api.request(`/admin/users/${userId}/status`, {
                method: 'PATCH',
                body: JSON.stringify({ isActive: newStatus })
            });

            if (response && response.success) {
                window.adminDashboard.showNotification(
                    'Success', 
                    `User ${newStatus ? 'activated' : 'deactivated'} successfully`, 
                    'success'
                );
                await window.adminDashboard.loadUsers();
            } else {
                window.adminDashboard.showNotification('Error', 'Failed to update user status', 'error');
            }
        } catch (error) {
            console.error('Toggle user status error:', error);
            window.adminDashboard.showNotification('Error', 'Failed to update user status', 'error');
        }
    }

    async deleteUser(userId) {
        const user = window.adminDashboard.users.find(u => u._id === userId);
        if (!user) return;

        if (!confirm(`Are you sure you want to delete user "${user.username}"? This action cannot be undone.`)) {
            return;
        }

        try {
            const response = await window.api.request(`/admin/users/${userId}`, {
                method: 'DELETE'
            });

            if (response && response.success) {
                window.adminDashboard.showNotification('Success', 'User deleted successfully', 'success');
                await window.adminDashboard.loadUsers();
            } else {
                window.adminDashboard.showNotification('Error', 'Failed to delete user', 'error');
            }
        } catch (error) {
            console.error('Delete user error:', error);
            window.adminDashboard.showNotification('Error', 'Failed to delete user', 'error');
        }
    }

    async activateSelected() {
        const selectedIds = Array.from(window.adminDashboard.selectedUsers);
        if (selectedIds.length === 0) return;

        try {
            const response = await window.api.request('/admin/users/bulk-activate', {
                method: 'POST',
                body: JSON.stringify({ userIds: selectedIds })
            });

            if (response && response.success) {
                window.adminDashboard.showNotification(
                    'Success', 
                    `Activated ${selectedIds.length} users successfully`, 
                    'success'
                );
                window.adminDashboard.selectedUsers.clear();
                window.adminDashboard.updateBulkActions();
                await window.adminDashboard.loadUsers();
            } else {
                window.adminDashboard.showNotification('Error', 'Failed to activate users', 'error');
            }
        } catch (error) {
            console.error('Bulk activate error:', error);
            window.adminDashboard.showNotification('Error', 'Failed to activate users', 'error');
        }
    }

    async deactivateSelected() {
        const selectedIds = Array.from(window.adminDashboard.selectedUsers);
        if (selectedIds.length === 0) return;

        try {
            const response = await window.api.request('/admin/users/bulk-deactivate', {
                method: 'POST',
                body: JSON.stringify({ userIds: selectedIds })
            });

            if (response && response.success) {
                window.adminDashboard.showNotification(
                    'Success', 
                    `Deactivated ${selectedIds.length} users successfully`, 
                    'success'
                );
                window.adminDashboard.selectedUsers.clear();
                window.adminDashboard.updateBulkActions();
                await window.adminDashboard.loadUsers();
            } else {
                window.adminDashboard.showNotification('Error', 'Failed to deactivate users', 'error');
            }
        } catch (error) {
            console.error('Bulk deactivate error:', error);
            window.adminDashboard.showNotification('Error', 'Failed to deactivate users', 'error');
        }
    }

    async deleteSelected() {
        const selectedIds = Array.from(window.adminDashboard.selectedUsers);
        if (selectedIds.length === 0) return;

        if (!confirm(`Are you sure you want to delete ${selectedIds.length} users? This action cannot be undone.`)) {
            return;
        }

        try {
            const response = await window.api.request('/admin/users/bulk-delete', {
                method: 'POST',
                body: JSON.stringify({ userIds: selectedIds })
            });

            if (response && response.success) {
                window.adminDashboard.showNotification(
                    'Success', 
                    `Deleted ${selectedIds.length} users successfully`, 
                    'success'
                );
                window.adminDashboard.selectedUsers.clear();
                window.adminDashboard.updateBulkActions();
                await window.adminDashboard.loadUsers();
            } else {
                window.adminDashboard.showNotification('Error', 'Failed to delete users', 'error');
            }
        } catch (error) {
            console.error('Bulk delete error:', error);
            window.adminDashboard.showNotification('Error', 'Failed to delete users', 'error');
        }
    }

    async refreshUsers() {
        try {
            await window.adminDashboard.loadUsers();
            window.adminDashboard.showNotification('Refreshed', 'User list updated', 'success');
        } catch (error) {
            console.error('Refresh users error:', error);
            window.adminDashboard.showNotification('Error', 'Failed to refresh users', 'error');
        }
    }
}

// Initialize admin users manager
window.adminUsers = new AdminUsers();

// Setup form event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Create user form
    const createForm = document.getElementById('create-user-form');
    if (createForm) {
        createForm.addEventListener('submit', (e) => {
            window.adminUsers.handleCreateUser(e);
        });
    }

    // Edit user form
    const editForm = document.getElementById('edit-user-form');
    if (editForm) {
        editForm.addEventListener('submit', (e) => {
            window.adminUsers.handleEditUser(e);
        });
    }
});
