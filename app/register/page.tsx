import { RegisterForm } from '@/components/RegisterForm'
import Link from 'next/link'

export default function RegisterPage() {
  return (
    <main className='min-h-screen bg-[#0D1D35] flex flex-col'>
      {/* Navigation */}
      <nav className='sticky top-0 z-50 bg-[#0D1D35]/95 backdrop-blur-sm border-b border-white/10 container mx-auto px-4 py-4 md:py-6 flex justify-between items-center'>
        <Link href='/' className='text-xl md:text-2xl font-bold text-white hover:text-[#9DFAD7] transition-colors'>
          FinancIA
        </Link>
        <div className='flex items-center space-x-4 md:space-x-6'>
          <Link href='/' className='text-white hover:text-[#9DFAD7] transition-colors text-sm md:text-base'>
            Volver al inicio
          </Link>
        </div>
      </nav>

      {/* Register Section */}
      <section className='flex-1 flex items-center justify-center px-4 py-8 md:py-12'>
        <div className='w-full max-w-md'>
          <div className='text-center mb-8'>
            <h1 className='text-3xl md:text-4xl font-bold text-white mb-4'>
              Crear Cuenta
            </h1>
            <p className='text-white/80 text-base md:text-lg'>
              Ahora eres parte de FinancIA. Es hora de transformar el control de tu dinero
            </p>
          </div>
          
          <RegisterForm />

          <div className='mt-6 text-center'>
            <p className='text-white/60 text-sm'>
              ¿Ya tienes una cuenta?{' '}
              <Link 
                href='/login' 
                className='text-[#9DFAD7] hover:text-[#D4FFB5] font-semibold transition-colors'
              >
                Inicia sesión aquí
              </Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  )
} 