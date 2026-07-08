import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import {
  buildRecurringTransactionMeta,
  getNextChargeDate,
  getPeriodKey,
  type RecurringFrequency,
} from '@/lib/recurring-expenses'

const CRON_SECRET = process.env.CRON_SECRET
const MAX_CATCH_UP_CHARGES = 12

interface RecurringExpenseRow {
  id: string
  user_id: string
  name: string
  amount: number
  category_id: string
  merchant: string | null
  frequency: RecurringFrequency
  billing_day: number | null
  next_charge_date: string
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const todayKey = new Date().toLocaleDateString('en-CA', {
    timeZone: 'America/Bogota',
  })

  try {
    const { data: dueItems, error } = await supabaseAdmin
      .from('recurring_expenses')
      .select('id,user_id,name,amount,category_id,merchant,frequency,billing_day,next_charge_date')
      .eq('status', 'active')
      .eq('auto_create', true)
      .lte('next_charge_date', todayKey)

    if (error) {
      console.error('Error fetching recurring expenses:', error)
      return NextResponse.json({ error: 'Error fetching recurring expenses' }, { status: 500 })
    }

    const results = []

    for (const item of (dueItems || []) as RecurringExpenseRow[]) {
      let chargeDateKey = item.next_charge_date
      let nextChargeDate = chargeDateKey
      let created = 0
      let skipped = 0
      let guard = 0

      while (chargeDateKey <= todayKey && guard < MAX_CATCH_UP_CHARGES) {
        const period = getPeriodKey(chargeDateKey, item.frequency)
        const meta = buildRecurringTransactionMeta(item.id, period, item.frequency)

        const { data: existing, error: existingError } = await supabaseAdmin
          .from('transactions')
          .select('id')
          .eq('user_id', item.user_id)
          .contains('meta', {
            type: 'recurring_expense',
            recurring_expense_id: item.id,
            period,
          })
          .limit(1)

        if (existingError) {
          console.error('Error checking recurring duplicate:', existingError)
          skipped += 1
        } else if (existing && existing.length > 0) {
          skipped += 1
        } else {
          const { error: insertError } = await supabaseAdmin
            .from('transactions')
            .insert({
              user_id: item.user_id,
              occurred_at: `${chargeDateKey}T12:00:00.000Z`,
              direction: 'gasto',
              status: 'confirmada',
              amount: item.amount,
              category_id: item.category_id,
              description: `Gasto fijo: ${item.name}`,
              merchant: item.merchant || item.name,
              meta,
            })

          if (insertError) {
            console.error('Error creating recurring transaction:', insertError)
            skipped += 1
          } else {
            created += 1
          }
        }

        nextChargeDate = getNextChargeDate(
          chargeDateKey,
          item.frequency,
          item.billing_day
        )
        chargeDateKey = nextChargeDate
        guard += 1
      }

      const { error: updateError } = await supabaseAdmin
        .from('recurring_expenses')
        .update({ next_charge_date: nextChargeDate })
        .eq('id', item.id)

      if (updateError) {
        console.error('Error updating recurring next charge:', updateError)
      }

      results.push({
        recurringExpenseId: item.id,
        created,
        skipped,
        nextChargeDate,
      })
    }

    return NextResponse.json({
      processed: results.length,
      created: results.reduce((sum, item) => sum + item.created, 0),
      skipped: results.reduce((sum, item) => sum + item.skipped, 0),
      results,
    })
  } catch (error) {
    console.error('Recurring expenses process error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

