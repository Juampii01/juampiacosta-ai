-- Tabla de registros del plan gratis de juampiacosta.ai.
-- Correr una sola vez en Supabase: SQL Editor -> New query -> pegar -> Run.
-- La web escribe con la clave secreta (service_role) desde api/registro.js, en el servidor.
-- Nadie más puede leer ni escribir: RLS activado y sin políticas para anon/authenticated.

create table if not exists public.registros (
  id           bigint generated always as identity primary key,
  email        text not null unique check (email = lower(email) and length(email) <= 254),
  nombre       text check (length(nombre) <= 80),
  origen       text not null default 'web',
  utm_source   text,
  utm_medium   text,
  utm_campaign text,
  utm_content  text,
  creado       timestamptz not null default now(),
  compro       boolean not null default false,  -- marcalo a mano (o desde tu cobro) cuando pase a pago
  baja         boolean not null default false   -- si pide no recibir más mails
);

alter table public.registros enable row level security;

create index if not exists registros_creado_idx on public.registros (creado desc);

-- Formulario de bienvenida (web/bienvenida.js -> api/perfil.js), agregado nov-2026
alter table public.registros
  add column if not exists whatsapp  text check (length(whatsapp) <= 25),
  add column if not exists pais      text check (length(pais) <= 40),
  add column if not exists situacion text check (length(situacion) <= 60),
  add column if not exists rubro     text check (length(rubro) <= 80),
  add column if not exists nivel     text check (length(nivel) <= 60),
  add column if not exists objetivo  text check (length(objetivo) <= 60),
  add column if not exists inversion text check (length(inversion) <= 60),
  add column if not exists perfil_completo boolean not null default false,
  add column if not exists actualizado timestamptz;

-- Opiniones de la biblioteca (sección «Tu opinión», api/opinion.js). Solo escribe el servidor.
create table if not exists public.opiniones (
  id bigint generated always as identity primary key,
  email text, nivel text,
  nota smallint check (nota between 1 and 5),
  gusta text, mejorar text, sobra text, falta text, vista text,
  creado timestamptz not null default now()
);
alter table public.opiniones enable row level security;
grant insert, select on public.opiniones to service_role;
