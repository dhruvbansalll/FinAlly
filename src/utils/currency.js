// Centralized currency formatting utility
export function getCurrencySymbol(code) {
  const symbols = {
    INR: '₹',
    USD: '$',
    EUR: '€',
    GBP: '£',
  }
  return symbols[code] || '₹'
}

export function formatCurrencyByCode(amount, currencyCode = 'INR') {
  const symbol = getCurrencySymbol(currencyCode)
  if (amount >= 100000) return `${symbol}${(amount / 100000).toFixed(1)}L`
  if (amount >= 1000) return `${symbol}${(amount / 1000).toFixed(1)}K`
  return `${symbol}${Math.round(amount).toLocaleString()}`
}

export function formatLongCurrency(amount, currencyCode = 'INR') {
  const symbol = getCurrencySymbol(currencyCode)
  return `${symbol}${amount.toLocaleString()}`
}
