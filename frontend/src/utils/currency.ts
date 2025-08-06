/**
 * Currency utilities for consistent currency display across the application
 */

export interface CurrencyOption {
  code: string;
  name: string;
  symbol: string;
}

export const CURRENCY_OPTIONS: CurrencyOption[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'PKR', name: 'Pakistani Rupee', symbol: 'Rs' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
];

export const DEFAULT_CURRENCY = 'PKR';

/**
 * Get currency symbol by currency code
 * @param currencyCode - The currency code (e.g., 'PKR', 'USD')
 * @returns The currency symbol (e.g., 'Rs', '$')
 */
export const getCurrencySymbol = (currencyCode?: string): string => {
  if (!currencyCode) {
    return getCurrencySymbol(DEFAULT_CURRENCY);
  }
  
  const currency = CURRENCY_OPTIONS.find(c => c.code === currencyCode);
  return currency ? currency.symbol : 'Rs'; // Default to Rs if currency not found
};

/**
 * Format amount with currency symbol
 * @param amount - The amount to format
 * @param currencyCode - The currency code
 * @param includeSymbol - Whether to include the currency symbol
 * @returns Formatted amount string
 */
export const formatCurrency = (
  amount: number | string,
  currencyCode?: string,
  includeSymbol: boolean = true
): string => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount)) {
    return includeSymbol ? `${getCurrencySymbol(currencyCode)}0.00` : '0.00';
  }
  
  const formatted = numAmount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  
  return includeSymbol ? `${getCurrencySymbol(currencyCode)}${formatted}` : formatted;
};

/**
 * Smart currency formatting that detects currency from data object
 * @param amount - The amount to format
 * @param dataObject - The data object that might contain currency information
 * @param fallbackCurrency - Fallback currency if none found in data
 * @returns Formatted amount string
 */
export const formatSmartCurrency = (
  amount: number | string,
  dataObject?: any,
  fallbackCurrency: string = DEFAULT_CURRENCY
): string => {
  // Look for currency information in various possible fields
  const detectedCurrency = dataObject?.currency || 
                          dataObject?.currency_code || 
                          dataObject?.currencyCode ||
                          fallbackCurrency;
  
  return formatCurrency(amount, detectedCurrency);
};

/**
 * Get currency name by currency code
 * @param currencyCode - The currency code
 * @returns The currency name
 */
export const getCurrencyName = (currencyCode?: string): string => {
  if (!currencyCode) {
    return getCurrencyName(DEFAULT_CURRENCY);
  }
  
  const currency = CURRENCY_OPTIONS.find(c => c.code === currencyCode);
  return currency ? currency.name : 'Pakistani Rupee';
};
