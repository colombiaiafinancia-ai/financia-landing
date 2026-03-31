import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { Client } from '@upstash/qstash';

const qstash = new Client({ token: process.env.QSTASH_TOKEN! });
const BATCH_SIZE = 50;
const BATCH_DELAY_SECONDS = 5;
const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: NextRequest) {
  // Autenticación: solo llamadas con el secreto (puede venir del cron o de una prueba manual)
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 1. Obtener usuarios elegibles
    const { data: users, error } = await supabaseAdmin
      .rpc('get_users_eligible_for_reminder', {p_user_id: '0f14813e-3cfb-4e44-8d00-b4993c43cc23'})
      .select('user_id');

    if (error) {
      console.error('Error fetching eligible users:', error);
      return NextResponse.json({ error: 'Error fetching users' }, { status: 500 });
    }

    if (!users?.length) {
      console.log('No eligible users today');
      return NextResponse.json({ message: 'No eligible users', count: 0 });
    }

    const userIds = users.map(u => u.user_id);
    const totalUsers = userIds.length;

    // 2. Dividir en lotes
    const batches = [];
    for (let i = 0; i < totalUsers; i += BATCH_SIZE) {
      batches.push(userIds.slice(i, i + BATCH_SIZE));
    }

    // 3. Encolar cada lote con delay progresivo
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL; // Ej: https://tu-dominio.vercel.app
    const batchPromises = batches.map((batch, index) => {
      const delaySeconds = index * BATCH_DELAY_SECONDS;
      return qstash.publishJSON({
        url: `${baseUrl}/api/reminder/batch`,
        body: { userIds: batch },
        delay: delaySeconds,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${CRON_SECRET}`,
        },
        // Reintentos: 2 veces con 60s de espera
        retries: 2,
        // Opcional: callback de estado para monitoreo
        // failureCallback: `${baseUrl}/api/reminder/failure`,
      });
    });

    await Promise.all(batchPromises);

    return NextResponse.json({
      message: `Triggered ${batches.length} batches for ${totalUsers} users`,
    });
  } catch (error) {
    console.error('Trigger error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}