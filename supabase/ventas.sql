-- Ventas y reembolsos para el CRM (crm.forjaia.com). Ya aplicada en Supabase (migración crm_ventas, 17/11/2026).
create table if not exists public.ventas (
  id bigint generated always as identity primary key,
  transaccion text not null,
  evento text not null,
  estado text not null check (estado in ('aprobada','anulada')),
  medio text not null default 'hotmart' check (medio in ('hotmart','mpago','manual')),
  email text, producto_id text, producto text,
  monto numeric(12,2), moneda text, monto_usd numeric(12,2), origen text,
  creado timestamptz not null default now(),
  unique (transaccion, estado)
);
alter table public.ventas enable row level security;
create index if not exists ventas_creado_idx on public.ventas (creado desc);
