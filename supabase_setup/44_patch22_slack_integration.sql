-- MOSCATELLI MainHub · Patch 22
-- Secure Slack outbox, routing, identity links, interactions and digests.
-- Apply after 43_patch21j_hardening.sql.

begin;

create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists supabase_vault with schema vault;

create table if not exists public.slack_integration_settings (
  singleton boolean primary key default true check (singleton),
  enabled boolean not null default false,
  environment text not null default 'testing' check (environment in ('testing','production')),
  timezone text not null default 'Europe/Rome',
  daily_digest_local_time time not null default '08:30',
  mainhub_base_url text not null default 'https://gianmoska-prog.github.io/MainHub/',
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null
);

insert into public.slack_integration_settings(singleton)
values (true)
on conflict (singleton) do nothing;

create table if not exists public.slack_channel_routes (
  route_key text primary key check (route_key in ('testing','updates','activity','decisions','operations','finance')),
  channel_name text not null,
  channel_id text,
  is_private boolean not null default false,
  delivery_mode text not null default 'immediate' check (delivery_mode in ('immediate','digest','both','off')),
  enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

insert into public.slack_channel_routes(route_key,channel_name,is_private,delivery_mode)
values
  ('testing','mainhub-testing',true,'immediate'),
  ('updates','updates',false,'digest'),
  ('activity','mainhub-activity',false,'immediate'),
  ('decisions','decisions',false,'immediate'),
  ('operations','operations',false,'both'),
  ('finance','finance',true,'immediate')
on conflict (route_key) do update set
  channel_name=excluded.channel_name,
  is_private=excluded.is_private,
  delivery_mode=excluded.delivery_mode;

create table if not exists public.slack_user_links (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  slack_user_id text not null unique,
  slack_email text,
  slack_display_name text not null default '',
  enabled boolean not null default true,
  verified_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.decision_acknowledgements (
  decision_id uuid not null references public.record_posts(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  slack_user_id text,
  acknowledged_at timestamptz not null default now(),
  primary key (decision_id,profile_id)
);

create table if not exists public.entity_comments (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  entity_type text not null check (entity_type in ('record','decision','calendar','finance','project','milestone','lotto','product','revision','supplier')),
  entity_id uuid not null,
  author_id uuid not null references public.profiles(id) on delete restrict,
  author_display text not null default '',
  body text not null check (char_length(trim(body)) between 1 and 1800),
  source text not null default 'mainhub' check (source in ('mainhub','slack')),
  slack_channel_id text,
  slack_message_ts text
);

create index if not exists entity_comments_entity_idx
on public.entity_comments(entity_type,entity_id,created_at);

create table if not exists public.slack_outbox (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  activity_event_id uuid unique references public.activity_events(id) on delete cascade,
  route_key text not null references public.slack_channel_routes(route_key),
  priority text not null check (priority in ('immediate','digest')),
  status text not null default 'pending' check (status in ('pending','digest_pending','processing','sent','retrying','dead','suppressed')),
  payload jsonb not null default '{}'::jsonb,
  attempts integer not null default 0 check (attempts >= 0),
  available_at timestamptz not null default now(),
  locked_at timestamptz,
  locked_by text,
  sent_at timestamptz,
  slack_channel_id text,
  slack_message_ts text,
  last_error text
);

create index if not exists slack_outbox_dispatch_idx
on public.slack_outbox(status,available_at,created_at);

create table if not exists public.slack_interaction_receipts (
  request_id text primary key,
  kind text not null,
  slack_user_id text,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  result jsonb not null default '{}'::jsonb
);

create table if not exists public.slack_digest_runs (
  digest_date date primary key,
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  status text not null default 'processing' check (status in ('processing','sent','failed')),
  item_count integer not null default 0,
  slack_channel_id text,
  slack_message_ts text,
  last_error text
);

alter table public.slack_integration_settings enable row level security;
alter table public.slack_channel_routes enable row level security;
alter table public.slack_user_links enable row level security;
alter table public.decision_acknowledgements enable row level security;
alter table public.entity_comments enable row level security;
alter table public.slack_outbox enable row level security;
alter table public.slack_interaction_receipts enable row level security;
alter table public.slack_digest_runs enable row level security;

drop policy if exists "slack_settings_internal_read" on public.slack_integration_settings;
create policy "slack_settings_internal_read" on public.slack_integration_settings
for select to authenticated using (public.is_internal_member());

drop policy if exists "slack_routes_internal_read" on public.slack_channel_routes;
create policy "slack_routes_internal_read" on public.slack_channel_routes
for select to authenticated using (public.is_internal_member());

drop policy if exists "slack_links_self_or_founder_read" on public.slack_user_links;
create policy "slack_links_self_or_founder_read" on public.slack_user_links
for select to authenticated using (profile_id=auth.uid() or public.is_founder());

drop policy if exists "decision_ack_internal_read" on public.decision_acknowledgements;
create policy "decision_ack_internal_read" on public.decision_acknowledgements
for select to authenticated using (public.is_internal_member());

drop policy if exists "entity_comments_internal_read" on public.entity_comments;
create policy "entity_comments_internal_read" on public.entity_comments
for select to authenticated using (public.is_internal_member());

drop policy if exists "entity_comments_internal_insert" on public.entity_comments;
create policy "entity_comments_internal_insert" on public.entity_comments
for insert to authenticated with check (public.is_internal_member() and author_id=auth.uid());

drop policy if exists "entity_comments_owner_or_founder_update" on public.entity_comments;
create policy "entity_comments_owner_or_founder_update" on public.entity_comments
for update to authenticated using (author_id=auth.uid() or public.is_founder())
with check (author_id=auth.uid() or public.is_founder());

drop policy if exists "entity_comments_owner_or_founder_delete" on public.entity_comments;
create policy "entity_comments_owner_or_founder_delete" on public.entity_comments
for delete to authenticated using (author_id=auth.uid() or public.is_founder());

drop policy if exists "slack_outbox_internal_read" on public.slack_outbox;
create policy "slack_outbox_internal_read" on public.slack_outbox
for select to authenticated using (public.is_internal_member());

drop policy if exists "slack_digest_internal_read" on public.slack_digest_runs;
create policy "slack_digest_internal_read" on public.slack_digest_runs
for select to authenticated using (public.is_internal_member());

grant select on public.slack_integration_settings,public.slack_channel_routes,public.decision_acknowledgements,public.slack_outbox,public.slack_digest_runs to authenticated;
grant select on public.slack_user_links to authenticated;
grant select,insert,update,delete on public.entity_comments to authenticated;
grant all on public.slack_integration_settings,public.slack_channel_routes,public.slack_user_links,public.decision_acknowledgements,public.entity_comments,public.slack_outbox,public.slack_interaction_receipts,public.slack_digest_runs to service_role;
-- The Edge gateway reads these original MainHub tables directly. Mutations
-- remain constrained to the service-only security-definer action function.
grant select on public.profiles,public.record_posts,public.record_attachments to service_role;

revoke insert,update,delete on public.slack_integration_settings,public.slack_channel_routes,public.slack_user_links,public.decision_acknowledgements,public.slack_outbox,public.slack_interaction_receipts,public.slack_digest_runs from authenticated;

create or replace function public.touch_slack_updated_at()
returns trigger language plpgsql security invoker set search_path=public as $$
begin
  new.updated_at=now();
  return new;
end;
$$;

drop trigger if exists slack_settings_touch on public.slack_integration_settings;
create trigger slack_settings_touch before update on public.slack_integration_settings
for each row execute function public.touch_slack_updated_at();
drop trigger if exists slack_routes_touch on public.slack_channel_routes;
create trigger slack_routes_touch before update on public.slack_channel_routes
for each row execute function public.touch_slack_updated_at();
drop trigger if exists slack_links_touch on public.slack_user_links;
create trigger slack_links_touch before update on public.slack_user_links
for each row execute function public.touch_slack_updated_at();
drop trigger if exists entity_comments_touch on public.entity_comments;
create trigger entity_comments_touch before update on public.entity_comments
for each row execute function public.touch_slack_updated_at();
drop trigger if exists slack_outbox_touch on public.slack_outbox;
create trigger slack_outbox_touch before update on public.slack_outbox
for each row execute function public.touch_slack_updated_at();

create or replace function public.slack_route_for_entity(p_entity_type text)
returns text language sql immutable as $$
  select case
    when p_entity_type='decision' then 'decisions'
    when p_entity_type='finance' then 'finance'
    when p_entity_type in ('calendar','project','milestone','lotto','product','revision','supplier') then 'operations'
    else 'activity'
  end;
$$;

create or replace function public.slack_priority_for_activity(p_entity_type text,p_action text)
returns text language sql immutable as $$
  select case
    when p_entity_type in ('decision','finance','calendar') then 'immediate'
    when p_action in ('created','deleted','completed','reopened') then 'immediate'
    when p_entity_type in ('record','project','milestone') then 'immediate'
    else 'digest'
  end;
$$;

-- Preserve the real MainHub actor when an authenticated Slack identity performs
-- a service-role mutation through apply_slack_action(). Fail closed if the
-- expected Patch 21H function body is not present.
do $$
declare
  v_definition text;
  v_original text := 'actor uuid := auth.uid();';
  v_replacement text := 'actor uuid := coalesce(auth.uid(), nullif(current_setting(''app.mainhub_actor_id'', true), '''')::uuid);';
begin
  select pg_get_functiondef('public.log_mainhub_activity()'::regprocedure) into v_definition;
  if position(v_replacement in v_definition)>0 then return; end if;
  if position(v_original in v_definition)=0 then raise exception 'Unexpected log_mainhub_activity definition'; end if;
  execute replace(v_definition,v_original,v_replacement);
end $$;

create or replace function public.invoke_mainhub_slack(p_payload jsonb)
returns bigint
language plpgsql
security definer
set search_path=public,extensions,vault
as $$
declare
  v_url text;
  v_secret text;
  v_request bigint;
begin
  select decrypted_secret into v_url from vault.decrypted_secrets where name='mainhub_project_url' limit 1;
  select decrypted_secret into v_secret from vault.decrypted_secrets where name='mainhub_slack_shared_secret' limit 1;
  if coalesce(v_url,'')='' or coalesce(v_secret,'')='' then return null; end if;
  select net.http_post(
    url:=rtrim(v_url,'/') || '/functions/v1/mainhub-slack',
    headers:=jsonb_build_object('Content-Type','application/json','x-mainhub-secret',v_secret),
    body:=coalesce(p_payload,'{}'::jsonb),
    timeout_milliseconds:=10000
  ) into v_request;
  return v_request;
end;
$$;

revoke all on function public.invoke_mainhub_slack(jsonb) from public,authenticated;
grant execute on function public.invoke_mainhub_slack(jsonb) to service_role;

create or replace function public.enqueue_mainhub_slack_activity()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
declare
  v_settings public.slack_integration_settings%rowtype;
  v_route text;
  v_priority text;
  v_status text;
  v_available timestamptz;
  v_job uuid;
begin
  select * into v_settings from public.slack_integration_settings where singleton=true;
  if not found or not v_settings.enabled then return new; end if;
  v_priority:=public.slack_priority_for_activity(new.entity_type,new.action);
  v_route:=case when v_settings.environment='testing' then 'testing' else public.slack_route_for_entity(new.entity_type) end;
  v_status:=case when v_priority='digest' and v_settings.environment='production' then 'digest_pending' else 'pending' end;
  -- Record images are inserted immediately after their parent post. A short delay
  -- lets the delivery worker include them in the same Slack thread.
  v_available:=case when new.entity_type in ('record','decision') and new.action='created' then now()+interval '20 seconds' else now() end;
  insert into public.slack_outbox(activity_event_id,route_key,priority,status,available_at,payload)
  values(new.id,v_route,v_priority,v_status,v_available,jsonb_build_object(
    'activity_id',new.id,
    'created_at',new.created_at,
    'actor_id',new.actor_id,
    'actor_display',new.actor_display,
    'entity_type',new.entity_type,
    'entity_id',new.entity_id,
    'action',new.action,
    'entity_label',new.entity_label,
    'context',new.context
  ))
  on conflict(activity_event_id) do nothing
  returning id into v_job;
  if v_job is not null and v_status='pending' and v_available<=now() then
    perform public.invoke_mainhub_slack(jsonb_build_object('kind','dispatch','job_id',v_job));
  end if;
  return new;
end;
$$;

drop trigger if exists trg_activity_slack_outbox on public.activity_events;
create trigger trg_activity_slack_outbox after insert on public.activity_events
for each row execute function public.enqueue_mainhub_slack_activity();

create or replace function public.claim_slack_outbox(p_job_id uuid,p_worker text default 'edge')
returns setof public.slack_outbox
language plpgsql
security definer
set search_path=public
as $$
begin
  return query
  update public.slack_outbox
  set status='processing',attempts=attempts+1,locked_at=now(),locked_by=left(coalesce(p_worker,'edge'),120)
  where id=p_job_id
    and status in ('pending','retrying')
    and available_at<=now()
  returning *;
end;
$$;

create or replace function public.finish_slack_outbox(
  p_job_id uuid,
  p_success boolean,
  p_channel_id text default null,
  p_message_ts text default null,
  p_error text default null
)
returns void
language plpgsql
security definer
set search_path=public
as $$
begin
  update public.slack_outbox
  set status=case when p_success then 'sent' when attempts>=5 then 'dead' else 'retrying' end,
      sent_at=case when p_success then now() else sent_at end,
      slack_channel_id=coalesce(p_channel_id,slack_channel_id),
      slack_message_ts=coalesce(p_message_ts,slack_message_ts),
      last_error=case when p_success then null else left(coalesce(p_error,'delivery_failed'),1800) end,
      available_at=case when p_success then available_at else now()+make_interval(mins=>least(60,greatest(1,power(2,least(attempts,5))::integer))) end,
      locked_at=null,
      locked_by=null
  where id=p_job_id;
end;
$$;

revoke all on function public.claim_slack_outbox(uuid,text) from public,authenticated;
revoke all on function public.finish_slack_outbox(uuid,boolean,text,text,text) from public,authenticated;
grant execute on function public.claim_slack_outbox(uuid,text),public.finish_slack_outbox(uuid,boolean,text,text,text) to service_role;

create or replace function public.apply_slack_action(
  p_request_id text,
  p_slack_user_id text,
  p_action text,
  p_entity_type text default null,
  p_entity_id uuid default null,
  p_payload jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  v_profile uuid;
  v_display text;
  v_existing jsonb;
  v_created uuid;
begin
  select result into v_existing from public.slack_interaction_receipts where request_id=p_request_id;
  if found then return jsonb_build_object('ok',true,'duplicate',true,'result',v_existing); end if;

  select l.profile_id,p.display_name into v_profile,v_display
  from public.slack_user_links l join public.profiles p on p.id=l.profile_id
  where l.slack_user_id=p_slack_user_id and l.enabled and p.is_active;
  if v_profile is null then raise exception 'slack_user_not_linked'; end if;

  insert into public.slack_interaction_receipts(request_id,kind,slack_user_id)
  values(p_request_id,p_action,p_slack_user_id);
  perform set_config('app.mainhub_actor_id',v_profile::text,true);

  if p_action='ack_decision' then
    if not exists(select 1 from public.record_posts where id=p_entity_id and category='decisions') then raise exception 'decision_not_found'; end if;
    insert into public.decision_acknowledgements(decision_id,profile_id,slack_user_id)
    values(p_entity_id,v_profile,p_slack_user_id)
    on conflict(decision_id,profile_id) do update set acknowledged_at=now(),slack_user_id=excluded.slack_user_id;
    insert into public.activity_events(actor_id,actor_display,entity_type,entity_id,action,entity_label,context)
    select v_profile,v_display,'decision',id,'updated',title,jsonb_build_object('source','slack','kind','acknowledged')
    from public.record_posts where id=p_entity_id;
  elsif p_action='comment' then
    insert into public.entity_comments(entity_type,entity_id,author_id,author_display,body,source,slack_channel_id,slack_message_ts)
    values(p_entity_type,p_entity_id,v_profile,v_display,trim(p_payload->>'body'),'slack',p_payload->>'channel_id',p_payload->>'message_ts')
    returning id into v_created;
    insert into public.activity_events(actor_id,actor_display,entity_type,entity_id,action,entity_label,context)
    values(v_profile,v_display,p_entity_type,p_entity_id,'updated','Comment added',jsonb_build_object('source','slack','kind','comment','comment_id',v_created));
  elsif p_action in ('milestone_complete','milestone_reopen') then
    update public.project_milestones
    set completed=(p_action='milestone_complete'),completed_at=case when p_action='milestone_complete' then now() else null end
    where id=p_entity_id;
    if not found then raise exception 'milestone_not_found'; end if;
  elsif p_action='project_status' then
    if coalesce(p_payload->>'status','') not in ('planned','active','paused','completed','archived') then raise exception 'invalid_project_status'; end if;
    update public.projects set status=p_payload->>'status' where id=p_entity_id;
    if not found then raise exception 'project_not_found'; end if;
  elsif p_action='create_record' then
    if coalesce(p_payload->>'category','') not in ('meetings','ideas','tasks','product','brand','finance','operations') then raise exception 'invalid_record_category'; end if;
    insert into public.record_posts(channel,category,title,body,created_by)
    values('record',p_payload->>'category',trim(p_payload->>'title'),trim(p_payload->>'body'),v_profile)
    returning id into v_created;
  elsif p_action='create_calendar' then
    if coalesce(p_payload->>'category','') not in ('milestone','meeting','production','launch','travel','admin') then raise exception 'invalid_calendar_category'; end if;
    insert into public.calendar_events(created_by,title,event_date,all_day,category,notes,time_zone)
    values(v_profile,trim(p_payload->>'title'),(p_payload->>'event_date')::date,true,p_payload->>'category',coalesce(p_payload->>'notes',''),'Europe/Rome')
    returning id into v_created;
  else
    raise exception 'unsupported_slack_action';
  end if;

  update public.slack_interaction_receipts
  set processed_at=now(),result=jsonb_build_object('ok',true,'id',coalesce(v_created,p_entity_id))
  where request_id=p_request_id;
  return jsonb_build_object('ok',true,'id',coalesce(v_created,p_entity_id));
exception when others then
  delete from public.slack_interaction_receipts where request_id=p_request_id and processed_at is null;
  raise;
end;
$$;

revoke all on function public.apply_slack_action(text,text,text,text,uuid,jsonb) from public,authenticated;
grant execute on function public.apply_slack_action(text,text,text,text,uuid,jsonb) to service_role;

create or replace function public.get_slack_integration_status()
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  v_settings public.slack_integration_settings%rowtype;
begin
  if not public.is_internal_member() then raise exception 'not_authorized'; end if;
  select * into v_settings from public.slack_integration_settings where singleton=true;
  return jsonb_build_object(
    'enabled',v_settings.enabled,
    'environment',v_settings.environment,
    'timezone',v_settings.timezone,
    'digest_time',to_char(v_settings.daily_digest_local_time,'HH24:MI'),
    'routes',(select coalesce(jsonb_agg(jsonb_build_object('key',route_key,'name',channel_name,'configured',channel_id is not null,'private',is_private,'mode',delivery_mode,'enabled',enabled) order by route_key),'[]'::jsonb) from public.slack_channel_routes),
    'pending',(select count(*) from public.slack_outbox where status in ('pending','retrying','processing')),
    'digest_pending',(select count(*) from public.slack_outbox where status='digest_pending'),
    'failed',(select count(*) from public.slack_outbox where status='dead'),
    'last_sent_at',(select max(sent_at) from public.slack_outbox where status='sent'),
    'last_digest_at',(select max(sent_at) from public.slack_digest_runs where status='sent')
  );
end;
$$;

revoke all on function public.get_slack_integration_status() from public;
grant execute on function public.get_slack_integration_status() to authenticated,service_role;

do $$
declare v_job bigint;
begin
  select jobid into v_job from cron.job where jobname='mainhub-slack-digest-tick' limit 1;
  if v_job is not null then perform cron.unschedule(v_job); end if;
  perform cron.schedule('mainhub-slack-digest-tick','* * * * *',$cron$
    select public.invoke_mainhub_slack(jsonb_build_object('kind','digest_tick','at',now()));
  $cron$);
end $$;

comment on table public.slack_outbox is 'Idempotent MainHub-to-Slack delivery queue. Slack secrets never enter this table or the browser client.';
comment on function public.apply_slack_action(text,text,text,text,uuid,jsonb) is 'Service-role-only Slack action gateway. Resolves Slack identities to active MainHub profiles before any mutation.';

notify pgrst,'reload schema';
commit;
