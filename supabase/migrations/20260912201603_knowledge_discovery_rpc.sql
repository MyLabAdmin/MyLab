create or replace function public.get_knowledge_discovery(
  p_locale text default 'en',
  p_search text default null,
  p_item_types text[] default null,
  p_category_id uuid default null,
  p_access_tier text default null,
  p_page integer default 1,
  p_page_size integer default 24
)
returns table (
  id uuid,
  item_type text,
  version_id uuid,
  version_number integer,
  title text,
  subtitle text,
  summary text,
  published_at timestamptz,
  access_tier text,
  categories jsonb,
  total_count bigint
)
language sql
stable
security invoker
set search_path = public
as $$
  with filtered as (
    select
      ki.id,
      ki.item_type,
      kiv.id as version_id,
      kiv.version_number,
      coalesce(kit.title, kiv.title) as title,
      coalesce(kit.subtitle, kiv.subtitle) as subtitle,
      coalesce(kit.summary, kiv.summary) as summary,
      kiv.published_at,
      kap.access_tier
    from public.knowledge_items ki
    join public.knowledge_item_versions kiv
      on kiv.knowledge_item_id = ki.id
     and kiv.status = 'published'
     and kiv.review_status = 'approved'
    left join public.knowledge_item_translations kit
      on kit.source_version_id = kiv.id
     and kit.locale = p_locale
     and kit.status = 'published'
    left join public.knowledge_access_policies kap
      on kap.knowledge_item_id = ki.id
     and kap.active = true
    where ki.status = 'published'
      and p_locale in ('ar', 'en')
      and (
        p_search is null
        or btrim(p_search) = ''
        or kiv.title ilike '%' || btrim(p_search) || '%'
        or coalesce(kiv.summary, '') ilike '%' || btrim(p_search) || '%'
        or coalesce(kit.title, '') ilike '%' || btrim(p_search) || '%'
        or coalesce(kit.summary, '') ilike '%' || btrim(p_search) || '%'
      )
      and (
        p_item_types is null
        or cardinality(p_item_types) = 0
        or ki.item_type = any(p_item_types)
      )
      and (
        p_category_id is null
        or exists (
          select 1
          from public.knowledge_item_categories kic_filter
          where kic_filter.knowledge_item_id = ki.id
            and kic_filter.category_id = p_category_id
        )
      )
      and (
        p_access_tier is null
        or kap.access_tier = p_access_tier
      )
  ),
  paged as (
    select
      f.*,
      count(*) over () as total_count
    from filtered f
    order by f.published_at desc nulls last, f.id desc
    limit greatest(1, least(coalesce(p_page_size, 24), 100))
    offset (greatest(coalesce(p_page, 1), 1) - 1)
      * greatest(1, least(coalesce(p_page_size, 24), 100))
  )
  select
    p.id,
    p.item_type,
    p.version_id,
    p.version_number,
    p.title,
    p.subtitle,
    p.summary,
    p.published_at,
    p.access_tier,
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', kc.id,
            'code', kc.code,
            'name', coalesce(kct.name, kc.name),
            'parent_id', kc.parent_id
          )
          order by coalesce(kct.name, kc.name), kc.id
        )
        from public.knowledge_item_categories kic
        join public.knowledge_categories kc
          on kc.id = kic.category_id
        left join public.knowledge_category_translations kct
          on kct.category_id = kc.id
         and kct.locale = p_locale
        where kic.knowledge_item_id = p.id
      ),
      '[]'::jsonb
    ) as categories,
    p.total_count
  from paged p;
$$;

comment on function public.get_knowledge_discovery(text, text, text[], uuid, text, integer, integer)
is 'Production Knowledge discovery contract: parent-level filtering, exact logical-item pagination/count, localized published content/category labels, and active access filtering.';
