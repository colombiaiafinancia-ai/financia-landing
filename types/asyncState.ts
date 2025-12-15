/**
 * TIPOS COMUNES - AsyncState
 * 
 * Define el contrato estándar que TODOS los hooks deben seguir.
 * Esto garantiza consistencia en la UI y facilita el mantenimiento.
 */

/**
 * Estado asíncrono estándar para todos los hooks
 * 
 * @template T - Tipo de datos que maneja el hook
 */
export interface AsyncState<T> {
  /** Datos cargados (null si no hay datos o están cargando) */
  data: T | null
  
  /** Indica si está cargando datos */
  isLoading: boolean
  
  /** Mensaje de error (null si no hay error) */
  error: string | null
  
  /** Función para recargar los datos */
  refetch: () => Promise<void>
}

/**
 * Estado asíncrono con datos adicionales (para casos complejos)
 * 
 * @template T - Tipo de datos principales
 * @template E - Tipo de datos adicionales
 */
export interface AsyncStateWithExtras<T, E = Record<string, unknown>> extends AsyncState<T> {
  /** Datos adicionales específicos del hook */
  extras: E
}

/**
 * Estado asíncrono para operaciones CRUD
 * 
 * @template T - Tipo de datos que maneja
 * @template CreateRequest - Tipo para crear elementos
 * @template UpdateRequest - Tipo para actualizar elementos
 */
export interface AsyncCrudState<T, CreateRequest = unknown, UpdateRequest = unknown> extends AsyncState<T> {
  /** Crear nuevo elemento */
  create: (data: CreateRequest) => Promise<void>
  
  /** Actualizar elemento existente */
  update: (id: string, data: UpdateRequest) => Promise<void>
  
  /** Eliminar elemento */
  delete: (id: string) => Promise<void>
  
  /** Indica si está ejecutando una operación */
  isOperating: boolean
}

/**
 * Utilidades para trabajar con AsyncState
 */
export const AsyncStateUtils = {
  /**
   * Crea un estado inicial vacío
   */
  createInitial: <T>(): AsyncState<T> => ({
    data: null,
    isLoading: true,
    error: null,
    refetch: async () => {}
  }),
  
  /**
   * Crea un estado con datos
   */
  createWithData: <T>(data: T, refetch: () => Promise<void>): AsyncState<T> => ({
    data,
    isLoading: false,
    error: null,
    refetch
  }),
  
  /**
   * Crea un estado con error
   */
  createWithError: <T>(error: string, refetch: () => Promise<void>): AsyncState<T> => ({
    data: null,
    isLoading: false,
    error,
    refetch
  }),
  
  /**
   * Crea un estado de carga
   */
  createLoading: <T>(refetch: () => Promise<void>): AsyncState<T> => ({
    data: null,
    isLoading: true,
    error: null,
    refetch
  })
}
