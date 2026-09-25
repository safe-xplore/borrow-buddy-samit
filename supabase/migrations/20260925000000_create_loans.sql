-- ตาราง loans ตาม design.md ข้อ 4 และ RLS ตามข้อ 6
create table public.loans (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id),
  friend_name text not null check (btrim(friend_name) <> ''),
  item_name text not null check (btrim(item_name) <> ''),
  borrowed_date date not null,
  due_date date not null,
  returned_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint loans_due_not_before_borrowed check (due_date >= borrowed_date),
  constraint loans_returned_not_before_borrowed
    check (returned_date is null or returned_date >= borrowed_date)
);

create index loans_owner_id_idx on public.loans (owner_id);

-- อัปเดต updated_at อัตโนมัติ และห้ามเปลี่ยน owner_id หลังสร้าง
create function public.loans_before_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.owner_id is distinct from old.owner_id then
    raise exception 'owner_id cannot be changed';
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger loans_before_update
  before update on public.loans
  for each row execute function public.loans_before_update();

-- RLS: เห็น/เพิ่ม/แก้ได้เฉพาะ Loan ของตัวเอง ไม่มี policy DELETE
alter table public.loans enable row level security;

create policy "loans_select_own" on public.loans
  for select to authenticated
  using (owner_id = (select auth.uid()));

create policy "loans_insert_own" on public.loans
  for insert to authenticated
  with check (owner_id = (select auth.uid()));

create policy "loans_update_own" on public.loans
  for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

-- ปิดสิทธิ์ระดับตารางที่ไม่ใช้ (anon ไม่มีสิทธิ์เลย, ไม่มีใครลบได้จากฝั่งเว็บ)
revoke all on public.loans from anon;
revoke delete, truncate on public.loans from authenticated;
