import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { Client } from '@upstash/qstash';

const qstash = new Client({ token: process.env.QSTASH_TOKEN! });
const BATCH_SIZE = 50;
const BATCH_DELAY_SECONDS = 5;
const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Construir URL base
    let baseUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!baseUrl && process.env.VERCEL_URL) {
      baseUrl = `https://${process.env.VERCEL_URL}`;
    }
    if (!baseUrl || (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://'))) {
      throw new Error(`Invalid baseUrl: ${baseUrl}`);
    }

    // Obtener todos los usuarios elegibles (sin filtrar por ID)
    const { data: users, error } = await supabaseAdmin
      .rpc('get_users_eligible_for_reminder'); // sin parámetro → todos los elegibles

    if (error) {
      console.error('Error fetching eligible users:', error);
      return NextResponse.json({ error: 'Error fetching users' }, { status: 500 });
    }

    if (!users || users.length === 0) {
      console.log('No eligible users today');
      return NextResponse.json({ message: 'No eligible users', count: 0 });
    }

    const userIds = users.map((u: any) => u.user_id);
    const totalUsers = userIds.length;

    // Dividir en lotes de BATCH_SIZE
    const batches = [];
    for (let i = 0; i < totalUsers; i += BATCH_SIZE) {
      batches.push(userIds.slice(i, i + BATCH_SIZE));
    }

    // Encolar cada lote con delay progresivo
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
        retries: 2,
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