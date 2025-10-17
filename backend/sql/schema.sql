-- Resell Panel Database Schema for MySQL
-- This schema matches the current Sequelize models exactly

-- Create database
CREATE DATABASE IF NOT EXISTS resell_panel;
USE resell_panel;

-- Users table (matches User.js model)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(30) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    credits INT NOT NULL DEFAULT 0,
    total_deposits DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    last_deposit DATETIME NULL,
    keys_generated INT NOT NULL DEFAULT 0,
    role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
    theme ENUM('light', 'dark') NOT NULL DEFAULT 'dark',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_login DATETIME NULL,
    stripe_customer_id VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_is_active (is_active),
    INDEX idx_role (role)
);

-- Generated Keys table (matches GeneratedKey.js model)
CREATE TABLE IF NOT EXISTS generated_keys (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    key VARCHAR(255) NOT NULL UNIQUE,
    type ENUM('day', 'week', 'month', 'lifetime') NOT NULL,
    status ENUM('active', 'used', 'expired', 'revoked') NOT NULL DEFAULT 'active',
    generation_id VARCHAR(255) NOT NULL,
    generation_name VARCHAR(255) NOT NULL,
    batch_number INT NOT NULL DEFAULT 1,
    generated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    used_at DATETIME NULL,
    expires_at DATETIME NULL,
    notes TEXT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_generation (user_id, generation_id),
    INDEX idx_user_type (user_id, type),
    INDEX idx_user_status (user_id, status),
    INDEX idx_generation (generation_id),
    INDEX idx_key (key)
);

-- Transactions table (matches Transaction.js model)
CREATE TABLE IF NOT EXISTS transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    type ENUM('deposit', 'withdrawal', 'purchase', 'refund', 'bonus') NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency ENUM('USD', 'EUR', 'BTC', 'ETH', 'CREDITS') NOT NULL DEFAULT 'USD',
    status ENUM('pending', 'completed', 'failed', 'cancelled') NOT NULL DEFAULT 'pending',
    payment_method ENUM('credit_card', 'cryptocurrency', 'paypal', 'bank_transfer', 'credits', 'stripe', 'stripe_free') NOT NULL,
    payment_id VARCHAR(255) NULL UNIQUE,
    description VARCHAR(500) NOT NULL,
    product_id VARCHAR(255) NULL,
    product_name VARCHAR(255) NULL,
    key_count INT NULL,
    generation_id VARCHAR(255) NULL,
    processed_at DATETIME NULL,
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_type (user_id, type),
    INDEX idx_user_status (user_id, status),
    INDEX idx_user_created (user_id, created_at),
    INDEX idx_payment_id (payment_id)
);

-- Imported Keys table (matches ImportedKey.js model)
CREATE TABLE IF NOT EXISTS imported_keys (
    id INT AUTO_INCREMENT PRIMARY KEY,
    key VARCHAR(255) NOT NULL UNIQUE,
    type ENUM('steam', 'origin', 'uplay', 'epic', 'other') NOT NULL,
    batch VARCHAR(255) NOT NULL,
    status ENUM('available', 'used', 'reserved') NOT NULL DEFAULT 'available',
    used_by INT NULL,
    used_at DATETIME NULL,
    added_by INT NOT NULL,
    added_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (used_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (added_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_type_status (type, status),
    INDEX idx_batch (batch),
    INDEX idx_used_by (used_by),
    INDEX idx_added_by (added_by)
);

-- Unused Keys table (matches UnusedKeys.js model)
CREATE TABLE IF NOT EXISTS unused_keys (
    id INT AUTO_INCREMENT PRIMARY KEY,
    day_keys JSON NOT NULL DEFAULT (JSON_ARRAY()),
    week_keys JSON NOT NULL DEFAULT (JSON_ARRAY()),
    month_keys JSON NOT NULL DEFAULT (JSON_ARRAY()),
    lifetime_keys JSON NOT NULL DEFAULT (JSON_ARRAY()),
    total_day_keys INT NOT NULL DEFAULT 0,
    total_week_keys INT NOT NULL DEFAULT 0,
    total_month_keys INT NOT NULL DEFAULT 0,
    total_lifetime_keys INT NOT NULL DEFAULT 0,
    available_day_keys INT NOT NULL DEFAULT 0,
    available_week_keys INT NOT NULL DEFAULT 0,
    available_month_keys INT NOT NULL DEFAULT 0,
    available_lifetime_keys INT NOT NULL DEFAULT 0,
    last_updated DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default admin user
INSERT INTO users (username, email, password, credits, total_deposits, keys_generated, role, theme, is_active) VALUES
('admin', 'admin@resellpanel.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8K8K8K8', 1000, 1000.00, 0, 'admin', 'dark', TRUE);

-- Create default unused keys document
INSERT INTO unused_keys (day_keys, week_keys, month_keys, lifetime_keys) VALUES
(JSON_ARRAY(), JSON_ARRAY(), JSON_ARRAY(), JSON_ARRAY());