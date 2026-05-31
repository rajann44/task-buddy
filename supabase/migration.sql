-- ============================================================================
-- SUPABASE MIGRATION AND DATABASE SCHEMA FOR TASKBUDDY
-- ============================================================================

-- ─── 1. CUSTOM TYPES & ENUMS ────────────────────────────────────────────────
create type public.user_role as enum ('client', 'cotasker', 'admin');
create type public.cotasker_status as enum ('none', 'pending', 'approved', 'rejected');
create type public.task_status as enum ('open', 'receiving_offers', 'assigned', 'in_progress', 'completed', 'cancelled');
create type public.moderation_status as enum ('approved', 'pending', 'rejected');
create type public.offer_status as enum ('pending', 'accepted', 'rejected', 'withdrawn');
create type public.payment_status as enum ('pending', 'reserved', 'released', 'refunded');

-- ─── 2. CORE TABLES ─────────────────────────────────────────────────────────

-- Users profile (synchronized with auth.users)
create table public.users (
  id uuid references auth.users on delete cascade primary key,
  email text not null unique,
  role public.user_role not null default 'client',
  name text not null,
  avatar_url text,
  co_tasker_status public.cotasker_status not null default 'none',
  is_disabled boolean not null default false,
  created_at timestamp with time zone not null default timezone('utc'::text, now())
);

-- Client profiles details
create table public.client_profiles (
  user_id uuid references public.users on delete cascade primary key,
  bio text,
  location text not null,
  is_verified boolean not null default false,
  created_at timestamp with time zone not null default timezone('utc'::text, now())
);

-- Co-tasker profile details (handyman listings, qualifications, portfolio)
create table public.cotasker_profiles (
  user_id uuid references public.users on delete cascade primary key,
  bio text not null,
  skills jsonb not null default '[]'::jsonb,
  categories jsonb not null default '[]'::jsonb,
  location text not null,
  rating numeric(3,2) not null default 5.00 check (rating >= 1.00 and rating <= 5.00),
  review_count integer not null default 0,
  completed_jobs integer not null default 0,
  response_time text not null default '< 1 hour',
  availability text not null,
  hourly_rate numeric(10,2),
  qualifications jsonb not null default '[]'::jsonb,
  languages jsonb not null default '[]'::jsonb,
  transport text,
  portfolio jsonb not null default '[]'::jsonb,
  created_at timestamp with time zone not null default timezone('utc'::text, now())
);

-- Task advertisements
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  category text not null,
  location text not null,
  address text not null,
  date date not null,
  time text,
  budget_type text not null check (budget_type in ('fixed', 'hourly', 'open_to_offers')),
  budget numeric(10,2),
  images jsonb not null default '[]'::jsonb,
  must_haves jsonb not null default '[]'::jsonb,
  client_id uuid not null references public.users(id) on delete cascade,
  assigned_cotasker_id uuid references public.users(id) on delete set null,
  status public.task_status not null default 'open',
  moderation_status public.moderation_status not null default 'pending',
  created_at timestamp with time zone not null default timezone('utc'::text, now())
);

-- Job offers submitted by co-taskers
create table public.offers (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  cotasker_id uuid not null references public.users(id) on delete cascade,
  price numeric(10,2) not null,
  message text not null,
  estimated_hours integer not null,
  status public.offer_status not null default 'pending',
  created_at timestamp with time zone not null default timezone('utc'::text, now())
);

-- Reviews and ratings between members
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  from_user_id uuid not null references public.users(id) on delete cascade,
  to_user_id uuid not null references public.users(id) on delete cascade,
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text not null,
  created_at timestamp with time zone not null default timezone('utc'::text, now())
);

-- System notifications for events
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  type text not null,
  title text not null,
  message text not null,
  is_read boolean not null default false,
  link_to text,
  created_at timestamp with time zone not null default timezone('utc'::text, now())
);

-- Escrow wallet transactions
create table public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  client_id uuid not null references public.users(id) on delete cascade,
  cotasker_id uuid references public.users(id) on delete set null,
  amount numeric(10,2) not null,
  status public.payment_status not null default 'pending',
  created_at timestamp with time zone not null default timezone('utc'::text, now())
);

-- Messages conversations meta
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  participant_ids jsonb not null default '[]'::jsonb, -- Array of user UUIDs
  last_message text,
  last_message_at timestamp with time zone not null default timezone('utc'::text, now()),
  unread_count integer not null default 0,
  task_id uuid references public.tasks(id) on delete cascade
);

-- Direct private inquiries before offer placement
create table public.chat_requests (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  sender_id uuid not null references public.users(id) on delete cascade,
  receiver_id uuid not null references public.users(id) on delete cascade,
  question text not null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamp with time zone not null default timezone('utc'::text, now())
);

-- Chat messages stream
create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.users(id) on delete cascade,
  text text not null,
  created_at timestamp with time zone not null default timezone('utc'::text, now())
);

-- ─── 3. INDEXES FOR PERFORMANCE & EFFICIENCY ────────────────────────────────
create index idx_tasks_moderation_status on public.tasks(moderation_status);
create index idx_tasks_client_id on public.tasks(client_id);
create index idx_offers_task_id on public.offers(task_id);
create index idx_offers_cotasker_id on public.offers(cotasker_id);
create index idx_chat_messages_conversation_id on public.chat_messages(conversation_id);
create index idx_notifications_user_id_unread on public.notifications(user_id) where is_read = false;

