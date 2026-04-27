type CurrencyFormatOptions = {
  compact?: boolean
}

export const formatCurrency = (
  amount: number,
  options: CurrencyFormatOptions = {}
): string => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    ...(options.compact ? { notation: 'compact' as const } : {}),
  }).format(amount)
}

export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('es-CO').format(num)
}

export const formatCurrencyInput = (value: string): string => {
  const numericValue = value.replace(/[^\d]/g, '')
  if (!numericValue) return ''

  return `$${formatNumber(Number(numericValue))}`
}

export const formatPercentage = (num: number): string => {
  return new Intl.NumberFormat('es-CO', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(num / 100)
}
