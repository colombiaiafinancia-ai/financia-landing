/**
 * SISTEMA DE MANEJO DE ERRORES ESTANDARIZADO
 * 
 * Proporciona utilidades para manejar errores de forma consistente
 * en toda la aplicación, con mensajes user-friendly y logging apropiado.
 */

/**
 * Tipos de errores de la aplicación
 */
export enum ErrorType {
  NETWORK = 'NETWORK',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  VALIDATION = 'VALIDATION',
  NOT_FOUND = 'NOT_FOUND',
  SERVER_ERROR = 'SERVER_ERROR',
  UNKNOWN = 'UNKNOWN'
}

/**
 * Interfaz para errores de la aplicación
 */
export interface AppError {
  type: ErrorType
  message: string
  originalError?: unknown
  context?: Record<string, unknown>
}

/**
 * Mensajes de error user-friendly
 */
const ERROR_MESSAGES: Record<ErrorType, string> = {
  [ErrorType.NETWORK]: 'Error de conexión. Verifica tu conexión a internet.',
  [ErrorType.AUTHENTICATION]: 'Error de autenticación. Por favor, inicia sesión nuevamente.',
  [ErrorType.AUTHORIZATION]: 'No tienes permisos para realizar esta acción.',
  [ErrorType.VALIDATION]: 'Los datos proporcionados no son válidos.',
  [ErrorType.NOT_FOUND]: 'El recurso solicitado no fue encontrado.',
  [ErrorType.SERVER_ERROR]: 'Error interno del servidor. Intenta nuevamente.',
  [ErrorType.UNKNOWN]: 'Ocurrió un error inesperado. Intenta nuevamente.'
}

/**
 * Utilidades para manejo de errores
 */
export class ErrorHandler {
  /**
   * Convierte cualquier error a un AppError
   */
  static normalize(error: unknown, context?: Record<string, unknown>): AppError {
    if (error instanceof Error) {
      return {
        type: this.classifyError(error),
        message: this.getErrorMessage(error),
        originalError: error,
        context
      }
    }
    
    if (typeof error === 'string') {
      return {
        type: ErrorType.UNKNOWN,
        message: error,
        originalError: error,
        context
      }
    }
    
    return {
      type: ErrorType.UNKNOWN,
      message: ERROR_MESSAGES[ErrorType.UNKNOWN],
      originalError: error,
      context
    }
  }
  
  /**
   * Clasifica el tipo de error basado en el mensaje
   */
  private static classifyError(error: Error): ErrorType {
    const message = error.message.toLowerCase()
    
    if (message.includes('network') || message.includes('fetch')) {
      return ErrorType.NETWORK
    }
    
    if (message.includes('auth') || message.includes('token') || message.includes('session')) {
      return ErrorType.AUTHENTICATION
    }
    
    if (message.includes('permission') || message.includes('unauthorized') || message.includes('forbidden')) {
      return ErrorType.AUTHORIZATION
    }
    
    if (message.includes('validation') || message.includes('invalid') || message.includes('required')) {
      return ErrorType.VALIDATION
    }
    
    if (message.includes('not found') || message.includes('404')) {
      return ErrorType.NOT_FOUND
    }
    
    if (message.includes('server') || message.includes('500') || message.includes('internal')) {
      return ErrorType.SERVER_ERROR
    }
    
    return ErrorType.UNKNOWN
  }
  
  /**
   * Obtiene un mensaje user-friendly para el error
   */
  private static getErrorMessage(error: Error): string {
    const errorType = this.classifyError(error)
    
    // Para errores de validación, usar el mensaje original si es claro
    if (errorType === ErrorType.VALIDATION && error.message.length < 100) {
      return error.message
    }
    
    return ERROR_MESSAGES[errorType]
  }
  
  /**
   * Registra el error en consola (solo en desarrollo)
   */
  static log(appError: AppError, feature?: string): void {
    if (process.env.NODE_ENV === 'development') {
      const prefix = feature ? `[${feature.toUpperCase()}]` : '[APP]'
      console.error(`${prefix} Error:`, {
        type: appError.type,
        message: appError.message,
        context: appError.context,
        originalError: appError.originalError
      })
    }
  }
  
  /**
   * Maneja un error de forma completa: normaliza, registra y retorna mensaje
   */
  static handle(error: unknown, feature?: string, context?: Record<string, unknown>): string {
    const appError = this.normalize(error, context)
    this.log(appError, feature)
    return appError.message
  }
}

/**
 * Hook para manejo de errores en componentes
 */
export const useErrorHandler = (feature?: string) => {
  return {
    handle: (error: unknown, context?: Record<string, unknown>) => 
      ErrorHandler.handle(error, feature, context),
    
    normalize: (error: unknown, context?: Record<string, unknown>) => 
      ErrorHandler.normalize(error, context),
    
    log: (error: AppError) => 
      ErrorHandler.log(error, feature)
  }
}
