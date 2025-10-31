// Rial currency format
import formatNumber from './formatNumber';

export const irrCurrencyFormat = (price: number | undefined) => {
  if (price === undefined || price === null || Number.isNaN(price)) return null;
  // iranian formatting but force 2 decimal places
  return formatNumber(price, { locale: 'fa-IR', minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// pound currency format
export const gbpCurrencyFormat = (price: number | undefined) => {
  if (price === undefined || price === null || Number.isNaN(price)) return null;
  return formatNumber(price, { locale: 'en-GB', minimumFractionDigits: 2, maximumFractionDigits: 2 });
};
