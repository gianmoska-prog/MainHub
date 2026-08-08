-- MOSCATELLI MainHub Patch 21I — Global Search
-- One RLS-respecting, database-backed search surface across the institutional record.

create or replace function public.search_mainhub(
  p_query text,
  p_limit integer default 48
)
returns table (
  result_type text,
  entity_id uuid,
  title text,
  subtitle text,
  snippet text,
  route text,
  date_key text,
  sort_at timestamptz,
  score integer
)
language sql
stable
security invoker
set search_path = public
as $$
  with input as (
    select lower(trim(coalesce(p_query, ''))) as needle,
           least(greatest(coalesce(p_limit, 48), 1), 80) as row_limit
  ),
  candidates as (
    select
      case when rp.category = 'decisions' then 'decision' else 'record' end::text as result_type,
      rp.id as entity_id,
      rp.title::text as title,
      case
        when rp.category = 'decisions' and rp.decision_number is not null then 'D-' || lpad(rp.decision_number::text, 3, '0')
        else coalesce(rp.category, 'record')
      end::text as subtitle,
      left(coalesce(rp.body, ''), 320)::text as snippet,
      'dashboard'::text as route,
      coalesce(rp.decision_date::text, rp.created_at::date::text)::text as date_key,
      coalesce(rp.updated_at, rp.created_at) as sort_at,
      case
        when lower(coalesce(rp.title,'')) = i.needle then 100
        when left(lower(coalesce(rp.title,'')), length(i.needle)) = i.needle then 84
        when position(i.needle in lower(coalesce(rp.title,''))) > 0 then 68
        when position(i.needle in lower(concat_ws(' ', rp.related_project_name, rp.related_product_name, rp.related_supplier_name, rp.decision_owner_display))) > 0 then 44
        else 30
      end::integer as score
    from public.record_posts rp cross join input i
    where public.is_internal_member()
      and rp.channel = 'record'
      and length(i.needle) >= 2
      and position(i.needle in lower(concat_ws(' ', rp.title, rp.body, rp.category, rp.related_project_name, rp.related_product_name, rp.related_supplier_name, rp.decision_owner_display))) > 0

    union all

    select
      'project', p.id, p.name,
      coalesce(p.status,'project'),
      left(coalesce(nullif(p.next_action,''), p.description, ''), 320),
      'divisions/operations/projects',
      coalesce(p.target_date::text, p.start_date::text, ''),
      coalesce(p.updated_at, p.created_at),
      case
        when lower(coalesce(p.name,'')) = i.needle then 100
        when left(lower(coalesce(p.name,'')), length(i.needle)) = i.needle then 84
        when position(i.needle in lower(coalesce(p.name,''))) > 0 then 68
        else 32
      end
    from public.projects p cross join input i
    where public.is_internal_member()
      and length(i.needle) >= 2
      and position(i.needle in lower(concat_ws(' ', p.name, p.description, p.next_action, p.status))) > 0

    union all

    select
      'calendar', ce.id, ce.title,
      coalesce(ce.category,'calendar'),
      left(coalesce(ce.notes,''), 320),
      'divisions/operations/calendar',
      ce.event_date::text,
      coalesce(ce.starts_at, ce.updated_at, ce.created_at),
      case
        when lower(coalesce(ce.title,'')) = i.needle then 100
        when left(lower(coalesce(ce.title,'')), length(i.needle)) = i.needle then 84
        when position(i.needle in lower(coalesce(ce.title,''))) > 0 then 68
        else 32
      end
    from public.calendar_events ce cross join input i
    left join public.projects cp on cp.id = ce.project_id
    where public.is_internal_member()
      and length(i.needle) >= 2
      and position(i.needle in lower(concat_ws(' ', ce.title, ce.notes, ce.category, cp.name))) > 0

    union all

    select
      'lotto', pl.id,
      concat_ws(' · ', pl.name, nullif(pl.title,'')),
      coalesce(pl.status,'lotto'),
      left(coalesce(pl.narrative,''), 320),
      'divisions/operations/products',
      '',
      coalesce(pl.updated_at, pl.created_at),
      case
        when lower(trim(concat_ws(' ', pl.name, pl.title))) = i.needle then 100
        when left(lower(trim(concat_ws(' ', pl.name, pl.title))), length(i.needle)) = i.needle then 84
        when position(i.needle in lower(concat_ws(' ', pl.name, pl.title))) > 0 then 68
        else 32
      end
    from public.product_lots pl cross join input i
    where public.is_internal_member()
      and length(i.needle) >= 2
      and position(i.needle in lower(concat_ws(' ', pl.name, pl.title, pl.narrative, pl.status))) > 0

    union all

    select
      'product', pr.id, pr.name,
      concat_ws(' · ', nullif(pr.internal_ref,''), nullif(pr.product_type,'')),
      left(coalesce(nullif(pr.next_action,''), nullif(pr.material,''), pr.notes, ''), 320),
      'divisions/operations/products',
      '',
      coalesce(pr.updated_at, pr.created_at),
      case
        when lower(coalesce(pr.name,'')) = i.needle then 100
        when lower(coalesce(pr.internal_ref,'')) = i.needle then 96
        when left(lower(coalesce(pr.name,'')), length(i.needle)) = i.needle then 84
        when position(i.needle in lower(coalesce(pr.name,''))) > 0 then 68
        else 34
      end
    from public.products pr cross join input i
    left join public.product_lots lot on lot.id = pr.lot_id
    left join public.suppliers ps on ps.id = pr.supplier_id
    where public.is_internal_member()
      and length(i.needle) >= 2
      and position(i.needle in lower(concat_ws(' ', pr.name, pr.internal_ref, pr.product_type, pr.material, pr.composition, pr.colourways, pr.supplier_name, ps.name, lot.name, lot.title, pr.next_action, pr.notes))) > 0

    union all

    select
      'supplier', s.id, s.name,
      concat_ws(' · ', coalesce(s.category,'supplier'), nullif(s.location,'')),
      left(coalesce(nullif(s.next_action,''), nullif(s.services,''), s.notes, ''), 320),
      'divisions/operations/suppliers',
      coalesce(s.last_contact_date::text,''),
      coalesce(s.updated_at, s.created_at),
      case
        when lower(coalesce(s.name,'')) = i.needle then 100
        when left(lower(coalesce(s.name,'')), length(i.needle)) = i.needle then 84
        when position(i.needle in lower(coalesce(s.name,''))) > 0 then 68
        else 34
      end
    from public.suppliers s cross join input i
    where public.is_internal_member()
      and length(i.needle) >= 2
      and position(i.needle in lower(concat_ws(' ', s.name, s.category, s.location, s.primary_contact, s.email, s.services, s.next_action, s.notes))) > 0
  )
  select c.*
  from candidates c, input i
  order by c.score desc, c.sort_at desc nulls last, c.title asc
  limit (select row_limit from input);
$$;

revoke all on function public.search_mainhub(text, integer) from public;
grant execute on function public.search_mainhub(text, integer) to authenticated;
grant execute on function public.search_mainhub(text, integer) to service_role;

comment on function public.search_mainhub(text, integer) is
  'RLS-respecting MainHub global search across The Record/Decisions, Projects, Calendar, Product Development and Suppliers.';

notify pgrst, 'reload schema';
