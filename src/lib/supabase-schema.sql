-- Enable RLS
alter table public.profiles enable row level security;
alter table public.auctions enable row level security;
alter table public.auction_items enable row level security;
alter table public.bids enable row level security;

-- Create tables
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  email text not null,
  full_name text,
  role text check (role in ('admin', 'seller', 'buyer')) not null default 'buyer',
  phone text,
  
  constraint profiles_email_key unique (email)
);

create table public.auctions (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  organizer_id uuid references public.profiles on delete cascade not null,
  title text not null,
  description text,
  start_date timestamp with time zone not null,
  end_date timestamp with time zone not null,
  status text check (status in ('draft', 'upcoming', 'active', 'ended')) not null default 'draft',
  contact_email text not null,
  contact_phone text not null,
  location text not null,
  terms_and_conditions text
);

create table public.auction_items (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  auction_id uuid references public.auctions on delete cascade not null,
  seller_id uuid references public.profiles on delete cascade not null,
  title text not null,
  description text,
  start_price decimal(10,2) not null check (start_price > 0),
  min_sell_price decimal(10,2) not null check (min_sell_price >= start_price),
  images text[] not null default '{}',
  weight decimal(5,2) not null,
  length decimal(5,2) not null,
  bloodline text,
  species text check (species in ('common', 'mirror', 'koi', 'leather')) not null,
  age text check (age in ('C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8', 'C9', 'C10')) not null,
  gender text check (gender in ('male', 'female')) not null,
  last_bid_at timestamp with time zone,
  highest_bid decimal(10,2)
);

create table public.bids (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  item_id uuid references public.auction_items on delete cascade not null,
  bidder_id uuid references public.profiles on delete cascade not null,
  amount decimal(10,2) not null check (amount > 0)
);

-- Create indexes
create index auctions_organizer_id_idx on public.auctions(organizer_id);
create index auctions_status_idx on public.auctions(status);
create index auction_items_auction_id_idx on public.auction_items(auction_id);
create index auction_items_seller_id_idx on public.auction_items(seller_id);
create index bids_item_id_idx on public.bids(item_id);
create index bids_bidder_id_idx on public.bids(bidder_id);

-- RLS Policies
create policy "Public profiles are viewable by everyone"
  on public.profiles for select
  using (true);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Active auctions are viewable by everyone"
  on public.auctions for select
  using (status in ('upcoming', 'active') or organizer_id = auth.uid());

create policy "Sellers and admins can create auctions"
  on public.auctions for insert
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('seller', 'admin')
    )
  );

create policy "Organizers can update their own auctions"
  on public.auctions for update
  using (organizer_id = auth.uid());

create policy "Auction items in active auctions are viewable by everyone"
  on public.auction_items for select
  using (
    exists (
      select 1 from public.auctions
      where id = auction_id and status in ('upcoming', 'active')
    )
    or seller_id = auth.uid()
  );

create policy "Sellers can create items in active auctions"
  on public.auction_items for insert
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('seller', 'admin')
    )
  );

create policy "Sellers can update their own items"
  on public.auction_items for update
  using (seller_id = auth.uid());

create policy "Bids are viewable by everyone"
  on public.bids for select
  using (true);

create policy "Authenticated users can place bids"
  on public.bids for insert
  with check (auth.uid() = bidder_id);

-- Functions
create or replace function update_highest_bid()
returns trigger as $$
begin
  update public.auction_items
  set highest_bid = (
    select max(amount)
    from public.bids
    where item_id = new.item_id
  )
  where id = new.item_id;
  
  return new;
end;
$$ language plpgsql security definer;

create or replace function extend_auction_on_bid()
returns trigger as $$
begin
  -- If bid is within last 3 minutes, extend auction by 3 minutes
  if exists (
    select 1 from public.auction_items i
    join public.auctions a on a.id = i.auction_id
    where i.id = new.item_id
    and a.end_date <= (now() + interval '3 minutes')
  ) then
    update public.auctions
    set end_date = end_date + interval '3 minutes'
    where id = (
      select auction_id from public.auction_items where id = new.item_id
    );
  end if;
  
  -- Update last_bid_at
  update public.auction_items
  set last_bid_at = now()
  where id = new.item_id;
  
  return new;
end;
$$ language plpgsql security definer;

-- Triggers
create trigger update_highest_bid_trigger
  after insert or update on public.bids
  for each row
  execute function update_highest_bid();

create trigger extend_auction_on_bid_trigger
  after insert on public.bids
  for each row
  execute function extend_auction_on_bid();