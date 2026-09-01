begin;

create extension if not exists citext with schema extensions;
create extension if not exists pgcrypto with schema extensions;

create table public.reserved_usernames (
  username extensions.citext primary key,
  reason text not null default 'official'
);

insert into public.reserved_usernames (username) values
  ('admin'), ('support'), ('moon'), ('moonirl'), ('help'),
  ('security'), ('official'), ('staff'), ('moderator'), ('system');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username extensions.citext unique,
  display_name text not null default 'عضو تازه',
  avatar_url text,
  bio text not null default '',
  city text,
  status text,
  intent text,
  verified boolean not null default false,
  full_moon boolean not null default false,
  account_status text not null default 'active' check (account_status in ('active', 'suspended', 'deleting')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint username_shape check (username is null or username::text ~ '^[a-z][a-z0-9_]{2,19}$')
);

create table public.posts (
  id uuid primary key default extensions.gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null default 'text' check (kind in ('text', 'photo', 'story', 'event', 'life', 'journal')),
  body text not null default '',
  image_url text,
  location text,
  audience text not null default 'public' check (audience in ('public', 'followers', 'private')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index posts_author_created_idx on public.posts(author_id, created_at desc);
create index posts_public_created_idx on public.posts(created_at desc) where audience = 'public';

create table public.follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  constraint follows_not_self check (follower_id <> following_id)
);
create index follows_following_idx on public.follows(following_id, created_at desc);

create table public.ratings (
  rater_id uuid not null references public.profiles(id) on delete cascade,
  rated_id uuid not null references public.profiles(id) on delete cascade,
  score smallint not null check (score between 1 and 10),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (rater_id, rated_id),
  constraint ratings_not_self check (rater_id <> rated_id)
);

create table public.relationships (
  id uuid primary key default extensions.gen_random_uuid(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  partner_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'active', 'ended', 'declined')),
  started_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint relationships_not_self check (requester_id <> partner_id)
);
create unique index relationships_pair_active_idx
  on public.relationships (least(requester_id, partner_id), greatest(requester_id, partner_id))
  where status in ('pending', 'active');

