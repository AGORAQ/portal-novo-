-- Extensões
create extension if not exists pgcrypto;

-- Enums
create type public.user_role as enum ('admin', 'supervisor', 'vendedor');
create type public.commission_group as enum ('master', 'ouro', 'prata', 'plus');
create type public.sale_status as enum ('Pendente', 'Pago', 'Cancelado');
create type public.finance_type as enum ('credito', 'debito');
create type public.finance_status as enum ('aberto', 'pago', 'cancelado');

-- Tabela de perfis
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text not null,
  role public.user_role not null default 'vendedor',
  commission_group public.commission_group not null default 'ouro',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.commission_tables (
  id uuid primary key default gen_random_uuid(),
  banco text not null,
  produto text not null,
  operacao text not null default '',
  codigo_tabela text not null default '',
  nome_tabela text not null,
  parcelas integer,
  comissao_total_empresa numeric(12,4) not null default 0,
  grupo_master numeric(12,4) not null default 0,
  grupo_ouro numeric(12,4) not null default 0,
  grupo_prata numeric(12,4) not null default 0,
  grupo_plus numeric(12,4) not null default 0,
  created_at timestamptz not null default now(),
  unique (banco, produto, codigo_tabela, nome_tabela)
);

create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  vendedor_id uuid not null references public.profiles(id),
  vendedor_nome text not null,
  cliente text not null,
  cpf text,
  phone text,
  proposal text,
  banco text not null,
  produto text not null,
  tabela_id uuid references public.commission_tables(id),
  tabela_nome text not null,
  parcelas integer,
  valor_venda numeric(14,2) not null default 0,
  percentual_empresa numeric(12,4) not null default 0,
  grupo_vendedor public.commission_group not null,
  percentual_vendedor numeric(12,4) not null default 0,
  valor_comissao_empresa numeric(14,2) not null default 0,
  valor_comissao_vendedor numeric(14,2) not null default 0,
  status public.sale_status not null default 'Pendente',
  data_venda date not null default current_date,
  created_at timestamptz not null default now()
);

create table if not exists public.finance_entries (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid references public.sales(id) on delete cascade,
  vendedor_id uuid not null references public.profiles(id),
  tipo public.finance_type not null,
  descricao text not null,
  valor numeric(14,2) not null default 0,
  status public.finance_status not null default 'aberto',
  referencia_data date not null default current_date,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
      and is_active = true
  );
$$;

create or replace function public.is_supervisor_or_admin()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role in ('admin', 'supervisor')
      and is_active = true
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role, commission_group, is_active)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'full_name', split_part(coalesce(new.email, ''), '@', 1)),
    coalesce((new.raw_user_meta_data->>'role')::public.user_role, 'vendedor'),
    coalesce((new.raw_user_meta_data->>'commission_group')::public.commission_group, 'ouro'),
    true
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = excluded.full_name,
        role = excluded.role,
        commission_group = excluded.commission_group,
        is_active = true;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.sync_finance_from_sale()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.finance_entries (
      sale_id,
      vendedor_id,
      tipo,
      descricao,
      valor,
      status,
      referencia_data
    )
    values (
      new.id,
      new.vendedor_id,
      'credito',
      'Comissão da venda - ' || new.cliente,
      new.valor_comissao_vendedor,
      case when new.status = 'Pago' then 'pago' when new.status = 'Cancelado' then 'cancelado' else 'aberto' end,
      new.data_venda
    );

    return new;
  end if;

  if tg_op = 'UPDATE' then
    update public.finance_entries
       set vendedor_id = new.vendedor_id,
           descricao = 'Comissão da venda - ' || new.cliente,
           valor = new.valor_comissao_vendedor,
           status = case when new.status = 'Pago' then 'pago' when new.status = 'Cancelado' then 'cancelado' else 'aberto' end,
           referencia_data = new.data_venda
     where sale_id = new.id;

    return new;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_sync_finance_from_sale_insert on public.sales;
create trigger trg_sync_finance_from_sale_insert
after insert on public.sales
for each row
execute function public.sync_finance_from_sale();

drop trigger if exists trg_sync_finance_from_sale_update on public.sales;
create trigger trg_sync_finance_from_sale_update
after update on public.sales
for each row
execute function public.sync_finance_from_sale();

create or replace view public.v_balances with (security_invoker = true) as
select
  p.id as vendedor_id,
  p.full_name,
  coalesce(sum(case when f.tipo = 'credito' and f.status <> 'cancelado' then f.valor else 0 end), 0) as total_creditos,
  coalesce(sum(case when f.tipo = 'debito' and f.status <> 'cancelado' then f.valor else 0 end), 0) as total_debitos,
  coalesce(sum(case when f.tipo = 'credito' and f.status <> 'cancelado' then f.valor else 0 end), 0)
    - coalesce(sum(case when f.tipo = 'debito' and f.status <> 'cancelado' then f.valor else 0 end), 0) as saldo_disponivel
from public.profiles p
left join public.finance_entries f on f.vendedor_id = p.id
where p.role in ('vendedor', 'supervisor')
group by p.id, p.full_name;

alter table public.profiles enable row level security;
alter table public.commission_tables enable row level security;
alter table public.sales enable row level security;
alter table public.finance_entries enable row level security;

-- policies: profiles
drop policy if exists "profiles_select_own_or_staff" on public.profiles;
create policy "profiles_select_own_or_staff"
on public.profiles for select
using (id = auth.uid() or public.is_supervisor_or_admin());

drop policy if exists "profiles_admin_insert" on public.profiles;
create policy "profiles_admin_insert"
on public.profiles for insert
with check (public.is_admin());

drop policy if exists "profiles_admin_update" on public.profiles;
create policy "profiles_admin_update"
on public.profiles for update
using (public.is_admin())
with check (public.is_admin());

-- policies: commission_tables
drop policy if exists "commission_tables_read_all_authenticated" on public.commission_tables;
create policy "commission_tables_read_all_authenticated"
on public.commission_tables for select
using (auth.role() = 'authenticated');

drop policy if exists "commission_tables_staff_write" on public.commission_tables;
create policy "commission_tables_staff_write"
on public.commission_tables for all
using (public.is_supervisor_or_admin())
with check (public.is_supervisor_or_admin());

-- policies: sales
drop policy if exists "sales_read_own_or_staff" on public.sales;
create policy "sales_read_own_or_staff"
on public.sales for select
using (vendedor_id = auth.uid() or public.is_supervisor_or_admin());

drop policy if exists "sales_insert_own_or_staff" on public.sales;
create policy "sales_insert_own_or_staff"
on public.sales for insert
with check (vendedor_id = auth.uid() or public.is_supervisor_or_admin());

drop policy if exists "sales_update_staff_or_own" on public.sales;
create policy "sales_update_staff_or_own"
on public.sales for update
using (vendedor_id = auth.uid() or public.is_supervisor_or_admin())
with check (vendedor_id = auth.uid() or public.is_supervisor_or_admin());

-- policies: finance_entries
drop policy if exists "finance_read_own_or_staff" on public.finance_entries;
create policy "finance_read_own_or_staff"
on public.finance_entries for select
using (vendedor_id = auth.uid() or public.is_supervisor_or_admin());

drop policy if exists "finance_admin_write" on public.finance_entries;
create policy "finance_admin_write"
on public.finance_entries for all
using (public.is_admin())
with check (public.is_admin());
