export const formatPrice = (value: number) =>
  new Intl.NumberFormat('ru-KZ', { style: 'currency', currency: 'KZT', maximumFractionDigits: 0 }).format(value);

export const cn = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(' ');
