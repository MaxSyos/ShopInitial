export function formatNumber(value: number | null | undefined, options?: { locale?: string; minimumFractionDigits?: number; maximumFractionDigits?: number; currency?: string; style?: 'decimal' | 'currency' }) {
  if (value === null || value === undefined || Number.isNaN(value)) return '0.00';
  const locale = options?.locale || 'pt-BR';
  const minimumFractionDigits = options?.minimumFractionDigits ?? 2;
  const maximumFractionDigits = options?.maximumFractionDigits ?? 2;
  const style = options?.style || (options?.currency ? 'currency' : 'decimal');

  try {
    if (style === 'currency' && options?.currency) {
      return new Intl.NumberFormat(locale, { style: 'currency', currency: options.currency, minimumFractionDigits, maximumFractionDigits }).format(value as number);
    }
    return new Intl.NumberFormat(locale, { minimumFractionDigits, maximumFractionDigits }).format(value as number);
  } catch (e) {
    // fallback
    return (Math.round((value as number) * Math.pow(10, maximumFractionDigits)) / Math.pow(10, maximumFractionDigits)).toFixed(maximumFractionDigits);
  }
}

export default formatNumber;
