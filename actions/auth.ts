"use server";

import { createSupabaseClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export async function logIn(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  // Validaciones básicas
  if (!email || !password) {
    return {
      error: "Por favor completa todos los campos"
    };
  }

  if (!email.includes("@")) {
    return {
      error: "Por favor ingresa un email válido"
    };
  }

  if (password.length < 6) {
    return {
      error: "La contraseña debe tener al menos 6 caracteres"
    };
  }

  const supabase = await createSupabaseClient();

  try {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Manejo específico de errores de Supabase
      console.error('auth.signInWithPassword error:', { message: error.message, status: (error as any)?.status })
      if (error.message.includes("Invalid login credentials")) {
        return { error: "Email o contraseña incorrectos" };
      }
      if (error.message.includes("Email not confirmed")) {
        return { error: "Por favor confirma tu email antes de iniciar sesión" };
      }
      if (error.message.includes("Too many requests")) {
        return { error: "Demasiados intentos. Intenta más tarde" };
      }
      return { error: "Error al iniciar sesión. Verifica tus datos" };
    }

    // ✅ Login exitoso - El middleware se encargará de la redirección
    return { success: "Login exitoso" };
  } catch (error) {
    console.error('logIn catch error:', error)
    return {
      error: "Error del servidor. Intenta más tarde"
    };
  }
}

