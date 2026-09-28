-- Run once in your Supabase project's SQL Editor. Safe to rerun.
-- Authentication is managed by Supabase; no passwords are stored in these tables.
begin;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null check (length(name) between 1 and 80),
  role text not null default 'customer' check (role in ('customer', 'owner'))
);
create table if not exists public.cars (
  id text primary key, name text not null, category text not null,
  seats integer not null, transmission text not null, fuel text not null,
  price integer not null check (price > 0), color text not null, description text not null
);
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  car_id text not null references public.cars(id),
  pickup text not null check (pickup in ('Kathmandu','Pokhara','Chitwan')),
  start_date date not null, end_date date not null,
  days integer not null check (days between 1 and 30),
  daily_rate integer not null check (daily_rate > 0),
  total integer not null check (total = days * daily_rate),
  status text not null default 'Confirmed' check (status in ('Confirmed','Cancelled')),
  created_at timestamptz not null default now(),
  check (end_date - start_date = days)
);
create index if not exists bookings_customer on public.bookings(user_id);
create index if not exists bookings_availability on public.bookings(car_id, status, start_date, end_date);

alter table public.profiles enable row level security;
alter table public.cars enable row level security;
alter table public.bookings enable row level security;
revoke all on public.profiles, public.cars, public.bookings from anon, authenticated;
grant select on public.cars to anon, authenticated;
grant select on public.profiles, public.bookings to authenticated;
drop policy if exists read_fleet on public.cars;
create policy read_fleet on public.cars for select to anon, authenticated using (true);
drop policy if exists read_own_profile on public.profiles;
create policy read_own_profile on public.profiles for select to authenticated using (id = (select auth.uid()));
drop policy if exists read_own_bookings on public.bookings;
create policy read_own_bookings on public.bookings for select to authenticated using (user_id = (select auth.uid()));
-- There are deliberately no client INSERT/UPDATE/DELETE policies or grants.

create or replace function public.rental_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(id,name,role) values
    (new.id, coalesce(nullif(left(trim(new.raw_user_meta_data->>'name'),80),''),'Customer'), 'customer');
  return new;
end;
$$;
revoke all on function public.rental_new_user() from public, anon, authenticated;
drop trigger if exists rental_profile_created on auth.users;
create trigger rental_profile_created after insert on auth.users
for each row execute function public.rental_new_user();
insert into public.profiles(id,name,role)
select id, coalesce(nullif(left(trim(raw_user_meta_data->>'name'),80),''),'Customer'), 'customer'
from auth.users on conflict (id) do nothing;

create or replace function public.rental_check_dates(p_start date, p_end date) returns void
language plpgsql set search_path = '' as $$
begin
  if p_start is null or p_end is null then raise exception 'Choose valid pickup and return dates.'; end if;
  if p_start < (now() at time zone 'Asia/Kathmandu')::date then raise exception 'Pickup cannot be in the past.'; end if;
  if p_end-p_start < 1 or p_end-p_start > 30 then raise exception 'Rentals must be between 1 and 30 days.'; end if;
end;
$$;
revoke all on function public.rental_check_dates(date,date) from public, anon, authenticated;

create or replace function public.rental_fleet(p_start date default null, p_end date default null) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare result jsonb;
begin
  if p_start is not null or p_end is not null then perform public.rental_check_dates(p_start,p_end); end if;
  select coalesce(jsonb_agg(to_jsonb(c) || jsonb_build_object('available',
    case when p_start is null then null else not exists (
      select 1 from public.bookings b where b.car_id=c.id and b.status='Confirmed'
      and b.start_date<p_end and b.end_date>p_start
    ) end) order by c.price, c.id), '[]'::jsonb) into result from public.cars c;
  return jsonb_build_object('cars',result,'locations',jsonb_build_array('Kathmandu','Pokhara','Chitwan'));
end;
$$;
revoke all on function public.rental_fleet(date,date) from public;
grant execute on function public.rental_fleet(date,date) to anon, authenticated;

