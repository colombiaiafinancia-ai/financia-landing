/** Disparado tras editar una categoría (p. ej. nombre) para refrescar transacciones y presupuestos en el dashboard. */
export const CATEGORIES_UPDATED_EVENT = 'financia:categories-updated'

export function dispatchCategoriesUpdated(): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(CATEGORIES_UPDATED_EVENT))
}