export async function signUp(formData: FormData) {
  // ===== LOGS DE DEBUG INICIALES MÁS VISIBLES =====
  console.log('🚀🚀🚀 SERVER FUNCTION CALLED - signUp iniciada');
  console.log('📥📥📥 SERVER - FormData recibido:', Array.from(formData.entries()));
  console.log('⏰⏰⏰ SERVER - Timestamp:', new Date().toISOString());
  
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;
  const password = formData.get("password") as string;
  const repeatPassword = formData.get("repeatPassword") as string;

  console.log('🔍 SERVER - Datos extraídos:', { 
    name: name || 'NULL', 
    email: email || 'NULL', 
    phone: phone || 'NULL',
    password: password ? '***' : 'NULL',
    repeatPassword: repeatPassword ? '***' : 'NULL'
  });

  // Validaciones básicas
  if (!name || !email || !phone || !password || !repeatPassword) {
    console.log('❌ SERVER - Validación falló: campos faltantes');
    return {
      error: "Por favor completa todos los campos"
    };
  }

  if (name.trim().length < 2) {
    console.log('❌ SERVER - Validación falló: nombre muy corto');
    return {
      error: "El nombre debe tener al menos 2 caracteres"
    };
  }

  if (!email.includes("@")) {
    console.log('❌ SERVER - Validación falló: email inválido');
    return {
      error: "Por favor ingresa un email válido"
    };
  }

  // Validación mejorada para números telefónicos internacionales
  if (!phone || phone.trim().length === 0) {
    console.log('❌ SERVER - Validación falló: teléfono vacío');
    return {
      error: "Por favor ingresa un número de teléfono"
    };
  }

  // Validar formato internacional: debe empezar con + y tener al menos 8 dígitos
  const phoneRegex = /^\+\d{1,4}\d{4,15}$/;
  if (!phoneRegex.test(phone.trim())) {
    console.log('❌ SERVER - Validación falló: formato de teléfono inválido', { 
      phone: phone.trim(), 
      length: phone.trim().length 
    });
    return {
      error: "Por favor ingresa un número de teléfono válido (formato: +código país + número)"
    };
  }

  // Validar longitud total (código de país + número)
  const phoneDigits = phone.replace(/\D/g, ''); // Solo dígitos
  if (phoneDigits.length < 7 || phoneDigits.length > 15) {
    console.log('❌ SERVER - Validación falló: longitud de teléfono inválida', { 
      phoneDigits, 
      length: phoneDigits.length 
    });
    return {
      error: "El número de teléfono debe tener entre 7 y 15 dígitos"
    };
  }

  if (password.length < 6) {
    console.log('❌ SERVER - Validación falló: contraseña muy corta');
    return {
      error: "La contraseña debe tener al menos 6 caracteres"
    };
  }

  if (password !== repeatPassword) {
    console.log('❌ SERVER - Validación falló: contraseñas no coinciden');
    return {
      error: "Las contraseñas no coinciden"
    };
  }

  console.log('✅ SERVER - Todas las validaciones pasaron');

  const supabase = await createSupabaseClient();
  console.log('🔗 SERVER - Cliente Supabase creado');

  try {
    // 1. Crear usuario en auth.users - LÓGICA DEL INSIGHTS
    console.log('📝 SERVER - Iniciando auth.signUp...');
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/dashboard`,
        data: {
          full_name: name.trim()
        }
      }
    });

    console.log('📊 SERVER - Resultado auth.signUp:', { 
      userId: data.user?.id, 
      error: error?.message 
    });

    // 2. Si el registro fue exitoso, usar UPSERT en lugar de INSERT - LÓGICA DEL INSIGHTS
    if (!error && data.user && (name || phone)) {
      try {
        console.log('💾 SERVER - Iniciando UPSERT en tabla usuarios...');
        console.log('📋 SERVER - Datos para UPSERT:', {
          id: data.user.id,
          nombre: name.trim(),
          gmail: email.trim(),
          telefono: phone.trim()
        });

        const { data: upsertData, error: userError } = await supabase
          .from('usuarios')
          .upsert({
            id: data.user.id,
            nombre: name.trim() || null,
            gmail: email.trim(),
            telefono: phone.trim() || null
          }, {
            onConflict: 'id'
          });

        console.log('📈 SERVER - Resultado UPSERT usuarios:', { 
          upsertData, 
          userError: userError?.message 
        });

        if (userError) {
          console.error('🚨 SERVER - Error al insertar datos del usuario:', userError);
          // No fallar el registro, pero loggearlo
        } else {
          console.log('🎉 SERVER - UPSERT exitoso en tabla usuarios');
        }
      } catch (insertError) {
        console.error('💥 SERVER - Error en catch de inserción:', insertError);
        // No fallar el registro, pero loggearlo
      }
    } else {
      console.log('⚠️ SERVER - No se ejecutó UPSERT:', {
        hasError: !!error,
        hasUser: !!data.user,
        hasNameOrPhone: !!(name || phone)
      });
    }

    if (error) {
      console.error('🔥 SERVER - Error en auth.signUp:', error);
      
      if (error.message.includes("User already registered")) {
        return { error: "Ya existe una cuenta con este email" };
      }
      if (error.message.includes("Password should be at least 6 characters")) {
        return { error: "La contraseña debe tener al menos 6 caracteres" };
      }
      if (error.message.includes("Unable to validate email address")) {
        return { error: "Email no válido. Verifica el formato" };
      }
      if (error.message.includes("Password should contain")) {
        return { error: "La contraseña no cumple con los requisitos de seguridad" };
      }
      if (error.message.includes("Email rate limit exceeded")) {
        return { error: "Demasiados intentos. Espera unos minutos e intenta de nuevo" };
      }
      if (error.message.includes("Invalid email")) {
        return { error: "Email inválido. Usa un formato válido como usuario@ejemplo.com" };
      }
      
      // Log del error completo para debugging
      console.error('📋 SERVER - Error completo de Supabase:', {
        message: error.message,
        status: error.status
      });
      
      return { error: `Error al crear la cuenta: ${error.message}` };
    }

    console.log('🏆 SERVER - Registro completado exitosamente');
    return {
      success: "Cuenta creada exitosamente. Revisa tu email para confirmarla"
    };
  } catch (error) {
    console.error('💣 SERVER - Error en catch principal:', error);
    return {
      error: "Error del servidor. Verifica tu conexión e intenta más tarde"
    };
  }
}

export async function logOut() {
  const supabase = await createSupabaseClient();
  const { error } = await supabase.auth.signOut();
  
  if (error) {
    console.error('Error al cerrar sesión:', error);
  }
  
  redirect("/");
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

/**
 * Solicitar correo de recuperación de contraseña.
 * Envía el link de reset a resetPasswordForEmail con redirectTo a /reset-password.
 */
export async function requestPasswordReset(formData: FormData) {
  const email = (formData.get("email") as string)?.trim();

  if (!email) {
    return { error: "Ingresa tu email" };
  }
  if (!email.includes("@")) {
    return { error: "Ingresa un email válido" };
  }

  const supabase = await createSupabaseClient();

  try {
    // 1) Comprobar si existe un usuario con ese email en nuestra tabla pública
    //    (sin usar service_role, solo la anon key y las policies de RLS).
    const { data: userRecord, error: userError } = await supabase
      .from("usuarios")
      .select("id")
      .eq("gmail", email)
      .maybeSingle();

    if (userError) {
      console.error("requestPasswordReset - error comprobando usuarios:", userError);
      return {
        error: "No pudimos verificar este email. Intenta nuevamente en unos minutos.",
      };
    }

    if (!userRecord) {
      // El email no está registrado en nuestra base → avisamos al usuario.
      return {
        error: "No encontramos ninguna cuenta con este email. Regístrate primero.",
      };
    }

    // 2) Si el email existe, entonces sí pedimos el correo de recuperación a Supabase.
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${SITE_URL}/reset-password`,
    });

    if (error) {
      if (error.message.includes("rate limit") || error.message.includes("Too many")) {
        return { error: "Demasiados intentos. Espera unos minutos e intenta de nuevo." };
      }
      return { error: "No pudimos enviar el correo. Verifica el email e intenta de nuevo." };
    }

    return { success: "Revisa tu correo. Te enviamos un enlace para restablecer tu contraseña." };
  } catch (err) {
    console.error("requestPasswordReset error:", err);
    return { error: "Error del servidor. Intenta más tarde." };
  }
}

/**
 * Actualizar contraseña usando la sesión temporal del link del correo.
 * Valida que password y confirmación coincidan y tengan longitud mínima.
 */
export async function resetPassword(formData: FormData) {
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!password || !confirmPassword) {
    return { error: "Completa ambos campos" };
  }
  if (password.length < 6) {
    return { error: "La contraseña debe tener al menos 6 caracteres" };
  }
  if (password !== confirmPassword) {
    return { error: "Las contraseñas no coinciden" };
  }

  const supabase = await createSupabaseClient();

  try {
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      if (error.message.includes("same as")) {
        return { error: "La nueva contraseña debe ser distinta a la actual." };
      }
      return { error: "No se pudo actualizar la contraseña. El enlace puede haber expirado." };
    }

    return { success: "Contraseña actualizada. Ya puedes iniciar sesión." };
  } catch (err) {
    console.error("resetPassword error:", err);
    return { error: "Error del servidor. Intenta más tarde." };
  }
} 