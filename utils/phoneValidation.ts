/**
 * Utilidades para validación de números telefónicos internacionales
 */

export interface PhoneValidationResult {
  isValid: boolean
  error?: string
  formattedPhone?: string
}

/**
 * Valida un número telefónico internacional
 * @param phone - Número telefónico con código de país (ej: +57 300 123 4567)
 * @returns Resultado de la validación
 */
export const validateInternationalPhone = (phone: string): PhoneValidationResult => {
  // Limpiar el número (remover espacios, guiones, paréntesis)
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '')
  
  // Verificar que no esté vacío
  if (!cleanPhone || cleanPhone.trim().length === 0) {
    return {
      isValid: false,
      error: "Por favor ingresa un número de teléfono"
    }
  }

  // Debe empezar con +
  if (!cleanPhone.startsWith('+')) {
    return {
      isValid: false,
      error: "El número debe incluir el código de país (ej: +57)"
    }
  }

  // Validar formato: +[1-4 dígitos código país][4-15 dígitos número]
  const phoneRegex = /^\+\d{1,4}\d{4,15}$/
  if (!phoneRegex.test(cleanPhone)) {
    return {
      isValid: false,
      error: "Formato inválido. Use: +código país + número (ej: +57 300 123 4567)"
    }
  }

  // Extraer solo los dígitos (sin el +)
  const phoneDigits = cleanPhone.substring(1)
  
  // Validar longitud total (código de país + número)
  if (phoneDigits.length < 7) {
    return {
      isValid: false,
      error: "El número es muy corto (mínimo 7 dígitos)"
    }
  }

  if (phoneDigits.length > 15) {
    return {
      isValid: false,
      error: "El número es muy largo (máximo 15 dígitos)"
    }
  }

  // Validar códigos de país comunes (opcional, para mejor UX)
  const countryCode = extractCountryCode(cleanPhone)
  if (!isValidCountryCode(countryCode)) {
    return {
      isValid: false,
      error: "Código de país no reconocido. Verifica que sea correcto."
    }
  }

  return {
    isValid: true,
    formattedPhone: cleanPhone
  }
}

/**
 * Extrae el código de país de un número telefónico
 * @param phone - Número telefónico completo (ej: +57 300 123 4567)
 * @returns Código de país (ej: +57)
 */
export const extractCountryCode = (phone: string): string => {
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '')
  
  // Códigos de país de 1 dígito
  if (cleanPhone.match(/^\+[1-9]/)) {
    const oneDigit = cleanPhone.substring(0, 2)
    if (['+1', '+7'].includes(oneDigit)) {
      return oneDigit
    }
  }

  // Códigos de país de 2 dígitos
  if (cleanPhone.match(/^\+\d{2}/)) {
    const twoDigits = cleanPhone.substring(0, 3)
    if (isValidTwoDigitCountryCode(twoDigits)) {
      return twoDigits
    }
  }

  // Códigos de país de 3 dígitos
  if (cleanPhone.match(/^\+\d{3}/)) {
    const threeDigits = cleanPhone.substring(0, 4)
    if (isValidThreeDigitCountryCode(threeDigits)) {
      return threeDigits
    }
  }

  // Códigos de país de 4 dígitos (algunos casos especiales)
  if (cleanPhone.match(/^\+\d{4}/)) {
    const fourDigits = cleanPhone.substring(0, 5)
    if (isValidFourDigitCountryCode(fourDigits)) {
      return fourDigits
    }
  }

  // Si no se puede determinar, devolver los primeros 4 caracteres
  return cleanPhone.substring(0, 4)
}

/**
 * Verifica si un código de país es válido
 * @param countryCode - Código de país (ej: +57)
 * @returns true si es válido
 */
