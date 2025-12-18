'use client'

import { useState, useMemo } from 'react'
import { ChevronDown, Search } from 'lucide-react'

interface CountryCode {
  code: string
  country: string
  flag: string
}

// Lista completa de países del mundo con sus códigos telefónicos
const worldCountries: CountryCode[] = [
  // América del Norte
  { code: '+1', country: 'Estados Unidos', flag: '🇺🇸' },
  { code: '+1', country: 'Canadá', flag: '🇨🇦' },
  
  // América Central y Caribe
  { code: '+52', country: 'México', flag: '🇲🇽' },
  { code: '+53', country: 'Cuba', flag: '🇨🇺' },
  { code: '+501', country: 'Belice', flag: '🇧🇿' },
  { code: '+502', country: 'Guatemala', flag: '🇬🇹' },
  { code: '+503', country: 'El Salvador', flag: '🇸🇻' },
  { code: '+504', country: 'Honduras', flag: '🇭🇳' },
  { code: '+505', country: 'Nicaragua', flag: '🇳🇮' },
  { code: '+506', country: 'Costa Rica', flag: '🇨🇷' },
  { code: '+507', country: 'Panamá', flag: '🇵🇦' },
  { code: '+508', country: 'San Pedro y Miquelón', flag: '🇵🇲' },
  { code: '+509', country: 'Haití', flag: '🇭🇹' },
  { code: '+590', country: 'Guadalupe', flag: '🇬🇵' },
  { code: '+1787', country: 'Puerto Rico', flag: '🇵🇷' },
  { code: '+1809', country: 'República Dominicana', flag: '🇩🇴' },
  { code: '+1876', country: 'Jamaica', flag: '🇯🇲' },
  { code: '+1784', country: 'San Vicente y las Granadinas', flag: '🇻🇨' },
  { code: '+1758', country: 'Santa Lucía', flag: '🇱🇨' },
  { code: '+1473', country: 'Granada', flag: '🇬🇩' },
  { code: '+1868', country: 'Trinidad y Tobago', flag: '🇹🇹' },
  { code: '+1767', country: 'Dominica', flag: '🇩🇲' },
  { code: '+1664', country: 'Montserrat', flag: '🇲🇸' },
  { code: '+1649', country: 'Islas Turcas y Caicos', flag: '🇹🇨' },
  { code: '+1721', country: 'Sint Maarten', flag: '🇸🇽' },
  { code: '+1246', country: 'Barbados', flag: '🇧🇧' },
  { code: '+1268', country: 'Antigua y Barbuda', flag: '🇦🇬' },
  { code: '+1284', country: 'Islas Vírgenes Británicas', flag: '🇻🇬' },
  { code: '+1340', country: 'Islas Vírgenes de EE.UU.', flag: '🇻🇮' },
  
  // América del Sur
  { code: '+54', country: 'Argentina', flag: '🇦🇷' },
  { code: '+55', country: 'Brasil', flag: '🇧🇷' },
  { code: '+56', country: 'Chile', flag: '🇨🇱' },
  { code: '+57', country: 'Colombia', flag: '🇨🇴' },
  { code: '+58', country: 'Venezuela', flag: '🇻🇪' },
  { code: '+591', country: 'Bolivia', flag: '🇧🇴' },
  { code: '+592', country: 'Guyana', flag: '🇬🇾' },
  { code: '+593', country: 'Ecuador', flag: '🇪🇨' },
  { code: '+594', country: 'Guayana Francesa', flag: '🇬🇫' },
  { code: '+595', country: 'Paraguay', flag: '🇵🇾' },
  { code: '+596', country: 'Martinica', flag: '🇲🇶' },
  { code: '+597', country: 'Suriname', flag: '🇸🇷' },
  { code: '+598', country: 'Uruguay', flag: '🇺🇾' },
  
  // Europa
  { code: '+33', country: 'Francia', flag: '🇫🇷' },
  { code: '+34', country: 'España', flag: '🇪🇸' },
  { code: '+39', country: 'Italia', flag: '🇮🇹' },
  { code: '+41', country: 'Suiza', flag: '🇨🇭' },
  { code: '+43', country: 'Austria', flag: '🇦🇹' },
  { code: '+44', country: 'Reino Unido', flag: '🇬🇧' },
  { code: '+45', country: 'Dinamarca', flag: '🇩🇰' },
  { code: '+46', country: 'Suecia', flag: '🇸🇪' },
  { code: '+47', country: 'Noruega', flag: '🇳🇴' },
  { code: '+48', country: 'Polonia', flag: '🇵🇱' },
  { code: '+49', country: 'Alemania', flag: '🇩🇪' },
  { code: '+351', country: 'Portugal', flag: '🇵🇹' },
  { code: '+352', country: 'Luxemburgo', flag: '🇱🇺' },
  { code: '+353', country: 'Irlanda', flag: '🇮🇪' },
  { code: '+354', country: 'Islandia', flag: '🇮🇸' },
  { code: '+355', country: 'Albania', flag: '🇦🇱' },
  { code: '+356', country: 'Malta', flag: '🇲🇹' },
  { code: '+357', country: 'Chipre', flag: '🇨🇾' },
  { code: '+358', country: 'Finlandia', flag: '🇫🇮' },
  { code: '+359', country: 'Bulgaria', flag: '🇧🇬' },
  { code: '+36', country: 'Hungría', flag: '🇭🇺' },
  { code: '+370', country: 'Lituania', flag: '🇱🇹' },
  { code: '+371', country: 'Letonia', flag: '🇱🇻' },
  { code: '+372', country: 'Estonia', flag: '🇪🇪' },
  { code: '+373', country: 'Moldavia', flag: '🇲🇩' },
  { code: '+374', country: 'Armenia', flag: '🇦🇲' },
  { code: '+375', country: 'Bielorrusia', flag: '🇧🇾' },
  { code: '+376', country: 'Andorra', flag: '🇦🇩' },
  { code: '+377', country: 'Mónaco', flag: '🇲🇨' },
  { code: '+378', country: 'San Marino', flag: '🇸🇲' },
  { code: '+380', country: 'Ucrania', flag: '🇺🇦' },
  { code: '+381', country: 'Serbia', flag: '🇷🇸' },
  { code: '+382', country: 'Montenegro', flag: '🇲🇪' },
  { code: '+383', country: 'Kosovo', flag: '🇽🇰' },
  { code: '+385', country: 'Croacia', flag: '🇭🇷' },
  { code: '+386', country: 'Eslovenia', flag: '🇸🇮' },
  { code: '+387', country: 'Bosnia y Herzegovina', flag: '🇧🇦' },
  { code: '+389', country: 'Macedonia del Norte', flag: '🇲🇰' },
  { code: '+420', country: 'República Checa', flag: '🇨🇿' },
  { code: '+421', country: 'Eslovaquia', flag: '🇸🇰' },
  { code: '+423', country: 'Liechtenstein', flag: '🇱🇮' },
  { code: '+31', country: 'Países Bajos', flag: '🇳🇱' },
  { code: '+32', country: 'Bélgica', flag: '🇧🇪' },
  { code: '+7', country: 'Rusia', flag: '🇷🇺' },
  { code: '+30', country: 'Grecia', flag: '🇬🇷' },
  { code: '+40', country: 'Rumania', flag: '🇷🇴' },
  
  // Asia
  { code: '+81', country: 'Japón', flag: '🇯🇵' },
  { code: '+82', country: 'Corea del Sur', flag: '🇰🇷' },
  { code: '+86', country: 'China', flag: '🇨🇳' },
  { code: '+852', country: 'Hong Kong', flag: '🇭🇰' },
  { code: '+853', country: 'Macao', flag: '🇲🇴' },
  { code: '+886', country: 'Taiwán', flag: '🇹🇼' },
  { code: '+91', country: 'India', flag: '🇮🇳' },
  { code: '+92', country: 'Pakistán', flag: '🇵🇰' },
  { code: '+93', country: 'Afganistán', flag: '🇦🇫' },
  { code: '+94', country: 'Sri Lanka', flag: '🇱🇰' },
  { code: '+95', country: 'Myanmar', flag: '🇲🇲' },
  { code: '+98', country: 'Irán', flag: '🇮🇷' },
  { code: '+60', country: 'Malasia', flag: '🇲🇾' },
  { code: '+62', country: 'Indonesia', flag: '🇮🇩' },
  { code: '+63', country: 'Filipinas', flag: '🇵🇭' },
  { code: '+64', country: 'Nueva Zelanda', flag: '🇳🇿' },
  { code: '+65', country: 'Singapur', flag: '🇸🇬' },
  { code: '+66', country: 'Tailandia', flag: '🇹🇭' },
  { code: '+84', country: 'Vietnam', flag: '🇻🇳' },
  { code: '+850', country: 'Corea del Norte', flag: '🇰🇵' },
  { code: '+855', country: 'Camboya', flag: '🇰🇭' },
  { code: '+856', country: 'Laos', flag: '🇱🇦' },
  { code: '+880', country: 'Bangladesh', flag: '🇧🇩' },
  { code: '+960', country: 'Maldivas', flag: '🇲🇻' },
  { code: '+961', country: 'Líbano', flag: '🇱🇧' },
  { code: '+962', country: 'Jordania', flag: '🇯🇴' },
  { code: '+963', country: 'Siria', flag: '🇸🇾' },
  { code: '+964', country: 'Irak', flag: '🇮🇶' },
  { code: '+965', country: 'Kuwait', flag: '🇰🇼' },
  { code: '+966', country: 'Arabia Saudí', flag: '🇸🇦' },
  { code: '+967', country: 'Yemen', flag: '🇾🇪' },
  { code: '+968', country: 'Omán', flag: '🇴🇲' },
  { code: '+971', country: 'Emiratos Árabes Unidos', flag: '🇦🇪' },
  { code: '+972', country: 'Israel', flag: '🇮🇱' },
  { code: '+973', country: 'Bahréin', flag: '🇧🇭' },
  { code: '+974', country: 'Catar', flag: '🇶🇦' },
  { code: '+975', country: 'Bután', flag: '🇧🇹' },
  { code: '+976', country: 'Mongolia', flag: '🇲🇳' },
  { code: '+977', country: 'Nepal', flag: '🇳🇵' },
  { code: '+992', country: 'Tayikistán', flag: '🇹🇯' },
  { code: '+993', country: 'Turkmenistán', flag: '🇹🇲' },
  { code: '+994', country: 'Azerbaiyán', flag: '🇦🇿' },
  { code: '+995', country: 'Georgia', flag: '🇬🇪' },
  { code: '+996', country: 'Kirguistán', flag: '🇰🇬' },
  { code: '+998', country: 'Uzbekistán', flag: '🇺🇿' },
  
  // África
  { code: '+20', country: 'Egipto', flag: '🇪🇬' },
  { code: '+27', country: 'Sudáfrica', flag: '🇿🇦' },
  { code: '+212', country: 'Marruecos', flag: '🇲🇦' },
  { code: '+213', country: 'Argelia', flag: '🇩🇿' },
  { code: '+216', country: 'Túnez', flag: '🇹🇳' },
  { code: '+218', country: 'Libia', flag: '🇱🇾' },
  { code: '+220', country: 'Gambia', flag: '🇬🇲' },
  { code: '+221', country: 'Senegal', flag: '🇸🇳' },
  { code: '+222', country: 'Mauritania', flag: '🇲🇷' },
  { code: '+223', country: 'Malí', flag: '🇲🇱' },
  { code: '+224', country: 'Guinea', flag: '🇬🇳' },
  { code: '+225', country: 'Costa de Marfil', flag: '🇨🇮' },
  { code: '+226', country: 'Burkina Faso', flag: '🇧🇫' },
  { code: '+227', country: 'Níger', flag: '🇳🇪' },
  { code: '+228', country: 'Togo', flag: '🇹🇬' },
  { code: '+229', country: 'Benín', flag: '🇧🇯' },
  { code: '+230', country: 'Mauricio', flag: '🇲🇺' },
  { code: '+231', country: 'Liberia', flag: '🇱🇷' },
  { code: '+232', country: 'Sierra Leona', flag: '🇸🇱' },
  { code: '+233', country: 'Ghana', flag: '🇬🇭' },
  { code: '+234', country: 'Nigeria', flag: '🇳🇬' },
  { code: '+235', country: 'Chad', flag: '🇹🇩' },
  { code: '+236', country: 'República Centroafricana', flag: '🇨🇫' },
  { code: '+237', country: 'Camerún', flag: '🇨🇲' },
  { code: '+238', country: 'Cabo Verde', flag: '🇨🇻' },
  { code: '+239', country: 'Santo Tomé y Príncipe', flag: '🇸🇹' },
  { code: '+240', country: 'Guinea Ecuatorial', flag: '🇬🇶' },
  { code: '+241', country: 'Gabón', flag: '🇬🇦' },
  { code: '+242', country: 'República del Congo', flag: '🇨🇬' },
  { code: '+243', country: 'República Democrática del Congo', flag: '🇨🇩' },
  { code: '+244', country: 'Angola', flag: '🇦🇴' },
  { code: '+245', country: 'Guinea-Bisáu', flag: '🇬🇼' },
  { code: '+246', country: 'Diego García', flag: '🇮🇴' },
  { code: '+248', country: 'Seychelles', flag: '🇸🇨' },
  { code: '+249', country: 'Sudán', flag: '🇸🇩' },
  { code: '+250', country: 'Ruanda', flag: '🇷🇼' },
  { code: '+251', country: 'Etiopía', flag: '🇪🇹' },
  { code: '+252', country: 'Somalia', flag: '🇸🇴' },
  { code: '+253', country: 'Yibuti', flag: '🇩🇯' },
  { code: '+254', country: 'Kenia', flag: '🇰🇪' },
  { code: '+255', country: 'Tanzania', flag: '🇹🇿' },
  { code: '+256', country: 'Uganda', flag: '🇺🇬' },
  { code: '+257', country: 'Burundi', flag: '🇧🇮' },
  { code: '+258', country: 'Mozambique', flag: '🇲🇿' },
  { code: '+260', country: 'Zambia', flag: '🇿🇲' },
  { code: '+261', country: 'Madagascar', flag: '🇲🇬' },
  { code: '+262', country: 'Reunión', flag: '🇷🇪' },
  { code: '+263', country: 'Zimbabue', flag: '🇿🇼' },
  { code: '+264', country: 'Namibia', flag: '🇳🇦' },
  { code: '+265', country: 'Malaui', flag: '🇲🇼' },
  { code: '+266', country: 'Lesoto', flag: '🇱🇸' },
  { code: '+267', country: 'Botsuana', flag: '🇧🇼' },
  { code: '+268', country: 'Esuatini', flag: '🇸🇿' },
  { code: '+269', country: 'Comoras', flag: '🇰🇲' },
  
  // Oceanía
  { code: '+61', country: 'Australia', flag: '🇦🇺' },
  { code: '+679', country: 'Fiyi', flag: '🇫🇯' },
  { code: '+685', country: 'Samoa', flag: '🇼🇸' },
  { code: '+686', country: 'Kiribati', flag: '🇰🇮' },
  { code: '+687', country: 'Nueva Caledonia', flag: '🇳🇨' },
  { code: '+688', country: 'Tuvalu', flag: '🇹🇻' },
  { code: '+689', country: 'Polinesia Francesa', flag: '🇵🇫' },
  { code: '+690', country: 'Tokelau', flag: '🇹🇰' },
  { code: '+691', country: 'Micronesia', flag: '🇫🇲' },
  { code: '+692', country: 'Islas Marshall', flag: '🇲🇭' },
  { code: '+670', country: 'Timor Oriental', flag: '🇹🇱' },
  { code: '+676', country: 'Tonga', flag: '🇹🇴' },
  { code: '+677', country: 'Islas Salomón', flag: '🇸🇧' },
  { code: '+678', country: 'Vanuatu', flag: '🇻🇺' },
  { code: '+680', country: 'Palaos', flag: '🇵🇼' },
  { code: '+681', country: 'Wallis y Futuna', flag: '🇼🇫' },
  { code: '+682', country: 'Islas Cook', flag: '🇨🇰' },
  { code: '+683', country: 'Niue', flag: '🇳🇺' },
  { code: '+684', country: 'Samoa Americana', flag: '🇦🇸' },
  { code: '+685', country: 'Samoa', flag: '🇼🇸' },
]

