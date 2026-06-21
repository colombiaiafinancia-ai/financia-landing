import { ImageResponse } from 'next/og'

export const alt = 'FinancIA, app de finanzas personales por WhatsApp'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: 'center',
          background: '#0d1a2e',
          color: '#f8fafc',
          display: 'flex',
          fontFamily: 'Arial, sans-serif',
          height: '100%',
          justifyContent: 'space-between',
          padding: 72,
          width: '100%',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', maxWidth: 690 }}>
          <div
            style={{
              border: '2px solid rgba(6, 182, 212, 0.38)',
              borderRadius: 999,
              color: '#67e8f9',
              display: 'flex',
              fontSize: 28,
              fontWeight: 700,
              letterSpacing: 2,
              padding: '12px 24px',
              textTransform: 'uppercase',
            }}
          >
            FinancIA
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              fontSize: 72,
              fontWeight: 800,
              lineHeight: 1.02,
              marginTop: 34,
            }}
          >
            App de finanzas personales
            <span style={{ color: '#06B6D4' }}>por WhatsApp</span>
          </div>
          <div style={{ color: '#cbd5e1', fontSize: 30, lineHeight: 1.35, marginTop: 28 }}>
            Registra gastos, organiza presupuestos y entiende tu dinero con inteligencia artificial.
          </div>
        </div>
        <div
          style={{
            alignItems: 'center',
            background: '#07111f',
            border: '3px solid rgba(6, 182, 212, 0.5)',
            borderRadius: 48,
            boxShadow: '0 30px 90px rgba(6, 182, 212, 0.24)',
            display: 'flex',
            flexDirection: 'column',
            gap: 22,
            height: 448,
            justifyContent: 'center',
            padding: 34,
            width: 310,
          }}
        >
          {['Gaste $42.000 en mercado', 'Listo. Lo guarde en comida.', 'Te quedan $318.000 este mes.'].map(
            (message, index) => (
              <div
                key={message}
                style={{
                  alignSelf: index === 0 ? 'flex-end' : 'flex-start',
                  background: index === 0 ? '#06B6D4' : '#17233a',
                  borderRadius: 22,
                  color: index === 0 ? '#07111f' : '#e2e8f0',
                  display: 'flex',
                  fontSize: 23,
                  fontWeight: 700,
                  lineHeight: 1.2,
                  padding: '18px 20px',
                  width: index === 2 ? 236 : 214,
                }}
              >
                {message}
              </div>
            )
          )}
        </div>
      </div>
    ),
    size
  )
}
