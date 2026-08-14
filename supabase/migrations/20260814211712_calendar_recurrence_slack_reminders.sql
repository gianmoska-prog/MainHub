begin;

alter table public.calendar_events
  add column if not exists repeat_rule text not null default 'none',
  add column if not exists repeat_until date;

alter table public.calendar_events
  drop constraint if exists calendar_events_repeat_rule_check;
alter table public.calendar_events
  add constraint calendar_events_repeat_rule_check
  check (repeat_rule in ('none','daily','weekly','monthly'));

alter table public.calendar_events
  drop constraint if exists calendar_events_repeat_until_check;
alter table public.calendar_events
  add constraint calendar_events_repeat_until_check
  check (repeat_until is null or (repeat_rule <> 'none' and repeat_until >= event_date));

create index if not exists calendar_events_recurring_range_idx
  on public.calendar_events (event_date, repeat_until)
  where repeat_rule <> 'none';

comment on column public.calendar_events.repeat_rule is
  'Series cadence for one logical calendar event: none, daily, weekly, or monthly.';
comment on column public.calendar_events.repeat_until is
  'Optional inclusive final local date for a repeating event series.';

create or replace function public.calendar_event_occurs_on(
  p_event_date date,
  p_repeat_rule text,
  p_repeat_until date,
  p_date date
)
returns boolean
language sql
immutable
parallel safe
set search_path = pg_catalog
as $$
  select case
    when p_date is null or p_event_date is null or p_date < p_event_date then false
    when p_repeat_until is not null and p_date > p_repeat_until then false
    when coalesce(p_repeat_rule, 'none') = 'none' then p_date = p_event_date
    when p_repeat_rule = 'daily' then true
    when p_repeat_rule = 'weekly' then mod(p_date - p_event_date, 7) = 0
    when p_repeat_rule = 'monthly' then extract(day from p_date) = extract(day from p_event_date)
    else false
  end;
$$;

create or replace function public.calendar_events_for_date(p_date date)
returns setof public.calendar_events
language sql
stable
security invoker
set search_path = public
as $$
  select ce.*
  from public.calendar_events ce
  where public.calendar_event_occurs_on(ce.event_date, ce.repeat_rule, ce.repeat_until, p_date)
  order by ce.all_day desc, ce.start_time asc nulls first, ce.title asc;
$$;

revoke all on function public.calendar_event_occurs_on(date,text,date,date) from public;
revoke all on function public.calendar_events_for_date(date) from public;
grant execute on function public.calendar_event_occurs_on(date,text,date,date) to authenticated, service_role;
grant execute on function public.calendar_events_for_date(date) to authenticated, service_role;

alter table public.slack_integration_settings
  add column if not exists calendar_reminder_local_time time not null default '08:00';

create table if not exists public.slack_calendar_reminder_runs (
  reminder_date date primary key,
  status text not null default 'processing' check (status in ('processing','sent','empty','failed')),
  event_count integer not null default 0 check (event_count >= 0),
  slack_channel_id text,
  slack_message_ts text,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  sent_at timestamptz
);

alter table public.slack_calendar_reminder_runs enable row level security;
revoke all on table public.slack_calendar_reminder_runs from public, anon, authenticated;
grant all on table public.slack_calendar_reminder_runs to service_role;

comment on table public.slack_calendar_reminder_runs is
  'Idempotency and delivery state for the single daily Slack calendar reminder.';

notify pgrst, 'reload schema';
commit;
