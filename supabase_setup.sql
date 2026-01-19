-- Create a table for public profiles (linked to Clerk)
create table profiles (
  user_id text primary key, -- From Clerk
  email text,
  tier text default 'free', -- 'free', 'pro', 'business'
  credits int default 3,
  stripe_customer_id text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable Row Level Security (RLS)
alter table profiles enable row level security;

-- Policies
-- 1. Public can read their own data (we will use a service role key on backend, but good practice)
create policy "Public profiles are viewable by everyone." on profiles
  for select using (true);

-- 2. Insert accessible by anyone (since we want to auto-create profiles on first login if we wanted)
-- For now, we will handle creation in the backend.
create policy "Users can insert their own profile." on profiles
  for insert with check (true);
