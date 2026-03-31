import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { sendWhatsAppMessage } from '@/lib/whatsapp';

const CRON_SECRET = process.env.CRON_SECRET;

interface ResultItem {
  userId: string;
  status: 'sent' | 'skipped' | 'failed';
  reason?: string;
  error?: string;
}

export async function POST(request: NextRequest) {
  // Verificar autorización
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { userIds, force = false } = await request.json(); // fuerza opcional para pruebas
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: 'Invalid user list' }, { status: 400 });
    }

    const colombiaDate = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });
    const results: ResultItem[] = [];

    for (const userId of userIds) {
      // ========== LOGS para depurar ==========

      // 1. Revalidar elegibilidad (a menos que se fuerce)
      let eligible = false;
      let eligError = null;

      if (!force) {
        const { data, error } = await supabaseAdmin
          .rpc('is_user_eligible_for_reminder', { user_id: userId });
        eligible = data === true;
        eligError = error;
      } else {
        eligible = true;
      }

      if (eligError || !eligible) {
        results.push({ userId, status: 'skipped', reason: 'not eligible' });
        continue;
      }

      // 2. Obtener teléfono
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('user_profiles')
        .select('phone')
        .eq('user_id', userId)
        .single();

      if (profileError || !profile?.phone) {
        results.push({ userId, status: 'failed', reason: 'no phone' });
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

      // 3. Mensaje
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