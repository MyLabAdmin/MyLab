create or replace function private.authorize_knowledge_write()
returns uuid
language plpgsql
stable
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  if not public.current_user_is_active() then
    raise exception 'Active account required' using errcode = '42501';
  end if;

  if not (
    public.current_user_has_role('knowledge_manager'::public.staff_role)
    or public.current_user_has_role('super_admin'::public.staff_role)
  ) then
    raise exception 'Knowledge authoring permission required' using errcode = '42501';
  end if;

  return v_user_id;
end;
$function$;

create or replace function private.create_knowledge_item(
  p_item_type text,
  p_title text,
  p_summary text,
  p_content text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := private.authorize_knowledge_write();
  v_item_id uuid;
  v_version_id uuid;
begin
  insert into public.knowledge_items (
    item_type,
    status,
    created_by,
    updated_by
  )
  values (
    p_item_type,
    'draft',
    v_user_id,
    v_user_id
  )
  returning id into v_item_id;

  insert into public.knowledge_item_versions (
    knowledge_item_id,
    version_number,
    title,
    summary,
    content,
    status,
    created_by
  )
  values (
    v_item_id,
    1,
    p_title,
    p_summary,
    p_content,
    'draft',
    v_user_id
  )
  returning id into v_version_id;

  return jsonb_build_object(
    'knowledge_item_id', v_item_id,
    'knowledge_item_version_id', v_version_id,
    'version_number', 1
  );
end;
$function$;

create or replace function private.create_knowledge_version(
  p_knowledge_item_id uuid,
  p_title text,
  p_summary text,
  p_content text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := private.authorize_knowledge_write();
  v_item public.knowledge_items%rowtype;
  v_source_version_id uuid;
  v_new_version_number integer;
  v_version_id uuid;
begin
  select *
    into v_item
  from public.knowledge_items
  where id = p_knowledge_item_id
  for update;

  if not found then
    raise exception 'Knowledge item not found' using errcode = 'P0002';
  end if;

  if v_item.status = 'archived' then
    raise exception 'Archived knowledge items cannot receive new versions' using errcode = '42501';
  end if;

  select v.id, v.version_number
    into v_source_version_id, v_new_version_number
  from public.knowledge_item_versions v
  where v.knowledge_item_id = p_knowledge_item_id
  order by v.version_number desc
  limit 1;

  v_new_version_number := coalesce(v_new_version_number, 0) + 1;

  insert into public.knowledge_item_versions (
    knowledge_item_id,
    version_number,
    title,
    summary,
    content,
    status,
    created_by
  )
  values (
    p_knowledge_item_id,
    v_new_version_number,
    p_title,
    p_summary,
    p_content,
    'draft',
    v_user_id
  )
  returning id into v_version_id;

  if v_source_version_id is not null then
    insert into public.knowledge_version_images (
      knowledge_item_version_id,
      imagekit_file_id,
      imagekit_url,
      alt_text,
      caption,
      sort_order,
      created_by
    )
    select
      v_version_id,
      imagekit_file_id,
      imagekit_url,
      alt_text,
      caption,
      sort_order,
      v_user_id
    from public.knowledge_version_images
    where knowledge_item_version_id = v_source_version_id;
  end if;

  update public.knowledge_items
  set updated_by = v_user_id
  where id = p_knowledge_item_id;

  return jsonb_build_object(
    'knowledge_item_id', p_knowledge_item_id,
    'knowledge_item_version_id', v_version_id,
    'version_number', v_new_version_number,
    'source_version_id', v_source_version_id
  );
end;
$function$;

create or replace function private.update_knowledge_draft(
  p_knowledge_item_version_id uuid,
  p_title text,
  p_summary text,
  p_content text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := private.authorize_knowledge_write();
  v_item_id uuid;
begin
  select v.knowledge_item_id
    into v_item_id
  from public.knowledge_item_versions v
  join public.knowledge_items i
    on i.id = v.knowledge_item_id
  where v.id = p_knowledge_item_version_id
    and v.status = 'draft'
    and i.status <> 'archived'
  for update of v;

  if not found then
    raise exception 'Draft knowledge version not found or not editable' using errcode = 'P0002';
  end if;

  update public.knowledge_item_versions
  set
    title = p_title,
    summary = p_summary,
    content = p_content
  where id = p_knowledge_item_version_id;

  update public.knowledge_items
  set updated_by = v_user_id
  where id = v_item_id;

  return p_knowledge_item_version_id;
end;
$function$;

create or replace function private.publish_knowledge_version(
  p_knowledge_item_version_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := private.authorize_knowledge_write();
  v_item_id uuid;
  v_previous_published_id uuid;
  v_version_number integer;
begin
  select v.knowledge_item_id, v.version_number
    into v_item_id, v_version_number
  from public.knowledge_item_versions v
  join public.knowledge_items i
    on i.id = v.knowledge_item_id
  where v.id = p_knowledge_item_version_id
    and v.status = 'draft'
    and i.status <> 'archived'
  for update of v;

  if not found then
    raise exception 'Draft knowledge version not found or not publishable' using errcode = 'P0002';
  end if;

  select id
    into v_previous_published_id
  from public.knowledge_item_versions
  where knowledge_item_id = v_item_id
    and status = 'published'
  for update;

  if v_previous_published_id is not null then
    update public.knowledge_item_versions
    set status = 'superseded'
    where id = v_previous_published_id;
  end if;

  update public.knowledge_item_versions
  set status = 'published'
  where id = p_knowledge_item_version_id;

  update public.knowledge_items
  set
    status = 'published',
    updated_by = v_user_id
  where id = v_item_id;

  return jsonb_build_object(
    'knowledge_item_id', v_item_id,
    'knowledge_item_version_id', p_knowledge_item_version_id,
    'version_number', v_version_number,
    'previous_published_version_id', v_previous_published_id
  );
end;
$function$;

create or replace function private.add_knowledge_version_image(
  p_knowledge_item_version_id uuid,
  p_imagekit_file_id text,
  p_imagekit_url text,
  p_alt_text text,
  p_caption text,
  p_sort_order integer
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := private.authorize_knowledge_write();
  v_image_id uuid;
begin
  if not exists (
    select 1
    from public.knowledge_item_versions v
    join public.knowledge_items i
      on i.id = v.knowledge_item_id
    where v.id = p_knowledge_item_version_id
      and v.status = 'draft'
      and i.status <> 'archived'
  ) then
    raise exception 'Draft knowledge version not found or not editable' using errcode = 'P0002';
  end if;

  insert into public.knowledge_version_images (
    knowledge_item_version_id,
    imagekit_file_id,
    imagekit_url,
    alt_text,
    caption,
    sort_order,
    created_by
  )
  values (
    p_knowledge_item_version_id,
    p_imagekit_file_id,
    p_imagekit_url,
    p_alt_text,
    p_caption,
    p_sort_order,
    v_user_id
  )
  returning id into v_image_id;

  return v_image_id;
end;
$function$;

create or replace function private.update_knowledge_version_image(
  p_image_id uuid,
  p_alt_text text,
  p_caption text,
  p_sort_order integer
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_image_id uuid;
begin
  perform private.authorize_knowledge_write();

  if not exists (
    select 1
    from public.knowledge_version_images m
    join public.knowledge_item_versions v
      on v.id = m.knowledge_item_version_id
    join public.knowledge_items i
      on i.id = v.knowledge_item_id
    where m.id = p_image_id
      and v.status = 'draft'
      and i.status <> 'archived'
  ) then
    raise exception 'Draft knowledge image not found or not editable' using errcode = 'P0002';
  end if;

  update public.knowledge_version_images
  set
    alt_text = p_alt_text,
    caption = p_caption,
    sort_order = p_sort_order
  where id = p_image_id
  returning id into v_image_id;

  return v_image_id;
end;
$function$;

create or replace function private.remove_knowledge_version_image(
  p_image_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
begin
  perform private.authorize_knowledge_write();

  if not exists (
    select 1
    from public.knowledge_version_images m
    join public.knowledge_item_versions v
      on v.id = m.knowledge_item_version_id
    join public.knowledge_items i
      on i.id = v.knowledge_item_id
    where m.id = p_image_id
      and v.status = 'draft'
      and i.status <> 'archived'
  ) then
    raise exception 'Draft knowledge image not found or not removable' using errcode = 'P0002';
  end if;

  delete from public.knowledge_version_images
  where id = p_image_id;
end;
$function$;

create or replace function public.create_knowledge_item(
  p_item_type text,
  p_title text,
  p_summary text,
  p_content text
)
returns jsonb
language sql
set search_path = ''
as $function$
  select private.create_knowledge_item(
    p_item_type,
    p_title,
    p_summary,
    p_content
  );
$function$;

create or replace function public.create_knowledge_version(
  p_knowledge_item_id uuid,
  p_title text,
  p_summary text,
  p_content text
)
returns jsonb
language sql
set search_path = ''
as $function$
  select private.create_knowledge_version(
    p_knowledge_item_id,
    p_title,
    p_summary,
    p_content
  );
$function$;

create or replace function public.update_knowledge_draft(
  p_knowledge_item_version_id uuid,
  p_title text,
  p_summary text,
  p_content text
)
returns uuid
language sql
set search_path = ''
as $function$
  select private.update_knowledge_draft(
    p_knowledge_item_version_id,
    p_title,
    p_summary,
    p_content
  );
$function$;

create or replace function public.publish_knowledge_version(
  p_knowledge_item_version_id uuid
)
returns jsonb
language sql
set search_path = ''
as $function$
  select private.publish_knowledge_version(
    p_knowledge_item_version_id
  );
$function$;

create or replace function public.add_knowledge_version_image(
  p_knowledge_item_version_id uuid,
  p_imagekit_file_id text,
  p_imagekit_url text,
  p_alt_text text,
  p_caption text,
  p_sort_order integer
)
returns uuid
language sql
set search_path = ''
as $function$
  select private.add_knowledge_version_image(
    p_knowledge_item_version_id,
    p_imagekit_file_id,
    p_imagekit_url,
    p_alt_text,
    p_caption,
    p_sort_order
  );
$function$;

create or replace function public.update_knowledge_version_image(
  p_image_id uuid,
  p_alt_text text,
  p_caption text,
  p_sort_order integer
)
returns uuid
language sql
set search_path = ''
as $function$
  select private.update_knowledge_version_image(
    p_image_id,
    p_alt_text,
    p_caption,
    p_sort_order
  );
$function$;

create or replace function public.remove_knowledge_version_image(
  p_image_id uuid
)
returns void
language sql
set search_path = ''
as $function$
  select private.remove_knowledge_version_image(
    p_image_id
  );
$function$;

revoke all on function private.authorize_knowledge_write() from anon;
revoke all on function private.create_knowledge_item(text,text,text,text) from anon;
revoke all on function private.create_knowledge_version(uuid,text,text,text) from anon;
revoke all on function private.update_knowledge_draft(uuid,text,text,text) from anon;
revoke all on function private.publish_knowledge_version(uuid) from anon;
revoke all on function private.add_knowledge_version_image(uuid,text,text,text,text,integer) from anon;
revoke all on function private.update_knowledge_version_image(uuid,text,text,integer) from anon;
revoke all on function private.remove_knowledge_version_image(uuid) from anon;

grant execute on function private.authorize_knowledge_write() to authenticated;
grant execute on function private.create_knowledge_item(text,text,text,text) to authenticated;
grant execute on function private.create_knowledge_version(uuid,text,text,text) to authenticated;
grant execute on function private.update_knowledge_draft(uuid,text,text,text) to authenticated;
grant execute on function private.publish_knowledge_version(uuid) to authenticated;
grant execute on function private.add_knowledge_version_image(uuid,text,text,text,text,integer) to authenticated;
grant execute on function private.update_knowledge_version_image(uuid,text,text,integer) to authenticated;
grant execute on function private.remove_knowledge_version_image(uuid) to authenticated;

revoke all on function public.create_knowledge_item(text,text,text,text) from anon;
revoke all on function public.create_knowledge_version(uuid,text,text,text) from anon;
revoke all on function public.update_knowledge_draft(uuid,text,text,text) from anon;
revoke all on function public.publish_knowledge_version(uuid) from anon;
revoke all on function public.add_knowledge_version_image(uuid,text,text,text,text,integer) from anon;
revoke all on function public.update_knowledge_version_image(uuid,text,text,integer) from anon;
revoke all on function public.remove_knowledge_version_image(uuid) from anon;

grant execute on function public.create_knowledge_item(text,text,text,text) to authenticated, service_role;
grant execute on function public.create_knowledge_version(uuid,text,text,text) to authenticated, service_role;
grant execute on function public.update_knowledge_draft(uuid,text,text,text) to authenticated, service_role;
grant execute on function public.publish_knowledge_version(uuid) to authenticated, service_role;
grant execute on function public.add_knowledge_version_image(uuid,text,text,text,text,integer) to authenticated, service_role;
grant execute on function public.update_knowledge_version_image(uuid,text,text,integer) to authenticated, service_role;
grant execute on function public.remove_knowledge_version_image(uuid) to authenticated, service_role;
