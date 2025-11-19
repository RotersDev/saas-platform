-- Migration para adicionar campo password na tabela customers
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS password VARCHAR(255);