-- ─── 4. AUTOMATIC SIGNUP PROFILE CREATION TRIGGER ────────────────────────────
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, role, name, co_tasker_status, is_disabled)
  values (
    new.id,
    new.email,
    'client',
    coalesce(new.raw_user_meta_data->>'name', 'New Member'),
    'none',
    false
  );
  
  -- Create a default blank client profile as well
  insert into public.client_profiles (user_id, location)
  values (new.id, 'Berlin');

  return new;
end;
$$ language plpgsql security definer;

-- Trigger execution
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── 5. ROW LEVEL SECURITY (RLS) POLICIES ───────────────────────────────────

-- Enable RLS
alter table public.users enable row level security;
alter table public.client_profiles enable row level security;
alter table public.cotasker_profiles enable row level security;
alter table public.tasks enable row level security;
alter table public.offers enable row level security;
alter table public.reviews enable row level security;
alter table public.notifications enable row level security;
alter table public.wallet_transactions enable row level security;
alter table public.conversations enable row level security;
alter table public.chat_requests enable row level security;
alter table public.chat_messages enable row level security;

-- Users policies
create policy "Allow public profiles read access" on public.users 
  for select using (true);
create policy "Allow users to update own profile or admins to manage" on public.users 
  for update using (
    auth.uid() = id
    or exists (
      select 1 from public.users 
      where id = auth.uid() and role = 'admin'
    )
  );

-- Client Profiles policies
create policy "Allow read access to client profiles" on public.client_profiles 
  for select using (true);
create policy "Allow clients to manage own profile" on public.client_profiles 
  for all using (auth.uid() = user_id);

-- Co-tasker Profiles policies
create policy "Allow read access to co-tasker profiles" on public.cotasker_profiles 
  for select using (true);
create policy "Allow co-taskers to manage own profile" on public.cotasker_profiles 
  for all using (auth.uid() = user_id);

-- Tasks policies
create policy "Allow read access to approved tasks, owners, and admins" on public.tasks 
  for select using (
    moderation_status = 'approved' 
    or auth.uid() = client_id
    or exists (
      select 1 from public.users 
      where id = auth.uid() and role = 'admin'
    )
  );
create policy "Allow authenticated users to create tasks" on public.tasks 
  for insert with check (auth.uid() = client_id);
create policy "Allow clients and admins to update tasks" on public.tasks 
  for update using (
    auth.uid() = client_id
    or exists (
      select 1 from public.users 
      where id = auth.uid() and role = 'admin'
    )
  );
create policy "Allow clients and admins to delete tasks" on public.tasks 
  for delete using (
    auth.uid() = client_id
    or exists (
      select 1 from public.users 
      where id = auth.uid() and role = 'admin'
    )
  );

-- Offers policies
create policy "Allow read access to offers for clients and applicants" on public.offers 
  for select using (
    auth.uid() = cotasker_id or 
    exists (select 1 from public.tasks where id = task_id and client_id = auth.uid())
  );
create policy "Allow co-taskers to make offers" on public.offers 
  for insert with check (auth.uid() = cotasker_id);
create policy "Allow co-taskers to update own offers" on public.offers 
  for update using (auth.uid() = cotasker_id);

-- Notifications policies
create policy "Allow private notifications read and update" on public.notifications 
  for select, update, delete using (auth.uid() = user_id);

create policy "Allow authenticated users to create notifications" on public.notifications
  for insert with check (auth.role() = 'authenticated');

-- Chat messages policies
create policy "Allow message access to conversation participants" on public.chat_messages 
  for all using (
    exists (
      select 1 from public.conversations 
      where id = conversation_id 
      and participant_ids @> jsonb_build_array(auth.uid()::text)
    )
  );

-- Conversations policies
create policy "Allow conversation access to participants" on public.conversations
  for all using (participant_ids @> jsonb_build_array(auth.uid()::text));

create policy "Allow authenticated users to start conversations" on public.conversations
  for insert with check (auth.role() = 'authenticated');

-- Chat requests policies
create policy "Allow chat request access to sender and receiver" on public.chat_requests
  for all using (auth.uid() = sender_id or auth.uid() = receiver_id);

create policy "Allow authenticated users to create chat requests" on public.chat_requests
  for insert with check (auth.role() = 'authenticated');

-- Reviews policies
create policy "Allow public read access to reviews" on public.reviews
  for select using (true);

create policy "Allow users to create reviews from themselves" on public.reviews
  for insert with check (auth.uid() = from_user_id);

-- Wallet transactions policies
create policy "Allow wallet transaction access to client and cotasker" on public.wallet_transactions
  for all using (auth.uid() = client_id or auth.uid() = cotasker_id);

create policy "Allow client to create wallet transactions" on public.wallet_transactions
  for insert with check (auth.role() = 'authenticated');

-- ─── 6. SCHEMA PRIVILEGES GRANTS ─────────────────────────────────────────────
-- Grant schema usage and basic permissions to API roles (anon and authenticated)
grant usage on schema public to postgres, anon, authenticated, service_role;

grant select, insert, update, delete on all tables in schema public to postgres, anon, authenticated, service_role;
grant usage, select on all sequences in schema public to postgres, anon, authenticated, service_role;
grant execute on all functions in schema public to postgres, anon, authenticated, service_role;

-- Ensure default privileges apply to future tables/sequences/functions as well
alter default privileges in schema public grant select, insert, update, delete on tables to postgres, anon, authenticated, service_role;
alter default privileges in schema public grant usage, select on sequences to postgres, anon, authenticated, service_role;
alter default privileges in schema public grant execute on functions to postgres, anon, authenticated, service_role;

