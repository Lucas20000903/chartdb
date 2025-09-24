-- ChartDB collaborative storage schema

create table if not exists public.diagrams (
    id text primary key,
    user_id uuid not null,
    name text not null,
    database_type text not null,
    database_edition text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.db_tables (
    id text primary key,
    diagram_id text not null references public.diagrams (id) on delete cascade,
    user_id uuid not null,
    payload jsonb not null,
    created_at timestamptz not null default now()
);

create index if not exists db_tables_diagram_id_idx on public.db_tables (diagram_id);

create table if not exists public.db_relationships (
    id text primary key,
    diagram_id text not null references public.diagrams (id) on delete cascade,
    user_id uuid not null,
    payload jsonb not null,
    created_at timestamptz not null default now()
);

create index if not exists db_relationships_diagram_id_idx
    on public.db_relationships (diagram_id);

create table if not exists public.db_dependencies (
    id text primary key,
    diagram_id text not null references public.diagrams (id) on delete cascade,
    user_id uuid not null,
    payload jsonb not null,
    created_at timestamptz not null default now()
);

create index if not exists db_dependencies_diagram_id_idx
    on public.db_dependencies (diagram_id);

create table if not exists public.areas (
    id text primary key,
    diagram_id text not null references public.diagrams (id) on delete cascade,
    user_id uuid not null,
    payload jsonb not null,
    created_at timestamptz not null default now()
);

create index if not exists areas_diagram_id_idx on public.areas (diagram_id);

create table if not exists public.db_custom_types (
    id text primary key,
    diagram_id text not null references public.diagrams (id) on delete cascade,
    user_id uuid not null,
    payload jsonb not null,
    created_at timestamptz not null default now()
);

create index if not exists db_custom_types_diagram_id_idx
    on public.db_custom_types (diagram_id);

create table if not exists public.user_configs (
    user_id uuid primary key,
    settings jsonb not null,
    updated_at timestamptz not null default now()
);

create table if not exists public.diagram_filters (
    diagram_id text not null references public.diagrams (id) on delete cascade,
    user_id uuid not null,
    filter jsonb not null,
    updated_at timestamptz not null default now(),
    primary key (diagram_id, user_id)
);

-- Recommended row level security policies
alter table public.diagrams enable row level security;
alter table public.db_tables enable row level security;
alter table public.db_relationships enable row level security;
alter table public.db_dependencies enable row level security;
alter table public.areas enable row level security;
alter table public.db_custom_types enable row level security;
alter table public.user_configs enable row level security;
alter table public.diagram_filters enable row level security;

create policy if not exists "Users can manage their diagrams"
    on public.diagrams
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create policy if not exists "Users can manage their tables"
    on public.db_tables
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create policy if not exists "Users can manage their relationships"
    on public.db_relationships
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create policy if not exists "Users can manage their dependencies"
    on public.db_dependencies
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create policy if not exists "Users can manage their areas"
    on public.areas
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create policy if not exists "Users can manage their custom types"
    on public.db_custom_types
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create policy if not exists "Users can manage their config"
    on public.user_configs
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create policy if not exists "Users can manage their diagram filters"
    on public.diagram_filters
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);
