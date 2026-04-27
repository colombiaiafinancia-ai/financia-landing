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
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { userIds, force = false } = await request.json();
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: 'Invalid user list' }, { status: 400 });
    }

    const colombiaDate = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });
    const results: ResultItem[] = [];

    for (const userId of userIds.filter(Boolean)) {
      let eligible = false;
      let eligError = null;

      if (!force) {
        const { data, error } = await supabaseAdmin
          .rpc('get_users_eligible_for_reminder', { p_user_id: userId });
        eligible = Array.isArray(data) && data.length > 0;
        eligError = error;
      } else {
        eligible = true;
      }

      if (eligError || !eligible) {
        results.push({
          userId,
          status: 'skipped',
          reason: eligError ? eligError.message : 'not eligible',
        });
        continue;
      }

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

      // Envía la plantilla (sin mensaje de texto)
      const { success, error: sendError } = await sendWhatsAppMessage(profile.phone);

      await supabaseAdmin
        .from('reminder_logs')
        .insert({
          user_id: userId,
          date: colombiaDate,
          status: success ? 'sent' : 'failed',
          error: sendError || null,
        });

      results.push({ userId, status: success ? 'sent' : 'failed', error: sendError });
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Batch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