export const isValidCountryCode = (countryCode: string): boolean => {
  // Lista de códigos de país válidos más comunes
  const validCodes = [
    // América del Norte
    '+1',
    
    // América Central y Caribe
    '+52', '+53', '+501', '+502', '+503', '+504', '+505', '+506', '+507', '+508', '+509',
    
    // América del Sur
    '+54', '+55', '+56', '+57', '+58', '+591', '+592', '+593', '+594', '+595', '+596', '+597', '+598',
    
    // Europa
    '+30', '+31', '+32', '+33', '+34', '+36', '+39', '+40', '+41', '+43', '+44', '+45', '+46', '+47', '+48', '+49',
    '+351', '+352', '+353', '+354', '+355', '+356', '+357', '+358', '+359', '+370', '+371', '+372', '+373', '+374', '+375', '+376', '+377', '+378', '+380', '+381', '+382', '+383', '+385', '+386', '+387', '+389', '+420', '+421', '+423',
    
    // Asia
    '+60', '+61', '+62', '+63', '+64', '+65', '+66', '+81', '+82', '+84', '+86', '+91', '+92', '+93', '+94', '+95', '+98',
    '+850', '+852', '+853', '+855', '+856', '+880', '+886', '+960', '+961', '+962', '+963', '+964', '+965', '+966', '+967', '+968', '+971', '+972', '+973', '+974', '+975', '+976', '+977', '+992', '+993', '+994', '+995', '+996', '+998',
    
    // África
    '+20', '+27', '+212', '+213', '+216', '+218', '+220', '+221', '+222', '+223', '+224', '+225', '+226', '+227', '+228', '+229', '+230', '+231', '+232', '+233', '+234', '+235', '+236', '+237', '+238', '+239', '+240', '+241', '+242', '+243', '+244', '+245', '+246', '+248', '+249', '+250', '+251', '+252', '+253', '+254', '+255', '+256', '+257', '+258', '+260', '+261', '+262', '+263', '+264', '+265', '+266', '+267', '+268', '+269',
    
    // Oceanía
    '+670', '+676', '+677', '+678', '+679', '+680', '+681', '+682', '+683', '+684', '+685', '+686', '+687', '+688', '+689', '+690', '+691', '+692',
    
    // Códigos especiales de 4 dígitos
    '+1787', '+1809', '+1876', '+1784', '+1758', '+1473', '+1868', '+1767', '+1664', '+1649', '+1721', '+1246', '+1268', '+1284', '+1340'
  ]
  
  return validCodes.includes(countryCode)
}

const isValidTwoDigitCountryCode = (code: string): boolean => {
  const twoDigitCodes = ['+20', '+27', '+30', '+31', '+32', '+33', '+34', '+36', '+39', '+40', '+41', '+43', '+44', '+45', '+46', '+47', '+48', '+49', '+52', '+53', '+54', '+55', '+56', '+57', '+58', '+60', '+61', '+62', '+63', '+64', '+65', '+66', '+81', '+82', '+84', '+86', '+91', '+92', '+93', '+94', '+95', '+98']
  return twoDigitCodes.includes(code)
}

const isValidThreeDigitCountryCode = (code: string): boolean => {
  const threeDigitCodes = ['+212', '+213', '+216', '+218', '+220', '+221', '+222', '+223', '+224', '+225', '+226', '+227', '+228', '+229', '+230', '+231', '+232', '+233', '+234', '+235', '+236', '+237', '+238', '+239', '+240', '+241', '+242', '+243', '+244', '+245', '+246', '+248', '+249', '+250', '+251', '+252', '+253', '+254', '+255', '+256', '+257', '+258', '+260', '+261', '+262', '+263', '+264', '+265', '+266', '+267', '+268', '+269', '+351', '+352', '+353', '+354', '+355', '+356', '+357', '+358', '+359', '+370', '+371', '+372', '+373', '+374', '+375', '+376', '+377', '+378', '+380', '+381', '+382', '+383', '+385', '+386', '+387', '+389', '+420', '+421', '+423', '+501', '+502', '+503', '+504', '+505', '+506', '+507', '+508', '+509', '+591', '+592', '+593', '+594', '+595', '+596', '+597', '+598', '+670', '+676', '+677', '+678', '+679', '+680', '+681', '+682', '+683', '+684', '+685', '+686', '+687', '+688', '+689', '+690', '+691', '+692', '+850', '+852', '+853', '+855', '+856', '+880', '+886', '+960', '+961', '+962', '+963', '+964', '+965', '+966', '+967', '+968', '+971', '+972', '+973', '+974', '+975', '+976', '+977', '+992', '+993', '+994', '+995', '+996', '+998']
  return threeDigitCodes.includes(code)
}

const isValidFourDigitCountryCode = (code: string): boolean => {
  const fourDigitCodes = ['+1787', '+1809', '+1876', '+1784', '+1758', '+1473', '+1868', '+1767', '+1664', '+1649', '+1721', '+1246', '+1268', '+1284', '+1340']
  return fourDigitCodes.includes(code)
}

/**
 * Formatea un número telefónico para mostrar
 * @param phone - Número telefónico (ej: +573001234567)
 * @returns Número formateado (ej: +57 300 123 4567)
 */
export const formatPhoneForDisplay = (phone: string): string => {
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '')
  
  if (!cleanPhone.startsWith('+')) {
    return phone
  }

  const countryCode = extractCountryCode(cleanPhone)
  const number = cleanPhone.substring(countryCode.length)
  
  // Formatear el número según su longitud
  if (number.length <= 4) {
    return `${countryCode} ${number}`
  } else if (number.length <= 7) {
    return `${countryCode} ${number.substring(0, 3)} ${number.substring(3)}`
  } else if (number.length <= 10) {
    return `${countryCode} ${number.substring(0, 3)} ${number.substring(3, 6)} ${number.substring(6)}`
  } else {
    return `${countryCode} ${number.substring(0, 3)} ${number.substring(3, 6)} ${number.substring(6, 10)} ${number.substring(10)}`
  }
}
