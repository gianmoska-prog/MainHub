-- MOSCATELLI MainHub — Patch 21B
-- Timezone-aware Operations Calendar
-- Run AFTER 35_patch20c_calendar_events.sql.
--
-- Existing timed events are interpreted as Europe/Rome wall-clock times because
-- the pre-21B calendar had no timezone field and MainHub's operational baseline
-- was Rome. All-day events remain date-only and never shift between timezones.

alter table public.calendar_events
  add column if not exists time_zone text,
  add column if not exists starts_at timestamptz,
  add column if not exists ends_at timestamptz;

update public.calendar_events
set time_zone = 'Europe/Rome'
where time_zone is null or btrim(time_zone) = '';

alter table public.calendar_events
  alter column time_zone set default 'Europe/Rome',
  alter column time_zone set not null;

-- Keep the stored wall-clock fields for backwards readability and future exports,
-- while starts_at / ends_at provide the authoritative absolute instants.
update public.calendar_events
set starts_at = case
      when all_day or start_time is null then null
      else (event_date + start_time) at time zone time_zone
    end,
    ends_at = case
      when all_day or end_time is null then null
      else (event_date + end_time) at time zone time_zone
    end;

alter table public.calendar_events
  drop constraint if exists calendar_events_time_zone_length;
alter table public.calendar_events
  add constraint calendar_events_time_zone_length
  check (length(time_zone) between 1 and 64);

create or replace function public.sync_calendar_event_timezone_fields()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if new.time_zone is null or btrim(new.time_zone) = '' then
    new.time_zone := 'Europe/Rome';
  end if;

  if new.all_day then
    new.start_time := null;
    new.end_time := null;
    new.starts_at := null;
    new.ends_at := null;
    return new;
  end if;

  if new.start_time is not null then
    new.starts_at := (new.event_date + new.start_time) at time zone new.time_zone;
  else
    new.starts_at := null;
  end if;

  if new.end_time is not null then
    new.ends_at := (new.event_date + new.end_time) at time zone new.time_zone;
  else
    new.ends_at := null;
  end if;

  return new;
end;
$$;

drop trigger if exists calendar_events_sync_timezone_fields on public.calendar_events;
create trigger calendar_events_sync_timezone_fields
before insert or update of event_date, all_day, start_time, end_time, time_zone, starts_at, ends_at
on public.calendar_events
for each row execute function public.sync_calendar_event_timezone_fields();

create index if not exists calendar_events_starts_at_idx
  on public.calendar_events (starts_at)
  where starts_at is not null;

comment on column public.calendar_events.time_zone is
  'IANA timezone in which event_date/start_time/end_time were entered.';
comment on column public.calendar_events.starts_at is
  'Absolute start instant for timed events; null for all-day events.';
comment on column public.calendar_events.ends_at is
  'Absolute end instant for timed events; null for all-day events.';

notify pgrst, 'reload schema';
