create or replace function private.get_knowledge_review_queue()
returns table (
  knowledge_item_version_id uuid,
  knowledge_item_id uuid,
  item_type text,
  title text,
  summary text,
  version_number integer,
  created_by uuid,
  created_at timestamptz,
  review_updated_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform private.authorize_knowledge_reviewer();

  return query
  select
    kiv.id,
    kiv.knowledge_item_id,
    ki.item_type,
    kiv.title,
    kiv.summary,
    kiv.version_number,
    kiv.created_by,
    kiv.created_at,
    kiv.review_updated_at
  from public.knowledge_item_versions as kiv
  join public.knowledge_items as ki
    on ki.id = kiv.knowledge_item_id
  where kiv.review_status = 'pending_review'
  order by kiv.review_updated_at asc nulls last, kiv.created_at asc;
end;
$$;

revoke all on function private.get_knowledge_review_queue() from public;
grant execute on function private.get_knowledge_review_queue() to authenticated, service_role;

create or replace function public.get_knowledge_review_queue()
returns table (
  knowledge_item_version_id uuid,
  knowledge_item_id uuid,
  item_type text,
  title text,
  summary text,
  version_number integer,
  created_by uuid,
  created_at timestamptz,
  review_updated_at timestamptz
)
language sql
stable
security invoker
set search_path = ''
as $$
  select * from private.get_knowledge_review_queue();
$$;

revoke all on function public.get_knowledge_review_queue() from public;
grant execute on function public.get_knowledge_review_queue() to authenticated, service_role;
