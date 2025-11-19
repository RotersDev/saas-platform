-- Script para configurar o Account ID da plataforma para receber split
-- Account ID: 9E859C2A-2C80-4B3E-BA9F-A27EFC93BEC4

-- Criar tabela de configurações da plataforma se não existir
CREATE TABLE IF NOT EXISTS platform_settings (
  id SERIAL PRIMARY KEY,
  key VARCHAR(255) UNIQUE NOT NULL,
  value TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Salvar Account ID da plataforma
INSERT INTO platform_settings (key, value, updated_at)
VALUES ('pushin_pay_account_id', '9E859C2A-2C80-4B3E-BA9F-A27EFC93BEC4', NOW())
ON CONFLICT (key)
DO UPDATE SET value = '9E859C2A-2C80-4B3E-BA9F-A27EFC93BEC4', updated_at = NOW();

-- Exemplo: Configurar split de 10% para TODAS as lojas existentes
-- Descomente e ajuste a porcentagem conforme necessário:

-- UPDATE split_configs
-- SET
--   split_1_percentage = 10.00,
--   split_1_pushin_pay_account = '9E859C2A-2C80-4B3E-BA9F-A27EFC93BEC4',
--   is_active = true
-- WHERE is_active = true OR split_1_percentage > 0;

-- Ou configure para uma loja específica (substitua 1 pelo ID da loja):
-- UPDATE split_configs
-- SET
--   split_1_percentage = 10.00,
--   split_1_pushin_pay_account = '9E859C2A-2C80-4B3E-BA9F-A27EFC93BEC4',
--   is_active = true
-- WHERE store_id = 1;

