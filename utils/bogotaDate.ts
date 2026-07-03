const BOGOTA_TIME_ZONE = 'America/Bogota'

function getBogotaParts(date: Date): { year: string; month: string; day: string } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: BOGOTA_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)

  const get = (type: string) => parts.find((part) => part.type === type)?.value || ''
  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
  }
}

export function getBogotaDateKey(date = new Date()): string {
  const { year, month, day } = getBogotaParts(date)
  return `${year}-${month}-${day}`
}

export function parseDateKeyToLocalDate(dateKey: string): Date {
  const [year, month, day] = dateKey.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function addDaysToDateKey(dateKey: string, days: number): string {
  const date = parseDateKeyToLocalDate(dateKey)
  date.setDate(date.getDate() + days)
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-')
}

export function formatDateKey(dateKey: string): string {
  return parseDateKeyToLocalDate(dateKey).toLocaleDateString('es-CO')
}

export function getBogotaCurrentWeekWindows(count = 4): Array<{
  label: string
  startKey: string
  endKey: string
}> {
  const todayKey = getBogotaDateKey()
  const today = parseDateKeyToLocalDate(todayKey)
  const daysSinceMonday = (today.getDay() + 6) % 7
  const currentWeekStart = new Date(today)
  currentWeekStart.setDate(today.getDate() - daysSinceMonday)

  const windows: Array<{ label: string; startKey: string; endKey: string }> = []
  for (let i = count - 1; i >= 0; i--) {
    const start = new Date(currentWeekStart)
    start.setDate(currentWeekStart.getDate() - i * 7)
    const startKey = [
      start.getFullYear(),
      String(start.getMonth() + 1).padStart(2, '0'),
      String(start.getDate()).padStart(2, '0'),
    ].join('-')

    windows.push({
      label: i === 0 ? 'Esta semana' : `Hace ${i} semana${i > 1 ? 's' : ''}`,
      startKey,
      endKey: addDaysToDateKey(startKey, 6),
    })
  }

  return windows
}

export function getTransactionBogotaDateKey(value: string | null): string | null {
  if (!value) return null

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    const dateOnly = value.split('T')[0]
    return /^\d{4}-\d{2}-\d{2}$/.test(dateOnly) ? dateOnly : null
  }

  return getBogotaDateKey(date)
}
