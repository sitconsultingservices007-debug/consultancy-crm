-- Create your FIRST Super Admin (run once, after schema.sql)
-- 1. Supabase dashboard > Authentication > Users > Add user (email + password, tick "Auto confirm")
-- 2. Replace the email and name below, then run:
insert into public.users (id, name, email, role, status)
select id, 'Admin', email, 'super_admin', 'active'
from auth.users where email = 'amarlimkar007@gmail.com'
on conflict (id) do update set role = 'super_admin', status = 'active';

-- Also: Authentication > Providers > Email > turn OFF "Confirm email"
-- so users added from the Users page can sign in immediately.
