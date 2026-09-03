create or replace function private.archive_knowledge_item(
  p_knowledge_item_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := private.authorize_knowledge_write();
  v_status text;
begin
  select status
    into v_status
  from public.knowledge_items
  where id = p_knowledge_item_id
  for update;

  if not found then
    raise exception 'Knowledge item not found' using errcode = 'P0002';
  end if;

  if v_status = 'archived' then
    raise exception 'Knowledge item is already archived' using errcode = '22023';
  end if;

  update public.knowledge_items
  set
    status = 'archived',
    updated_by = v_user_id
  where id = p_knowledge_item_id;

  return p_knowledge_item_id;
end;
$function$;

create or replace function public.archive_knowledge_item(
  p_knowledge_item_id uuid
)
returns uuid
language sql
set search_path = ''
as $function$
  select private.archive_knowledge_item(p_knowledge_item_id);
$function$;

revoke execute on function public.archive_knowledge_item(uuid)
from anon;

grant execute on function public.archive_knowledge_item(uuid)
to authenticated;

grant execute on function public.archive_knowledge_item(uuid)
to service_role;
