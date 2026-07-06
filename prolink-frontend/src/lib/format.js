/**
 * Currency formatting utilities for ProLink
 * Uses HTML-safe entity to avoid UTF-8 encoding corruption
 */

const NAIRA_ENTITY = '\u20A6'; // \u20A6 — safe Unicode, but we ensure it's always properly encoded

/**
 * Format a number as Naira amount
 * @param {number|string} amount - The amount to format
 * @param {object} options
 * @param {boolean} options.showSymbol - Whether to show \u20A6 symbol (default: true)
 * @param {number} options.decimals - Number of decimal places (default: 0)
 * @returns {string} e.g. "\u20A625,000" or "25,000"
 */
export function formatNaira(amount, options = {}) {
  const { showSymbol = true, decimals = 0 } = options;
  const num = typeof amount === 'string' ? parseFloat(amount) : (amount || 0);
  const formatted = num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return showSymbol ? `${NAIRA_ENTITY}${formatted}` : formatted;
}

/**
 * Format a number as Naira with K/M suffix for compact display
 * @param {number} amount - The amount to format
 * @returns {string} e.g. "\u20A6150k" or "\u20A61.2M"
 */
export function formatNairaCompact(amount) {
  const num = typeof amount === 'string' ? parseFloat(amount) : (amount || 0);
  if (num >= 1_000_000) {
    return `${NAIRA_ENTITY}${(num / 1_000_000).toFixed(1)}M`;
  }
  if (num >= 1_000) {
    return `${NAIRA_ENTITY}${Math.round(num / 1_000)}k`;
  }
  return `${NAIRA_ENTITY}${num}`;
}

/**
 * Convert a number to string with currency formatting (for chart tick formatters, etc.)
 */
export function nairaTickFormatter(value) {
  return `\u20A6${(value / 1000).toFixed(0)}k`;
}
