-- Run in Supabase: SQL Editor > New query > Run
create extension if not exists "pgcrypto";

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null unique,
  role text not null default 'staff' check (role in ('super_admin','staff')),
  status text not null default 'active' check (status in ('active','disabled')),
  created_at timestamptz default now()
);

create table public.candidates (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text, email text, location text,
  preferred_locations text[] default '{}',
  degree text, stream text, passout_year int,
  previous_companies text[] default '{}',
  current_company text, current_job_role text,
  total_experience numeric(4,1),
  pf_available boolean default false,
  skills text[] default '{}',
  notice_period text,
  current_ctc numeric, expected_ctc numeric,
  registration_status text default 'Registered',
  cv_url text,
  created_at timestamptz default now()
);

create table public.candidate_services (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidates(id) on delete cascade,
  service_type text not null check (service_type in ('Registration Fee','Company Documentation Fee','Interview Support Fee')),
  total_amount numeric not null default 0,
  paid_amount numeric not null default 0,
  balance_amount numeric generated always as (total_amount - paid_amount) stored,
  unique (candidate_id, service_type)
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid references public.candidates(id) on delete set null,
  transaction_type text not null check (transaction_type in ('income','expense')),
  category text not null,
  amount numeric not null check (amount > 0),
  payment_method text,
  notes text,
  txn_date date not null default current_date,
  created_by uuid references public.users(id),
  created_at timestamptz default now()
);

create table public.reminders (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid references public.candidates(id) on delete cascade,
  title text not null,
  reminder_date date not null,
  expected_amount numeric default 0,
  notes text,
  status text not null default 'Pending' check (status in ('Pending','Completed','Overdue'))
);

-- Role helpers
create or replace function public.is_admin() returns boolean language sql stable security definer as $$
  select exists (select 1 from public.users where id = auth.uid() and role = 'super_admin' and status = 'active');
$$;
create or replace function public.is_active_user() returns boolean language sql stable security definer as $$
  select exists (select 1 from public.users where id = auth.uid() and status = 'active');
$$;

-- Row Level Security
alter table public.users enable row level security;
alter table public.candidates enable row level security;
alter table public.candidate_services enable row level security;
alter table public.transactions enable row level security;
alter table public.reminders enable row level security;

create policy "users read self or admin" on public.users for select using (id = auth.uid() or public.is_admin());
create policy "users admin write" on public.users for all using (public.is_admin()) with check (public.is_admin());

create policy "candidates all active" on public.candidates for all using (public.is_active_user()) with check (public.is_active_user());
create policy "services all active" on public.candidate_services for all using (public.is_active_user()) with check (public.is_active_user());
create policy "reminders all active" on public.reminders for all using (public.is_active_user()) with check (public.is_active_user());

-- Staff can read and insert transactions; only admin can edit or delete
create policy "txn read" on public.transactions for select using (public.is_active_user());
create policy "txn insert" on public.transactions for insert with check (public.is_active_user());
create policy "txn update admin" on public.transactions for update using (public.is_admin());
create policy "txn delete admin" on public.transactions for delete using (public.is_admin());

-- CV storage bucket (private)
insert into storage.buckets (id, name, public) values ('cvs','cvs',false) on conflict do nothing;
create policy "cv active users" on storage.objects for all
  using (bucket_id = 'cvs' and public.is_active_user()) with check (bucket_id = 'cvs' and public.is_active_user());
