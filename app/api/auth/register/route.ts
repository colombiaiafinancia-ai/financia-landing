import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseClient } from '@/utils/supabase/server'
import { getSupabaseAdminClient } from '@/services/supabase/admin'

function normalizePromoCode(value: unknown) {
  return String(value || '').replace(/\s+/g, '').toUpperCase()
}

export async function POST(request: NextRequest) {
  console.log('🚀🚀🚀 API ROUTE CALLED - /api/auth/register')
  console.log('⏰⏰⏰ API ROUTE - Timestamp:', new Date().toISOString())
  
  try {
    const body = await request.json()
    console.log('📥📥📥 API ROUTE - Body recibido:', body)
    
    const { name, email, phone, password, repeatPassword } = body
    const promoCode = normalizePromoCode(body.promoCode)

    // Validation
    if (!name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }
    if (!email?.trim()) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }
    // Validación mejorada para números telefónicos internacionales
    if (!phone?.trim()) {
      return NextResponse.json({ error: 'Phone is required' }, { status: 400 })
    }

    // Validar formato internacional: debe empezar con + y tener formato válido
    const phoneRegex = /^\+\d{1,4}\d{4,15}$/;
    if (!phoneRegex.test(phone.trim())) {
      return NextResponse.json({ 
        error: 'Please enter a valid international phone number (format: +country code + number)' 
      }, { status: 400 })
    }

    // Validar longitud total
    const phoneDigits = phone.replace(/\D/g, '');
    if (phoneDigits.length < 7 || phoneDigits.length > 15) {
      return NextResponse.json({ 
        error: 'Phone number must have between 7 and 15 digits' 
      }, { status: 400 })
    }
    if (!password) {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 })
    }
    if (password !== repeatPassword) {
      return NextResponse.json({ error: 'Passwords do not match' }, { status: 400 })
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    const supabaseAdmin = getSupabaseAdminClient()

    if (promoCode) {
      const { data: promo, error: promoError } = await supabaseAdmin
        .from('promo_codes')
        .select('trial_days,starts_at,expires_at,max_redemptions,redemptions_count,is_active')
        .eq('normalized_code', promoCode)
        .maybeSingle()

      const now = Date.now()
      const promoIsInvalid =
        promoError ||
        !promo ||
        !promo.is_active ||
        (promo.starts_at && now < new Date(promo.starts_at).getTime()) ||
        (promo.expires_at && now > new Date(promo.expires_at).getTime()) ||
        (promo.max_redemptions !== null && promo.redemptions_count >= promo.max_redemptions)

      if (promoIsInvalid) {
        return NextResponse.json({
          error: 'El codigo promocional no es valido o ya no esta disponible'
        }, { status: 400 })
      }
    }

    console.log('🔍 API ROUTE - Datos extraídos:', {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      password: '***',
      repeatPassword: '***'
    })

    console.log('✅ API ROUTE - Todas las validaciones pasaron')

    const supabase = await createSupabaseClient()
    console.log('🔗 API ROUTE - Cliente Supabase creado')

    console.log('📝 API ROUTE - Iniciando auth.signUp...')
    
    // Create user in Supabase Auth with phone in metadata
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/dashboard`,
        data: {
          full_name: name.trim(),
          phone: phone.trim(),
          promo_code: promoCode || null,
        }
      }
    });

    console.log('📊 API ROUTE - Resultado auth.signUp:', { 
      userId: data?.user?.id, 
      error: error?.message,
      userMetadata: data?.user?.user_metadata
    })

    if (error) {
      console.log('❌ API ROUTE - Error en auth.signUp:', error)
      const errMsg = error.message.toLowerCase()
      if (
        errMsg.includes('telefono') ||
        errMsg.includes('usuarios_telefono') ||
        (errMsg.includes('duplicate') && errMsg.includes('telefono'))
      ) {
        return NextResponse.json({ 
          error: 'El número ya está enlazado a una cuenta' 
        }, { status: 400 })
      }
      if (
        (errMsg.includes('database error') && errMsg.includes('saving')) ||
        (errMsg.includes('duplicate') && errMsg.includes('key'))
      ) {
        return NextResponse.json({ 
          error: 'El email o el número ya está enlazado a una cuenta' 
        }, { status: 400 })
      }
      if (
        errMsg.includes('gmail') ||
        (errMsg.includes('duplicate') && errMsg.includes('email')) ||
        errMsg.includes('user already registered') ||
        errMsg.includes('already registered')
      ) {
        return NextResponse.json({ 
          error: 'Ya existe una cuenta con este email. Inicia sesión.' 
        }, { status: 400 })
      }
      return NextResponse.json({ 
        error: `Error al crear la cuenta: ${error.message}` 
      }, { status: 400 })
    }

    if (!data?.user) {
      console.log('❌ API ROUTE - No se creó el usuario')
      return NextResponse.json({ 
        error: 'Error al crear la cuenta' 
      }, { status: 400 })
    }

    // Usuario ya existente: Supabase devuelve success con identities vacío
    if (!data.user.identities || data.user.identities.length === 0) {
      console.log('⚠️ API ROUTE - Email/phone ya registrado (identities vacío)')
      return NextResponse.json({ 
        error: 'Ya existe una cuenta con este email o teléfono. Inicia sesión.' 
      }, { status: 400 })
    }

    if (promoCode) {
      const { data: redemption, error: redemptionError } = await supabaseAdmin
        .rpc('redeem_promo_code', {
          p_user_id: data.user.id,
          p_code: promoCode,
          p_email: email.trim(),
        })

      const result = Array.isArray(redemption) ? redemption[0] : redemption

      if (redemptionError || !result?.ok) {
        console.error('Error aplicando codigo promocional:', redemptionError || result)
        await supabaseAdmin.auth.admin.deleteUser(data.user.id)

        return NextResponse.json({
          error: 'No pudimos aplicar el codigo promocional. Intenta registrarte nuevamente.'
        }, { status: 400 })
      }
    }

    // ✅ NUEVO FLUJO: Solo guardamos en metadata, el trigger se encarga del resto
    console.log('⏳ API ROUTE - Datos guardados en auth.user_metadata, esperando confirmación de email')
    console.log('📋 API ROUTE - Metadata guardado:', {
      full_name: name.trim(),
      phone: phone.trim(),
      email: email.trim()
    })
    
    console.log('🏆 API ROUTE - Registro completado exitosamente')

    return NextResponse.json({ 
      success: 'Te enviamos un correo de verificación. Revisa tu bandeja de entrada, si no lo encuentras, revisa la carpeta de spam' 
    })

  } catch (error) {
    console.log('💥 API ROUTE - Error general:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor' 
    }, { status: 500 })
  }
}
