begin;

alter table public.slack_channel_routes
  drop constraint if exists slack_channel_routes_route_key_check;

alter table public.slack_channel_routes
  add constraint slack_channel_routes_route_key_check
  check (route_key in ('testing','updates','activity','decisions','operations','finance','atlas'));

insert into public.slack_channel_routes(route_key,channel_name,channel_id,is_private,delivery_mode,enabled)
values ('atlas','atlas','C0BQ1KLFLS0',false,'immediate',true)
on conflict (route_key) do update set
  channel_name=excluded.channel_name,
  channel_id=excluded.channel_id,
  is_private=excluded.is_private,
  delivery_mode=excluded.delivery_mode,
  enabled=excluded.enabled,
  updated_at=now();

commit;
