-- Resell Panel Database Schema for MySQL
-- Create database
CREATE DATABASE IF NOT EXISTS resell_panel;
USE resell_panel;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(30) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    balance DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    credits INT NOT NULL DEFAULT 0,
    total_deposits DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    last_deposit DATETIME NULL,
    keys_generated INT NOT NULL DEFAULT 0,
    theme ENUM('light', 'dark') NOT NULL DEFAULT 'dark',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_login DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_is_active (is_active)
);

-- Generated Keys table
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

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    type ENUM('deposit', 'withdrawal', 'purchase', 'refund', 'bonus') NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency ENUM('USD', 'EUR', 'BTC', 'ETH', 'CREDITS') NOT NULL DEFAULT 'USD',
    status ENUM('pending', 'completed', 'failed', 'cancelled') NOT NULL DEFAULT 'pending',
    payment_method ENUM('credit_card', 'cryptocurrency', 'paypal', 'bank_transfer', 'credits') NOT NULL,
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

-- Insert sample data
INSERT INTO users (username, email, password, balance, credits, keys_generated, theme) VALUES
('admin', 'admin@resellpanel.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8K8K8K8', 1000.00, 500, 0, 'dark'),
('testuser', 'test@resellpanel.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8K8K8K8', 100.00, 50, 0, 'dark');

-- Create indexes for better performance
CREATE INDEX idx_users_created ON users(created_at);
CREATE INDEX idx_keys_generated ON generated_keys(generated_at);
CREATE INDEX idx_transactions_created ON transactions(created_at);