interface CountryCodeSelectorProps {
  value: string
  onChange: (code: string) => void
  disabled?: boolean
}

const CountryCodeSelector: React.FC<CountryCodeSelectorProps> = ({
  value,
  onChange,
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  // Encontrar el país seleccionado, por defecto Colombia
  const selectedCountry = worldCountries.find(country => country.code === value) || 
    worldCountries.find(country => country.code === '+57') || 
    worldCountries[0]

  // Filtrar países basado en el término de búsqueda
  const filteredCountries = useMemo(() => {
    if (!searchTerm.trim()) return worldCountries
    
    const term = searchTerm.toLowerCase()
    return worldCountries.filter(country => 
      country.country.toLowerCase().includes(term) ||
      country.code.includes(term)
    )
  }, [searchTerm])

  const handleSelect = (code: string) => {
    onChange(code)
    setIsOpen(false)
    setSearchTerm('')
  }

  const handleToggle = () => {
    setIsOpen(!isOpen)
    if (!isOpen) {
      setSearchTerm('')
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className="flex items-center space-x-2 px-3 py-3 bg-white/5 border border-white/10 rounded-l-lg text-white hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-[120px]"
      >
        <span className="text-lg">{selectedCountry.flag}</span>
        <span className="text-sm font-medium">{selectedCountry.code}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-96 bg-[#1A2B47] border border-white/20 rounded-lg shadow-xl z-50 max-h-80 overflow-hidden">
          {/* Barra de búsqueda */}
          <div className="p-3 border-b border-white/10">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/50" />
              <input
                type="text"
                placeholder="Buscar país o código..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-[#5ce1e6] focus:ring-1 focus:ring-[#5ce1e6] text-sm"
                autoFocus
              />
            </div>
          </div>

          {/* Lista de países */}
          <div className="overflow-y-auto max-h-60">
            {filteredCountries.length > 0 ? (
              filteredCountries.map((country, index) => (
                <button
                  key={`${country.code}-${country.country}-${index}`}
                  type="button"
                  onClick={() => handleSelect(country.code)}
                  className="w-full flex items-center space-x-3 px-4 py-3 text-left text-white hover:bg-white/10 transition-colors"
                >
                  <span className="text-lg flex-shrink-0">{country.flag}</span>
                  <span className="text-sm font-medium flex-shrink-0 min-w-[60px]">{country.code}</span>
                  <span className="text-sm text-white/70 truncate">{country.country}</span>
                </button>
              ))
            ) : (
              <div className="px-4 py-6 text-center text-white/50">
                <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No se encontraron países</p>
                <p className="text-xs mt-1">Intenta con otro término de búsqueda</p>
              </div>
            )}
          </div>

          {/* Información adicional */}
          <div className="p-3 border-t border-white/10 bg-white/5">
            <p className="text-xs text-white/50 text-center">
              {filteredCountries.length} de {worldCountries.length} países disponibles
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default CountryCodeSelector 