create or replace function public.rental_book(p_car_id text, p_pickup text, p_start date, p_end date) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare vehicle public.cars; booking public.bookings; customer uuid := auth.uid();
begin
  if customer is null then raise exception 'Please sign in to continue.'; end if;
  if (select role from public.profiles where id=customer) is distinct from 'customer' then
    raise exception 'Use a customer account to book a vehicle.';
  end if;
  perform public.rental_check_dates(p_start,p_end);
  if p_pickup is null or p_pickup not in ('Kathmandu','Pokhara','Chitwan') then raise exception 'Choose a supported pickup location.'; end if;
  -- Serialize reservations for this vehicle, including requests from different visitors.
  select * into vehicle from public.cars where id=p_car_id for update;
  if not found then raise exception 'Vehicle not found.'; end if;
  if exists(select 1 from public.bookings where car_id=p_car_id and status='Confirmed' and start_date<p_end and end_date>p_start) then
    raise exception 'This vehicle is reserved for those dates. Choose another car or change your dates.';
  end if;
  insert into public.bookings(user_id,car_id,pickup,start_date,end_date,days,daily_rate,total)
  values(customer,p_car_id,p_pickup,p_start,p_end,p_end-p_start,vehicle.price,(p_end-p_start)*vehicle.price)
  returning * into booking;
  return jsonb_build_object('booking',to_jsonb(booking));
end;
$$;
revoke all on function public.rental_book(text,text,date,date) from public, anon;
grant execute on function public.rental_book(text,text,date,date) to authenticated;

create or replace function public.rental_cancel(p_booking_id uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare booking public.bookings;
begin
  if auth.uid() is null then raise exception 'Please sign in to continue.'; end if;
  select * into booking from public.bookings where id=p_booking_id and user_id=auth.uid() for update;
  if not found then raise exception 'Booking not found.'; end if;
  if booking.status='Cancelled' then return jsonb_build_object('ok',true); end if;
  if booking.start_date <= (now() at time zone 'Asia/Kathmandu')::date then raise exception 'Online cancellation is available only before the pickup date.'; end if;
  update public.bookings set status='Cancelled' where id=booking.id;
  return jsonb_build_object('ok',true);
end;
$$;
revoke all on function public.rental_cancel(uuid) from public, anon;
grant execute on function public.rental_cancel(uuid) to authenticated;

create or replace function public.rental_owner_orders() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare result jsonb;
begin
  if auth.uid() is null then raise exception 'Please sign in to continue.'; end if;
  if (select role from public.profiles where id=auth.uid()) is distinct from 'owner' then raise exception 'Owner access is required.'; end if;
  select coalesce(jsonb_agg(to_jsonb(b) || jsonb_build_object('name',c.name,'customer_name',p.name,'customer_email',u.email)
    order by b.created_at desc,b.id), '[]'::jsonb) into result
  from public.bookings b join public.cars c on c.id=b.car_id
  join public.profiles p on p.id=b.user_id join auth.users u on u.id=b.user_id;
  return jsonb_build_object('bookings',result);
end;
$$;
revoke all on function public.rental_owner_orders() from public, anon;
grant execute on function public.rental_owner_orders() to authenticated;

insert into public.cars(id,name,category,seats,transmission,fuel,price,color,description) values
('creta','Hyundai Creta','SUV',5,'Automatic','Petrol',6500,'#bdc5bd','A versatile companion for city streets and scenic escapes. Comfortable seating and room for your weekend essentials.'),
('swift','Suzuki Swift','Hatchback',5,'Manual','Petrol',3500,'#bc563e','Light, compact, and easy to park. A practical choice for discovering the city at your own pace.'),
('scorpio','Mahindra Scorpio','SUV',7,'Manual','Diesel',8500,'#384b42','Room for your crew and the journey ahead. A spacious SUV for group trips on suitable paved roads.'),
('nexon','Tata Nexon EV','Electric',5,'Automatic','Electric',7000,'#588c92','A quiet, all-electric drive for planned routes with charging access. A fresh way to explore.'),
('city','Honda City','Sedan',5,'Automatic','Petrol',5500,'#e1ddd0','A comfortable sedan with a generous cabin. Well suited to everyday journeys and relaxed highway travel.'),
('venue','Hyundai Venue','SUV',5,'Manual','Petrol',5000,'#c79b58','Compact proportions with an elevated driving position. A flexible option for your next short getaway.')
on conflict (id) do nothing;
commit;
