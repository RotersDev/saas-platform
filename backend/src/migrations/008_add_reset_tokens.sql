-- Migration para adicionar campos de reset token
ALTER TABLE users
ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255),
ADD COLUMN IF NOT EXISTS reset_token_expires_at TIMESTAMP;

ALTER TABLE customers
ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255),
ADD COLUMN IF NOT EXISTS reset_token_expires_at TIMESTAMP;

