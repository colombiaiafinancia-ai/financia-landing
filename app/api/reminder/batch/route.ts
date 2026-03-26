import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { sendWhatsAppMessage } from '@/lib/whatsapp';

// Autenticación con el mismo secreto que usa el trigger
const CRON_SECRET = process.env.CRON_SECRET;

export async function POST(request: NextRequest) {
  // Verificar autorización
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { userIds } = await request.json();
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: 'Invalid user list' }, { status: 400 });
    }

    const colombiaDate = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });
    const results = [];

    for (const userId of userIds) {
      // 1. Revalidar elegibilidad justo antes de enviar
      const { data: eligible, error: eligError } = await supabaseAdmin
        .rpc('is_user_eligible_for_reminder', { user_id: userId });

      if (eligError || !eligible) {
        results.push({ userId, status: 'skipped', reason: 'not eligible' });
        continue;
      }

      // 2. Obtener teléfono del usuario
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('user_profiles')
        .select('phone')
        .eq('user_id', userId)
        .single();

      if (profileError || !profile?.phone) {
        results.push({ userId, status: 'failed', reason: 'no phone' });
        // Registrar fallo en logs
        await supabaseAdmin
          .from('reminder_logs')
          .insert({
            user_id: userId,
            date: colombiaDate,
            status: 'failed',
            error: 'No phone number',
          });
        continue;
      }

      // 3. Mensaje personalizado (puedes hacerlo más divertido)
      const message = `🎯 ¡Hola! ¿Cómo va tu día? Recuerda que registrar tus gastos hoy te ayuda a mantener el control. Si ya lo hiciste, ¡felicitaciones! Si no, anota tus movimientos para que tu asistente FinancIA te dé el mejor consejo. 💸✨`;

      // 4. Enviar WhatsApp
      const { success, error: sendError } = await sendWhatsAppMessage(profile.phone, message);

      // 5. Registrar en logs
      const { error: logError } = await supabaseAdmin
        .from('reminder_logs')
        .insert({
          user_id: userId,
          date: colombiaDate,
          status: success ? 'sent' : 'failed',
          error: sendError || null,
        });

      if (logError) {
        console.error('Error logging reminder:', logError);
      }

      results.push({ userId, status: success ? 'sent' : 'failed', error: sendError });
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Batch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}