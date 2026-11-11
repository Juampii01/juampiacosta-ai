-- Ajustes que se cambian desde el Panel (sin tocar código). Solo la clave secreta del servidor lee y escribe.
-- «oferta»: la oferta por única vez para el plan gratis ({activa, desde, precio, antes, hotmart, mpago, pesos}).
create table if not exists public.ajustes (
  clave text primary key,
  valor jsonb not null default '{}'::jsonb,
  actualizado timestamptz not null default now()
);
alter table public.ajustes enable row level security;
