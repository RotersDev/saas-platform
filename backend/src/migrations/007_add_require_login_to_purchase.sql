-- Migration para adicionar campo require_login_to_purchase na tabela stores
ALTER TABLE stores
ADD COLUMN IF NOT EXISTS require_login_to_purchase BOOLEAN NOT NULL DEFAULT false;

