-- Índices para las consultas que hace el dashboard en cada carga.
-- Todos son idempotentes (`if not exists`); si ya existe uno equivalente, no hace nada.

-- Lista de transacciones del usuario ordenada por fecha y resumen del mes actual
create index if not exists transactions_user_occurred_at_idx
  on public.transactions (user_id, occurred_at desc);

-- Categorías visibles para el usuario (globales + propias, activas)
create index if not exists categories_user_active_idx
  on public.categories (user_id)
  where is_active;

-- Presupuestos por usuario
create index if not exists category_budgets_user_idx
  on public.category_budgets (user_id);
