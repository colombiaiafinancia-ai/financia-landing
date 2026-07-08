create table if not exists public.recurring_expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  amount numeric(12, 2) not null check (amount > 0),
  category_id uuid not null references public.categories(id),
  merchant text,
  frequency text not null default 'monthly' check (frequency in ('weekly', 'monthly', 'yearly')),
  billing_day integer check (billing_day between 1 and 31),
  next_charge_date date not null,
  starts_at date not null default current_date,
  ends_at date,
  status text not null default 'active' check (status in ('active', 'paused', 'ended')),
  auto_create boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  ended_at timestamptz,
  constraint recurring_expenses_ended_status_check check (
    (status = 'ended' and ended_at is not null)
    or status <> 'ended'
  )
);

create index if not exists recurring_expenses_user_status_idx
  on public.recurring_expenses (user_id, status, next_charge_date);

create index if not exists recurring_expenses_category_idx
  on public.recurring_expenses (category_id);

alter table public.recurring_expenses enable row level security;

drop policy if exists "Users can view own recurring expenses" on public.recurring_expenses;
create policy "Users can view own recurring expenses"
  on public.recurring_expenses
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can create own recurring expenses" on public.recurring_expenses;
create policy "Users can create own recurring expenses"
  on public.recurring_expenses
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update own recurring expenses" on public.recurring_expenses;
create policy "Users can update own recurring expenses"
  on public.recurring_expenses
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete own recurring expenses" on public.recurring_expenses;
create policy "Users can delete own recurring expenses"
  on public.recurring_expenses
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

create or replace function public.set_recurring_expenses_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_recurring_expenses_updated_at on public.recurring_expenses;
create trigger set_recurring_expenses_updated_at
  before update on public.recurring_expenses
  for each row
  execute function public.set_recurring_expenses_updated_at();