create table public.conversations (
  id uuid primary key default extensions.gen_random_uuid(),
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.conversation_members (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  last_read_at timestamptz,
  primary key (conversation_id, user_id)
);
create index conversation_members_user_idx on public.conversation_members(user_id, joined_at desc);

create table public.messages (
  id uuid primary key default extensions.gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (length(body) between 1 and 4000),
  created_at timestamptz not null default now()
);
create index messages_conversation_created_idx on public.messages(conversation_id, created_at desc);

create table public.blocks (
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  constraint blocks_not_self check (blocker_id <> blocked_id)
);

create table public.reports (
  id uuid primary key default extensions.gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reported_user_id uuid references public.profiles(id) on delete set null,
  post_id uuid references public.posts(id) on delete set null,
  reason text not null,
  details text not null default '',
  status text not null default 'open' check (status in ('open', 'reviewing', 'resolved', 'dismissed')),
  created_at timestamptz not null default now(),
  constraint report_has_target check (reported_user_id is not null or post_id is not null)
);

create table public.todos (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (length(title) between 1 and 300),
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index todos_user_created_idx on public.todos(user_id, created_at desc);

create table public.journal_entries (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (length(body) between 1 and 20000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index journal_user_created_idx on public.journal_entries(user_id, created_at desc);

create table public.username_orders (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  username extensions.citext not null,
  price_stars integer not null default 150 check (price_stars = 150),
  status text not null default 'pending' check (status in ('pending', 'paid', 'claimed', 'refunded', 'expired', 'failed')),
  invoice_payload text not null unique,
  telegram_payment_charge_id text unique,
  provider_payment_charge_id text,
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  fulfilled_at timestamptz,
  constraint order_username_shape check (username::text ~ '^[a-z][a-z0-9_]{2,19}$')
);
create index username_orders_user_created_idx on public.username_orders(user_id, created_at desc);
create unique index username_orders_one_pending_idx on public.username_orders(user_id, username) where status = 'pending';

create table public.payment_events (
  id bigint generated always as identity primary key,
  telegram_update_id bigint unique,
  event_type text not null,
  order_id uuid references public.username_orders(id) on delete set null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger posts_set_updated_at before update on public.posts for each row execute function public.set_updated_at();
create trigger ratings_set_updated_at before update on public.ratings for each row execute function public.set_updated_at();
create trigger relationships_set_updated_at before update on public.relationships for each row execute function public.set_updated_at();
create trigger conversations_set_updated_at before update on public.conversations for each row execute function public.set_updated_at();
create trigger todos_set_updated_at before update on public.todos for each row execute function public.set_updated_at();
create trigger journal_set_updated_at before update on public.journal_entries for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), split_part(coalesce(new.email, 'عضو تازه'), '@', 1)),
    nullif(new.raw_user_meta_data ->> 'avatar_url', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.is_conversation_member(target_conversation uuid, target_user uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.conversation_members
    where conversation_id = target_conversation and user_id = target_user
  );
$$;

create or replace function public.quote_username(candidate text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  normalized text := lower(trim(candidate));
  current_username text;
  price integer;
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  select username::text into current_username from public.profiles where id = auth.uid();

  if normalized !~ '^[a-z][a-z0-9_]{2,19}$' then
    return jsonb_build_object('username', normalized, 'available', false, 'price_stars', 0, 'reason', 'invalid');
  end if;

  if exists (select 1 from public.reserved_usernames where username = normalized) then
    return jsonb_build_object('username', normalized, 'available', false, 'price_stars', 0, 'reason', 'reserved');
  end if;

  if exists (select 1 from public.profiles where username = normalized and id <> auth.uid()) then
    return jsonb_build_object('username', normalized, 'available', false, 'price_stars', 0, 'reason', 'taken');
  end if;

  if current_username = normalized then
    return jsonb_build_object('username', normalized, 'available', true, 'price_stars', 0, 'reason', 'free_first_id');
  end if;

  price := case when length(normalized) <= 4 or current_username is not null then 150 else 0 end;
  return jsonb_build_object(
    'username', normalized,
    'available', true,
    'price_stars', price,
    'reason', case when length(normalized) <= 4 then 'premium_short_id' when current_username is not null then 'paid_change' else 'free_first_id' end
  );
end;
$$;

create or replace function public.claim_username(candidate text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  quote jsonb;
  normalized text := lower(trim(candidate));
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  perform 1 from public.profiles where id = auth.uid() for update;
  quote := public.quote_username(normalized);
  if not (quote ->> 'available')::boolean then raise exception 'USERNAME_UNAVAILABLE'; end if;
  if (quote ->> 'price_stars')::integer <> 0 then raise exception 'PAYMENT_REQUIRED'; end if;

  update public.profiles set username = normalized where id = auth.uid();
  return jsonb_build_object('username', normalized);
exception when unique_violation then
  raise exception 'USERNAME_UNAVAILABLE';
end;
$$;

create or replace function public.fulfill_username_order(target_order uuid, charge_id text, provider_charge_id text default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  selected_order public.username_orders%rowtype;
begin
  select * into selected_order from public.username_orders where id = target_order for update;
  if not found then raise exception 'ORDER_NOT_FOUND'; end if;
  if selected_order.status in ('paid', 'claimed') then
    return jsonb_build_object('username', selected_order.username::text, 'status', selected_order.status);
  end if;
  if selected_order.status <> 'pending' then raise exception 'ORDER_NOT_PAYABLE'; end if;
  if exists (select 1 from public.reserved_usernames where username = selected_order.username) then raise exception 'USERNAME_RESERVED'; end if;
  if exists (select 1 from public.profiles where username = selected_order.username and id <> selected_order.user_id) then raise exception 'USERNAME_TAKEN'; end if;

  update public.profiles set username = selected_order.username where id = selected_order.user_id;
  update public.username_orders
    set status = 'claimed', telegram_payment_charge_id = charge_id,
        provider_payment_charge_id = provider_charge_id, paid_at = now(), fulfilled_at = now()
    where id = target_order;
  return jsonb_build_object('username', selected_order.username::text, 'status', 'claimed');
exception when unique_violation then
  raise exception 'USERNAME_TAKEN';
end;
$$;

revoke all on function public.set_updated_at() from public, anon, authenticated;
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.is_conversation_member(uuid, uuid) from public, anon;
revoke all on function public.quote_username(text) from public, anon;
revoke all on function public.claim_username(text) from public, anon;
revoke all on function public.fulfill_username_order(uuid, text, text) from public, anon, authenticated;
grant execute on function public.is_conversation_member(uuid, uuid) to authenticated;
grant execute on function public.quote_username(text) to authenticated;
grant execute on function public.claim_username(text) to authenticated;
grant execute on function public.fulfill_username_order(uuid, text, text) to service_role;

alter table public.reserved_usernames enable row level security;
alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.follows enable row level security;
alter table public.ratings enable row level security;
alter table public.relationships enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;
alter table public.blocks enable row level security;
alter table public.reports enable row level security;
alter table public.todos enable row level security;
alter table public.journal_entries enable row level security;
alter table public.username_orders enable row level security;
alter table public.payment_events enable row level security;

create policy profiles_read_active on public.profiles for select using (account_status = 'active' or id = auth.uid());
create policy profiles_update_self on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());

create policy posts_read_visible on public.posts for select using (
  author_id = auth.uid() or audience = 'public' or (
    audience = 'followers' and exists (
      select 1 from public.follows where follower_id = auth.uid() and following_id = author_id
    )
  )
);
create policy posts_insert_self on public.posts for insert with check (author_id = auth.uid());
create policy posts_update_self on public.posts for update using (author_id = auth.uid()) with check (author_id = auth.uid());
create policy posts_delete_self on public.posts for delete using (author_id = auth.uid());

create policy follows_read on public.follows for select using (true);
create policy follows_insert_self on public.follows for insert with check (follower_id = auth.uid());
create policy follows_delete_self on public.follows for delete using (follower_id = auth.uid());

create policy ratings_read_involved on public.ratings for select using (rater_id = auth.uid() or rated_id = auth.uid());
create policy ratings_insert_self on public.ratings for insert with check (rater_id = auth.uid());
create policy ratings_update_self on public.ratings for update using (rater_id = auth.uid()) with check (rater_id = auth.uid());
create policy ratings_delete_self on public.ratings for delete using (rater_id = auth.uid());

create policy relationships_read_involved on public.relationships for select using (auth.uid() in (requester_id, partner_id));
create policy relationships_insert_self on public.relationships for insert with check (requester_id = auth.uid());
create policy relationships_update_involved on public.relationships for update using (auth.uid() in (requester_id, partner_id)) with check (auth.uid() in (requester_id, partner_id));
create policy relationships_delete_involved on public.relationships for delete using (auth.uid() in (requester_id, partner_id));

create policy conversations_read_member on public.conversations for select using (public.is_conversation_member(id));
create policy conversations_insert_self on public.conversations for insert with check (created_by = auth.uid());
create policy conversations_update_member on public.conversations for update using (public.is_conversation_member(id));
create policy conversation_members_read_member on public.conversation_members for select using (public.is_conversation_member(conversation_id));
create policy conversation_members_insert_creator on public.conversation_members for insert with check (
  exists (select 1 from public.conversations where id = conversation_id and created_by = auth.uid())
);
create policy conversation_members_delete_self on public.conversation_members for delete using (user_id = auth.uid());
create policy messages_read_member on public.messages for select using (public.is_conversation_member(conversation_id));
create policy messages_insert_member on public.messages for insert with check (sender_id = auth.uid() and public.is_conversation_member(conversation_id));

create policy blocks_read_self on public.blocks for select using (blocker_id = auth.uid());
create policy blocks_insert_self on public.blocks for insert with check (blocker_id = auth.uid());
create policy blocks_delete_self on public.blocks for delete using (blocker_id = auth.uid());
create policy reports_read_self on public.reports for select using (reporter_id = auth.uid());
create policy reports_insert_self on public.reports for insert with check (reporter_id = auth.uid());

create policy todos_self on public.todos for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy journal_self on public.journal_entries for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy username_orders_read_self on public.username_orders for select using (user_id = auth.uid());

revoke all on all tables in schema public from anon, authenticated;
grant select on public.profiles, public.posts, public.follows to anon, authenticated;
grant update (display_name, avatar_url, bio, city, status, intent) on public.profiles to authenticated;
grant insert, update, delete on public.posts to authenticated;
grant insert, delete on public.follows to authenticated;
grant select, insert, update, delete on public.ratings, public.relationships to authenticated;
grant select, insert, update on public.conversations to authenticated;
grant select, insert, delete on public.conversation_members to authenticated;
grant select, insert on public.messages to authenticated;
grant select, insert, delete on public.blocks to authenticated;
grant select, insert on public.reports to authenticated;
grant select, insert, update, delete on public.todos, public.journal_entries to authenticated;
grant select on public.username_orders to authenticated;
grant all on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;

commit;
