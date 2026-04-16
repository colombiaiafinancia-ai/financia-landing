/**
 * Orden del mapa = orden en la cuadrícula del selector (8 columnas en desktop).
 * Valores: nombre legible del icono (documentación).
 */
export const CATEGORY_ICON_MAP = {
  tag: 'Tag',
  shopping: 'ShoppingCart',
  home: 'Home',
  transport: 'Car',
  food: 'Utensils',
  health: 'Heart',
  salary: 'Wallet',
  business: 'Briefcase',
  gift: 'Gift',
  plane: 'Plane',
  book: 'BookOpen',
  music: 'Music',
  gamepad: 'Gamepad2',
  baby: 'Baby',
  pet: 'Dog',
  smartphone: 'Smartphone',
  wifi: 'Wifi',
  utilities: 'Zap',
  coffee: 'Coffee',
  clothing: 'Shirt',
  entertainment: 'Film',
  fitness: 'Dumbbell',
  education: 'GraduationCap',
  savings: 'PiggyBank',
  bank: 'Landmark',
  coins: 'Coins',
} as const

export type CategoryIconKey = keyof typeof CATEGORY_ICON_MAP

export const DEFAULT_CATEGORY_ICON_KEY: CategoryIconKey = 'tag'

export function isValidCategoryIconKey(value: string | null | undefined): value is CategoryIconKey {
  if (!value) return false
  return value in CATEGORY_ICON_MAP
}
