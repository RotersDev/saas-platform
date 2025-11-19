export function generateOrderNumber(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 10).toUpperCase();
  return `ORD-${timestamp}-${random}`;
}

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function calculateDiscount(
  amount: number,
  type: 'percentage' | 'fixed',
  value: number,
  maxDiscount?: number
): number {
  let discount = 0;

  if (type === 'percentage') {
    discount = (amount * value) / 100;
    if (maxDiscount && discount > maxDiscount) {
      discount = maxDiscount;
    }
  } else {
    discount = value;
    if (discount > amount) {
      discount = amount;
    }
  }

  return Math.round(discount * 100) / 100;
}

export function validateEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

export function validateSubdomain(subdomain: string): boolean {
  const re = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/;
  return re.test(subdomain);
}


